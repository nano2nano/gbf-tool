export function getParams(summon: Element): parameter.summon {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const summon_name = summon
    .getElementsByClassName('prt-supporter-summon')[0]!
    .textContent?.replace(/^\s+|\s+$/g, '')
    .split(' ')[2];
  const bless_rank = Number(summon.getAttribute('data-supporter-evolution'));
  return { name: summon_name ?? '', bless_rank: bless_rank };
}

export async function waitSupporterList() {
  return new Promise<HTMLCollectionOf<Element>>((res) => {
    function _waitSupporterList() {
      const items = document.getElementsByClassName('prt-supporter-attribute');
      if (items.length === 7) {
        res(items);
      } else {
        setTimeout(_waitSupporterList, 250);
      }
    }
    _waitSupporterList();
  });
}

export async function waitSelectedSupporterList() {
  return new Promise<NodeListOf<Element>>((res) => {
    function _waitSelectedSupporterList() {
      const items = document.querySelectorAll('.prt-supporter-attribute:not(.disableView)');
      if (items.length === 1) {
        res(items);
      } else {
        setTimeout(_waitSelectedSupporterList, 250);
      }
    }
    _waitSelectedSupporterList();
  });
}
