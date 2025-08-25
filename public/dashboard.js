const who = document.getElementById('who');
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.onclick = () => {
  localStorage.removeItem('forno_user');
  location.href = '/';
};

const user = JSON.parse(localStorage.getItem('forno_user'));
if (!user) location.href = '/';

who.textContent = "Usuario: " + user.name;

document.querySelectorAll(".menu a").forEach(link => {
  link.onclick = () => {
    document.querySelectorAll(".menu a").forEach(el => el.classList.remove("active"));
    document.querySelectorAll("section.panel").forEach(p => p.classList.remove("active"));
    link.classList.add("active");
    document.getElementById("panel-" + link.dataset.panel).classList.add("active");
  };
});

const tblUsers = document.getElementById("tblUsers").querySelector("tbody");
const tblProducts = document.getElementById("tblProducts").querySelector("tbody");

async function loadUsers() {
  const res = await fetch('/api/users');
  const users = await res.json();
  tblUsers.innerHTML = users.map(u => `
    <tr>
      <td><i class="fas fa-user user-icon ${u.role === 1 ? 'admin' : 'user'}"></i>${u.name}</td>
      <td>${u.role === 1 ? 'Administrador' : 'Usuario'}</td>
      <td><i class="fas fa-${u.active ? 'check' : 'times'} status-icon ${u.active ? 'active' : 'inactive'}"></i></td>
      <td><button class="btn" onclick="editUser('${u.id}')">Editar</button></td>
    </tr>`).join("");
}
async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  tblProducts.innerHTML = products.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.types_count}</td>
      <td><i class="fas fa-${p.active ? 'check' : 'times'} status-icon ${p.active ? 'active' : 'inactive'}"></i></td>
      <td><button class="btn" onclick="editProduct('${p.id}')">Editar</button></td>
    </tr>`).join("");
}

window.editUser = id => alert("Editar usuario: " + id);
window.editProduct = id => alert("Editar producto: " + id);

loadUsers();
loadProducts();
