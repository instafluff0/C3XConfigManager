const test = require('node:test');
const assert = require('node:assert/strict');
const { buildUnifiedDiffRows } = require('../src/configCore');

test('buildUnifiedDiffRows returns surgical hunks for single-line change', () => {
  const oldText = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].join('\n');
  const newText = ['a', 'b', 'c', 'D-CHANGED', 'e', 'f', 'g', 'h'].join('\n');
  const rows = buildUnifiedDiffRows(oldText, newText, { context: 2 });
  assert.ok(Array.isArray(rows));
  const hunks = rows.filter((r) => r.kind === 'hunk');
  assert.equal(hunks.length, 1);
  const del = rows.filter((r) => r.kind === 'del');
  const add = rows.filter((r) => r.kind === 'add');
  assert.equal(del.length, 1);
  assert.equal(add.length, 1);
  assert.equal(del[0].text, 'd');
  assert.equal(add[0].text, 'D-CHANGED');
  assert.ok(rows.length < 10, 'single change should not emit full-file rows');
});

test('buildUnifiedDiffRows ignores CRLF-only differences', () => {
  const oldText = 'line1\r\nline2\r\nline3\r\n';
  const newText = 'line1\nline2\nline3\n';
  const rows = buildUnifiedDiffRows(oldText, newText, { context: 3 });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].kind, 'meta');
  assert.match(rows[0].text, /No textual differences/i);
});

test('buildUnifiedDiffRows includes line numbers on changed rows', () => {
  const oldText = ['one', 'two', 'three'].join('\n');
  const newText = ['zero', 'one', 'two', 'three'].join('\n');
  const rows = buildUnifiedDiffRows(oldText, newText, { context: 1 });
  const add = rows.find((r) => r.kind === 'add');
  assert.ok(add);
  assert.equal(add.oldLine, null);
  assert.equal(add.newLine, 1);
});

test('buildUnifiedDiffRows does not emit whole-file replace for small edit in large file', () => {
  const oldLines = [];
  const newLines = [];
  for (let i = 1; i <= 300; i += 1) {
    const line = `LINE_${i}`;
    oldLines.push(line);
    newLines.push(line);
  }
  newLines[149] = 'LINE_150_CHANGED';

  const rows = buildUnifiedDiffRows(oldLines.join('\n'), newLines.join('\n'), { context: 3 });
  const hunkRows = rows.filter((r) => r.kind === 'hunk');
  const delRows = rows.filter((r) => r.kind === 'del');
  const addRows = rows.filter((r) => r.kind === 'add');
  const ctxRows = rows.filter((r) => r.kind === 'ctx');

  assert.equal(hunkRows.length, 1);
  assert.equal(delRows.length, 1);
  assert.equal(addRows.length, 1);
  assert.equal(delRows[0].text, 'LINE_150');
  assert.equal(addRows[0].text, 'LINE_150_CHANGED');
  assert.ok(ctxRows.length <= 6, 'context rows should be bounded by context window');
});

test('buildUnifiedDiffRows treats case-only changes as real diffs', () => {
  const rows = buildUnifiedDiffRows('Alpha', 'alpha', { context: 1 });
  const delRows = rows.filter((r) => r.kind === 'del');
  const addRows = rows.filter((r) => r.kind === 'add');
  assert.equal(delRows.length, 1);
  assert.equal(addRows.length, 1);
  assert.equal(delRows[0].text, 'Alpha');
  assert.equal(addRows[0].text, 'alpha');
});
