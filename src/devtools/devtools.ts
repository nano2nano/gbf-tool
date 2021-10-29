import { browser, DevtoolsNetwork } from 'webextension-polyfill-ts';
import { parseJson } from '../common/utils';

console.log('load devtools.js (gbf tool)');

const backgroundPageConnection = browser.runtime.connect({
  name: 'devtools',
});

backgroundPageConnection.postMessage({
  name: 'init',
  tabId: browser.devtools.inspectedWindow.tabId,
});

browser.devtools.network.onRequestFinished.addListener(handler);

async function handler(request: DevtoolsNetwork.Request): Promise<void> {
  const req = parseJson((await request.getContent())[0]);
  if (!req) return;
  // console.log(req);
  const tab_id = browser.devtools.inspectedWindow.tabId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tmp: any = request;
  if (tmp.request.url.match('result(multi|)/data') !== null) {
    if (req.appearance !== null) {
      const message: message.message = {
        tag: 'appear_hell',
        tab_id: tab_id,
      };
      browser.runtime.sendMessage(message);
    }
  } else if (tmp.request.url.match('start.json') !== null) {
    const items = await browser.storage.local.get('trial_battle_quest_id');
    const trialBattleQuestID = items.trial_battle_quest_id;
    const message = {
      tag: 'start_quest',
      tab_id: tab_id,
      quest_type: req.quest_id === trialBattleQuestID ? 'trial' : 'normal',
    };
    browser.runtime.sendMessage(message);
  } else if (tmp.request.url.match('result.json')) {
    const winScenario = getScenarioByCmd('win', req.scenario);
    if (winScenario !== undefined) {
      const message = {
        tag: 'game_result',
        tab_id: tab_id,
        isWin: true,
        isLastRaid: winScenario.is_last_raid,
      };
      browser.runtime.sendMessage(message);
    } else if (existsCommand('lose', req.scenario)) {
      const message = {
        tag: 'game_result',
        tab_id: tab_id,
        isWin: false,
      };
      browser.runtime.sendMessage(message);
    } else if (tmp.request.url.match('normal_attack_result.json')) {
      const message = {
        tag: 'normal_attack',
        tab_id: tab_id,
      };
      browser.runtime.sendMessage(message);
    }
  }
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
