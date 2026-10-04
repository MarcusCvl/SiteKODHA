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
  // na ordem em que aparecem na página (sem medir a posição: medir aqui, com a página ainda
  // carregando, obrigava o navegador a montar o layout às pressas)
  .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

// a posição de cada seção e a altura da página ficam guardadas e só são medidas quando o
// layout muda (o ResizeObserver avisa depois do layout pronto). medir a cada rolagem podia
// obrigar o navegador a recalcular a página no meio da rolagem
let toposDasSecoes = [];
let alturaDaPagina = 0;

function medirSecoes() {
  toposDasSecoes = secoesDoMenu.map((secao) => secao.offsetTop);
  alturaDaPagina = document.documentElement.scrollHeight;
}

function marcarSecaoAtual() {
  const linha = window.scrollY + window.innerHeight * 0.4;
  const noFimDaPagina = window.innerHeight + window.scrollY >= alturaDaPagina - 2;

  let atual = null;
  secoesDoMenu.forEach((secao, i) => {
    if (toposDasSecoes[i] <= linha) atual = secao;
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
// o header só ganha fundo depois que a página sai do topo
function atualizarHeader() {
  header.classList.toggle("fixo", window.scrollY > 12);
}

// a primeira medida (seções e header) vem do próprio ResizeObserver, que avisa logo depois do
// primeiro layout: ler posições antes disso, com a página ainda carregando, obrigava o navegador
// a montar o layout às pressas
new ResizeObserver(() => {
  medirSecoes();
  marcarSecaoAtual();
  atualizarHeader();
}).observe(document.body);

window.addEventListener("scroll", atualizarHeader, { passive: true });
