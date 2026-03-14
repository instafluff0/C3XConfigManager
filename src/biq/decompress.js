'use strict';

// PKWare IMPLODE decompression for Civ3 BIQ/SAV files.
// Ported from c3sat/civ3decompress/decompress.go (MIT license, Jim Nelson 2016/2020)
// and cross-referenced with c3sat/civ3decompress/tables.go.

// Length Huffman table: Map from composite key `(bitLength << 16) | bits` → [baseValue, extraBits]
const LENGTH_LOOKUP = new Map([
  [(3 << 16) | 0b101,     [2, 0]],
  [(2 << 16) | 0b11,      [3, 0]],
  [(3 << 16) | 0b100,     [4, 0]],
  [(3 << 16) | 0b011,     [5, 0]],
  [(4 << 16) | 0b0101,    [6, 0]],
  [(4 << 16) | 0b0100,    [7, 0]],
  [(4 << 16) | 0b0011,    [8, 0]],
  [(5 << 16) | 0b00101,   [9, 0]],
  [(5 << 16) | 0b00100,   [10, 1]],
  [(5 << 16) | 0b00011,   [12, 2]],
  [(5 << 16) | 0b00010,   [16, 3]],
  [(6 << 16) | 0b000011,  [24, 4]],
  [(6 << 16) | 0b000010,  [40, 5]],
  [(6 << 16) | 0b000001,  [72, 6]],
  [(7 << 16) | 0b0000001, [136, 7]],
  [(7 << 16) | 0b0000000, [264, 8]],
]);

// Offset Huffman table: Map from composite key `(bitLength << 16) | bits` → offsetHighBits
const OFFSET_LOOKUP = new Map([
  [(2 << 16) | 0b11,       0x00],
  [(4 << 16) | 0b1011,     0x01],
  [(4 << 16) | 0b1010,     0x02],
  [(5 << 16) | 0b10011,    0x03],
  [(5 << 16) | 0b10010,    0x04],
  [(5 << 16) | 0b10001,    0x05],
  [(5 << 16) | 0b10000,    0x06],
  [(6 << 16) | 0b011111,   0x07],
  [(6 << 16) | 0b011110,   0x08],
  [(6 << 16) | 0b011101,   0x09],
  [(6 << 16) | 0b011100,   0x0a],
  [(6 << 16) | 0b011011,   0x0b],
  [(6 << 16) | 0b011010,   0x0c],
  [(6 << 16) | 0b011001,   0x0d],
  [(6 << 16) | 0b011000,   0x0e],
  [(6 << 16) | 0b010111,   0x0f],
  [(6 << 16) | 0b010110,   0x10],
  [(6 << 16) | 0b010101,   0x11],
  [(6 << 16) | 0b010100,   0x12],
  [(6 << 16) | 0b010011,   0x13],
  [(6 << 16) | 0b010010,   0x14],
  [(6 << 16) | 0b010001,   0x15],
  [(7 << 16) | 0b0100001,  0x16],
  [(7 << 16) | 0b0100000,  0x17],
  [(7 << 16) | 0b0011111,  0x18],
  [(7 << 16) | 0b0011110,  0x19],
  [(7 << 16) | 0b0011101,  0x1a],
  [(7 << 16) | 0b0011100,  0x1b],
  [(7 << 16) | 0b0011011,  0x1c],
  [(7 << 16) | 0b0011010,  0x1d],
  [(7 << 16) | 0b0011001,  0x1e],
  [(7 << 16) | 0b0011000,  0x1f],
  [(7 << 16) | 0b0010111,  0x20],
  [(7 << 16) | 0b0010110,  0x21],
  [(7 << 16) | 0b0010101,  0x22],
  [(7 << 16) | 0b0010100,  0x23],
  [(7 << 16) | 0b0010011,  0x24],
  [(7 << 16) | 0b0010010,  0x25],
  [(7 << 16) | 0b0010001,  0x26],
  [(7 << 16) | 0b0010000,  0x27],
  [(7 << 16) | 0b0001111,  0x28],
  [(7 << 16) | 0b0001110,  0x29],
  [(7 << 16) | 0b0001101,  0x2a],
  [(7 << 16) | 0b0001100,  0x2b],
  [(7 << 16) | 0b0001011,  0x2c],
  [(7 << 16) | 0b0001010,  0x2d],
  [(7 << 16) | 0b0001001,  0x2e],
  [(7 << 16) | 0b0001000,  0x2f],
  [(8 << 16) | 0b00001111, 0x30],
  [(8 << 16) | 0b00001110, 0x31],
  [(8 << 16) | 0b00001101, 0x32],
  [(8 << 16) | 0b00001100, 0x33],
  [(8 << 16) | 0b00001011, 0x34],
  [(8 << 16) | 0b00001010, 0x35],
  [(8 << 16) | 0b00001001, 0x36],
  [(8 << 16) | 0b00001000, 0x37],
  [(8 << 16) | 0b00000111, 0x38],
  [(8 << 16) | 0b00000110, 0x39],
  [(8 << 16) | 0b00000101, 0x3a],
  [(8 << 16) | 0b00000100, 0x3b],
  [(8 << 16) | 0b00000011, 0x3c],
  [(8 << 16) | 0b00000010, 0x3d],
  [(8 << 16) | 0b00000001, 0x3e],
  [(8 << 16) | 0b00000000, 0x3f],
]);

const LENGTH_END_OF_STREAM = 519;

/**
 * Decompress a PKWare IMPLODE compressed Civ3 BIQ/SAV byte array.
 *
 * @param {Buffer|Uint8Array} input  - Compressed bytes (starting with 0x00 0x04/05/06 header)
 * @returns {{ ok: true, data: Buffer } | { ok: false, error: string }}
 */
function decompress(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);

  if (bytes.length < 3 || bytes[0] !== 0x00) {
    return { ok: false, error: 'Not a valid compressed byte array: bad first byte' };
  }
  if (bytes[1] !== 0x04 && bytes[1] !== 0x05 && bytes[1] !== 0x06) {
    return { ok: false, error: `Not a valid compressed byte array: dictsize byte 0x${bytes[1].toString(16)}` };
  }

  const dictsize = bytes[1]; // 4, 5, or 6 (number of low-order offset bits)
  const chunks = [];
  let totalOut = 0;

  let byteOff = 2;
  let bitOff = 0;

  // Helper: read one bit from the stream (LSB-first within each byte)
  function readBit() {
    if (byteOff >= bytes.length) throw new Error('Unexpected end of input reading bit');
    const bit = (bytes[byteOff] >> bitOff) & 1;
    bitOff++;
    if (bitOff === 8) { bitOff = 0; byteOff++; }
    return bit;
  }

  // Helper: read N bits, LSB-first, accumulated into an integer (LSB = bit 0)
  function readBitsLsb(n) {
    let value = 0;
    for (let i = 0; i < n; i++) {
      value |= (readBit() << i);
    }
    return value;
  }

  // Helper: read N bits, MSB-first into accumulator (left-shift style, used for Huffman)
  function readBitsMsb(n) {
    let key = 0;
    for (let i = 0; i < n; i++) {
      key = (key << 1) | readBit();
    }
    return key;
  }

  // Output buffer management — we accumulate into a rolling array of bytes
  const outBuf = [];

  function readLengthSequence() {
    let seqBits = 0;
    let seqLen = 0;
    while (true) {
      seqBits = (seqBits << 1) | readBit();
      seqLen++;
      if (seqLen > 8) throw new Error('Token did not match length sequence');
      const entry = LENGTH_LOOKUP.get((seqLen << 16) | seqBits);
      if (entry !== undefined) {
        const [base, extraBits] = entry;
        if (extraBits === 0) return base;
        // Read extraBits bits LSB-first, right-shift accumulate style (like Go version)
        let xxxes = 0;
        for (let i = 0; i < extraBits; i++) {
          xxxes = (xxxes >>> 1) | (readBit() ? 0x80 : 0);
        }
        xxxes = (xxxes >>> (8 - extraBits)) & 0xff;
        return base + xxxes;
      }
    }
  }

  function readOffsetSequence(dictsizeBits) {
    let seqBits = 0;
    let seqLen = 0;
    while (true) {
      seqBits = (seqBits << 1) | readBit();
      seqLen++;
      if (seqLen > 8) throw new Error('Token did not match offset sequence');
      const highBits = OFFSET_LOOKUP.get((seqLen << 16) | seqBits);
      if (highBits !== undefined) {
        // Read dictsizeBits low-order bits LSB-first, right-shift accumulate
        let lowBits = 0;
        for (let i = 0; i < dictsizeBits; i++) {
          lowBits = ((lowBits >>> 1) & 0x7fffffff) | (readBit() ? 0x80000000 : 0);
        }
        lowBits = (lowBits >>> (32 - dictsizeBits)) >>> 0;
        return (highBits << dictsizeBits) + lowBits;
      }
    }
  }

  try {
    while (true) {
      const tokenFlag = readBit();
      if (tokenFlag) {
        // Back-reference
        const length = readLengthSequence();
        if (length === LENGTH_END_OF_STREAM) break;

        const copyDictsize = length === 2 ? 2 : dictsize;
        const offset = readOffsetSequence(copyDictsize);
        const copyFrom = outBuf.length - offset - 1;
        if (copyFrom < 0) {
          throw new Error(`Offset underflow: copyFrom=${copyFrom}, outLen=${outBuf.length}, offset=${offset}`);
        }
        // Byte-by-byte copy (handles overlapping)
        for (let i = 0; i < length; i++) {
          outBuf.push(outBuf[copyFrom + i]);
        }
      } else {
        // Literal byte: 8 bits LSB-first, right-shift accumulate
        let byt = 0;
        for (let i = 0; i < 8; i++) {
          byt = ((byt >>> 1) & 0x7f) | (readBit() ? 0x80 : 0);
        }
        outBuf.push(byt);
      }
    }
  } catch (err) {
    return { ok: false, error: `Decompression error: ${err.message}` };
  }

  return { ok: true, data: Buffer.from(outBuf) };
}

module.exports = { decompress };
