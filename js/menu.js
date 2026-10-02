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
  document.documentElement.classList.toggle("menu-aberto", aberto);

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
  if (!menuAberto()) return;

  if (event.key === "Escape") {
    fecharMenu();
    menuToggle.focus();
    return;
  }

  // com o painel aberto, o Tab circula entre o botão e os links, sem escapar para a página de trás
  if (event.key === "Tab") {
    const focaveis = [menuToggle, ...navbar.querySelectorAll("a")];
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];

    if (event.shiftKey && document.activeElement === primeiro) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primeiro.focus();
    }
  }
});

// ao voltar para o desktop o painel não pode ficar preso aberto
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) fecharMenu();
});

// o link da seção que está na tela fica aceso no menu.
// a seção "atual" é a última cujo topo já passou de 40% da altura da janela;
// seções sem link (por que, cta) mantêm aceso o link da seção anterior
const linksDoMenu = [...navbar.querySelectorAll('.nav-link[href^="#"]')];
const secoesDoMenu = linksDoMenu
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean)
  .sort((a, b) => a.offsetTop - b.offsetTop);

function marcarSecaoAtual() {
  const linha = window.scrollY + window.innerHeight * 0.4;
  const noFimDaPagina = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

  let atual = null;
  secoesDoMenu.forEach((secao) => {
    if (secao.offsetTop <= linha) atual = secao;
  });
  // a última seção pode ser baixa demais para alcançar a linha: no fim da página, ela vence
  if (noFimDaPagina) atual = secoesDoMenu[secoesDoMenu.length - 1];

  linksDoMenu.forEach((link) => {
    const ativo = atual !== null && link.getAttribute("href") === `#${atual.id}`;
    link.classList.toggle("ativo", ativo);
    if (ativo) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

let secaoAgendada = false;
window.addEventListener(
  "scroll",
  () => {
    if (secaoAgendada) return;
    secaoAgendada = true;
    requestAnimationFrame(() => {
      marcarSecaoAtual();
      secaoAgendada = false;
    });
  },
  { passive: true }
);
window.addEventListener("load", marcarSecaoAtual);
marcarSecaoAtual();

// o header só ganha fundo depois que a página sai do topo
function atualizarHeader() {
  header.classList.toggle("fixo", window.scrollY > 12);
}

atualizarHeader();
window.addEventListener("scroll", atualizarHeader, { passive: true });
