// lead-site: recebe o formulário de contato do site e grava em public.leads (kodha-os).
//
// Pública de propósito (verify_jwt = false): o site não carrega chave nenhuma.
// A gravação usa a chave secreta, que só existe aqui dentro, e a resposta nunca
// devolve dados do banco — só { ok: true } ou { ok: false, erro }.

import { createClient } from "npm:@supabase/supabase-js@2";

// sites que podem chamar a função. Ao comprar o domínio, acrescentar aqui e publicar de novo.
const ORIGENS_PERMITIDAS = [
  "https://kodha.vercel.app",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

// previews da Vercel (uma por branch/deploy): kodha-git-<branch>-<time>.vercel.app, kodha-<hash>-<time>.vercel.app
const PREVIEW_VERCEL = /^https:\/\/kodha-[a-z0-9-]+\.vercel\.app$/;

function origemPermitida(origem: string | null): origem is string {
  return !!origem && (ORIGENS_PERMITIDAS.includes(origem) || PREVIEW_VERCEL.test(origem));
}

// o que o site oferece → nome do serviço cadastrado no kodha-os (public.servicos.nome)
const SERVICOS: Record<string, string | null> = {
  "Identidade visual": "Branding",
  "Landing page": "Landing page de conversão",
  "Site institucional": "Site institucional",
  "Ainda não sei / quero conversar": null,
};

const LIMITES = { nome: 120, empresa: 120, email: 160, telefone: 20, mensagem: 2000 };

function chaveSecreta(): string {
  const novas = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (novas) {
    try {
      const chave = JSON.parse(novas)["default"];
      if (chave) return chave;
    } catch {
      // cai para a chave antiga
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, chaveSecreta(), {
  auth: { persistSession: false },
});

function cabecalhos(origem: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origemPermitida(origem) ? origem : ORIGENS_PERMITIDAS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function responder(corpo: Record<string, unknown>, status: number, origem: string | null) {
  return new Response(JSON.stringify(corpo), { status, headers: cabecalhos(origem) });
}

function texto(valor: unknown, limite: number): string {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}

Deno.serve(async (req) => {
  const origem = req.headers.get("Origin");

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cabecalhos(origem) });
  if (req.method !== "POST") return responder({ ok: false, erro: "metodo" }, 405, origem);
  if (!origemPermitida(origem)) return responder({ ok: false, erro: "origem" }, 403, origem);

  let dados: Record<string, unknown>;
  try {
    dados = await req.json();
  } catch {
    return responder({ ok: false, erro: "formato" }, 400, origem);
  }

  // campo invisível preenchido = bot. Responde como sucesso para ele não insistir.
  if (texto(dados.website, 200) !== "") return responder({ ok: true }, 200, origem);

  const nome = texto(dados.nome, LIMITES.nome);
  const empresa = texto(dados.empresa, LIMITES.empresa);
  const email = texto(dados.email, LIMITES.email).toLowerCase();
  const telefone = texto(dados.telefone, LIMITES.telefone);
  const servico = texto(dados.servico, 80);
  const mensagem = texto(dados.mensagem, LIMITES.mensagem);
  const pagina = texto(dados.pagina, 300);
  const envioId = texto(dados.envio_id, 64);

  const digitos = telefone.replace(/\D/g, "");
  const valido =
    nome.length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) &&
    digitos.length >= 10 && digitos.length <= 13 &&
    Object.hasOwn(SERVICOS, servico) &&
    /^[a-zA-Z0-9-]{8,64}$/.test(envioId);

  if (!valido) return responder({ ok: false, erro: "dados" }, 422, origem);

  let servicoId: string | null = null;
  const nomeServico = SERVICOS[servico];
  if (nomeServico) {
    const { data } = await supabase.from("servicos").select("id").eq("nome", nomeServico).maybeSingle();
    servicoId = data?.id ?? null;
  }

  const obs = [
    `Serviço de interesse: ${servico}`,
    mensagem ? `Mensagem: ${mensagem}` : "",
    pagina ? `Página: ${pagina}` : "",
  ].filter(Boolean).join("\n");

  // origem_chave é única no banco: reenviar o mesmo formulário não duplica o lead
  const { error } = await supabase.from("leads").insert({
    nome,
    empresa,
    telefone,
    email,
    origem: "Site",
    servico_id: servicoId,
    obs,
    origem_chave: `site:${envioId}`,
  });

  if (error && error.code !== "23505") {
    console.error("falha ao gravar lead", error.code, error.message);
    return responder({ ok: false, erro: "gravacao" }, 500, origem);
  }

  return responder({ ok: true }, 200, origem);
});
