/* ═══════════════════════════════════════════════════════════════════════════════
   facturacion.js — Sazón Restaurant System
   Módulo 04: Facturación & Cobro
   Depende de: utils.js
   ═══════════════════════════════════════════════════════════════════════════════ */

(function initFacturacion() {
  const PEDIDOS_STORE  = 'sazon_pedidos';
  const FACTURAS_STORE = 'sazon_facturas';
  const IGV = 0.18;

  function getPedidos()       { return Storage.get(PEDIDOS_STORE, []); }
  function savePedidos(list)  { Storage.set(PEDIDOS_STORE, list); }
  function getFacturas()      { return Storage.get(FACTURAS_STORE, []); }
  function saveFacturas(list) { Storage.set(FACTURAS_STORE, list); }

  let currentMesa    = null;
  let currentPedidos = [];
  let descuento      = 0;

  /* ─── BUSCAR MESA ──────────────────────────────────────────────────────────── */
  function buscarMesa() {
    const mesaEl = document.getElementById('buscar-mesa');
    const mesa   = parseInt(mesaEl?.value);
    if (!mesa || mesa < 1 || mesa > 50) { toast('Mesa entre 1 y 50.', 'error'); return; }

    currentMesa    = mesa;
    currentPedidos = getPedidos().filter(p => p.mesa === mesa && p.estado === 'entregado');
    descuento      = 0;

    if (document.getElementById('descuento-input'))    document.getElementById('descuento-input').value = '';
    if (document.getElementById('justificacion-desc')) document.getElementById('justificacion-desc').value = '';
    if (document.getElementById('monto-efectivo'))     document.getElementById('monto-efectivo').value = '';

    renderFactura();
  }

  /* ─── RENDER FACTURA ───────────────────────────────────────────────────────── */
  function renderFactura() {
    const wrap      = document.getElementById('factura-wrap');
    const facturas  = getFacturas();
    const mesaPagada = facturas.some(f => f.mesa === currentMesa && f.estado === 'pagada');

    if (!wrap) return;
    if (!currentMesa) {
      wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">Busca una mesa para ver su cuenta</div></div>';
      return;
    }
    if (!currentPedidos.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🍽</div><div class="empty-state-text">No hay pedidos entregados para la Mesa ${currentMesa}</div></div>`;
      return;
    }
    if (mesaPagada) {
      wrap.innerHTML = `<div class="alert alert-success">✓ La cuenta de la Mesa ${currentMesa} ya fue pagada.</div>`;
      return;
    }

    const subtotal = currentPedidos.reduce((acc, p) => acc + p.total, 0);
    const igv      = (subtotal - descuento) * IGV;
    const total    = (subtotal - descuento) * (1 + IGV);

    wrap.innerHTML = `
      <div class="section-title">Mesa ${currentMesa} — Cuenta</div>
      ${currentPedidos.map(p => `
        <div style="margin-bottom:1rem">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
            <span class="badge badge-gold">${p.codigo}</span>
            <span style="color:var(--text-muted);font-size:0.8rem">Mozo: ${p.mozo}</span>
          </div>
          ${p.items.map(it => `
            <div style="display:flex;justify-content:space-between;font-size:0.87rem;padding:0.25rem 0;border-bottom:1px solid rgba(255,255,255,0.04)">
              <span>${it.cantidad}× ${it.nombre}</span>
              <span style="color:var(--gold-pale)">${fmtMoney(it.precio * it.cantidad)}</span>
            </div>`).join('')}
        </div>`).join('')}
      <div class="divider"></div>
      <div class="total-box">
        <div class="total-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
        ${descuento > 0 ? `<div class="total-row" style="color:#4ade80"><span>Descuento</span><span>− ${fmtMoney(descuento)}</span></div>` : ''}
        <div class="total-row"><span>IGV (18%)</span><span>${fmtMoney(igv)}</span></div>
        <div class="total-row grand"><span>TOTAL</span><span>${fmtMoney(total)}</span></div>
      </div>`;

    document.getElementById('res-subtotal').textContent = fmtMoney(subtotal);
    document.getElementById('res-igv').textContent      = fmtMoney(igv);
    document.getElementById('res-total').textContent    = fmtMoney(total);

    handleMetodoPago();
  }

  /* ─── DESCUENTO ────────────────────────────────────────────────────────────── */
  function applyDescuento() {
    const subtotal = currentPedidos.reduce((acc, p) => acc + p.total, 0);
    const dEl = document.getElementById('descuento-input');
    const jEl = document.getElementById('justificacion-desc');
    const d   = parseFloat(dEl?.value || 0);
    const j   = jEl?.value.trim() || '';

    if (isNaN(d) || d < 0)  { toast('Descuento no puede ser negativo.', 'error'); return; }
    if (d > subtotal)        { toast('Descuento no puede superar el subtotal.', 'error'); return; }
    if (j.length < 10)       { toast('Justificación del descuento mín 10 caracteres.', 'error'); return; }

    descuento = d;
    toast(`Descuento de ${fmtMoney(d)} aplicado.`, 'success');
    renderFactura();
  }

  /* ─── MÉTODO DE PAGO ───────────────────────────────────────────────────────── */
  function handleMetodoPago() {
    const metodo = document.getElementById('metodo-pago')?.value;
    const efectivoWrap = document.getElementById('efectivo-wrap');
    if (efectivoWrap) efectivoWrap.style.display = metodo === 'efectivo' ? 'block' : 'none';
  }

  /* ─── VUELTO ───────────────────────────────────────────────────────────────── */
  function calcularVuelto() {
    const subtotal = currentPedidos.reduce((acc, p) => acc + p.total, 0);
    const total    = (subtotal - descuento) * (1 + IGV);
    const recibido = parseFloat(document.getElementById('monto-efectivo')?.value || 0);
    const vueltoEl = document.getElementById('vuelto-display');
    if (!vueltoEl) return;
    if (recibido >= total) {
      vueltoEl.textContent = `Vuelto: ${fmtMoney(recibido - total)}`;
      vueltoEl.style.color = '#4ade80';
    } else {
      vueltoEl.textContent = `Falta: ${fmtMoney(total - recibido)}`;
      vueltoEl.style.color = '#f87171';
    }
  }

  /* ─── PROCESAR PAGO ────────────────────────────────────────────────────────── */
  function procesarPago() {
    if (!currentPedidos.length) { toast('No hay pedidos para cobrar.', 'error'); return; }
    const metodo   = document.getElementById('metodo-pago')?.value;
    const subtotal = currentPedidos.reduce((acc, p) => acc + p.total, 0);
    const igv      = (subtotal - descuento) * IGV;
    const total    = (subtotal - descuento) * (1 + IGV);

    if (metodo === 'efectivo') {
      const recibido = parseFloat(document.getElementById('monto-efectivo')?.value || 0);
      if (isNaN(recibido) || recibido < total) { toast('El monto recibido es insuficiente.', 'error'); return; }
    }

    const pedidos = getPedidos();
    currentPedidos.forEach(cp => {
      const idx = pedidos.findIndex(p => p.id === cp.id);
      if (idx !== -1) pedidos[idx].estado = 'pagado';
    });
    savePedidos(pedidos);

    const factura = {
      id:       Date.now().toString(),
      mesa:     currentMesa,
      pedidos:  currentPedidos.map(p => p.id),
      subtotal, descuento, igv, total,
      metodo,
      estado:   'pagada',
      creadaEn: new Date().toISOString(),
    };
    const facturas = getFacturas();
    facturas.push(factura);
    saveFacturas(facturas);

    toast(`✓ Pago procesado. Total: ${fmtMoney(total)}`, 'success');
    currentMesa    = null;
    currentPedidos = [];
    descuento      = 0;
    document.getElementById('buscar-mesa').value = '';
    renderFactura();
    renderHistorial();
  }

  /* ─── HISTORIAL ────────────────────────────────────────────────────────────── */
  function renderHistorial() {
    const facturas = getFacturas();
    const wrap = document.getElementById('historial-wrap');
    if (!wrap) return;
    if (!facturas.length) {
      wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📜</div><div class="empty-state-text">Sin facturas registradas</div></div>';
      return;
    }
    wrap.innerHTML = [...facturas].reverse().map(f => `
      <div class="glass-card animate-in" style="margin-bottom:0.75rem">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">
          <div>
            <span class="badge badge-gold">Mesa ${f.mesa}</span>
            <span style="margin-left:0.5rem;color:var(--text-muted);font-size:0.82rem">${new Date(f.creadaEn).toLocaleString('es-PE')}</span>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <span class="badge badge-gray">${f.metodo}</span>
            <span class="estado-pill estado-pagado">Pagada</span>
            <span style="font-family:'Playfair Display',serif;color:var(--gold-pale);font-size:1.1rem">${fmtMoney(f.total)}</span>
          </div>
        </div>
      </div>`).join('');
  }

  /* ─── BIND ─────────────────────────────────────────────────────────────────── */
  document.getElementById('btn-buscar-mesa')?.addEventListener('click', buscarMesa);
  document.getElementById('btn-aplicar-descuento')?.addEventListener('click', applyDescuento);
  document.getElementById('btn-procesar-pago')?.addEventListener('click', procesarPago);
  document.getElementById('metodo-pago')?.addEventListener('change', handleMetodoPago);
  document.getElementById('monto-efectivo')?.addEventListener('input', calcularVuelto);
  document.getElementById('buscar-mesa')?.addEventListener('keydown', e => { if (e.key === 'Enter') buscarMesa(); });

  renderFactura();
  renderHistorial();
})();
