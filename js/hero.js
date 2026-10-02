// o K do hero tem duas versões: em 3D (js/hero-3d.js) e em imagem, com as peças
// se encaixando pelo css. o 3D só entra se o navegador aguenta e a pessoa não pediu menos
// movimento; ?k=imagem no endereço força a versão em imagem (para comparar)
const hero = document.querySelector(".hero");
const imagemDoK = document.querySelector(".hero-k-haste");

if (hero && imagemDoK) {
  const poucoMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pediuImagem = new URLSearchParams(location.search).get("k") === "imagem";

  if (!poucoMovimento && !pediuImagem && "WebGLRenderingContext" in window) {
    hero.classList.add("hero-3d");
    // se o three.js não carregar em 5s (internet lenta, erro), a imagem assume
    setTimeout(() => {
      if (!hero.classList.contains("hero-3d-carregado")) hero.classList.remove("hero-3d");
    }, 5000);
  }

  // o KODHA escrito e o slogan entram depois que a imagem carregou
  const montar = () => hero.classList.add("montado");

  if (imagemDoK.complete) {
    montar();
  } else {
    imagemDoK.addEventListener("load", montar, { once: true });
    imagemDoK.addEventListener("error", montar, { once: true });
  }
}
