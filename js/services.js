// cards de serviços: no computador, o card inclina na direção do mouse, sobe um pouco e
// um brilho acompanha o cursor. o movimento é amortecido (vai chegando aos poucos no alvo),
// por isso fica fluido. no celular e com "reduzir movimento" nada disso acontece
const cardsDeServico = document.querySelectorAll(".services-cards-item");
const temMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const poucoMovimentoServicos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (temMouse && !poucoMovimentoServicos) {
  cardsDeServico.forEach((card) => {
    const alvo = { x: 0, y: 0, sobe: 0 };
    const atual = { x: 0, y: 0, sobe: 0 };
    let quadro = null;

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
      if (!card.classList.contains("visivel")) return;
      card.classList.add("interativo");
      alvo.sobe = -6;
      mover();
    });

    card.addEventListener("pointermove", (evento) => {
      const caixa = card.getBoundingClientRect();
      const px = (evento.clientX - caixa.left) / caixa.width;
      const py = (evento.clientY - caixa.top) / caixa.height;
      card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      if (!card.classList.contains("interativo")) return;
      alvo.x = (0.5 - py) * 7;
      alvo.y = (px - 0.5) * 9;
      mover();
    });

    card.addEventListener("pointerleave", () => {
      alvo.x = 0;
      alvo.y = 0;
      alvo.sobe = 0;
      mover();
    });
  });
}
