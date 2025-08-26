document.addEventListener("DOMContentLoaded", () => {
  showPanel("dashboard");
  cargarUsuarios();
  document.getElementById("formUsuario").addEventListener("submit", guardarUsuario);
});

function showPanel(id) {
  document.querySelectorAll(".panel").forEach(panel => panel.style.display = "none");
  document.getElementById(id).style.display = "block";
}

function logout() {
  window.location.href = "login.html";
}

let usuarios = [
  { id: 1, nombre: "admin", rol: "admin", activo: true },
  { id: 2, nombre: "leo", rol: "user", activo: false }
];

function cargarUsuarios() {
  const tabla = document.getElementById("tablaUsuarios");
  tabla.innerHTML = "";

  usuarios.forEach(usuario => {
    const fila = document.createElement("tr");

    const icono = document.createElement("td");
    const iconoHTML = usuario.rol === "admin"
      ? '<i class="fas fa-user user-icon admin"></i>'
      : '<i class="fas fa-user user-icon user"></i>';
    icono.innerHTML = `${iconoHTML} ${usuario.nombre}`;

    const rol = document.createElement("td");
    rol.textContent = usuario.rol === "admin" ? "Administrador" : "Operador";

    const estado = document.createElement("td");
    estado.innerHTML = usuario.activo
      ? '<i class="fas fa-check" style="color: green"></i>'
      : '<i class="fas fa-times" style="color: red"></i>';

    const acciones = document.createElement("td");
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.className = "btn";
    btnEditar.onclick = () => mostrarFormularioUsuario(usuario);
    acciones.appendChild(btnEditar);

    fila.appendChild(icono);
    fila.appendChild(rol);
    fila.appendChild(estado);
    fila.appendChild(acciones);
    tabla.appendChild(fila);
  });
}

function mostrarFormularioUsuario(usuario = null) {
  document.getElementById("modalTitulo").textContent = usuario ? "Editar Usuario" : "Nuevo Usuario";
  document.getElementById("username").value = usuario ? usuario.nombre : "";
  document.getElementById("rol").value = usuario ? usuario.rol : "user";
  document.getElementById("active").checked = usuario ? usuario.activo : true;
  document.getElementById("formUsuario").dataset.editando = usuario ? usuario.id : "";
  document.getElementById("modalUsuario").style.display = "block";
}

function cerrarModal() {
  document.getElementById("modalUsuario").style.display = "none";
  document.getElementById("formUsuario").reset();
}

function guardarUsuario(e) {
  e.preventDefault();
  const id = document.getElementById("formUsuario").dataset.editando;
  const nombre = document.getElementById("username").value.trim();
  const rol = document.getElementById("rol").value;
  const activo = document.getElementById("active").checked;

  if (!nombre) return;

  if (id) {
    const usuario = usuarios.find(u => u.id == id);
    if (usuario) {
      usuario.nombre = nombre;
      usuario.rol = rol;
      usuario.activo = activo;
    }
  } else {
    const nuevoId = Math.max(...usuarios.map(u => u.id)) + 1;
    usuarios.push({ id: nuevoId, nombre, rol, activo });
  }

  cerrarModal();
  cargarUsuarios();
}
