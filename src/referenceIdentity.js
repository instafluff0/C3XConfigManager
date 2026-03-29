'use strict';

(function initReferenceIdentity(root) {
  function normalizeReferenceEntryKey(entry) {
    return String(entry && entry.civilopediaKey || '').trim().toUpperCase();
  }

  function getReferenceEntryIdentity(tabKey, entry, fallbackIndex) {
    const normalizedTabKey = String(tabKey || '').trim().toLowerCase();
    const fallback = Number(fallbackIndex);
    if (normalizedTabKey === 'units') {
      const rawBiqIndex = entry && entry.biqIndex;
      const biqIndex = rawBiqIndex === '' || rawBiqIndex == null ? NaN : Number(rawBiqIndex);
      if (Number.isFinite(biqIndex) && biqIndex >= 0) return `biq:${biqIndex}`;
      const id = String(entry && entry.id || '').trim();
      if (id) return `id:${id}`;
    }
    const id = String(entry && entry.id || '').trim();
    if (id) return `id:${id}`;
    const key = normalizeReferenceEntryKey(entry);
    if (key) return `key:${key}`;
    if (Number.isFinite(fallback) && fallback >= 0) return `idx:${fallback}`;
    return '';
  }

  function findCleanReferenceEntry(entries, tabKey, entry, fallbackIndex) {
    const list = Array.isArray(entries) ? entries : [];
    const identity = getReferenceEntryIdentity(tabKey, entry, fallbackIndex);
    if (!identity) return null;
    for (let i = 0; i < list.length; i += 1) {
      const candidate = list[i];
      if (getReferenceEntryIdentity(tabKey, candidate, i) === identity) return candidate;
    }
    return null;
  }

  const api = {
    getReferenceEntryIdentity,
    findCleanReferenceEntry
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ReferenceIdentity = api;
})(typeof window !== 'undefined' ? window : globalThis);
