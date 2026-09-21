const form = document.querySelector(".form");

// cole aqui a URL do app da web publicado no Apps Script (apps-script/Codigo.gs).
// enquanto estiver vazia, o formulário cai direto no WhatsApp.
const SCRIPT_URL = "";
const WHATSAPP = "5532999999999";

const status = form.querySelector(".form-status");
const botao = form.querySelector(".form-button");
const select = form.querySelector("select");

// o select nasce com a cor de placeholder e só clareia quando tem escolha
function pintarSelect() {
  select.classList.toggle("preenchido", select.value !== "");
}

select.addEventListener("change", pintarSelect);
pintarSelect();

// máscara de telefone no padrão brasileiro
form.phone.addEventListener("input", () => {
  const digitos = form.phone.value.replace(/\D/g, "").slice(0, 11);
  let valor = digitos;

  if (digitos.length > 2) {
    valor = `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  }

  if (digitos.length > 6) {
    const corte = digitos.length > 10 ? 7 : 6;
    valor = `(${digitos.slice(0, 2)}) ${digitos.slice(2, corte)}-${digitos.slice(corte)}`;
  }

  form.phone.value = valor;
});

function avisar(mensagem, tipo) {
  status.textContent = mensagem;
  status.className = tipo ? `form-status ${tipo}` : "form-status";
}

function campoValido(campo) {
  if (!campo.required) return true;
  if (campo.type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(campo.value.trim());
  if (campo.type === "tel") return campo.value.replace(/\D/g, "").length >= 10;
  return campo.value.trim().length > 1;
}

function linkWhatsapp(dados) {
  const texto =
    `Olá, KODHA! Sou ${dados.name}.` +
    (dados.company ? ` Meu negócio é ${dados.company}.` : "") +
    ` Tenho interesse em: ${dados.selection}.` +
    (dados.message ? ` ${dados.message}` : "");

  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  // se o campo invisível foi preenchido, é bot — finge sucesso e não envia nada
  if (form.website.value !== "") {
    form.reset();
    return;
  }

  const campos = form.querySelectorAll("input, select, textarea");
  let primeiroErro = null;

  campos.forEach((campo) => {
    const valido = campoValido(campo);
    const container = campo.closest(".form-field");

    if (container) container.classList.toggle("invalido", !valido);
    if (!valido && !primeiroErro) primeiroErro = campo;
  });

  if (primeiroErro) {
    avisar("Confira os campos destacados antes de enviar.", "erro");
    primeiroErro.focus();
    return;
  }

  const dados = {
    name: form.name.value,
    company: form.company.value,
    phone: form.phone.value,
    email: form.email.value,
    selection: form.selection.value,
    message: form.message.value,
    origem: "site-kodha",
    pagina: location.href,
  };

  if (!SCRIPT_URL) {
    avisar("Abrindo o WhatsApp para você finalizar o contato...");
    window.open(linkWhatsapp(dados), "_blank", "noopener");
    return;
  }

  // innerHTML e não textContent: o botão tem a seta num span dentro dele
  const conteudoOriginal = botao.innerHTML;
  botao.textContent = "Enviando...";
  botao.disabled = true;
  avisar("");

  try {
    // text/plain de propósito: é o que evita o preflight de CORS do Apps Script
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(dados),
    });

    form.reset();
    pintarSelect();
    avisar("Mensagem enviada. Respondemos em até 24h.", "sucesso");
  } catch (erro) {
    avisar("Não conseguimos enviar agora. Vamos continuar pelo WhatsApp?", "erro");
    window.open(linkWhatsapp(dados), "_blank", "noopener");
    console.error(erro);
  } finally {
    setTimeout(() => {
      botao.innerHTML = conteudoOriginal;
      botao.disabled = false;
    }, 3000);
  }
});
