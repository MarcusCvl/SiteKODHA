const header = document.querySelector(".header");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");
const navbar = document.querySelector(".navbar");

// o fundo escurecido é criado pelo js: sem menu aberto ele nem existe na página
const overlay = document.createElement("div");
overlay.className = "menu-overlay";
overlay.hidden = true;
document.body.appendChild(overlay);

function menuAberto() {
  return navigation.classList.contains("aberto");
}

// a classe .aberto em .navigation é o que o css usa para descer o painel e virar o X
function alternarMenu(aberto) {
  navigation.classList.toggle("aberto", aberto);

  menuToggle.setAttribute("aria-expanded", aberto);
  menuToggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");

  if (aberto) {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("visivel"));
  } else {
    overlay.classList.remove("visivel");
    setTimeout(() => {
      if (!menuAberto()) overlay.hidden = true;
    }, 420);
  }
}

function fecharMenu() {
  if (menuAberto()) alternarMenu(false);
}

menuToggle.addEventListener("click", () => {
  alternarMenu(!menuAberto());
});

// escolher um link leva para a seção, então o painel pode sair da frente
navbar.addEventListener("click", (event) => {
  if (event.target.closest("a")) fecharMenu();
});

// clique em qualquer lugar fora do painel e do botão fecha o menu
document.addEventListener("click", (event) => {
  if (!navigation.contains(event.target)) fecharMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuAberto()) {
    fecharMenu();
    menuToggle.focus();
  }
});

// ao voltar para o desktop o painel não pode ficar preso aberto
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) fecharMenu();
});

// o header só ganha fundo depois que a página sai do topo
function atualizarHeader() {
  header.classList.toggle("fixo", window.scrollY > 12);
}

atualizarHeader();
window.addEventListener("scroll", atualizarHeader, { passive: true });
