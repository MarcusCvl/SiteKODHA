/* ==========================================================================
   KODHA — comportamento do site
   Movimento: convergir → conectar → avançar. Sempre com intenção.
   ========================================================================== */
(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     CONFIGURAÇÃO — ajuste aqui
     ---------------------------------------------------------------------- */
  var CONFIG = {
    // URL do app da web publicado no Google Apps Script (apps-script/Codigo.gs).
    // Enquanto estiver vazia, o formulário cai direto no WhatsApp.
    APPS_SCRIPT_URL: '',

    // WhatsApp de atendimento (só dígitos, com DDI). Usado no fallback.
    WHATSAPP: '5532999999999'
  };

  var reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------------
     Header + menu mobile
     ---------------------------------------------------------------------- */
  var header = document.querySelector('.header');
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  var navFundo = document.getElementById('nav-fundo');

  function aoRolar() {
    header.classList.toggle('is-fixo', window.scrollY > 12);
  }
  aoRolar();
  window.addEventListener('scroll', aoRolar, { passive: true });

  function menuAberto() {
    return nav.classList.contains('is-aberto');
  }

  function alternarMenu(abrir) {
    nav.classList.toggle('is-aberto', abrir);
    burger.setAttribute('aria-expanded', String(abrir));
    burger.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');

    if (abrir) {
      navFundo.hidden = false;
      // deixa o navegador pintar antes de animar a opacidade
      requestAnimationFrame(function () { navFundo.classList.add('is-visivel'); });
    } else {
      navFundo.classList.remove('is-visivel');
      setTimeout(function () { if (!menuAberto()) navFundo.hidden = true; }, 420);
    }
  }

  function fecharMenu() {
    if (menuAberto()) alternarMenu(false);
  }

  burger.addEventListener('click', function () {
    alternarMenu(!menuAberto());
  });

  // clique em qualquer lugar fora do painel e do botão fecha o menu
  document.addEventListener('click', function (e) {
    if (!menuAberto()) return;
    if (nav.contains(e.target) || burger.contains(e.target)) return;
    fecharMenu();
  });

  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') fecharMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharMenu();
  });

  // ao voltar para desktop, o painel não pode ficar preso aberto
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) fecharMenu();
  });

  /* ----------------------------------------------------------------------
     Reveal na entrada
     ---------------------------------------------------------------------- */
  var alvos = document.querySelectorAll('.reveal');

  if (reduzirMovimento || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(alvos, function (el) { el.classList.add('is-visivel'); });
  } else {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('is-visivel');
        observador.unobserve(entrada.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(alvos, function (el) { observador.observe(el); });
  }

  /* ----------------------------------------------------------------------
     Fio de conexão — traçado orgânico no fundo da página inteira.
     O caminho é gerado em pixels reais (sem distorção) e vai sendo
     desenhado conforme a pessoa desce: conexão que avança.
     ---------------------------------------------------------------------- */
  var fioSvg = document.querySelector('.fio-global svg');
  var fioLinha = document.querySelector('.fio-global__linha');
  var fioComprimento = 0;

  // Catmull-Rom → Bézier: curvas contínuas, sem canto nenhum.
  function suavizar(pontos) {
    var d = 'M ' + pontos[0][0].toFixed(1) + ' ' + pontos[0][1].toFixed(1);
    for (var i = 0; i < pontos.length - 1; i++) {
      var p0 = pontos[i - 1] || pontos[i];
      var p1 = pontos[i];
      var p2 = pontos[i + 1];
      var p3 = pontos[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6;
      var c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6;
      var c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) +
           ', ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) +
           ', ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  function gerarFio() {
    if (!fioSvg || !fioLinha) return;

    var w = document.documentElement.clientWidth;
    var h = document.documentElement.scrollHeight;
    if (!w || !h) return;

    fioSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    var estreito = w < 900;
    var margem = { dir: w * (estreito ? 0.9 : 0.935), esq: w * (estreito ? 0.1 : 0.065) };
    var lado = 'dir';
    var respiro = estreito ? 70 : 96;

    // troca de lado só nas fronteiras entre seções, onde existe espaço vazio —
    // a linha nunca atravessa o meio de um bloco de conteúdo
    var fronteiras = [];
    var ultima = 0;
    Array.prototype.forEach.call(document.querySelectorAll('main > section'), function (sec) {
      var topo = sec.offsetTop;
      if (topo < h * 0.16 || topo > h * 0.9) return;
      if (topo - ultima < (estreito ? 1000 : 1250)) return;
      ultima = topo;
      fronteiras.push(topo);
    });

    var pontos = [[margem[lado], 0]];

    function trechoReto(ateY) {
      var de = pontos[pontos.length - 1];
      // um respiro lateral no meio do trecho tira a rigidez sem sair da margem
      if (ateY - de[1] > 700) {
        var desvio = w * 0.026 * (lado === 'dir' ? -1 : 1);
        pontos.push([margem[lado] + desvio, de[1] + (ateY - de[1]) * 0.5]);
      }
      pontos.push([margem[lado], ateY]);
    }

    fronteiras.forEach(function (y) {
      trechoReto(y - respiro);
      lado = lado === 'dir' ? 'esq' : 'dir';
      pontos.push([margem[lado], y + respiro]);
    });
    trechoReto(h);

    fioLinha.setAttribute('d', suavizar(pontos));
    fioComprimento = fioLinha.getTotalLength();

    if (reduzirMovimento) {
      fioLinha.style.strokeDasharray = 'none';
      fioLinha.style.strokeDashoffset = 0;
    } else {
      fioLinha.style.strokeDasharray = fioComprimento;
      atualizarFio();
    }
  }

  function atualizarFio() {
    if (!fioLinha || !fioComprimento || reduzirMovimento) return;
    var alturaTotal = document.documentElement.scrollHeight;
    var vista = window.innerHeight;
    var avanco = (window.scrollY + vista * 0.85) / alturaTotal;
    avanco = Math.max(0.06, Math.min(1, avanco));
    fioLinha.style.strokeDashoffset = fioComprimento * (1 - avanco);
  }

  var fioAgendado = false;
  window.addEventListener('scroll', function () {
    if (fioAgendado) return;
    fioAgendado = true;
    requestAnimationFrame(function () { atualizarFio(); fioAgendado = false; });
  }, { passive: true });

  gerarFio();
  window.addEventListener('load', gerarFio);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(gerarFio);

  var alturaConhecida = document.documentElement.scrollHeight;
  if ('ResizeObserver' in window) {
    new ResizeObserver(function () {
      var nova = document.documentElement.scrollHeight;
      if (Math.abs(nova - alturaConhecida) < 24) return;
      alturaConhecida = nova;
      gerarFio();
    }).observe(document.body);
  }

  var redimensionando;
  window.addEventListener('resize', function () {
    clearTimeout(redimensionando);
    redimensionando = setTimeout(gerarFio, 180);
  });

  /* ----------------------------------------------------------------------
     Ano do rodapé
     ---------------------------------------------------------------------- */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------------------
     Select: cor do texto quando há valor escolhido
     ---------------------------------------------------------------------- */
  var select = document.querySelector('.campo select');
  if (select) {
    var pintarSelect = function () { select.classList.toggle('tem-valor', !!select.value); };
    select.addEventListener('change', pintarSelect);
    pintarSelect();
  }

  /* ----------------------------------------------------------------------
     Máscara de telefone (BR)
     ---------------------------------------------------------------------- */
  var tel = document.getElementById('telefone');
  if (tel) {
    tel.addEventListener('input', function () {
      var d = tel.value.replace(/\D/g, '').slice(0, 11);
      var saida = d;
      if (d.length > 2) saida = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length > 6) {
        var corte = d.length > 10 ? 7 : 6;
        saida = '(' + d.slice(0, 2) + ') ' + d.slice(2, corte) + '-' + d.slice(corte);
      }
      tel.value = saida;
    });
  }

  /* ----------------------------------------------------------------------
     Formulário → Google Apps Script → planilha
     ---------------------------------------------------------------------- */
  var form = document.getElementById('form-contato');
  if (!form) return;

  var status = document.getElementById('form-status');
  var botao = document.getElementById('btn-enviar');
  var textoBotao = botao.querySelector('.btn__texto');
  var textoOriginal = textoBotao.textContent;

  function avisar(msg, tipo) {
    status.textContent = msg;
    status.className = 'form__status' + (tipo ? ' ' + tipo : '');
  }

  function valido(campo) {
    var el = campo;
    if (!el.required) return true;
    if (el.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
    if (el.type === 'tel') return el.value.replace(/\D/g, '').length >= 10;
    return el.value.trim().length > 1;
  }

  function linkWhatsApp(dados) {
    var texto =
      'Olá, KODHA! Sou ' + dados.nome + '.' +
      (dados.negocio ? ' Meu negócio é ' + dados.negocio + '.' : '') +
      ' Tenho interesse em: ' + dados.servico + '.' +
      (dados.mensagem ? ' ' + dados.mensagem : '');
    return 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var campos = form.querySelectorAll('input, select, textarea');
    var primeiroErro = null;

    Array.prototype.forEach.call(campos, function (el) {
      var ok = valido(el);
      el.closest('.campo').classList.toggle('tem-erro', !ok);
      if (!ok && !primeiroErro) primeiroErro = el;
    });

    if (primeiroErro) {
      avisar('Confira os campos destacados antes de enviar.', 'erro');
      primeiroErro.focus();
      return;
    }

    var dados = {
      nome: form.nome.value.trim(),
      negocio: form.negocio.value.trim(),
      telefone: form.telefone.value.trim(),
      email: form.email.value.trim(),
      servico: form.servico.value,
      mensagem: form.mensagem.value.trim(),
      origem: 'site-kodha',
      pagina: location.href,
      enviadoEm: new Date().toISOString()
    };

    if (!CONFIG.APPS_SCRIPT_URL) {
      avisar('Abrindo o WhatsApp para você finalizar o contato…');
      window.open(linkWhatsApp(dados), '_blank', 'noopener');
      return;
    }

    botao.disabled = true;
    textoBotao.textContent = 'Enviando…';
    avisar('');

    // Content-Type text/plain evita o preflight de CORS do Apps Script.
    fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(dados)
    })
      .then(function () {
        form.reset();
        if (select) select.classList.remove('tem-valor');
        avisar('Mensagem enviada. Respondemos em até 24h.', 'ok');
      })
      .catch(function () {
        avisar('Não conseguimos enviar agora. Vamos continuar pelo WhatsApp?', 'erro');
        window.open(linkWhatsApp(dados), '_blank', 'noopener');
      })
      .then(function () {
        botao.disabled = false;
        textoBotao.textContent = textoOriginal;
      });
  });
})();
