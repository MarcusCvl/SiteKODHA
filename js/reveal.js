const elementosReveal = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("visivel");
        observer.unobserve(entrada.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);

elementosReveal.forEach((elemento) => observer.observe(elemento));

// o ano do rodapé vem do relógio, não de um número fixo no html
const anoAtual = document.querySelector(".footer-year");

if (anoAtual) {
  anoAtual.textContent = new Date().getFullYear();
}
