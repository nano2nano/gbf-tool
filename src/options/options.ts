import { browser } from 'webextension-polyfill-ts';

// 設定画面で保存ボタンを押されたら
async function save_options() {
  // 設定値を変数に格納
  const topPage = (document.getElementById('top_page') as HTMLInputElement).value;
  const questPage = (document.getElementById('quest_page') as HTMLInputElement).value;
  const trialPage = (document.getElementById('trial_page') as HTMLInputElement).value;
  const trialBattleQuestID = (document.getElementById('trial_battle_quest_id') as HTMLInputElement)
    .value;

  // chromeアカウントと紐づくストレージに保存
  await browser.storage.local.set({
    top_page: topPage,
    quest_page: questPage,
    trial_page: trialPage,
    trial_battle_quest_id: trialBattleQuestID,
  });
  console.log('save options');
}

// 設定画面で設定を表示する
async function restore_options() {
  // デフォルト値は、ここで設定する
  const items = await browser.storage.local.get({
    top_page: 'http://game.granbluefantasy.jp/',
    quest_page: 'http://game.granbluefantasy.jp/#quest/index',
    trial_page: 'http://game.granbluefantasy.jp/#quest/supporter/990021/17',
    trial_battle_quest_id: '990021',
  });
  (document.getElementById('top_page') as HTMLInputElement).value = items.top_page;
  (document.getElementById('quest_page') as HTMLInputElement).value = items.quest_page;
  (document.getElementById('trial_page') as HTMLInputElement).value = items.trial_page;
  (document.getElementById('trial_battle_quest_id') as HTMLInputElement).value =
    items.trial_battle_quest_id;
}

async function add_filter() {
  const targetUrl = (document.getElementById('target_url') as HTMLInputElement).value;
  const summonName = (document.getElementById('summon_name') as HTMLInputElement).value;
  const blessRank = (document.getElementById('bless_rank') as HTMLInputElement).value;
  const items = await browser.storage.local.get('summon_filter');
  const filters: parameter.filter[] = items.summon_filter ?? [];
  if (!targetUrl || !summonName || !blessRank) {
    alert('不正な値');
    return;
  }
  const filter: parameter.filter = {
    url: targetUrl,
    attribute: undefined,
    summon: {
      name: summonName,
      bless_rank: Number(blessRank),
    },
  };
  filters.push(filter);
  await browser.storage.local.set({ summon_filter: filters });
  (document.getElementById('target_url') as HTMLInputElement).value = '';
  (document.getElementById('summon_name') as HTMLInputElement).value = '';
  (document.getElementById('bless_rank') as HTMLInputElement).value = '';
  alert('フィルターを追加しました');
}

async function delete_filter() {
  await browser.storage.local.remove('summon_filter');
  alert('削除しました');
}

// 画面表示と保存ボタンのイベントを設定
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save')?.addEventListener('click', save_options);
document.getElementById('add_filter')?.addEventListener('click', add_filter);
document.getElementById('delete_filter')?.addEventListener('click', delete_filter);

browser.storage.local.get('summon_filter').then((items) => {
  const filters = items.summon_filter;
  console.log(filters);
});
