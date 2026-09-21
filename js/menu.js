const header = document.querySelector(".header");
const menuCheckbox = document.getElementById("menu");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");

// o fundo escurecido é criado pelo js: sem menu aberto ele nem existe na página
const overlay = document.createElement("div");
overlay.className = "menu-overlay";
overlay.hidden = true;
document.body.appendChild(overlay);

function fecharMenu() {
  menuCheckbox.checked = false;
  atualizarMenu();
}

function atualizarMenu() {
  const aberto = menuCheckbox.checked;

  menuToggle.setAttribute("aria-expanded", aberto);
  menuToggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");

  if (aberto) {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("visivel"));
  } else {
    overlay.classList.remove("visivel");
    setTimeout(() => {
      if (!menuCheckbox.checked) overlay.hidden = true;
    }, 420);
  }
}

menuCheckbox.addEventListener("change", atualizarMenu);

// clique em qualquer lugar fora do painel e do botão fecha o menu
document.addEventListener("click", (event) => {
  const cliqueForaDoMenu = !navigation.contains(event.target);
  if (menuCheckbox.checked && cliqueForaDoMenu) {
    fecharMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuCheckbox.checked) {
    fecharMenu();
  }
});

// ao voltar para o desktop o painel não pode ficar preso aberto
window.addEventListener("resize", () => {
  if (window.innerWidth > 900 && menuCheckbox.checked) {
    fecharMenu();
  }
});

// o header só ganha fundo depois que a página sai do topo
function atualizarHeader() {
  header.classList.toggle("fixo", window.scrollY > 12);
}

atualizarHeader();
window.addEventListener("scroll", atualizarHeader, { passive: true });
