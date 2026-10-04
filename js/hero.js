// o K do hero é sempre o 3D (js/hero-3d.js). a versão em imagem só aparece se o navegador
// não tiver WebGL nenhum ou se o 3D der erro. ?k=imagem no endereço força a imagem (teste).
// com "reduzir movimento" o 3D aparece já montado, sem a entrada e sem inclinar
const hero = document.querySelector(".hero");
const imagemDoK = document.querySelector(".hero-k-haste");

if (hero && imagemDoK) {
  const pediuImagem = new URLSearchParams(location.search).get("k") === "imagem";

  // a decisão já foi tomada no <head> (classe k-3d), aqui só repete no hero
  if (!pediuImagem && document.documentElement.classList.contains("k-3d")) {
    hero.classList.add("hero-3d");
  }

  // o KODHA escrito e o slogan entram junto com a montagem do K. no 3D as imagens do K nem
  // aparecem, então não há o que esperar (esperar por elas atrasava o maior elemento da tela);
  // na versão em imagem, a montagem espera a imagem do K carregar
  const montar = () => hero.classList.add("montado");

  if (hero.classList.contains("hero-3d") || imagemDoK.complete) {
    montar();
  } else {
    imagemDoK.addEventListener("load", montar, { once: true });
    imagemDoK.addEventListener("error", montar, { once: true });
  }
}
