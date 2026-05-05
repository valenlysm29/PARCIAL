/* ═══════════════════════════════════════════════════════════════════════════════
   pedidos.js — Sazón Restaurant System
   Módulo 02: Toma de Pedidos
   Depende de: utils.js
   ═══════════════════════════════════════════════════════════════════════════════ */

(function initPedidos() {
  const PLATOS_STORE  = 'sazon_platos';
  const PEDIDOS_STORE = 'sazon_pedidos';
  let currentItems = [];

  function getPlatos()  { return Storage.get(PLATOS_STORE, []).filter(p => p.estado === 'activo'); }
  function getPedidos() { return Storage.get(PEDIDOS_STORE, []); }
  function savePedidos(list) { Storage.set(PEDIDOS_STORE, list); }

  /* ─── ITEMS UI ─────────────────────────────────────────────────────────────── */
  function renderItems() {
    const wrap   = document.getElementById('items-wrap');
    const platos = getPlatos();
    if (!wrap) return;
    if (!currentItems.length) {
      wrap.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:1rem">Sin platos agregados</p>';
      updateTotal();
      return;
    }
    wrap.innerHTML = currentItems.map((it, i) => {
      const plato = platos.find(p => p.id === it.platoId);
      if (!plato) return '';
      const sub = plato.precio * it.cantidad;
      return `
        <div class="pedido-item animate-in">
          <div class="pedido-item-info">
            <div style="font-weight:600;color:var(--cream)">${plato.nombre}</div>
            <div style="font-size:0.78rem;color:var(--text-muted)">${fmtMoney(plato.precio)} c/u</div>
            <div style="display:flex;gap:0.5rem;margin-top:0.5rem;align-items:center">
              <button class="btn btn-outline btn-sm" onclick="changeQty(${i},-1)">−</button>
              <span style="min-width:2rem;text-align:center;color:var(--gold-pale);font-weight:600">${it.cantidad}</span>
              <button class="btn btn-outline btn-sm" onclick="changeQty(${i},1)">+</button>
            </div>
            <textarea class="form-control" style="margin-top:0.5rem;min-height:50px;font-size:0.8rem" placeholder="Observación especial (opcional)" onchange="setObs(${i},this.value)">${it.obs || ''}</textarea>
          </div>
          <div style="text-align:right;min-width:80px">
            <div style="color:var(--gold-pale);font-weight:700;font-family:'Playfair Display',serif">${fmtMoney(sub)}</div>
            <button class="btn btn-danger btn-sm" style="margin-top:0.5rem" onclick="removeItem(${i})">✕</button>
          </div>
        </div>`;
    }).join('');
    updateTotal();
  }

  function updateTotal() {
    const platos = getPlatos();
    const total = currentItems.reduce((acc, it) => {
      const p = platos.find(x => x.id === it.platoId);
      return acc + (p ? p.precio * it.cantidad : 0);
    }, 0);
    const el = document.getElementById('pedido-total');
    if (el) el.textContent = fmtMoney(total);
  }

  window.changeQty  = (i, delta) => { currentItems[i].cantidad = Math.max(1, currentItems[i].cantidad + delta); renderItems(); };
  window.setObs     = (i, val)   => { currentItems[i].obs = val; };
  window.removeItem = i          => { currentItems.splice(i, 1); renderItems(); };

  /* ─── ADD PLATO ────────────────────────────────────────────────────────────── */
  function addPlato() {
    const sel = document.getElementById('plato-select');
    if (!sel || !sel.value) { toast('Selecciona un plato.', 'error'); return; }
    currentItems.push({ platoId: sel.value, cantidad: 1, obs: '' });
    sel.value = '';
    renderItems();
  }

  /* ─── POPULATE SELECT ──────────────────────────────────────────────────────── */
  function populatePlatoSelect() {
    const sel = document.getElementById('plato-select');
    if (!sel) return;
    const platos = getPlatos();
    sel.innerHTML = '<option value="">— Seleccionar plato —</option>' +
      platos.map(p => `<option value="${p.id}">${p.nombre} (${fmtMoney(p.precio)})</option>`).join('');
  }

  /* ─── PRIORITY LOGIC ───────────────────────────────────────────────────────── */
  function handlePriorityChange() {
    const val  = document.getElementById('pedido-prioridad')?.value;
    const jWrap = document.getElementById('justificacion-wrap');
    if (jWrap) jWrap.style.display = val === 'urgente' ? 'block' : 'none';
  }

  /* ─── VALIDATE ─────────────────────────────────────────────────────────────── */
  function validatePedido() {
    let ok = true;
    const mesa = document.getElementById('pedido-mesa');
    const mozo = document.getElementById('pedido-mozo');
    const prio = document.getElementById('pedido-prioridad');
    const just = document.getElementById('pedido-justificacion');

    if (!mesa || !mesa.value || parseInt(mesa.value) < 1 || parseInt(mesa.value) > 50) {
      mesa?.classList.add('invalid');
      const e = document.getElementById('pedido-mesa-err');
      if (e) { e.textContent = 'Mesa entre 1 y 50.'; e.classList.add('visible'); }
      ok = false;
    } else {
      mesa?.classList.remove('invalid');
      const e = document.getElementById('pedido-mesa-err');
      if (e) e.classList.remove('visible');
    }

    if (!mozo || mozo.value.trim().length < 3) {
      mozo?.classList.add('invalid');
      const e = document.getElementById('pedido-mozo-err');
      if (e) { e.textContent = 'Nombre del mozo mín 3 caracteres.'; e.classList.add('visible'); }
      ok = false;
    } else {
      mozo?.classList.remove('invalid');
      const e = document.getElementById('pedido-mozo-err');
      if (e) e.classList.remove('visible');
    }

    if (prio?.value === 'urgente' && just?.value.trim().length < 10) {
      just?.classList.add('invalid');
      const e = document.getElementById('pedido-just-err');
      if (e) { e.textContent = 'Justificación mín 10 caracteres.'; e.classList.add('visible'); }
      ok = false;
    } else {
      just?.classList.remove('invalid');
      const e = document.getElementById('pedido-just-err');
      if (e) e.classList.remove('visible');
    }

    if (!currentItems.length) { toast('Agrega al menos un plato.', 'error'); ok = false; }
    return ok;
  }

  /* ─── SAVE PEDIDO ──────────────────────────────────────────────────────────── */
  function savePedido() {
    if (!validatePedido()) return;
    const pedidos = getPedidos();
    const platos  = getPlatos();
    const total   = currentItems.reduce((acc, it) => {
      const p = platos.find(x => x.id === it.platoId);
      return acc + (p ? p.precio * it.cantidad : 0);
    }, 0);
    const pedido = {
      id:            Date.now().toString(),
      codigo:        genCode('PED', pedidos),
      mesa:          parseInt(document.getElementById('pedido-mesa').value),
      mozo:          document.getElementById('pedido-mozo').value.trim(),
      prioridad:     document.getElementById('pedido-prioridad').value,
      justificacion: document.getElementById('pedido-justificacion')?.value.trim() || '',
      items:         currentItems.map(it => ({
        platoId:  it.platoId,
        nombre:   platos.find(p => p.id === it.platoId)?.nombre || '',
        precio:   platos.find(p => p.id === it.platoId)?.precio || 0,
        alergenos:platos.find(p => p.id === it.platoId)?.alergenos || [],
        cantidad: it.cantidad,
        obs:      it.obs,
        estado:   'pendiente',
      })),
      total,
      estado:    'enviado',
      createdAt: new Date().toISOString(),
    };
    pedidos.push(pedido);
    savePedidos(pedidos);
    toast(`Pedido ${pedido.codigo} enviado a cocina.`, 'success');

    // Reset form
    currentItems = [];
    document.getElementById('pedido-mesa').value = '';
    document.getElementById('pedido-mozo').value = '';
    document.getElementById('pedido-prioridad').value = 'normal';
    const just  = document.getElementById('pedido-justificacion');
    if (just) just.value = '';
    const jWrap = document.getElementById('justificacion-wrap');
    if (jWrap) jWrap.style.display = 'none';
    renderItems();
    renderPedidosList();
  }

  /* ─── RENDER LIST ──────────────────────────────────────────────────────────── */
  function renderPedidosList() {
    const pedidos = getPedidos();
    const wrap = document.getElementById('pedidos-list');
    if (!wrap) return;
    if (!pedidos.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No hay pedidos registrados</div></div>`;
      return;
    }
    wrap.innerHTML = [...pedidos].reverse().map(p => `
      <div class="glass-card animate-in" style="margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem">
          <div>
            <span class="badge badge-gold">${p.codigo}</span>
            <span style="margin-left:0.5rem;font-weight:600">Mesa ${p.mesa}</span>
            <span style="margin-left:0.5rem;color:var(--text-muted);font-size:0.85rem">· ${p.mozo}</span>
          </div>
          <div style="display:flex;gap:0.4rem;align-items:center">
            ${p.prioridad === 'urgente' ? '<span class="badge badge-urgent">⚡ URGENTE</span>' : p.prioridad === 'alta' ? '<span class="badge badge-orange">▲ Alta</span>' : '<span class="badge badge-gray">Normal</span>'}
            <span class="estado-pill estado-${p.estado}">${p.estado}</span>
          </div>
        </div>
        <div style="margin-top:0.75rem;font-size:0.82rem;color:var(--text-muted)">${new Date(p.createdAt).toLocaleString('es-PE')}</div>
        <div style="margin-top:0.75rem">
          ${p.items.map(it => `
            <div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.87rem;border-bottom:1px solid rgba(255,255,255,0.04)">
              <span>${it.cantidad}× ${it.nombre}${it.obs ? ` <em style="color:var(--text-muted)">(${it.obs})</em>` : ''}</span>
              <span style="color:var(--gold-pale)">${fmtMoney(it.precio * it.cantidad)}</span>
            </div>`).join('')}
        </div>
        <div style="text-align:right;margin-top:0.75rem;font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--gold-pale)">Total: ${fmtMoney(p.total)}</div>
        ${p.estado === 'enviado' ? `<button class="btn btn-danger btn-sm" style="margin-top:0.75rem" onclick="cancelarPedido('${p.id}')">Cancelar pedido</button>` : ''}
      </div>`).join('');
  }

  window.cancelarPedido = id => {
    if (!confirm('¿Cancelar este pedido?')) return;
    const pedidos = getPedidos();
    const idx = pedidos.findIndex(p => p.id === id);
    if (idx !== -1) { pedidos[idx].estado = 'cancelado'; savePedidos(pedidos); }
    toast('Pedido cancelado.', 'info');
    renderPedidosList();
  };

  /* ─── BIND ─────────────────────────────────────────────────────────────────── */
  document.getElementById('btn-add-plato')?.addEventListener('click', addPlato);
  document.getElementById('btn-enviar-pedido')?.addEventListener('click', savePedido);
  document.getElementById('pedido-prioridad')?.addEventListener('change', handlePriorityChange);

  populatePlatoSelect();
  renderItems();
  renderPedidosList();
})();