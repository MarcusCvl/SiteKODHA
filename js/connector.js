// Fio de conexão: o traçado azul que percorre o fundo do site.
// O caminho é gerado em pixels reais e vai sendo desenhado conforme a pessoa desce.

const connectorSvg = document.querySelector(".connector svg");
const connectorLinha = document.querySelector(".connector-line");
const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let comprimentoDoFio = 0;
let alturaConhecida = 0;

// Catmull-Rom vira Bézier: é o que deixa a curva contínua, sem nenhum canto reto
function suavizar(pontos) {
  let caminho = `M ${pontos[0][0].toFixed(1)} ${pontos[0][1].toFixed(1)}`;

  for (let i = 0; i < pontos.length - 1; i++) {
    const anterior = pontos[i - 1] || pontos[i];
    const atual = pontos[i];
    const proximo = pontos[i + 1];
    const seguinte = pontos[i + 2] || proximo;

    const controle1X = atual[0] + (proximo[0] - anterior[0]) / 6;
    const controle1Y = atual[1] + (proximo[1] - anterior[1]) / 6;
    const controle2X = proximo[0] - (seguinte[0] - atual[0]) / 6;
    const controle2Y = proximo[1] - (seguinte[1] - atual[1]) / 6;

    caminho += ` C ${controle1X.toFixed(1)} ${controle1Y.toFixed(1)}, ${controle2X.toFixed(1)} ${controle2Y.toFixed(1)}, ${proximo[0].toFixed(1)} ${proximo[1].toFixed(1)}`;
  }

  return caminho;
}

function gerarFio() {
  if (!connectorSvg || !connectorLinha) return;

  const largura = document.documentElement.clientWidth;
  const altura = document.documentElement.scrollHeight;
  if (!largura || !altura) return;

  connectorSvg.setAttribute("viewBox", `0 0 ${largura} ${altura}`);

  const estreito = largura < 900;
  const margem = {
    dir: largura * (estreito ? 0.9 : 0.935),
    esq: largura * (estreito ? 0.1 : 0.065),
  };
  const respiro = estreito ? 70 : 96;
  let lado = "dir";

  // a troca de lado acontece só nas fronteiras entre seções, onde existe espaço vazio,
  // para o fio nunca cortar um título ou um card
  const fronteiras = [];
  let ultimaFronteira = 0;

  document.querySelectorAll("main > section").forEach((secao) => {
    const topo = secao.offsetTop;
    if (topo < altura * 0.16 || topo > altura * 0.9) return;
    if (topo - ultimaFronteira < (estreito ? 1000 : 1250)) return;

    ultimaFronteira = topo;
    fronteiras.push(topo);
  });

  const pontos = [[margem[lado], 0]];

  function trechoReto(ateY) {
    const ultimo = pontos[pontos.length - 1];

    // um respiro lateral no meio do trecho tira a rigidez sem sair da margem
    if (ateY - ultimo[1] > 700) {
      const desvio = largura * 0.026 * (lado === "dir" ? -1 : 1);
      pontos.push([margem[lado] + desvio, ultimo[1] + (ateY - ultimo[1]) * 0.5]);
    }

    pontos.push([margem[lado], ateY]);
  }

  fronteiras.forEach((y) => {
    trechoReto(y - respiro);
    lado = lado === "dir" ? "esq" : "dir";
    pontos.push([margem[lado], y + respiro]);
  });

  trechoReto(altura);

  connectorLinha.setAttribute("d", suavizar(pontos));
  comprimentoDoFio = connectorLinha.getTotalLength();
  alturaConhecida = altura;

  if (movimentoReduzido) {
    connectorLinha.style.strokeDasharray = "none";
    connectorLinha.style.strokeDashoffset = 0;
  } else {
    connectorLinha.style.strokeDasharray = comprimentoDoFio;
    atualizarFio();
  }
}

function atualizarFio() {
  if (!connectorLinha || !comprimentoDoFio || movimentoReduzido) return;

  const alturaTotal = document.documentElement.scrollHeight;
  const avanco = (window.scrollY + window.innerHeight * 0.85) / alturaTotal;
  const progresso = Math.max(0.06, Math.min(1, avanco));

  connectorLinha.style.strokeDashoffset = comprimentoDoFio * (1 - progresso);
}

let fioAgendado = false;

window.addEventListener(
  "scroll",
  () => {
    if (fioAgendado) return;
    fioAgendado = true;
    requestAnimationFrame(() => {
      atualizarFio();
      fioAgendado = false;
    });
  },
  { passive: true }
);

gerarFio();
window.addEventListener("load", gerarFio);

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(gerarFio);
}

// a página muda de altura quando os reveals entram: o fio precisa ser refeito
if ("ResizeObserver" in window) {
  new ResizeObserver(() => {
    const novaAltura = document.documentElement.scrollHeight;
    if (Math.abs(novaAltura - alturaConhecida) < 24) return;
    gerarFio();
  }).observe(document.body);
}

let redimensionando;

window.addEventListener("resize", () => {
  clearTimeout(redimensionando);
  redimensionando = setTimeout(gerarFio, 180);
});
