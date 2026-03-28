'use strict';

function buildReferenceListRows({ tabKey, filteredEntries }) {
  const rows = Array.isArray(filteredEntries) ? filteredEntries : [];
  if (tabKey === 'units') {
    // Quint lists one logical unit row per PRTO logical entry, in order.
    // Do not group by civilopedia key; many distinct units legitimately share it.
    return rows.map(({ entry, baseIndex }) => ({ entry, baseIndex, isChild: false }));
  }
  return rows.map(({ entry, baseIndex }) => ({ entry, baseIndex, isChild: false }));
}

module.exports = {
  buildReferenceListRows
};
