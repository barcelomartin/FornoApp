// --- guard: requiere login
const me = JSON.parse(localStorage.getItem('forno_user') || 'null');
if (!me) location.href = '/login.html';

// ui
const who = document.getElementById('who');
who.textContent = `Usuario: ${me?.name}`;
document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('forno_user'); location.href='/login.html'; };

// router simple por hash
const links = [...document.querySelectorAll('a[data-panel]')];
const panels = {
  usuarios:  document.getElementById('panel-usuarios'),
  productos: document.getElementById('panel-productos'),
  campanias: document.getElementById('panel-campanias'),
  reservas:  document.getElementById('panel-reservas'),
};
function show(panel){
  Object.values(panels).forEach(p=>p.classList.remove('active'));
  links.forEach(a=>a.classList.remove('active'));
  (panels[panel]||panels.usuarios).classList.add('active');
  (links.find(a=>a.dataset.panel===panel)||links[0]).classList.add('active');
}
window.addEventListener('hashchange', ()=>show(location.hash.slice(1)));
show(location.hash.slice(1)||'usuarios');

// helpers
async function api(path, opts){
  const r = await fetch(path, { headers:{'Content-Type':'application/json'}, ...opts });
  const data = await r.json().catch(()=> ({}));
  if(!r.ok) throw new Error(data?.error||'Error');
  return data;
}
const el = sel => document.querySelector(sel);
const fillTable = (tblId, rows, cols) => {
  const tb = document.querySelector(`#${tblId} tbody`); tb.innerHTML = '';
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    cols.forEach(c=>{ const td=document.createElement('td'); td.textContent=r[c]??''; tr.appendChild(td); });
    tb.appendChild(tr);
  });
};
const fillSelect = (selId, rows, value='id', label='name')=>{
  const s = document.getElementById(selId); s.innerHTML='';
  rows.forEach(r=>{ const o=document.createElement('option'); o.value=r[value]; o.textContent=r[label]; s.appendChild(o); });
};

// carga inicial
async function loadAll(){
  const [users, products, types, campaigns, campProds, reservations] = await Promise.all([
    api('/api/users').catch(()=>[]),
    api('/api/products').catch(()=>[]),
    api('/api/product_types').catch(()=>[]),
    api('/api/campaigns').catch(()=>[]),
    api('/api/campaign_products').catch(()=>[]),
    api('/api/reservations').catch(()=>[])
  ]);
  fillTable('tblUsers', users, ['id','name']);
  fillTable('tblProducts', products, ['id','name']);
  const typesFmt = types.map(t=>({id:t.id, product:t.product_id, type:t.name}));
  fillTable('tblTypes', typesFmt, ['id','product','type']);
  fillTable('tblCampaigns', campaigns, ['id','name','start_date','end_date']);
  fillTable('tblCampaignProducts', campProds, ['id','campaign_id','product_id']);
  fillTable('tblReservations', reservations, ['id','client_name','phone','status','created_at']);

  fillSelect('pt_product', products);
  fillSelect('cp_campaign', campaigns);
  fillSelect('cp_product', products);
  // para crear reservas: listar tipos
  fillSelect('r_type', types, 'id', 'name');
}
loadAll().catch(console.error);

// acciones (Usuarios)
export const dash = {
  async addUser(){
    const name = el('#u_name').value.trim();
    const password = el('#u_pass').value;
    if(!name || !password) return alert('Completa nombre y contraseña');
    await api('/api/users', { method:'POST', body:JSON.stringify({ name, password, role:2 }) });
    el('#u_name').value=''; el('#u_pass').value='';
    loadAll();
  },

  // Productos
  async addProduct(){
    const name = el('#p_name').value.trim();
    if(!name) return;
    await api('/api/products', { method:'POST', body:JSON.stringify({ name }) });
    el('#p_name').value='';
    loadAll();
  },
  async addProductType(){
    const product_id = el('#pt_product').value;
    const name = el('#pt_name').value.trim();
    if(!product_id || !name) return;
    await api('/api/product_types', { method:'POST', body:JSON.stringify({ product_id, name }) });
    el('#pt_name').value='';
    loadAll();
  },

  // Campañas
  async addCampaign(){
    const name = el('#c_name').value.trim();
    const start_date = el('#c_start').value;
    const end_date = el('#c_end').value;
    if(!name || !start_date || !end_date) return alert('Completa todos los campos');
    await api('/api/campaigns', { method:'POST', body:JSON.stringify({ name, start_date, end_date }) });
    el('#c_name').value=''; el('#c_start').value=''; el('#c_end').value='';
    loadAll();
  },
  async addCampaignProduct(){
    const campaign_id = el('#cp_campaign').value;
    const product_id  = el('#cp_product').value;
    if(!campaign_id || !product_id) return;
    await api('/api/campaign_products', { method:'POST', body:JSON.stringify({ campaign_id, product_id }) });
    loadAll();
  },

  // Reservas
  async createReservation(){
    const client_name = el('#r_client').value.trim();
    const phone = el('#r_phone').value.trim();
    const product_type_id = el('#r_type').value;
    const quantity = parseInt(el('#r_qty').value||'1',10);
    if(!client_name || !phone || !product_type_id || quantity<1) return alert('Datos incompletos');
    await api('/api/reservations', {
      method:'POST',
      body:JSON.stringify({ client_name, phone, items:[{ product_type_id, quantity }] })
    });
    el('#r_client').value=''; el('#r_phone').value='';
    loadAll();
  }
};
window.dash = dash;
