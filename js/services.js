// cards de serviços: no computador, o card inclina na direção do mouse, sobe um pouco e
// um brilho acompanha o cursor. o movimento é amortecido (vai chegando aos poucos no alvo),
// por isso fica fluido. no celular e com "reduzir movimento" nada disso acontece
const cardsDeServico = document.querySelectorAll(".services-cards-item");
const grupoDeCards = document.querySelector(".services-cards");

// as luzes atrás dos cards se movem sem parar e, com o vidro dos cards em cima, o navegador
// refaz o desfoque a cada quadro: fora da tela, a animação fica pausada
if (grupoDeCards && "IntersectionObserver" in window) {
  new IntersectionObserver(([entrada]) => {
    grupoDeCards.classList.toggle("fora-da-tela", !entrada.isIntersecting);
  }).observe(grupoDeCards);
}
const temMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const poucoMovimentoServicos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (temMouse && !poucoMovimentoServicos) {
  cardsDeServico.forEach((card) => {
    const alvo = { x: 0, y: 0, sobe: 0 };
    const atual = { x: 0, y: 0, sobe: 0 };
    let quadro = null;
    // a posição do card é medida uma vez ao entrar com o mouse: medir a cada movimento,
    // logo depois de mudar o estilo dele, obrigava o navegador a recalcular a página
    let caixa = null;

    function animar() {
      atual.x += (alvo.x - atual.x) * 0.12;
      atual.y += (alvo.y - atual.y) * 0.12;
      atual.sobe += (alvo.sobe - atual.sobe) * 0.12;
      card.style.setProperty("--rx", `${atual.x.toFixed(3)}deg`);
      card.style.setProperty("--ry", `${atual.y.toFixed(3)}deg`);
      card.style.setProperty("--sobe", `${atual.sobe.toFixed(2)}px`);

      const parado =
        Math.abs(alvo.x - atual.x) < 0.01 && Math.abs(alvo.y - atual.y) < 0.01 && Math.abs(alvo.sobe - atual.sobe) < 0.01;
      quadro = parado ? null : requestAnimationFrame(animar);
    }

    function mover() {
      if (quadro === null) quadro = requestAnimationFrame(animar);
    }

    card.addEventListener("pointerenter", () => {
      // só depois que o card já entrou na tela (reveal), para não brigar com a entrada
      caixa = card.getBoundingClientRect();
      if (!card.classList.contains("visivel")) return;
      card.classList.add("interativo");
      alvo.sobe = -6;
      mover();
    });

    card.addEventListener("pointermove", (evento) => {
      if (!caixa) caixa = card.getBoundingClientRect();
      const px = (evento.clientX - caixa.left) / caixa.width;
      const py = (evento.clientY - caixa.top) / caixa.height;
      card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      if (!card.classList.contains("interativo")) return;
      alvo.x = (0.5 - py) * 7;
      alvo.y = (px - 0.5) * 9;
      mover();
    });

    // rolando com o mouse parado em cima, o card muda de lugar na tela: mede de novo
    window.addEventListener("scroll", () => (caixa = null), { passive: true });

    card.addEventListener("pointerleave", () => {
      caixa = null;
      alvo.x = 0;
      alvo.y = 0;
      alvo.sobe = 0;
      mover();
    });
  });
}
