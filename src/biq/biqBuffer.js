'use strict';

// Little-endian binary reader and writer for Civ3 BIQ files.

/**
 * BiqReader wraps a Buffer and provides sequential little-endian reads.
 */
class BiqReader {
  constructor(buf) {
    this.buf = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
    this.pos = 0;
  }

  get remaining() { return this.buf.length - this.pos; }

  readByte() {
    if (this.pos >= this.buf.length) throw new Error(`BiqReader: underflow reading byte at pos ${this.pos}`);
    return this.buf[this.pos++];
  }

  readBytes(n) {
    if (this.pos + n > this.buf.length) throw new Error(`BiqReader: underflow reading ${n} bytes at pos ${this.pos}`);
    const slice = this.buf.slice(this.pos, this.pos + n);
    this.pos += n;
    return slice;
  }

  readShort() {
    if (this.pos + 2 > this.buf.length) throw new Error(`BiqReader: underflow reading short at pos ${this.pos}`);
    const v = this.buf.readInt16LE(this.pos);
    this.pos += 2;
    return v;
  }

  readUShort() {
    if (this.pos + 2 > this.buf.length) throw new Error(`BiqReader: underflow reading ushort at pos ${this.pos}`);
    const v = this.buf.readUInt16LE(this.pos);
    this.pos += 2;
    return v;
  }

  readInt() {
    if (this.pos + 4 > this.buf.length) throw new Error(`BiqReader: underflow reading int at pos ${this.pos}`);
    const v = this.buf.readInt32LE(this.pos);
    this.pos += 4;
    return v;
  }

  readUInt() {
    if (this.pos + 4 > this.buf.length) throw new Error(`BiqReader: underflow reading uint at pos ${this.pos}`);
    const v = this.buf.readUInt32LE(this.pos);
    this.pos += 4;
    return v;
  }

  readFloat() {
    if (this.pos + 4 > this.buf.length) throw new Error(`BiqReader: underflow reading float at pos ${this.pos}`);
    const v = this.buf.readFloatLE(this.pos);
    this.pos += 4;
    return v;
  }

  /**
   * Read a fixed-width null-padded string.
   * @param {number} len - Byte width of field
   * @param {string} [encoding='latin1'] - Character encoding
   */
  readString(len, encoding = 'latin1') {
    const raw = this.readBytes(len);
    // Find first null byte
    let end = 0;
    while (end < raw.length && raw[end] !== 0) end++;
    return raw.slice(0, end).toString(encoding);
  }

  readTag() {
    return this.readBytes(4).toString('latin1');
  }

  peek(n = 4) {
    if (this.pos + n > this.buf.length) return null;
    return this.buf.slice(this.pos, this.pos + n);
  }

  skip(n) {
    this.pos += n;
    if (this.pos > this.buf.length) this.pos = this.buf.length;
  }
}

/**
 * BiqWriter builds a little-endian binary buffer.
 */
class BiqWriter {
  constructor() {
    this._chunks = [];
    this._len = 0;
  }

  writeByte(v) {
    const buf = Buffer.allocUnsafe(1);
    buf[0] = v & 0xff;
    this._chunks.push(buf);
    this._len += 1;
  }

  writeBytes(buf) {
    const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
    this._chunks.push(b);
    this._len += b.length;
  }

  writeShort(v) {
    const buf = Buffer.allocUnsafe(2);
    buf.writeInt16LE(v, 0);
    this._chunks.push(buf);
    this._len += 2;
  }

  writeInt(v) {
    const buf = Buffer.allocUnsafe(4);
    buf.writeInt32LE(v | 0, 0);
    this._chunks.push(buf);
    this._len += 4;
  }

  writeUInt(v) {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32LE(v >>> 0, 0);
    this._chunks.push(buf);
    this._len += 4;
  }

  writeFloat(v) {
    const buf = Buffer.allocUnsafe(4);
    buf.writeFloatLE(v, 0);
    this._chunks.push(buf);
    this._len += 4;
  }

  /**
   * Write a fixed-width null-padded string.
   * @param {string} str
   * @param {number} len - Field width in bytes
   * @param {string} [encoding='latin1']
   */
  writeString(str, len, encoding = 'latin1') {
    const src = Buffer.from(String(str || ''), encoding);
    const buf = Buffer.alloc(len, 0);
    src.copy(buf, 0, 0, Math.min(src.length, len));
    this._chunks.push(buf);
    this._len += len;
  }

  writeTag(tag) {
    this.writeString(tag, 4, 'latin1');
  }

  toBuffer() {
    return Buffer.concat(this._chunks, this._len);
  }

  get length() { return this._len; }
}

module.exports = { BiqReader, BiqWriter };
