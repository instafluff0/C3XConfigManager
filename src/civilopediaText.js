(function initCivilopediaTextUtils(global) {
  function stripControlMarkup(text) {
    return String(text || '')
      .replace(/\^\{([^}]*)\}/g, '$1')
      .replace(/\^/g, ' ')
      .replace(/[{}]/g, ' ');
  }

  function dropCommentLines(text) {
    return String(text || '')
      .split('\n')
      .filter((line) => !String(line || '').trim().startsWith(';'))
      .join('\n');
  }

  function splitStatRow(line) {
    const raw = String(line || '').trim();
    if (!raw) return null;
    const match = raw.match(/^(.+?)(?:\t+|\s{2,})(.+)$/);
    if (!match) return null;
    const label = String(match[1] || '').trim();
    const value = String(match[2] || '').trim();
    if (!label || !value) return null;
    if (/[.!?]/.test(label) && !label.endsWith(':')) return null;
    if (value.split(/\s+/).length > 10 && !/[0-9%/|()-]/.test(value)) return null;
    return { label, value };
  }

  function shouldMergeParagraphBlock(prev, next) {
    return !!(prev
      && /[A-Za-z0-9,;]$/.test(prev)
      && /^[a-z0-9(]/.test(next));
  }

  function toReadBlocks(text) {
    const lines = stripControlMarkup(dropCommentLines(text))
      .split('\n')
      .map((line) => String(line || '').replace(/\r/g, '').trimEnd());
    const rawBlocks = [];
    let current = [];
    lines.forEach((line) => {
      if (!String(line || '').trim()) {
        if (current.length) rawBlocks.push(current);
        current = [];
        return;
      }
      current.push(String(line || ''));
    });
    if (current.length) rawBlocks.push(current);

    const blocks = [];
    rawBlocks.forEach((blockLines) => {
      const trimmed = blockLines.map((line) => String(line || '').trim()).filter(Boolean);
      if (!trimmed.length) return;
      const statRows = trimmed.map(splitStatRow);
      const statCount = statRows.filter(Boolean).length;
      const isStatBlock = statCount >= 2 && statCount >= Math.ceil(trimmed.length * 0.55);
      if (isStatBlock) {
        blocks.push({
          type: 'table',
          rows: trimmed.map((line) => {
            const pair = splitStatRow(line);
            if (pair) return { type: 'pair', label: pair.label, value: pair.value };
            if (line.endsWith(':')) return { type: 'heading', text: line };
            return { type: 'text', text: line };
          })
        });
        return;
      }
      const normalized = trimmed.join(' ').replace(/\s+/g, ' ').trim();
      if (!normalized) return;
      const prev = blocks.length > 0 ? blocks[blocks.length - 1] : null;
      if (prev && prev.type === 'paragraph' && shouldMergeParagraphBlock(prev.text, normalized)) {
        prev.text = `${prev.text} ${normalized}`.replace(/\s+/g, ' ').trim();
      } else {
        blocks.push({ type: 'paragraph', text: normalized });
      }
    });
    return blocks;
  }

  function toReadParagraphs(text) {
    const blocks = toReadBlocks(text);
    const out = [];
    blocks.forEach((block) => {
      if (block.type === 'paragraph') {
        out.push(String(block.text || ''));
        return;
      }
      (block.rows || []).forEach((row) => {
        if (!row) return;
        if (row.type === 'pair') {
          out.push(`${row.label} ${row.value}`.replace(/\s+/g, ' ').trim());
        } else {
          out.push(String(row.text || '').trim());
        }
      });
    });
    const merged = [];
    out.filter(Boolean).forEach((line) => {
      const prev = merged.length > 0 ? merged[merged.length - 1] : '';
      if (shouldMergeParagraphBlock(prev, line)) {
        merged[merged.length - 1] = `${prev} ${line}`.replace(/\s+/g, ' ').trim();
      } else {
        merged.push(line);
      }
    });
    return merged;
  }

  function toPlainText(text) {
    return toReadParagraphs(text)
      .join(' ')
      .replace(/\$LINK<([^=<>]+)=([^<>]+)>/g, '$1')
      .replace(/\[([^\]]+)\]/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const api = {
    stripControlMarkup,
    dropCommentLines,
    toReadBlocks,
    toReadParagraphs,
    toPlainText
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (global) {
    global.c3xCivilopediaText = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
