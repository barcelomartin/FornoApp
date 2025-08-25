const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.onclick = () => { localStorage.removeItem('forno_user'); location.href='/login.html'; };

// router simple por hash
// ----------------- Router simple por hash -----------------
const links = [...document.querySelectorAll('a[data-panel]')];
const panels = {
home:      document.getElementById('panel-home'),
@@ -31,72 +31,7 @@ function show(panel) {
window.addEventListener('hashchange', ()=>show(location.hash.slice(1)));
show(location.hash.slice(1) || 'home'); // por defecto: Dashboard

// ------------- helpers -------------
// ===== Estado para productos/tipos =====
const state = {
  products: [],
  types: [],
  selectedProductId: null
};

// Render productos (solo nombre + Editar)
function renderProductsOnly(products){
  state.products = products || [];
  const tb = document.querySelector('#tblProductsOnly tbody');
  tb.innerHTML = '';
  state.products.forEach(p=>{
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = p.name;
    tr.appendChild(tdName);

    const tdAct = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Editar';
    btn.onclick = () => p_edit(p);
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);

    tb.appendChild(tr);
  });
}

// Render tipos del producto seleccionado
function renderTypesFor(productId){
  const product = state.products.find(p=>p.id===productId);
  const tb = document.querySelector('#tblTypesFor tbody');
  const title = document.getElementById('pt_title');
  const ptNewBtn = document.getElementById('pt_newBtn');

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
    btn.className = 'btn';
    btn.textContent = 'Editar';
    btn.onclick = () => pt_edit(t);
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);

    tb.appendChild(tr);
  });
}

// ----------------- Helpers -----------------
async function api(path, opts){
const r = await fetch(path, { headers:{'Content-Type':'application/json'}, ...opts });
const data = await r.json().catch(()=> ({}));
@@ -110,14 +45,6 @@ const fillTable = (tblId, rows, cols) => {
rows.forEach(r=>{
const tr = document.createElement('tr');
cols.forEach(c=>{ const td=document.createElement('td'); td.textContent=r[c]??''; tr.appendChild(td); });
    const tdAct = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Editar';
    btn.dataset.id = r.id;
    btn.onclick = () => dash.u_edit(r);
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);
tb.appendChild(tr);
});
};
@@ -127,9 +54,12 @@ const fillSelect = (selId, rows, value='id', label='name')=>{
rows.forEach(r=>{ const o=document.createElement('option'); o.value=r[value]; o.textContent=r[label]; s.appendChild(o); });
};

// -------- Usuarios: render especial (avatar pequeño + role bonito, SIN id) ----------
// ==========================================================
//                       USUARIOS
// ==========================================================
function renderUsers(users){
const tb = document.querySelector('#tblUsers tbody');
  if (!tb) return;
tb.innerHTML = '';

users.forEach(u=>{
@@ -168,61 +98,28 @@ function renderUsers(users){
});
}

// -------- Carga inicial ----------
async function loadAll(){
    const [users, products, types, campaigns, campProds, reservations] = await Promise.all([
    api('/api/users').catch(()=>[]),
    api('/api/products').catch(()=>[]),
    api('/api/product_types').catch(()=>[]),
    api('/api/campaigns').catch(()=>[]),
    api('/api/campaign_products').catch(()=>[]),
    api('/api/reservations').catch(()=>[])
  ]);
  
  renderUsers(users);

  // NUEVO: productos y tipos al estado + renders
  state.products = products || [];
  state.types = types || [];
  renderProductsOnly(state.products);
  renderTypesFor(state.selectedProductId);
  
  const typesFmt = types.map(t=>({id:t.id, product:t.product_id, type:t.name}));
  fillTable('tblProducts', products, ['id','name']);
  fillTable('tblTypes', typesFmt, ['id','product','type']);
  fillTable('tblCampaigns', campaigns, ['id','name','start_date','end_date']);
  fillTable('tblCampaignProducts', campProds, ['id','campaign_id','product_id']);
  fillTable('tblReservations', reservations, ['id','client_name','phone','status','created_at']);

  fillSelect('pt_product', products);
  fillSelect('cp_campaign', campaigns);
  fillSelect('cp_product', products);
  fillSelect('r_type', types, 'id', 'name');
}
loadAll().catch(console.error);

// -------- Usuarios: Nuevo / Editar ----------
const uWrap = $('#u_formWrap');
const uNewBtn = $('#u_newBtn');
const uSaveBtn = $('#u_saveBtn');
const uCancelBtn = $('#u_cancelBtn');

function u_showForm(show){ uWrap.style.display = show ? 'grid' : 'none'; }
function u_showForm(show){ if (uWrap) uWrap.style.display = show ? 'grid' : 'none'; }
function u_fillForm(user) {
  $('#u_id').value   = user?.id ?? '';
  $('#u_name').value = user?.name ?? '';
  $('#u_pass').value = ''; // nunca precargamos pass
  $('#u_role').value = user?.role ?? '2';
  const fid = $('#u_id'), fname = $('#u_name'), fpass = $('#u_pass'), frole = $('#u_role');
  if (fid)   fid.value   = user?.id ?? '';
  if (fname) fname.value = user?.name ?? '';
  if (fpass) fpass.value = ''; // nunca precargamos pass
  if (frole) frole.value = user?.role ?? '2';
}

uNewBtn?.addEventListener('click', () => { u_fillForm(null); u_showForm(true); });
uCancelBtn?.addEventListener('click', () => { u_showForm(false); });

uSaveBtn?.addEventListener('click', async () => {
  const id   = $('#u_id').value.trim();
  const name = $('#u_name').value.trim();
  const pass = $('#u_pass').value;
  const role = parseInt($('#u_role').value || '2', 10);
  const id   = $('#u_id')?.value?.trim() || '';
  const name = $('#u_name')?.value?.trim() || '';
  const pass = $('#u_pass')?.value || '';
  const role = parseInt($('#u_role')?.value || '2', 10);
if (!name) return alert('Nombre requerido');

if (!id) {
@@ -236,45 +133,243 @@ uSaveBtn?.addEventListener('click', async () => {
await loadAll();
});

export const dash = {
  u_edit(user){ u_fillForm(user); u_showForm(true); },
// ==========================================================
//                   PRODUCTOS & TIPOS
// ==========================================================
const state = {
  products: [],
  types: [],
  selectedProductId: null
};

// ---- Grids de productos / tipos (solo vista) ----
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

  // Resto (productos/campañas/reservas) igual que tenías:
  async addProduct(){
    const name = $('#p_name')?.value?.trim(); if(!name) return;
    const tdAct = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Editar';
    btn.onclick = () => p_edit(p);
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);

    tb.appendChild(tr);
  });
}

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
    btn.className = 'btn';
    btn.textContent = 'Editar';
    btn.onclick = () => pt_edit(t);
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);

    tb.appendChild(tr);
  });
}

// ---- Form PRODUCTO ----
const pForm     = document.getElementById('p_form');
const pHint     = document.getElementById('p_hint');
const pNewBtn   = document.getElementById('p_newBtn');
const pSaveBtn  = document.getElementById('p_saveBtn');
const pCancelBtn= document.getElementById('p_cancelBtn');

function p_showForm(show){
  if (pForm) pForm.style.display = show ? 'flex' : 'none';
  if (pHint) pHint.style.display = show ? 'none' : 'block';
}
function p_fillForm(p){
  const id   = document.getElementById('p_id');
  const name = document.getElementById('p_name');
  if (id)   id.value   = p?.id ?? '';
  if (name) name.value = p?.name ?? '';
}
function p_select(productId){
  state.selectedProductId = productId || null;
  renderTypesFor(state.selectedProductId);
}
function p_new(){
  p_fillForm(null);
  p_showForm(true);
}
function p_edit(p){
  p_fillForm(p);
  p_showForm(true);
  p_select(p.id);
}
async function p_save(){
  const id   = document.getElementById('p_id')?.value?.trim() || '';
  const name = document.getElementById('p_name')?.value?.trim() || '';
  if (!name) return alert('Nombre requerido');

  if (!id){
await api('/api/products', { method:'POST', body:JSON.stringify({ name }) });
    $('#p_name').value=''; loadAll();
  },
  async addProductType(){
    const product_id = $('#pt_product').value;
    const name = $('#pt_name').value.trim();
    if(!product_id || !name) return;
  } else {
    await api('/api/products', { method:'PUT', body:JSON.stringify({ id, name }) });
  }
  p_showForm(false);
  await loadAll();
}
function p_cancel(){ p_showForm(false); }

pNewBtn?.addEventListener('click', p_new);
pSaveBtn?.addEventListener('click', p_save);
pCancelBtn?.addEventListener('click', p_cancel);

// ---- Form TIPOS ----
const ptForm      = document.getElementById('pt_form');
const ptNewBtn    = document.getElementById('pt_newBtn');
const ptSaveBtn   = document.getElementById('pt_saveBtn');
const ptCancelBtn = document.getElementById('pt_cancelBtn');

function pt_showForm(show){ if (ptForm) ptForm.style.display = show ? 'flex' : 'none'; }
function pt_fillForm(t){
  const id   = document.getElementById('pt_id');
  const name = document.getElementById('pt_name');
  if (id)   id.value   = t?.id ?? '';
  if (name) name.value = t?.name ?? '';
}
function pt_new(){
  if (!state.selectedProductId) return alert('Selecciona antes un producto.');
  pt_fillForm(null);
  pt_showForm(true);
}
function pt_edit(t){
  p_select(t.product_id); // asegura que esté seleccionado
  pt_fillForm(t);
  pt_showForm(true);
}
async function pt_save(){
  if (!state.selectedProductId) return alert('Selecciona antes un producto.');
  const id   = document.getElementById('pt_id')?.value?.trim() || '';
  const name = document.getElementById('pt_name')?.value?.trim() || '';
  const product_id = state.selectedProductId;
  if (!name) return alert('Nombre del tipo requerido');

  if (!id){
await api('/api/product_types', { method:'POST', body:JSON.stringify({ product_id, name }) });
    $('#pt_name').value=''; loadAll();
  },
  } else {
    await api('/api/product_types', { method:'PUT', body:JSON.stringify({ id, name, product_id }) });
  }
  pt_showForm(false);
  await loadAll();
}
function pt_cancel(){ pt_showForm(false); }

ptNewBtn?.addEventListener('click', pt_new);
ptSaveBtn?.addEventListener('click', pt_save);
ptCancelBtn?.addEventListener('click', pt_cancel);

// ==========================================================
//              CAMPAÑAS / RESERVAS (igual que antes)
// ==========================================================
export const dash = {
  u_edit(user){ u_fillForm(user); u_showForm(true); },

async addCampaign(){
    const name=$('#c_name').value.trim(), start_date=$('#c_start').value, end_date=$('#c_end').value;
    const name=$('#c_name')?.value?.trim();
    const start_date=$('#c_start')?.value;
    const end_date=$('#c_end')?.value;
if(!name||!start_date||!end_date) return alert('Completa todos los campos');
await api('/api/campaigns', { method:'POST', body:JSON.stringify({ name, start_date, end_date }) });
    $('#c_name').value=''; $('#c_start').value=''; $('#c_end').value=''; loadAll();
    if ($('#c_name')) $('#c_name').value='';
    if ($('#c_start')) $('#c_start').value='';
    if ($('#c_end')) $('#c_end').value='';
    loadAll();
},

async addCampaignProduct(){
    const campaign_id=$('#cp_campaign').value, product_id=$('#cp_product').value;
    const campaign_id=$('#cp_campaign')?.value;
    const product_id=$('#cp_product')?.value;
if(!campaign_id||!product_id) return;
await api('/api/campaign_products', { method:'POST', body:JSON.stringify({ campaign_id, product_id }) });
loadAll();
},

async createReservation(){
    const client_name=$('#r_client').value.trim();
    const phone=$('#r_phone').value.trim();
    const product_type_id=$('#r_type').value;
    const quantity=parseInt($('#r_qty').value||'1',10);
    const client_name=$('#r_client')?.value?.trim();
    const phone=$('#r_phone')?.value?.trim();
    const product_type_id=$('#r_type')?.value;
    const quantity=parseInt($('#r_qty')?.value||'1',10);
if(!client_name||!phone||!product_type_id||quantity<1) return alert('Datos incompletos');
await api('/api/reservations', {
method:'POST',
body:JSON.stringify({ client_name, phone, items:[{ product_type_id, quantity }] })
});
    $('#r_client').value=''; $('#r_phone').value=''; loadAll();
    if ($('#r_client')) $('#r_client').value='';
    if ($('#r_phone')) $('#r_phone').value='';
    loadAll();
}
};
window.dash = dash;

// ==========================================================
//                   CARGA INICIAL GLOBAL
// ==========================================================
async function loadAll(){
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

  // Campañas / Reservas (tablas básicas)
  fillTable('tblCampaigns', campaigns, ['id','name','start_date','end_date']);
  fillTable('tblCampaignProducts', campProds, ['id','campaign_id','product_id']);
  fillTable('tblReservations', reservations, ['id','client_name','phone','status','created_at']);

  // selects
  fillSelect('cp_campaign', campaigns);
  fillSelect('cp_product', state.products);
  fillSelect('r_type', state.types, 'id', 'name');
}
loadAll().catch(console.error);
