// --- guard login ---
const me = JSON.parse(localStorage.getItem('forno_user')||'null');
if(!me) location.href='/login.html';
document.getElementById('who').textContent="Usuario: "+me.name;
document.getElementById('logoutBtn').onclick=()=>{localStorage.removeItem('forno_user');location.href='/login.html'};

// router simple
const links=[...document.querySelectorAll('a[data-panel]')];
const panels={home:null,usuarios:$('#panel-usuarios'),productos:$('#panel-productos'),campanias:$('#panel-campanias'),reservas:$('#panel-reservas')};
function show(p){Object.values(panels).forEach(x=>x&&x.classList.remove('active'));links.forEach(a=>a.classList.remove('active'));if(panels[p]){panels[p].classList.add('active');links.find(a=>a.dataset.panel===p)?.classList.add('active');}}
window.addEventListener('hashchange',()=>show(location.hash.slice(1)));show(location.hash.slice(1)||'usuarios');

async function api(path,opts){const r=await fetch(path,{headers:{'Content-Type':'application/json'},...opts});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Error');return d;}
const $=s=>document.querySelector(s);

// ---------- Usuarios ----------
function renderUsers(users){
  const tb=$('#tblUsers tbody');tb.innerHTML='';
  users.forEach(u=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><div class="user-cell"><svg class="avatar ${u.role==1?'admin':'user'}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/></svg> ${u.name}</div></td>
      <td><span class="role-badge">${u.role==1?'Administrador':'Usuario'}</span></td>
      <td><button class="btn">Editar</button></td>`;
    tb.appendChild(tr);
  });
}

// ---------- Productos + Subtipos ----------
let state={products:[],types:[]};
function renderProductsGrid(){
  const tb=$('#tblProductsGrid tbody');tb.innerHTML='';
  state.products.forEach(p=>{
    const tipos=state.types.filter(t=>t.product_id===p.id);
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.name}</td>
      <td><span class="pill">${tipos.length}</span></td>
      <td><button class="btn verTipos">Ver tipos</button></td>`;
    tb.appendChild(tr);
    const tr2=document.createElement('tr');tr2.className='expand-row';tr2.style.display='none';
    const td=document.createElement('td');td.colSpan=3;td.innerHTML=`<div class="expand-box"><strong>Tipos:</strong><ul>${tipos.map(t=>`<li>${t.name}</li>`).join('')||'(ninguno)'}</ul></div>`;
    tr2.appendChild(td);tb.appendChild(tr2);
    tr.querySelector('.verTipos').onclick=()=>{tr2.style.display=tr2.style.display==='none'?'table-row':'none';};
  });
}

// ---------- Load ----------
async function loadAll(){
  const [users,products,types,camps,res]=await Promise.all([
    api('/api/users').catch(()=>[]),
    api('/api/products').catch(()=>[]),
    api('/api/product_types').catch(()=>[]),
    api('/api/campaigns').catch(()=>[]),
    api('/api/reservations').catch(()=>[])
  ]);
  renderUsers(users);
  state.products=products;state.types=types;renderProductsGrid();
}
loadAll();
