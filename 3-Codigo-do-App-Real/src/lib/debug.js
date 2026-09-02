// src/lib/debug.js
// Sistema de debug visual + arquivo para testar sem USB debugging

const MAX_LOGS = 200;
const STORAGE_KEY = 'fedebug_logs';

let logs = [];
let listeners = [];

function loadLogs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) logs = JSON.parse(stored);
  } catch { logs = []; }
}

function saveLogs() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-MAX_LOGS))); } catch {}
}

function addLog(category, message, data) {
  const entry = {
    time: new Date().toISOString(),
    category,
    message,
    data: data ? JSON.stringify(data).slice(0, 200) : undefined,
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();
  saveLogs();
  listeners.forEach(fn => fn(entry));
  console.log(`[${category}] ${message}`, data || '');
}

export function logAdMob(message, data) { addLog('AdMob', message, data); }
export function logRadar(message, data) { addLog('Radar', message, data); }
export function logShare(message, data) { addLog('Share', message, data); }
export function logGemini(message, data) { addLog('Gemini', message, data); }
export function logError(category, error) { addLog(category, 'ERROR: ' + (error?.message || error), error?.stack); }
export function logInfo(category, message, data) { addLog(category, message, data); }

export function getLogs() {
  loadLogs();
  return [...logs].reverse();
}

export function clearLogs() {
  logs = [];
  saveLogs();
  listeners.forEach(fn => fn({ type: 'cleared' }));
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(f => f !== fn); };
}

export async function exportLogsToFile() {
  loadLogs();
  const content = logs.map(l => `[${l.time}] [${l.category}] ${l.message}${l.data ? ' | ' + l.data : ''}`).join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'FeDiaria_debug.txt',
        types: [{ description: 'Text file', accept: { 'text/plain': ['.txt'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { ok: true, path: 'Arquivo salvo via seletor' };
    } catch (e) { /* fallback */ }
  }
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'FeDiaria_debug.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { ok: true, path: 'Download/FeDiaria_debug.txt' };
}

export function pruneOldLogs() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  loadLogs();
  const before = logs.length;
  logs = logs.filter(l => new Date(l.time).getTime() > cutoff);
  if (logs.length !== before) saveLogs();
}

loadLogs();
pruneOldLogs();