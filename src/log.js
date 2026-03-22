'use strict';

// Shared debug logger for the C3X Config Manager main process.
//
// Usage:
//   const log = require('./log');
//   log.setCiv3Root(civ3Path);   // call once at startup / on settings load
//   log.info('category', 'message with ' + log.rel('/some/absolute/path'));
//
// Privacy: all absolute paths should go through log.rel() before logging.
// log.rel() returns a path relative to the Civ3 root, so user home-directory
// components (e.g. /Users/johndoe/...) are never written to the log.

const path = require('node:path');
const os = require('node:os');

let _civ3Root = '';

// Set the Civ3 root path used by rel() for path sanitization.
// Call this whenever civ3Path is known (settings load, bundle load, etc.).
function setCiv3Root(root) {
  _civ3Root = String(root || '').replace(/[/\\]+$/, '');
}

// Returns a privacy-safe representation of an absolute path for logging:
//   - Paths under the Civ3 root are shown relative to it (e.g. "Conquests/Scenarios/foo.biq")
//   - Paths under the OS temp dir are shown as "[tmp]/filename"
//   - All other paths are shown as just the final filename component
//     to avoid revealing user account names or system layout.
function rel(absPath) {
  const p = String(absPath || '');
  if (!p) return '(none)';

  // Normalize separators for comparison
  const norm = p.replace(/\\/g, '/');
  const rootNorm = _civ3Root.replace(/\\/g, '/');

  if (rootNorm && norm.toLowerCase().startsWith(rootNorm.toLowerCase() + '/')) {
    return norm.slice(rootNorm.length + 1);
  }
  if (rootNorm && norm.toLowerCase() === rootNorm.toLowerCase()) {
    return '(civ3Root)';
  }

  const tmpNorm = os.tmpdir().replace(/\\/g, '/');
  if (tmpNorm && norm.startsWith(tmpNorm + '/')) {
    return '[tmp]/' + path.basename(p);
  }

  // Unknown root: just the filename
  return path.basename(p) || p;
}

// Format an array of paths for a compact log line.
function relList(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return '(none)';
  return paths.map(rel).join(', ');
}

function _stamp() {
  // ISO-8601 local-ish timestamp without TZ noise: "2026-03-21 14:05:32.123"
  return new Date().toISOString().slice(0, 23).replace('T', ' ');
}

function _fmt(level, category, msg) {
  return `[C3X][${_stamp()}][${level}][${category}] ${msg}`;
}

function debug(category, msg) { console.log(_fmt('DBG', category, msg)); }
function info(category, msg)  { console.log(_fmt('INF', category, msg)); }
function warn(category, msg)  { console.warn(_fmt('WRN', category, msg)); }
function error(category, msg) { console.error(_fmt('ERR', category, msg)); }

module.exports = { debug, info, warn, error, rel, relList, setCiv3Root };
