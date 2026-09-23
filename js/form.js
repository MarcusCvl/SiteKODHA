const form = document.querySelector(".form");

// Edge Function "lead-site" do Supabase (kodha-os): grava o lead e só responde ok ou erro.
// O site não guarda chave nenhuma; quem escreve no banco é a função.
const ENDPOINT = "https://uprmkigkvjneuvuvwzyr.supabase.co/functions/v1/lead-site";

// WhatsApp de reserva, oferecido quando o envio falha (só dígitos, com DDI).
// provisório: número do Elisson — o mesmo do link do rodapé no index.html
const WHATSAPP = "5561982063819";

const status = form.querySelector(".form-status");
const botao = form.querySelector(".form-button");
const select = form.querySelector("select");
const campos = form.querySelectorAll("input:not(.form-honeypot), select, textarea");

// um id por envio: se a mesma mensagem for enviada duas vezes, o banco não duplica o lead
let envioId = null;

// o select nasce com a cor de placeholder e só clareia quando tem escolha
function pintarSelect() {
  select.classList.toggle("preenchido", select.value !== "");
}

select.addEventListener("change", pintarSelect);
pintarSelect();

// quem chega por um card de Serviços já encontra o serviço escolhido
document.querySelectorAll("[data-servico]").forEach((link) => {
  link.addEventListener("click", () => {
    select.value = link.dataset.servico;
    select.closest(".form-field").classList.remove("invalido");
    pintarSelect();
  });
});

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

function marcarCampo(campo) {
  const valido = campoValido(campo);
  const container = campo.closest(".form-field");
  if (container) container.classList.toggle("invalido", !valido);
  return valido;
}

// o destaque de erro some assim que a pessoa corrige o campo, sem precisar reenviar
campos.forEach((campo) => {
  const evento = campo.tagName === "SELECT" ? "change" : "input";
  campo.addEventListener(evento, () => {
    if (campo.closest(".form-field.invalido")) marcarCampo(campo);
  });
});

function linkWhatsapp(dados) {
  const texto =
    `Olá, vim pelo site da KODHA! Sou ${dados.nome}.` +
    (dados.empresa ? ` Meu negócio é ${dados.empresa}.` : "") +
    ` Tenho interesse em: ${dados.servico}.` +
    (dados.mensagem ? ` ${dados.mensagem}` : "");

  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

// quando o envio falha, o WhatsApp vira um link clicável: abrir sozinho seria bloqueado
// pelo navegador, porque já não é mais o clique da pessoa
function oferecerWhatsapp(dados) {
  avisar("Não conseguimos enviar agora. ", "erro");

  const link = document.createElement("a");
  link.href = linkWhatsapp(dados);
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Continuar pelo WhatsApp";
  status.append(link);
}

async function enviar(dados) {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 15000);

  try {
    const resposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
      signal: controle.signal,
    });
    const retorno = await resposta.json().catch(() => ({}));
    return resposta.ok && retorno.ok === true;
  } finally {
    clearTimeout(limite);
  }
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (botao.disabled) return;

  // se o campo invisível foi preenchido, é bot: finge sucesso e não envia nada
  if (form.website.value !== "") {
    form.reset();
    return;
  }

  let primeiroErro = null;
  campos.forEach((campo) => {
    if (!marcarCampo(campo) && !primeiroErro) primeiroErro = campo;
  });

  if (primeiroErro) {
    avisar("Confira os campos destacados antes de enviar.", "erro");
    primeiroErro.focus();
    return;
  }

  envioId = envioId || crypto.randomUUID();

  const dados = {
    nome: form.name.value.trim(),
    empresa: form.company.value.trim(),
    telefone: form.phone.value.trim(),
    email: form.email.value.trim(),
    servico: form.selection.value,
    mensagem: form.message.value.trim(),
    pagina: location.href,
    envio_id: envioId,
    website: form.website.value,
  };

  // innerHTML e não textContent: o botão tem a seta num span dentro dele
  const conteudoOriginal = botao.innerHTML;
  botao.textContent = "Enviando...";
  botao.disabled = true;
  avisar("");

  let enviado = false;
  try {
    enviado = await enviar(dados);
  } catch (erro) {
    console.error(erro);
  }

  botao.innerHTML = conteudoOriginal;
  botao.disabled = false;

  if (enviado) {
    form.reset();
    pintarSelect();
    envioId = null;
    avisar("Mensagem enviada. Respondemos em até 24h.", "sucesso");
  } else {
    oferecerWhatsapp(dados);
  }
});
