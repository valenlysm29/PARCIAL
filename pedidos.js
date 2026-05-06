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
    const wrap = document.getElementById('items-wrap');
    const platos = getPlatos();
    if (!wrap) return;

    if (!currentItems.length) {
      wrap.innerHTML = `
        <div class="animate__animated animate__fadeIn" style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:2rem;border:1px dashed rgba(255,255,255,0.1);border-radius:8px">
          <i class="fas fa-utensils" style="display:block;margin-bottom:0.5rem;opacity:0.5"></i>
          Aún no has seleccionado platos
        </div>`;
      updateTotal();
      return;
    }

    wrap.innerHTML = currentItems.map((it, i) => {
      const plato = platos.find(p => p.id === it.platoId);
      if (!plato) return '';
      const sub = plato.precio * it.cantidad;
      return `
        <div class="pedido-item animate__animated animate__fadeInLeft" style="background:rgba(255,255,255,0.03);padding:1rem;border-radius:8px;margin-bottom:0.75rem;border-left:3px solid var(--gold)">
          <div class="pedido-item-info">
            <div style="font-weight:600;color:var(--cream);font-size:1rem">${plato.nombre}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.5rem">${fmtMoney(plato.precio)} c/u</div>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <button class="btn btn-outline btn-sm" onclick="changeQty(${i},-1)" style="padding:0 10px">−</button>
              <span style="min-width:2rem;text-align:center;color:var(--gold-pale);font-weight:700">${it.cantidad}</span>
              <button class="btn btn-outline btn-sm" onclick="changeQty(${i},1)" style="padding:0 10px">+</button>
            </div>
            <textarea class="form-control" style="margin-top:0.8rem;min-height:45px;font-size:0.75rem;background:rgba(0,0,0,0.2)" 
              placeholder="Notas para cocina (término de carne, alergias...)" 
              onchange="setObs(${i},this.value)">${it.obs || ''}</textarea>
          </div>
          <div style="text-align:right;min-width:90px;display:flex;flex-direction:column;justify-content:space-between">
            <div style="color:var(--gold-pale);font-weight:700;font-family:'Playfair Display',serif;font-size:1.1rem">${fmtMoney(sub)}</div>
            <button class="btn btn-danger btn-sm" style="align-self:flex-end;opacity:0.7" onclick="removeItem(${i})">
              <i class="fas fa-trash-alt"></i>
            </button>
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
    if (!sel || !sel.value) { toast('Por favor, selecciona un plato de la lista.', 'error'); return; }
    
    // Verificar si el plato ya existe para aumentar cantidad en lugar de duplicar fila
    const existing = currentItems.find(it => it.platoId === sel.value);
    if(existing) {
      existing.cantidad++;
    } else {
      currentItems.push({ platoId: sel.value, cantidad: 1, obs: '' });
    }
    
    sel.value = '';
    renderItems();
  }

  /* ─── POPULATE SELECT ──────────────────────────────────────────────────────── */
  function populatePlatoSelect() {
    const sel = document.getElementById('plato-select');
    if (!sel) return;
    const platos = getPlatos();
    sel.innerHTML = '<option value="">— Seleccionar del Menú —</option>' +
      platos.map(p => `<option value="${p.id}">${p.nombre} (${fmtMoney(p.precio)})</option>`).join('');
  }

  /* ─── PRIORITY LOGIC ───────────────────────────────────────────────────────── */
  function handlePriorityChange() {
    const val  = document.getElementById('pedido-prioridad')?.value;
    const jWrap = document.getElementById('justificacion-wrap');
    if (jWrap) {
        if(val === 'urgente') {
            jWrap.style.display = 'block';
            jWrap.classList.add('animate__animated', 'animate__fadeIn');
        } else {
            jWrap.style.display = 'none';
        }
    }
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
      if (e) { e.textContent = 'Indique mesa válida (1-50)'; e.classList.add('visible'); }
      ok = false;
    } else {
      mesa?.classList.remove('invalid');
      document.getElementById('pedido-mesa-err')?.classList.remove('visible');
    }

    if (!mozo || mozo.value.trim().length < 3) {
      mozo?.classList.add('invalid');
      const e = document.getElementById('pedido-mozo-err');
      if (e) { e.textContent = 'Nombre del mozo demasiado corto'; e.classList.add('visible'); }
      ok = false;
    } else {
      mozo?.classList.remove('invalid');
      document.getElementById('pedido-mozo-err')?.classList.remove('visible');
    }

    if (prio?.value === 'urgente' && just?.value.trim().length < 10) {
      just?.classList.add('invalid');
      const e = document.getElementById('pedido-just-err');
      if (e) { e.textContent = 'La urgencia requiere una explicación detallada'; e.classList.add('visible'); }
      ok = false;
    } else {
      just?.classList.remove('invalid');
      document.getElementById('pedido-just-err')?.classList.remove('visible');
    }

    if (!currentItems.length) { toast('No puedes enviar una comanda vacía.', 'error'); ok = false; }
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
      prioridad:      document.getElementById('pedido-prioridad').value,
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
    toast(`Comanda ${pedido.codigo} enviada con éxito.`, 'success');

    // Reset Form
    currentItems = [];
    document.getElementById('pedido-mesa').value = '';
    document.getElementById('pedido-mozo').value = '';
    document.getElementById('pedido-prioridad').value = 'normal';
    if(document.getElementById('pedido-justificacion')) document.getElementById('pedido-justificacion').value = '';
    handlePriorityChange();
    renderItems();
    renderPedidosList();
  }

  /* ─── RENDER LIST ──────────────────────────────────────────────────────────── */
  function renderPedidosList() {
    const pedidos = getPedidos();
    const wrap = document.getElementById('pedidos-list');
    if (!wrap) return;

    if (!pedidos.length) {
      wrap.innerHTML = `
        <div class="glass-card-dark" style="display: flex; flex-direction: column; justify-content: center; align-items: center; border: 1px dashed var(--gold-pale); opacity: 0.6; padding: 3rem; text-align: center;">
          <i class="fas fa-clipboard-list" style="font-size: 2rem; color: var(--gold); margin-bottom: 1rem;"></i>
          <p style="color:var(--text-muted); font-style:italic">No hay pedidos registrados hoy.</p>
        </div>`;
      return;
    }

    wrap.innerHTML = [...pedidos].reverse().map(p => `
      <div class="glass-card animate__animated animate__fadeInUp" style="margin-bottom:1rem; border-left: 4px solid ${p.prioridad === 'urgente' ? '#ff4d4d' : '#d4af37'}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem">
          <div>
            <span class="badge" style="background:var(--gold);color:black;font-weight:bold">${p.codigo}</span>
            <span style="margin-left:0.5rem;font-weight:600;color:var(--cream)">Mesa ${p.mesa}</span>
            <div style="color:var(--text-muted);font-size:0.75rem;margin-top:0.2rem">Mozo: ${p.mozo}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem">
            ${p.prioridad === 'urgente' ? '<span class="badge" style="background:#ff4d4d;color:white;font-size:0.7rem">⚡ URGENTE</span>' : ''}
            <span class="estado-pill estado-${p.estado}" style="text-transform:uppercase;font-size:0.65rem;letter-spacing:1px">${p.estado}</span>
          </div>
        </div>
        
        <div style="margin-top:1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top:0.5rem">
          ${p.items.map(it => `
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:0.2rem 0">
              <span style="color:var(--text-muted)">${it.cantidad}× <span style="color:var(--cream)">${it.nombre}</span></span>
              <span style="color:var(--gold-pale)">${fmtMoney(it.precio * it.cantidad)}</span>
            </div>`).join('')}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;padding-top:0.5rem;border-top:1px solid rgba(255,255,255,0.1)">
          <span style="font-size:0.75rem;color:var(--text-muted)">${new Date(p.createdAt).toLocaleTimeString()}</span>
          <div style="font-family:'Playfair Display',serif;font-size:1.2rem;color:var(--gold-pale);font-weight:bold">Total: ${fmtMoney(p.total)}</div>
        </div>

        ${p.estado === 'enviado' ? `
          <button class="btn btn-danger btn-sm btn-full" style="margin-top:1rem;background:transparent;border:1px solid #ff4d4d;color:#ff4d4d" 
            onclick="cancelarPedido('${p.id}')">Anular Comanda</button>` : ''}
      </div>`).join('');
  }

  window.cancelarPedido = id => {
    if (!confirm('¿Está seguro de anular esta comanda del sistema?')) return;
    const pedidos = getPedidos();
    const idx = pedidos.findIndex(p => p.id === id);
    if (idx !== -1) { pedidos[idx].estado = 'cancelado'; savePedidos(pedidos); }
    toast('Comanda anulada.', 'info');
    renderPedidosList();
  };

  /* ─── BIND ─────────────────────────────────────────────────────────────────── */
  document.getElementById('btn-add-plato')?.addEventListener('click', addPlato);
  document.getElementById('btn-enviar-pedido')?.addEventListener('click', savePedido);
  document.getElementById('pedido-prioridad')?.addEventListener('change', handlePriorityChange);

  // Init
  populatePlatoSelect();
  renderItems();
  renderPedidosList();
})();