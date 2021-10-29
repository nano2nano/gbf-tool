import { browser } from 'webextension-polyfill-ts';

const port = browser.runtime.connect({ name: 'popup' });

async function attachDebugger() {
  const tabArray = await browser.tabs.query({
    currentWindow: true,
    active: true,
  });
  const currentTab = tabArray[0];
  if (currentTab === undefined) return;
  if (currentTab.title !== 'グランブルーファンタジー') {
    alert('タイトルが "グランブルーファンタジー" ではないページが指定されました');
    return;
  }
  port.postMessage({ action: 'attachDebugger', tabId: currentTab.id });
}
document.getElementById('start')?.addEventListener('click', attachDebugger);
