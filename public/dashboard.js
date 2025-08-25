// ============ utilidades ============
const $ = (s) => document.querySelector(s);
async function api(path, opts){
  const r = await fetch(path, { headers:{'Content-Type':'application/json'}, ...opts });
  const data = await r.json().catch(()=> ({}));
  if (!r.ok) throw new Error(data?.error || 'Error');
  return data;
}

// ============ sesión ============
$('#logoutBtn')?.addEventListener('click', ()=>{ localStorage.removeItem('forno_user'); location.href='/login.html'; });
const me = JSON.parse(localStorage.getItem('forno_user') || 'null');
if (!me) location.href='/login.html';
$('#who').textContent = `Usuario: ${me.name}`;

// ============ router ============
const links = [...document.querySelectorAll('a[data-panel]')];
const panels = {
  home:      document.getElementById('panel-home'),
  usuarios:  document.getElementById('panel-usuarios'),
  productos: document.getElementById('panel-productos'),
  campanias: document.getElementById('panel-campanias'),
  reservas:  document.getElementById('panel-reservas'),
};
function show(panel) {
  Object.values(panels).forEach(p => p && p.classList.remove('active'));
  links.forEach(a => a.classList.remove('active'));
  const el = panels[panel];
  if (el) {
    el.classList.add('active');
    links.find(a => a.dataset.panel === panel)?.classList.add('active');
  }
}
window.addEventListener('hashchange', ()=>show(location.hash.slice(1)));
show(location.hash.slice(1) || 'home'); // por defecto: Dashboard

// ============ helpers visuales ============
const fillTable = (tblId, rows, cols) => {
  const tb = document.querySelector(`#${tblId} tbody`); if (!tb) return;
  tb.innerHTML = '';
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    cols.forEach(c=>{ const td=document.createElement('td'); td.textContent=r[c]??''; tr.appendChild(td); });
    tb.appendChild(tr);
  });
};
const fillSelect = (selId, rows, value='id', label='name')=>{
  const s = document.getElementById(selId); if (!s) return;
  s.innerHTML = '';
  rows.forEach(r=>{ const o=document.createElement('option'); o.value=r[value]; o.textContent=r[label]; s.appendChild(o); });
};

// ==========================================================
//                           USUARIOS
// ==========================================================
function renderUsers(users){
  const tb = document.querySelector('#tblUsers tbody'); if (!tb) return;
  tb.innerHTML = '';
  users.forEach(u=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="user-cell">
          <svg class="avatar ${Number(u.role)===1?'admin':'user'}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
          </svg>
          ${u.name}
        </div>
      </td>
      <td><span class="role-badge">${Number(u.role)===1?'Administrador':'Usuario'}</span></td>
      <td><button class="btn u-edit">Editar</button></td>`;
    tr.querySelector('.u-edit').onclick = () => dash.u_edit(u);
    tb.appendChild(tr);
  });
}

// formulario usuarios
const uWrap = $('#u_formWrap');
function u_showForm(show){ if (uWrap) uWrap.style.display = show ? 'flex' : 'none'; }
function u_fillForm(user) {
  const fid = $('#u_id'), fname=$('#u_name'), fpass=$('#u_pass'), frole=$('#u_role');
  if (fid)   fid.value   = user?.id ?? '';
  if (fname) fname.value = user?.name ?? '';
  if (fpass) fpass.value = '';
  if (frole) frole.value = user?.role ?? '2';
}
$('#u_newBtn')?.addEventListener('click', ()=>{ u_fillForm(null); u_showForm(true); });
$('#u_cancelBtn')?.addEventListener('click', ()=> u_showForm(false));
$('#u_saveBtn')?.addEventListener('click', async ()=>{
  const id   = $('#u_id')?.value?.trim() || '';
  const name = $('#u_name')?.value?.trim() || '';
  const pass = $('#u_pass')?.value || '';
  const role = parseInt($('#u_role')?.value || '2', 10);
  if (!name) return alert('Nombre requerido');

  if (!id) await api('/api/users', { method:'POST', body:JSON.stringify({ name, password:pass||'1234', role }) });
  else {
    const payload = { id, name, role };
    if (pass) payload.password = pass;
    await api('/api/users', { method:'PUT', body:JSON.stringify(payload) });
  }
  u_showForm(false);
  await loadAll();
});

// ==========================================================
//                     PRODUCTOS & TIPOS (CRUD)
// ==========================================================
const state = { products:[], types:[], selectedProductId:null };

// ---- grid lateral de productos (nombre + Editar) ----
function renderProductsOnly(products){
  state.products = products || [];
  const tb = document.querySelector('#tblProductsOnly tbody');
  if (!tb) return;
  tb.innerHTML = '';

  state.products.forEach(p=>{
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = p.name;
    tr.appendChild(tdName);

    const tdAct = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'btn gray';
    btn.textContent = 'Editar';
    btn.onclick = () => p_edit(p);
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);

    tr.onclick = (e)=>{ if (e.target.tagName !== 'BUTTON') p_select(p.id); };
    tb.appendChild(tr);
  });
}

// ---- listado de tipos del producto seleccionado ----
function renderTypesFor(productId){
  const product = state.products.find(p=>p.id===productId);
  const tb = document.querySelector('#tblTypesFor tbody');
  const title = document.getElementById('pt_title');
  const ptNewBtn = document.getElementById('pt_newBtn');

  if (!tb || !title || !ptNewBtn) return;

  tb.innerHTML = '';
  if (!product) {
    title.textContent = 'Selecciona un producto para gestionar sus tipos.';
    ptNewBtn.disabled = true;
    return;
  }
  title.textContent = `Tipos de: ${product.name}`;
  ptNewBtn.disabled = false;

  const list = state.types.filter(t=>t.product_id === productId);
  list.forEach(t=>{
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = t.name;
    tr.appendChild(tdName);

    const tdAct = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'btn gray';
    btn.textContent = 'Editar';
    btn.onclick = () => pt_edit(t);
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);

    tb.appendChild(tr);
  });
}

// ---- formulario PRODUCTO ----
const pForm     = document.getElementById('p_form');
const pHint     = document.getElementById('p_hint');
function p_showForm(show){
  if (pForm) pForm.style.display = show ? 'flex' : 'none';
  if (pHint) pHint.style.display = show ? 'none' : 'block';
}
function p_fillForm(p){ $('#p_id').value = p?.id ?? ''; $('#p_name').value = p?.name ?? ''; }
function p_select(productId){ state.selectedProductId = productId || null; renderTypesFor(state.selectedProductId); }
function p_new(){ p_fillForm(null); p_showForm(true); }
function p_edit(p){ p_fillForm(p); p_showForm(true); p_select(p.id); }
async function p_save(){
  const id   = $('#p_id')?.value?.trim() || '';
  const name = $('#p_name')?.value?.trim() || '';
  if (!name) return alert('Nombre requerido');

  if (!id) await api('/api/products', { method:'POST', body:JSON.stringify({ name }) });
  else     await api('/api/products', { method:'PUT',  body:JSON.stringify({ id, name }) });

  p_showForm(false);
  await loadAll(id || undefined);
}
function p_cancel(){ p_showForm(false); }

$('#p_newBtn')?.addEventListener('click', p_new);
$('#p_saveBtn')?.addEventListener('click', p_save);
$('#p_cancelBtn')?.addEventListener('click', p_cancel);

// ---- formulario TIPOS ----
const ptForm      = document.getElementById('pt_form');
function pt_showForm(show){ if (ptForm) ptForm.style.display = show ? 'flex' : 'none'; }
function pt_fillForm(t){ $('#pt_id').value = t?.id ?? ''; $('#pt_name').value = t?.name ?? ''; }
function pt_new(){
  if (!state.selectedProductId) return alert('Selecciona antes un producto.');
  pt_fillForm(null); pt_showForm(true);
}
function pt_edit(t){
  p_select(t.product_id);
  pt_fillForm(t);
  pt_showForm(true);
}
async function pt_save(){
  if (!state.selectedProductId) return alert('Selecciona antes un producto.');
  const id   = $('#pt_id')?.value?.trim() || '';
  const name = $('#pt_name')?.value?.trim() || '';
  const product_id = state.selectedProductId;
  if (!name) return alert('Nombre del tipo requerido');

  if (!id) await api('/api/product_types', { method:'POST', body:JSON.stringify({ product_id, name }) });
  else     await api('/api/product_types', { method:'PUT',  body:JSON.stringify({ id, name, product_id }) });

  pt_showForm(false);
  await loadAll(product_id);
}
function pt_cancel(){ pt_showForm(false); }

$('#pt_newBtn')?.addEventListener('click', pt_new);
$('#pt_saveBtn')?.addEventListener('click', pt_save);
$('#pt_cancelBtn')?.addEventListener('click', pt_cancel);

// ==========================================================
//              CAMPAÑAS / RESERVAS (como tenías)
// ==========================================================
export const dash = {
  u_edit(user){ u_fillForm(user); u_showForm(true); },

  async addCampaign(){
    const name=$('#c_name')?.value?.trim();
    const start_date=$('#c_start')?.value;
    const end_date=$('#c_end')?.value;
    if(!name||!start_date||!end_date) return alert('Completa todos los campos');
    await api('/api/campaigns', { method:'POST', body:JSON.stringify({ name, start_date, end_date }) });
    if ($('#c_name'))  $('#c_name').value='';
    if ($('#c_start')) $('#c_start').value='';
    if ($('#c_end'))   $('#c_end').value='';
    loadAll();
  },

  async addCampaignProduct(){
    const campaign_id=$('#cp_campaign')?.value;
    const product_id=$('#cp_product')?.value;
    if(!campaign_id||!product_id) return;
    await api('/api/campaign_products', { method:'POST', body:JSON.stringify({ campaign_id, product_id }) });
    loadAll();
  },

  async createReservation(){
    const client_name=$('#r_client')?.value?.trim();
    const phone=$('#r_phone')?.value?.trim();
    const product_type_id=$('#r_type')?.value;
    const quantity=parseInt($('#r_qty')?.value||'1',10);
    if(!client_name||!phone||!product_type_id||quantity<1) return alert('Datos incompletos');
    await api('/api/reservations', { method:'POST', body:JSON.stringify({ client_name, phone, items:[{ product_type_id, quantity }] }) });
    if ($('#r_client')) $('#r_client').value='';
    if ($('#r_phone')) $('#r_phone').value='';
    loadAll();
  }
};
window.dash = dash;

// ==========================================================
//                   CARGA INICIAL GLOBAL
// ==========================================================
async function loadAll(selectProductId){
  const [users, products, types, campaigns, campProds, reservations] = await Promise.all([
    api('/api/users').catch(()=>[]),
    api('/api/products').catch(()=>[]),
    api('/api/product_types').catch(()=>[]),
    api('/api/campaigns').catch(()=>[]),
    api('/api/campaign_products').catch(()=>[]),
    api('/api/reservations').catch(()=>[])
  ]);

  // Usuarios
  renderUsers(users);

  // Productos & Tipos
  state.products = products || [];
  state.types    = types || [];
  renderProductsOnly(state.products);
  renderTypesFor(state.selectedProductId);

  // Campañas / Reservas
  fillTable('tblCampaigns', campaigns, ['id','name','start_date','end_date']);
  fillTable('tblCampaignProducts', campProds, ['id','campaign_id','product_id']);
  fillTable('tblReservations', reservations, ['id','client_name','phone','status','created_at']);

  // selects
  fillSelect('cp_campaign', campaigns);
  fillSelect('cp_product', state.products);
  fillSelect('r_type', state.types, 'id', 'name');

  // si vengo de crear/editar, mantengo producto expandido/seleccionado
  if (selectProductId){
    state.selectedProductId = selectProductId;
    renderTypesFor(selectProductId);
  }
}
loadAll().catch(console.error);
