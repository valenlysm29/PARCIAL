/* ═══════════════════════════════════════════════════════════════════════════════
   cocina.js — Sazón Restaurant System
   Módulo 03: Tablero de Cocina
   Depende de: utils.js
   ═══════════════════════════════════════════════════════════════════════════════ */

(function initCocina() {
  const PEDIDOS_STORE = 'sazon_pedidos';
  function getPedidos()       { return Storage.get(PEDIDOS_STORE, []); }
  function savePedidos(list)  { Storage.set(PEDIDOS_STORE, list); }

  const ESTADOS_PEDIDO = ['pendiente','en preparacion','listo para servir','entregado'];
  const ESTADO_LABELS  = {
    'pendiente':         'Pendiente',
    'en preparacion':    'En Preparación',
    'listo para servir': 'Listo ✓',
    'entregado':         'Entregado',
  };

  function nextEstado(actual) {
    const i = ESTADOS_PEDIDO.indexOf(actual);
    return ESTADOS_PEDIDO[Math.min(i + 1, ESTADOS_PEDIDO.length - 1)];
  }

  function updatePedidoEstado(id) {
    const pedidos = getPedidos();
    const idx = pedidos.findIndex(p => p.id === id);
    if (idx === -1) return;
    const p = pedidos[idx];
    const allReady = p.items.every(it => it.estado === 'listo para servir');
    if (allReady) p.estado = 'listo para servir';
    savePedidos(pedidos);
  }

  window.avanzarItemEstado = (pedidoId, itemIdx) => {
    const pedidos = getPedidos();
    const pIdx = pedidos.findIndex(p => p.id === pedidoId);
    if (pIdx === -1) return;
    pedidos[pIdx].items[itemIdx].estado = nextEstado(pedidos[pIdx].items[itemIdx].estado);
    updatePedidoEstado(pedidoId);
    savePedidos(pedidos);
    renderCocina();
  };

  window.avanzarPedidoEstado = pedidoId => {
    const pedidos = getPedidos();
    const pIdx = pedidos.findIndex(p => p.id === pedidoId);
    if (pIdx === -1) return;
    const p = pedidos[pIdx];
    p.estado = nextEstado(p.estado);
    p.items.forEach(it => { if (it.estado !== 'entregado') it.estado = p.estado; });
    savePedidos(pedidos);
    renderCocina();
  };

  window.marcarEntregado = pedidoId => {
    const pedidos = getPedidos();
    const pIdx = pedidos.findIndex(p => p.id === pedidoId);
    if (pIdx === -1) return;
    pedidos[pIdx].estado = 'entregado';
    pedidos[pIdx].items.forEach(it => it.estado = 'entregado');
    savePedidos(pedidos);
    toast('Pedido marcado como entregado.', 'success');
    renderCocina();
  };

  function estadoClass(e) {
    if (e === 'pendiente')          return 'estado-pendiente';
    if (e === 'en preparacion')     return 'estado-en-preparacion';
    if (e === 'listo para servir')  return 'estado-listo';
    if (e === 'entregado')          return 'estado-entregado';
    return '';
  }

  /* ─── RENDER ───────────────────────────────────────────────────────────────── */
  function renderCocina() {
    const pedidos = getPedidos().filter(p => p.estado !== 'cancelado' && p.estado !== 'entregado');
    const grid = document.getElementById('cocina-grid');
    if (!grid) return;

    const countEl = document.getElementById('cocina-count');
    if (countEl) countEl.textContent = `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''} activo${pedidos.length !== 1 ? 's' : ''}`;

    if (!pedidos.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">👨‍🍳</div><div class="empty-state-text">No hay pedidos en cocina. La calma es dorada.</div></div>`;
      return;
    }

    const sorted = [...pedidos].sort((a, b) => {
      const prio = { urgente: 3, alta: 2, normal: 1 };
      return (prio[b.prioridad] || 1) - (prio[a.prioridad] || 1);
    });

    grid.innerHTML = sorted.map(p => {
      const isUrgente   = p.prioridad === 'urgente';
      const allAlergenos = [...new Set(p.items.flatMap(it => it.alergenos || []))];
      return `
        <div class="cocina-card ${isUrgente ? 'urgente-card' : ''} animate-in">
          <div class="cocina-card-header">
            <div>
              <span class="badge badge-gold">${p.codigo}</span>
              <span style="margin-left:0.5rem;font-weight:700;font-size:1rem">Mesa ${p.mesa}</span>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">Mozo: ${p.mozo}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${new Date(p.createdAt).toLocaleTimeString('es-PE')}</div>
            </div>
            <div style="text-align:right">
              ${isUrgente ? '<span class="badge badge-urgent">⚡ URGENTE</span>' : p.prioridad === 'alta' ? '<span class="badge badge-orange">▲ Alta</span>' : '<span class="badge badge-gray">Normal</span>'}
              <div style="margin-top:0.4rem"><span class="estado-pill ${estadoClass(p.estado)}">${ESTADO_LABELS[p.estado] || p.estado}</span></div>
            </div>
          </div>
          ${allAlergenos.length ? `<div style="margin-bottom:0.75rem">${allAlergenos.map(a => `<span class="alergeno-tag">⚠ ${a}</span>`).join('')}</div>` : ''}
          <div>
            ${p.items.map((it, idx) => `
              <div class="plato-row">
                <div style="flex:1">
                  <div style="font-size:0.88rem;color:var(--cream)">${it.cantidad}× ${it.nombre}</div>
                  ${it.obs ? `<div style="font-size:0.75rem;color:var(--gold);font-style:italic">💬 ${it.obs}</div>` : ''}
                  ${it.alergenos?.length ? `<div>${it.alergenos.map(a => `<span class="alergeno-tag" style="font-size:0.68rem">⚠ ${a}</span>`).join('')}</div>` : ''}
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem">
                  <span class="estado-pill ${estadoClass(it.estado)}" style="font-size:0.72rem">${ESTADO_LABELS[it.estado] || it.estado}</span>
                  ${it.estado !== 'entregado' && it.estado !== 'listo para servir'
                    ? `<button class="btn btn-outline btn-sm" onclick="avanzarItemEstado('${p.id}',${idx})">→ Avanzar</button>` : ''}
                </div>
              </div>`).join('')}
          </div>
          <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap">
            ${p.estado !== 'listo para servir' ? `<button class="btn btn-gold btn-sm" onclick="avanzarPedidoEstado('${p.id}')">↑ Avanzar pedido</button>` : ''}
            <button class="btn btn-success btn-sm" onclick="marcarEntregado('${p.id}')">✓ Entregado</button>
          </div>
        </div>`;
    }).join('');
  }

  /* ─── BIND ─────────────────────────────────────────────────────────────────── */
  renderCocina();
  setInterval(renderCocina, 15000);
  document.getElementById('btn-refresh-cocina')?.addEventListener('click', renderCocina);
})();