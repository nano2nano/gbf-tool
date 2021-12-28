import { browser } from 'webextension-polyfill-ts';
import { getParams, waitSupporterList, waitSelectedSupporterList, waitElement } from './utils';

console.info('load content.js (gbf tool)');

router();
window.addEventListener('hashchange', router);

async function router() {
  console.log('load gbf extension');
  const items = await browser.storage.local.get('trial_page');
  const trialPage = items.trial_page;

  if (trialPage === undefined) {
    console.error('uninitialized');
    return;
  }

  if (location.href === trialPage) {
    const attributes = await waitSelectedSupporterList();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const supporterList = attributes[0]!.getElementsByClassName('btn-supporter lis-supporter');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const targetSupporter = supporterList[supporterList.length - 1]!;
    await waitElement(targetSupporter);
    console.log('supporter has been rendered');
    targetSupporter?.scrollIntoView({ block: 'center' });
  } else if (location.hash.match(/\/supporter/) !== null) {
    console.log('supporter page');
    const items = await browser.storage.local.get({ summon_filter: [] });
    const filters: parameter.filter[] = items.summon_filter;
    const filter = filters.find((filter) => filter.url === location.href);
    if (filter === undefined) {
      // do nothing
      return;
    }
    const attributeId = filter.attribute;
    const attributes = await waitSupporterList();
    const root = attributeId !== undefined ? attributes[attributeId] : document.body;
    if (root === undefined) {
      console.error('not fond attribute');
      return;
    }
    const summons = (root as HTMLElement).getElementsByClassName('btn-supporter lis-supporter');
    const idx = findSummonIndex(summons, filter.summon);
    const targetSupporter = idx === -1 ? undefined : summons[idx];
    if (targetSupporter !== undefined) {
      await waitElement(targetSupporter);
      console.log('supporter has been rendered');
      targetSupporter.scrollIntoView({ block: 'center' });
    } else {
      const items = await browser.storage.local.get('trial_page');
      location.href = items.trial_page;
    }
  }
}

function findSummonIndex(
  summons: HTMLCollectionOf<Element>,
  target: parameter.summon | parameter.summon[]
) {
  const summon_array = Array.from(summons);
  return Array.isArray(target)
    ? (() => {
        for (let i = 0; i < target.length; i++) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const idx = _findSummonIndex(summon_array, target[i]!);
          if (idx !== -1) {
            return idx;
          }
        }
        return -1;
      })()
    : _findSummonIndex(summon_array, target);
}

function _findSummonIndex(summons: Element[], target: parameter.summon) {
  const index = summons.findIndex((summon) => {
    const param = getParams(summon);
    return param.name === target.name && param.bless_rank === target.bless_rank;
  });
  return index;
}

browser.runtime.onMessage.addListener((message: message.message) => {
  switch (message.tag) {
    case 'appear_hell':
      console.log('appear hell');
      break;
    default:
      break;
  }
  console.debug(message);
});
