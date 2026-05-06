/* ═══════════════════════════════════════════════════════════════════════════════
   platos.js — Sazón Restaurant System
   Módulo 01: Gestión de Platos
   Depende de: utils.js
   ═══════════════════════════════════════════════════════════════════════════════ */

(function initPlatos() {
  const STORE = 'sazon_platos';
  const PEDIDOS_STORE = 'sazon_pedidos';
  let editId = null;

  const ALERGENOS_LIST = ['Gluten','Lácteos','Huevo','Mariscos','Frutos secos','Soja','Otro'];

  function getPlatos()  { return Storage.get(STORE, []); }
  function savePlatos(list) { Storage.set(STORE, list); }
  function getPedidos() { return Storage.get(PEDIDOS_STORE, []); }

  /* ─── BUILD ALERGENOS FORM ─────────────────────────────────────────────────── */
  function buildAlergenosForm(selected = []) {
    const wrap = document.getElementById('alergenos-wrap');
    wrap.innerHTML = '';

    const ninguno = document.createElement('label');
    ninguno.className = 'checkbox-label';
    ninguno.innerHTML = `<input type="checkbox" value="Ninguno" ${selected.includes('Ninguno') ? 'checked' : ''}> Ninguno`;
    wrap.appendChild(ninguno);

    ALERGENOS_LIST.forEach(a => {
      const lb = document.createElement('label');
      lb.className = 'checkbox-label';
      lb.innerHTML = `<input type="checkbox" value="${a}" ${selected.includes(a) ? 'checked' : ''}> ${a}`;
      wrap.appendChild(lb);
    });

    const otroWrap = document.createElement('div');
    otroWrap.id = 'otro-wrap';
    otroWrap.style.display = selected.includes('Otro') ? 'block' : 'none';
    otroWrap.style.marginTop = '0.5rem';
    otroWrap.innerHTML = `<input type="text" class="form-control" id="alergeno-otro-input" placeholder="Especifique el alérgeno" value="${selected.filter(x => !ALERGENOS_LIST.includes(x) && x !== 'Ninguno').join(', ')}">`;
    wrap.appendChild(otroWrap);

    wrap.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', handleAlergenoChange);
    });
    if (selected.includes('Ninguno')) disableOtherAlergenos(true);
  }

  function handleAlergenoChange(e) {
    const val = e.target.value;
    if (val === 'Ninguno') {
      disableOtherAlergenos(e.target.checked);
    } else {
      const ningunoCb = document.querySelector('#alergenos-wrap input[value="Ninguno"]');
      if (ningunoCb) ningunoCb.checked = false;
      const otroWrap = document.getElementById('otro-wrap');
      const otroChecked = !!document.querySelector('#alergenos-wrap input[value="Otro"]:checked');
      if (otroWrap) otroWrap.style.display = otroChecked ? 'block' : 'none';
    }
  }

  function disableOtherAlergenos(disable) {
    document.querySelectorAll('#alergenos-wrap input[type=checkbox]').forEach(cb => {
      if (cb.value !== 'Ninguno') { cb.disabled = disable; cb.checked = false; }
    });
    const otroWrap = document.getElementById('otro-wrap');
    if (otroWrap) otroWrap.style.display = 'none';
  }

  function getSelectedAlergenos() {
    const checked = [...document.querySelectorAll('#alergenos-wrap input[type=checkbox]:checked')].map(c => c.value);
    if (checked.includes('Otro')) {
      const customVal = document.getElementById('alergeno-otro-input')?.value.trim();
      if (customVal) return checked.filter(x => x !== 'Otro').concat(customVal.split(',').map(s => s.trim()).filter(Boolean));
    }
    return checked;
  }

  /* ─── VALIDATION ───────────────────────────────────────────────────────────── */
  const rules = {
    codigo:      v => /^PL\d{3,}$/.test(v) && !v.includes(' '),
    nombre:      v => v.length >= 3 && v.length <= 60 && !/^\d+$/.test(v),
    descripcion: v => v.length >= 10 && v.length <= 250,
    categoria:   v => v !== '',
    precio:      v => parseFloat(v) > 0 && !isNaN(parseFloat(v)),
    tiempo_prep: v => { const n = parseInt(v); return !isNaN(n) && n >= 1 && n <= 120; },
    estado:      v => ['activo','inactivo'].includes(v),
  };

  const errMsgs = {
    codigo:      'Código requerido (ej: PL001), mín 3 chars, sin espacios.',
    nombre:      'Nombre de 3 a 60 chars, no solo números.',
    descripcion: 'Descripción de 10 a 250 caracteres.',
    categoria:   'Selecciona una categoría.',
    precio:      'Precio numérico mayor a 0.',
    tiempo_prep: 'Tiempo de 1 a 120 minutos.',
    estado:      'Selecciona un estado.',
  };

  function validateForm() {
    let ok = true;
    Object.keys(rules).forEach(id => {
      const el = document.getElementById('plato-' + id);
      if (!el) return;
      const v = el.value.trim();
      const valid = rules[id](v);
      el.classList.toggle('invalid', !valid);
      const errEl = document.getElementById('plato-' + id + '-err');
      if (errEl) { errEl.textContent = valid ? '' : errMsgs[id]; errEl.classList.toggle('visible', !valid); }
      if (!valid) ok = false;
    });

    // Código único
    const codigoEl = document.getElementById('plato-codigo');
    if (codigoEl) {
      const v = codigoEl.value.trim().toUpperCase();
      const duplicate = getPlatos().some(p => p.codigo === v && p.id !== editId);
      if (duplicate) {
        codigoEl.classList.add('invalid');
        const errEl = document.getElementById('plato-codigo-err');
        if (errEl) { errEl.textContent = 'Este código ya existe.'; errEl.classList.add('visible'); }
        ok = false;
      }
    }

    // Alérgeno "Otro" con texto
    const otroChecked = !!document.querySelector('#alergenos-wrap input[value="Otro"]:checked');
    if (otroChecked) {
      const otroInput = document.getElementById('alergeno-otro-input');
      if (!otroInput || !otroInput.value.trim()) {
        otroInput?.classList.add('invalid');
        ok = false;
        toast('Especifica el alérgeno "Otro".', 'error');
      }
    }
    return ok;
  }

  /* ─── OPEN FORM ────────────────────────────────────────────────────────────── */
  function openForm(plato = null) {
    editId = plato ? plato.id : null;
    const title = document.getElementById('modal-plato-title');
    if (title) title.textContent = plato ? 'Editar Plato' : 'Nuevo Plato';

    const fields = ['codigo','nombre','descripcion','categoria','precio','tiempo_prep','estado'];
    fields.forEach(f => {
      const el = document.getElementById('plato-' + f);
      if (el) {
        el.value = plato ? (plato[f] ?? '') : '';
        el.classList.remove('invalid');
        const errEl = document.getElementById('plato-' + f + '-err');
        if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
      }
    });
    if (!plato) {
      const codigoEl = document.getElementById('plato-codigo');
      if (codigoEl) codigoEl.value = genCode('PL', getPlatos());
    }
    buildAlergenosForm(plato ? plato.alergenos || [] : []);
    openModal('modal-plato');
  }

  /* ─── SAVE ─────────────────────────────────────────────────────────────────── */
  function savePlato() {
    if (!validateForm()) return;
    const platos = getPlatos();
    const data = {
      id:          editId || Date.now().toString(),
      codigo:      document.getElementById('plato-codigo').value.trim().toUpperCase(),
      nombre:      document.getElementById('plato-nombre').value.trim(),
      descripcion: document.getElementById('plato-descripcion').value.trim(),
      categoria:   document.getElementById('plato-categoria').value,
      precio:      parseFloat(document.getElementById('plato-precio').value),
      tiempo_prep: parseInt(document.getElementById('plato-tiempo_prep').value),
      estado:      document.getElementById('plato-estado').value,
      alergenos:   getSelectedAlergenos(),
    };
    if (editId) {
      const idx = platos.findIndex(p => p.id === editId);
      if (idx !== -1) platos[idx] = data;
      toast('Plato actualizado.', 'success');
    } else {
      platos.push(data);
      toast('Plato registrado.', 'success');
    }
    savePlatos(platos);
    closeModal('modal-plato');
    renderPlatos();
  }

  /* ─── DELETE ───────────────────────────────────────────────────────────────── */
  function deletePlato(id) {
    const pedidos = getPedidos();
    const enUso = pedidos.some(p => p.items && p.items.some(it => it.platoId === id));
    if (enUso) { toast('No se puede eliminar: el plato tiene pedidos asociados.', 'error'); return; }
    if (!confirm('¿Eliminar este plato?')) return;
    savePlatos(getPlatos().filter(p => p.id !== id));
    toast('Plato eliminado.', 'info');
    renderPlatos();
  }

  /* ─── RENDER ───────────────────────────────────────────────────────────────── */
  function renderPlatos() {
    const list = getPlatos();
    const q    = (document.getElementById('filter-nombre')?.value || '').toLowerCase();
    const fCat = document.getElementById('filter-cat')?.value || '';
    const fEst = document.getElementById('filter-estado')?.value || '';

    const filtered = list.filter(p =>
      (!q    || p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)) &&
      (!fCat || p.categoria === fCat) &&
      (!fEst || p.estado === fEst)
    );

    const tbody = document.getElementById('platos-tbody');
    if (!tbody) return;

    const countEl = document.getElementById('platos-count');
    if (countEl) countEl.textContent = `${filtered.length} plato${filtered.length !== 1 ? 's' : ''}`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">🍽</div><div class="empty-state-text">No hay platos registrados</div></div></td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr class="animate-in">
        <td><span class="badge badge-gold">${p.codigo}</span></td>
        <td><strong>${p.nombre}</strong><div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${p.descripcion.substring(0,50)}${p.descripcion.length > 50 ? '…' : ''}</div></td>
        <td><span class="badge badge-gray">${p.categoria}</span></td>
        <td style="color:var(--gold-pale);font-weight:600">${fmtMoney(p.precio)}</td>
        <td>${p.tiempo_prep} min</td>
        <td>${p.alergenos?.length ? p.alergenos.map(a => `<span class="alergeno-tag">⚠ ${a}</span>`).join('') : '<span style="color:var(--text-muted);font-size:0.8rem">—</span>'}</td>
        <td><span class="estado-pill estado-${p.estado}">${p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}</span></td>
        <td>
          <div style="display:flex;gap:0.4rem">
            <button class="btn btn-outline btn-sm" onclick="editPlato('${p.id}')">✏ Editar</button>
            <button class="btn btn-danger btn-sm" onclick="deletePlato('${p.id}')">✕</button>
          </div>
        </td>
      </tr>`).join('');
  }

  /* ─── EXPOSE FOR INLINE HANDLERS ──────────────────────────────────────────── */
  window.editPlato   = id => { const p = getPlatos().find(x => x.id === id); if (p) openForm(p); };
  window.deletePlato = deletePlato;

  /* ─── BIND ─────────────────────────────────────────────────────────────────── */
  document.getElementById('btn-nuevo-plato')?.addEventListener('click', () => openForm());
  document.getElementById('btn-save-plato')?.addEventListener('click', savePlato);
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  ['filter-nombre','filter-cat','filter-estado'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderPlatos);
  });

  renderPlatos();
})();
