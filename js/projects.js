// "Ver mais projetos": enquanto a página de projetos não existe, o botão só mostra um aviso
// que abre com transição, fica 12s na tela e fecha sozinho.
// Quando a página ficar pronta, trocar o <button> por um <a href="..."> e apagar este arquivo.

const botaoMaisProjetos = document.querySelector(".projects-mais .link-arrow");
const avisoProjetos = document.getElementById("projetos-aviso");
const textoAviso = avisoProjetos && avisoProjetos.querySelector(".projects-aviso-texto");

const TEMPO_NA_TELA = 12000;
const TEMPO_PARA_FECHAR = 900; // a caixa leva ~0,85s para fechar (css: atraso 0,15s + 0,7s)

let temporizador;
let limpeza;

function mostrarAviso() {
  clearTimeout(limpeza);
  // o texto entra no aviso na hora de abrir: é o que faz o leitor de tela anunciar a mensagem
  textoAviso.textContent = textoAviso.dataset.mensagem;
  avisoProjetos.classList.add("mostrando");
  botaoMaisProjetos.setAttribute("aria-expanded", "true");

  clearTimeout(temporizador);
  temporizador = setTimeout(esconderAviso, TEMPO_NA_TELA);
}

function esconderAviso() {
  clearTimeout(temporizador);
  avisoProjetos.classList.remove("mostrando");
  botaoMaisProjetos.setAttribute("aria-expanded", "false");

  // só esvazia depois que a caixa terminou de fechar, para o texto não sumir no meio da animação
  limpeza = setTimeout(() => {
    if (!avisoProjetos.classList.contains("mostrando")) textoAviso.textContent = "";
  }, TEMPO_PARA_FECHAR);
}

if (botaoMaisProjetos && textoAviso) {
  botaoMaisProjetos.addEventListener("click", () => {
    if (avisoProjetos.classList.contains("mostrando")) esconderAviso();
    else mostrarAviso();
  });
}
