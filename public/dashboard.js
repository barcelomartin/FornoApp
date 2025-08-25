
// dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("nav .menu a");
  const panels = document.querySelectorAll("section.panel");

  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.dataset.panel;

      links.forEach(l => l.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      link.classList.add("active");
      const panel = document.querySelector(`#panel-${target}`);
      if (panel) panel.classList.add("active");
    });
  });

  const who = localStorage.getItem("forno_user");
  if (who) {
    const user = JSON.parse(who);
    document.getElementById("who").textContent = `Usuario: ${user.name}`;
  }

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("forno_user");
    location.href = "/login.html";
  });
});
