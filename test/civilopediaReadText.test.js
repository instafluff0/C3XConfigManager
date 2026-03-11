const test = require('node:test');
const assert = require('node:assert/strict');

const { toReadBlocks, toReadParagraphs, toPlainText } = require('../src/civilopediaText');

test('toReadParagraphs removes Civilopedia comment divider lines', () => {
  const input = [
    'Given sufficient training and motivation.',
    '',
    '; ____________________________________________GUNPOWDER FOOT UNITS_____________________________________________',
    '',
    'By the time of Alexander the Great.'
  ].join('\n');

  const lines = toReadParagraphs(input);
  assert.equal(lines.length, 2);
  assert.equal(lines[0], 'Given sufficient training and motivation.');
  assert.equal(lines[1], 'By the time of Alexander the Great.');
});

test('toReadParagraphs strips control markup and preserves readable text', () => {
  const input = '^{Domestic} - Overseer, {military} ^focus';
  const lines = toReadParagraphs(input);
  assert.equal(lines.length, 1);
  assert.equal(lines[0], 'Domestic - Overseer, military focus');
});

test('toReadParagraphs collapses hard-wrap newlines and merges accidental mid-sentence breaks', () => {
  const input = [
    "While early Muslim forces consisted of very few soldiers, it's understood that they retained higher morale and",
    '',
    'mobility than their enemies, as well as the luxury to retreat into the desert where they alone knew the location'
  ].join('\n');

  const lines = toReadParagraphs(input);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /higher morale and mobility than their enemies/);
});

test('toPlainText removes link tokens while keeping labels', () => {
  const input = 'See $LINK<Horseman=PRTO_HORSEMAN> and [mounted tactics].';
  assert.equal(toPlainText(input), 'See Horseman and mounted tactics.');
});

test('toReadBlocks identifies Anarchy-style stats as a table block', () => {
  const input = [
    '^{$LINK<Ratings:=GCON_Sphere_Grades>}   Tall: F | Wide: F | Military: F | Development: F',
    '^Worker efficiency\t\t\t\t-50%',
    '^Hurry Method\t\t\t\t\tNone',
    '^Corruption & Waste\t\t\t\t5/6 (Catastrophic)',
    '^War Weariness\t\t\t\t\tNone',
    '^Draft Rate\t\t\t\t\t\t0',
    '^Military Police Limit\t\t\t\t0',
    '^Units Support:',
    '^  per village/town/city\t\t\t0/0/0',
    '^Additional Free Unit Support\t\t0'
  ].join('\n');

  const blocks = toReadBlocks(input);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'table');
  const rows = blocks[0].rows || [];
  assert.equal(rows[0].type, 'pair');
  assert.match(rows[0].label, /Ratings:/);
  assert.match(rows[0].value, /Tall: F/);
  assert.equal(rows[7].type, 'heading');
  assert.equal(rows[7].text, 'Units Support:');
  assert.equal(rows[8].type, 'pair');
  assert.equal(rows[8].label, 'per village/town/city');
  assert.equal(rows[8].value, '0/0/0');
});

test('toReadBlocks keeps regular prose as paragraph blocks', () => {
  const input = [
    'Given sufficient training and motivation, as well as better weapons and heavier armor, mounted troops can become accomplished cavalry.',
    '',
    'By the time of Alexander the Great, both the Persians and Macedonians were fielding large bodies of heavily-armed and armored cavalry.'
  ].join('\n');
  const blocks = toReadBlocks(input);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, 'paragraph');
  assert.equal(blocks[1].type, 'paragraph');
});
