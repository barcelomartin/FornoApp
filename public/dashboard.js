// ===== helpers =====
const $ = s => document.querySelector(s);
async function api(path, opts) {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const d = await r.json().catch(()=> ({}));
  if (!r.ok) throw new Error(d?.error || 'Error');
  return d;
}

// ===== guard login =====
const me = JSON.parse(localStorage.getItem('forno_user') || 'null');
if (!me) location.href = '/login.html';
$('#who').textContent = `Usuario: ${me.name}`;
$('#logoutBtn').onclick = () => { localStorage.removeItem('forno_user'); location.href='/login.html'; };

// ===== router =====
const links = [...document.querySelectorAll('a[data-panel]')];
const panels = {
  home: null,
  usuarios: $('#panel-usuarios'),
  productos: $('#panel-productos'),
  campanias: $('#panel-campanias'),
  reservas: $('#panel-reservas')
};
function show(panel){
  Object.values(panels).forEach(p=>p&&p.classList.remove('active'));
  links.forEach(a=>a.classList.remove('active'));
  if (panels[panel]) {
    panels[panel].classList.add('active');
    links.find(a=>a.dataset.panel===panel)?.classList.add('active');
  }
}
window.addEventListener('hashchange', ()=>show(location.hash.slice(1)));
show(location.hash.slice(1) || 'usuarios');

// ==========================================================
//                           USUARIOS
// ==========================================================
function renderUsers(users){
  const tb = $('#tblUsers tbody'); tb.innerHTML='';
  users.forEach(u=>{
    const tr=document.createElement('tr');
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
    tr.querySelector('.u-edit').onclick=()=>dash.u_edit(u);
    tb.appendChild(tr);
  });
}

const uWrap=$('#u_formWrap'), uNewBtn=$('#u_newBtn'), uSaveBtn=$('#u_saveBtn'), uCancelBtn=$('#u_cancelBtn');
function u_showForm(s){ uWrap.style.display= s?'flex':'none'; }
function u_fillForm(u){ $('#u_id').value=u?.id??''; $('#u_name').value=u?.name??''; $('#u_pass').value=''; $('#u_role').value=u?.role??'2'; }
uNewBtn?.addEventListener('click',()=>{u_fillForm(null);u_showForm(true);});
uCancelBtn?.addEventListener('click',()=>u_showForm(false));
uSaveBtn?.addEventListener('click', async ()=>{
  const id=$('#u_id').value.trim(), name=$('#u_name').value.trim(), pass=$('#u_pass').value, role=parseInt($('#u_role').value||'2',10);
  if(!name) return alert('Nombre requerido');
  if(!id) await api('/api/users',{method:'POST',body:JSON.stringify({name,password:pass||'1234',role})});
  else{
    const payload={id,name,role}; if(pass) payload.password=pass;
    await api('/api/users',{method:'PUT',body:JSON.stringify(payload)});
  }
  u_showForm(false); await loadAll();
});

// ==========================================================
//                     PRODUCTOS & TIPOS (CRUD)
// ==========================================================
const state = { products:[], types:[], selectedProductId:null };

// -- formulario de producto
const pForm = $('#p_form'), pNewBtn=$('#p_newBtn'), pSaveBtn=$('#p_saveBtn'), pCancelBtn=$('#p_cancelBtn');
function p_showForm(s){ pForm.style.display = s?'flex':'none'; }
function p_fillForm(p){ $('#p_id').value=p?.id??''; $('#p_name').value=p?.name??''; }
pNewBtn?.addEventListener('click',()=>{ state.selectedProductId=null; p_fillForm(null); p_showForm(true); });
pCancelBtn?.addEventListener('click',()=>p_showForm(false));
pSaveBtn?.addEventListener('click', async ()=>{
  const id=$('#p_id').value.trim(), name=$('#p_name').value.trim();
  if(!name) return alert('Nombre de producto requerido');
  if(!id) await api('/api/products',{method:'POST',body:JSON.stringify({name})});
  else await api('/api/products',{method:'PUT',body:JSON.stringify({id,name})});
  p_showForm(false);
  await loadAll(id ? id : undefined); // vuelve a seleccionar si edité
});

// -- render grid productos + expand con tipos
function renderProductsGrid(){
  const tb = $('#tblProductsGrid tbody'); tb.innerHTML='';

  if(!state.products.length){
    const tr=document.createElement('tr'); const td=document.createElement('td'); td.colSpan=3; td.innerHTML='<span class="muted">No hay productos</span>'; tr.appendChild(td); tb.appendChild(tr); return;
  }

  state.products.forEach(p=>{
    const tipos = state.types.filter(t=>t.product_id===p.id);

    // Fila principal del producto
    const tr=document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}</td>
      <td><span class="pill">${tipos.length}</span></td>
      <td style="display:flex;gap:8px">
        <button class="btn verTipos">Ver tipos</button>
        <button class="btn gray p-edit">Editar</button>
      </td>`;
    tb.appendChild(tr);

    // Fila expandida con tabla de tipos + formulario tipo
    const tr2=document.createElement('tr'); tr2.className='expand-row'; tr2.style.display='none';
    const td=document.createElement('td'); td.colSpan=3; td.innerHTML = `
      <div class="expand-box">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <strong style="margin-right:auto">Tipos de ${p.name}</strong>
          <button class="btn secondary pt-new">+ Nuevo tipo</button>
        </div>
        <div class="pt-form form-inline" style="display:none">
          <input class="pt-id" type="hidden"/>
          <input class="pt-name" placeholder="Nombre del tipo"/>
          <button class="btn pt-save">Guardar</button>
          <button class="btn gray pt-cancel">Cancelar</button>
        </div>
        <table class="pt-table" style="margin-top:6px">
          <thead><tr><th>Nombre</th><th style="width:120px">Acciones</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>`;
    tr2.appendChild(td); tb.appendChild(tr2);

    // handlers de la fila
    const btnVer = tr.querySelector('.verTipos');
    const btnEdit= tr.querySelector('.p-edit');
    btnVer.onclick = ()=>{ tr2.style.display = tr2.style.display==='none' ? 'table-row' : 'none'; if(tr2.style.display!=='none') state.selectedProductId=p.id; };
    btnEdit.onclick= ()=>{ p_fillForm(p); state.selectedProductId=p.id; p_showForm(true); };

    // render tipos
    const tbT = tr2.querySelector('.pt-table tbody');
    tbT.innerHTML = '';
    tipos.forEach(t=>{
      const trT=document.createElement('tr');
      trT.innerHTML = `<td>${t.name}</td><td><button class="btn gray pt-edit">Editar</button></td>`;
      tbT.appendChild(trT);

      const btnTE = trT.querySelector('.pt-edit');
      btnTE.onclick = ()=>{
        const frm=tr2.querySelector('.pt-form'); frm.style.display='flex';
        frm.querySelector('.pt-id').value   = t.id;
        frm.querySelector('.pt-name').value = t.name;
        state.selectedProductId=p.id;
      };
    });

    // crear nuevo tipo
    const btnNewType = tr2.querySelector('.pt-new');
    const frm = tr2.querySelector('.pt-form');
    const fId = frm.querySelector('.pt-id');
    const fNm = frm.querySelector('.pt-name');
    const fSave = frm.querySelector('.pt-save');
    const fCancel = frm.querySelector('.pt-cancel');

    btnNewType.onclick = ()=>{ frm.style.display='flex'; fId.value=''; fNm.value=''; state.selectedProductId=p.id; };
    fCancel.onclick = ()=>{ frm.style.display='none'; };

    fSave.onclick = async ()=>{
      const id = fId.value.trim();
      const name = fNm.value.trim();
      const product_id = p.id;
      if(!name) return alert('Nombre del tipo requerido');
      if(!id) await api('/api/product_types',{method:'POST', body:JSON.stringify({product_id,name})});
      else    await api('/api/product_types',{method:'PUT',  body:JSON.stringify({id,name,product_id})});
      frm.style.display='none';
      await loadAll(p.id); // recargar manteniendo seleccionado
      // abrir expand de nuevo
      const rows = $('#tblProductsGrid tbody').rows;
      // (la reconstrucción ya dejará la UI limpia; si quisieras reabrir, se puede buscar fila por nombre)
    };
  });
}

// ==========================================================
//         Campañas / Reservas (lista simple demo)
// ==========================================================
function fillTable(id, rows, cols){
  const tb=document.querySelector(`#${id} tbody`); tb.innerHTML='';
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    cols.forEach(c=>{ const td=document.createElement('td'); td.textContent=r[c]??''; tr.appendChild(td); });
    tb.appendChild(tr);
  });
}

// API público (usuarios)
export const dash = { u_edit(u){ u_fillForm(u); u_showForm(true); } };
window.dash = dash;

// ==========================================================
//                   CARGA INICIAL
// ==========================================================
async function loadAll(selectProductId){
  try{
    const [users,products,types,camps,res] = await Promise.all([
      api('/api/users').catch(()=>[]),
      api('/api/products').catch(()=>[]),
      api('/api/product_types').catch(()=>[]),
      api('/api/campaigns').catch(()=>[]),
      api('/api/reservations').catch(()=>[]),
    ]);

    renderUsers(users);
    state.products=products||[];
    state.types=types||[];
    renderProductsGrid();

    fillTable('tblCampaigns', camps, ['id','name']);
    fillTable('tblReservations', res,   ['id','client_name','phone']);

    if(selectProductId){
      // opcional: mantener expandido el producto editado/creado
      const idx = state.products.findIndex(p=>p.id===selectProductId);
      if(idx>-1){
        const body = $('#tblProductsGrid tbody');
        const mainRow  = body.rows[idx*2];   // cada producto ocupa 2 filas (principal + expand)
        const expandRow= body.rows[idx*2+1];
        if(mainRow && expandRow){ expandRow.style.display='table-row'; }
      }
    }
  }catch(e){ console.error(e); }
}
loadAll();
