/* ═══════════════════════════════════════════════════════════════════════════════
   utils.js — Sazón Restaurant System
   Shared utilities used by every module.
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── STORAGE HELPERS ────────────────────────────────────────────────────────── */
const Storage = {
  get: (key, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

/* ─── TOAST ──────────────────────────────────────────────────────────────────── */
function toast(msg, type = 'info', duration = 3000) {
  const icons = { success: '✓', error: '✕', info: '◆' };
  const c = document.querySelector('.toast-container') || (() => {
    const el = document.createElement('div');
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || '◆'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, duration);
}

/* ─── MODAL ──────────────────────────────────────────────────────────────────── */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

/* ─── FORMAT CURRENCY ────────────────────────────────────────────────────────── */
function fmtMoney(n) {
  return 'S/ ' + Number(n).toFixed(2);
}

/* ─── GENERATE CODE ──────────────────────────────────────────────────────────── */
function genCode(prefix, list, field = 'codigo') {
  const nums = list.map(x => parseInt((x[field] || '').replace(prefix, '')) || 0);
  const next  = (nums.length ? Math.max(...nums) : 0) + 1;
  return prefix + String(next).padStart(3, '0');
}

/* ─── NAVIGATION ACTIVE ──────────────────────────────────────────────────────── */
(function markActive() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href')?.split('/').pop();
    if (href === page) a.classList.add('active');
  });
})();
