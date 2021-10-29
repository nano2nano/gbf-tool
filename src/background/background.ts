import { Alarms, browser } from 'webextension-polyfill-ts';
import { parseJson } from '../common/utils';

/* eslint-disable @typescript-eslint/no-explicit-any */
const gRequests: number[] = [];
const gObjects: { requestId: number; url: string }[] = [];

browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message) => {
    switch (message.action) {
      case 'attachDebugger':
        attachDebugger(message.tabId);
        break;
    }
  });
});

chrome.debugger.onDetach.addListener((source, reason) => {
  if (reason === 'canceled_by_user') {
    return;
  }
  console.debug('retry attaching debugger');
  // TODO: need error handle
  attachDebugger(source.tabId);
});

chrome.debugger.onEvent.addListener((source, method, params: any) => {
  switch (method) {
    case 'Network.requestWillBeSent': {
      // If we see a url need to be handled, push it into index queue
      const rUrl = params.request.url;
      if (isTargetRequest(rUrl)) {
        gRequests.push(params.requestId);
      }
      break;
    }
    case 'Network.responseReceived': {
      // We get its request id here, write it down to object queue
      if (gRequests.some((element) => element === params.requestId)) {
        gObjects.push({
          requestId: params.requestId,
          url: params.response.url,
        });
      }
      break;
    }
    case 'Network.loadingFinished': {
      const tabId = source.tabId;
      if (tabId === undefined) return;
      // Pop out the request object from both object queue and request queue
      const requestId = params.requestId;
      let object: any = null;
      for (const o in gObjects) {
        if (requestId === gObjects[o]?.requestId) {
          object = gObjects.splice(Number(o), 1)[0];
          break;
        }
      }
      // Usually loadingFinished will be immediately after responseReceived
      if (object === null) return;
      gRequests.splice(gRequests.indexOf(object.url), 1);
      (async () => {
        const response = await new Promise<any>((resolve) => {
          chrome.debugger.sendCommand(
            source,
            'Network.getResponseBody',
            { requestId: requestId },
            resolve
          );
        });
        if (!response) return;
        const res = parseJson(response.body);
        // console.log(res);
        switch (true) {
          case isResultRequest(object.url): {
            if (res.appearance !== null) {
              const message: message.message = {
                tag: 'appear_hell',
                tab_id: tabId,
              };
              browser.tabs.sendMessage(tabId, message);
            }
            break;
          }
          case isQuestStartRequest(object.url): {
            console.log('start quest');
            const items = await browser.storage.local.get(['trial_battle_quest_id', 'quest_page']);
            const trialBattleQuestID = items.trial_battle_quest_id;
            if (trialBattleQuestID === undefined) {
              console.error('uninitialized trial_battle_quest_id');
            }
            if (res.quest_id === trialBattleQuestID) {
              console.log('quest type: trial');
              await browser.tabs.update(tabId, { url: items.quest_page });
              setReloadAlarm(source.tabId, 0.005);
            }
            break;
          }
          case isQuestResultRequest(object.url): {
            const winScenario = getScenarioByCmd('win', res.scenario);
            if (winScenario !== undefined) {
              console.log('win battle');
              if (winScenario.is_last_raid) {
                console.log('is last battle');
                browser.tabs.goBack(source.tabId);
              }
              // browser.tabs.sendMessage(tabId, message);
            } else if (existsCommand('lose', res.scenario)) {
              console.log('lose battle');
              const message: message.message = {
                tag: 'game_result',
                is_win: false,
              };
              browser.tabs.sendMessage(tabId, message);
            } else if (isNormalAttackRequest(object.url)) {
              const message: message.message = {
                tag: 'normal_attack',
              };
              // browser.tabs.reload(source.tabId);
              browser.tabs.sendMessage(tabId, message);
            }
            break;
          }
          default:
            break;
        }
        if (gRequests.length === 0) {
          reattachDebugger(source.tabId);
        }
      })();
      break;
    }
  }
});

function isTargetRequest(url: string): boolean {
  return (
    isResultRequest(url) ||
    isQuestStartRequest(url) ||
    isQuestResultRequest(url) ||
    isNormalAttackRequest(url)
  );
}

function isResultRequest(url: string): boolean {
  return url.match('result(multi|)/data') !== null;
}

function isQuestStartRequest(url: string): boolean {
  return url.match('start.json') !== null;
}

function isQuestResultRequest(url: string): boolean {
  return url.match('result.json') !== null;
}

function isNormalAttackRequest(url: string) {
  return url.match('normal_attack_result.json') !== null;
}

function setReloadAlarm(tabId: number | undefined, delayInMinutes: number | undefined) {
  const listener = (name: Alarms.Alarm) => {
    switch (name.name) {
      case 'reload_page':
        browser.tabs.reload(tabId);
        browser.alarms.onAlarm.removeListener(listener);
        browser.alarms.clear('reload_page');
        break;
      default:
        break;
    }
  };
  browser.alarms.create('reload_page', { delayInMinutes: delayInMinutes });
  browser.alarms.onAlarm.addListener(listener);
}

function getScenarioByCmd(target_cmd: string, scenario: { cmd: string; is_last_raid: boolean }[]) {
  if (scenario) {
    return scenario.find(({ cmd }) => cmd === target_cmd);
  } else {
    return undefined;
  }
}
function existsCommand(target_cmd: string, scenario: { cmd: string; is_last_raid: boolean }[]) {
  if (scenario) {
    const idx = scenario.findIndex(({ cmd }) => cmd === target_cmd);
    return idx === -1 ? false : true;
  } else {
    return false;
  }
}

async function attachDebugger(tabId: number | undefined) {
  const version = '1.0';
  await chrome.debugger.attach({ tabId: tabId }, version);
  console.debug('attached');
  await chrome.debugger.sendCommand(
    {
      tabId: tabId,
    },
    'Network.enable'
  );
  console.debug('network enabled');
}

async function reattachDebugger(tabId: number | undefined) {
  await chrome.debugger.detach({ tabId: tabId });
  console.debug('detach');
  await attachDebugger(tabId);
}

// function initialListener(details: chrome.webRequest.WebRequestBodyDetails) {
//   if (gAttached) return;  // Only need once at the very first request, so block all following requests
//   const tabId = details.tabId;
//   if (tabId > 0) {
//     gAttached = true;
//     chrome.debugger.attach({
//       tabId: tabId
//     }, "1.0", function () {
//       chrome.debugger.sendCommand({
//         tabId: tabId
//       }, "Network.enable");
//     });
//     // Remove self since the debugger is attached already
//     chrome.webRequest.onBeforeRequest.removeListener(initialListener);
//   }
// }

// // Attach debugger on startup
// chrome.webRequest.onBeforeRequest.addListener(initialListener, { urls: ["*://game.granbluefantasy.jp/*"] }, ["blocking"]);
