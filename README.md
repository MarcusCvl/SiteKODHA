# KODHA — site institucional

Site de uma página da **KODHA**, estúdio de identidade visual, landing pages e sites
institucionais para profissionais independentes.

Feito em HTML, CSS e JavaScript puros: sem framework, sem build e sem dependências.
Abrir o `index.html` num servidor local já basta.

---

## Sumário

- [Seções da página](#seções-da-página)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Rodando localmente](#rodando-localmente)
- [Convenções do projeto](#convenções-do-projeto)
- [Formulário de contato](#formulário-de-contato)
- [Publicação](#publicação)
- [Pendências](#pendências)
- [Identidade visual](#identidade-visual)
- [Autores](#autores)

---

## Seções da página

Na ordem em que aparecem:

| Seção | Âncora | CSS |
|---|---|---|
| Header e menu | — | `header.css` |
| Hero | `#inicio` | `hero.css` |
| Processo (essência + etapas) | `#processo` | `process.css` |
| Serviços | `#servicos` | `services.css` |
| Por que trabalhar com a gente | — | `why.css` |
| Projetos | `#projetos` | `projects.css` |
| Chamada para ação | — | `cta.css` |
| Contato | `#contato` | `contact.css` |
| Quem somos | `#quem-somos` | `about.css` |
| Rodapé | — | `footer.css` |

---

## Estrutura de pastas

```
site-kodha/
├── index.html
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── favicon.svg
│   ├── logo-kodha-horizontal.svg   usado no JSON-LD
│   ├── og-image.png                imagem de compartilhamento (1200×630)
│   └── img/                        logo, fotos e capas dos projetos
├── css/
│   ├── style.css                   só os @import, na ordem da página
│   ├── global.css                  variáveis, reset, utilitários, botões e reveal
│   ├── connector.css               o fio azul do fundo
│   └── <seção>.css                 um arquivo por seção (ver tabela acima)
├── js/
│   ├── menu.js                     menu hambúrguer, header fixo e seção atual no menu
│   ├── reveal.js                   animação de entrada e ano do rodapé
│   ├── connector.js                desenha o fio azul conforme a página rola
│   ├── form.js                     validação, máscara de telefone e envio
│   └── projects.js                 aviso de 12s do "Ver mais projetos" (até existir a página)
└── supabase/
    └── functions/lead-site/        Edge Function que grava os leads no kodha-os
```

---

## Rodando localmente

Qualquer servidor estático serve. Duas opções:

- **VS Code:** extensão *Live Server* → botão *Go Live*.
- **Terminal (Python):**

  ```bash
  python -m http.server 5500
  ```

  e abrir `http://localhost:5500`.

> Abrir o `index.html` direto pelo explorador de arquivos (`file://`) também funciona,
> mas o envio do formulário e alguns recursos do navegador se comportam melhor com servidor.

---

## Convenções do projeto

**CSS**

- Mobile first: o estilo base é o celular; `@media (min-width: 768px)` para tablet e
  `1180px` para desktop.
- Um arquivo por seção, com classes prefixadas pelo nome dela (`.hero-title`,
  `.process-steps-item`…).
- Cores, tamanhos e raios vêm das variáveis do `:root` em `global.css`.
- Textos de botão que não podem quebrar usam fonte fluida com `clamp()` e são
  testados em 320px.

**Cache (`?v=`)**

Os links de CSS e JS levam um número de versão (ex.: `style.css?v=21`). Ao alterar
**qualquer** CSS ou JS, subir esse número **nos dois lugares**:

- `index.html` (link do `style.css` e os `<script>`)
- `css/style.css` (todos os `@import`)

**Imagens**

- Ficam em `assets/img/`, de preferência em **WebP**.
- **Capas de projeto:** proporção 16:11 (ideal 1600×1100). Nome no padrão
  `thumb-<projeto>.webp`.
- **Fotos da seção Quem somos:** moldura de 2,45:1. A foto fica presa no topo e o
  excesso é cortado da base.
- Toda `<img>` leva `alt`, `width`, `height` e `loading="lazy"`.

**Links externos**

Cards de projeto abrem o site do cliente com `target="_blank" rel="noopener"`. O link fica
no título e se estende pelo card inteiro via `::after`.

---

## Formulário de contato

Os leads do site caem direto na tabela `leads` do **kodha-os** (Supabase), o sistema interno
da KODHA, com `origem = "Site"` e `status = "novo"`.

```
site (js/form.js) ──POST──▶ Edge Function lead-site ──▶ public.leads
                    ◀── { ok: true } / { ok: false }
```

- O site **não guarda chave nenhuma**. Quem grava é a Edge Function, com a chave secreta
  que só existe no Supabase.
- A função nunca devolve dados do banco, só `ok`. A tabela tem RLS: só sócios logados
  leem os leads.
- A função valida os campos, descarta bots (honeypot `website`) e aceita chamadas só dos
  domínios em `ORIGENS_PERMITIDAS`.
- Cada envio leva um `envio_id`, gravado em `origem_chave` (única no banco): reenviar o mesmo
  formulário não duplica o lead.
- O serviço escolhido no site é ligado ao `servico_id` do kodha-os pelo mapa `SERVICOS`
  da função (ex.: "Identidade visual" → "Branding").
- Se o envio falhar, o formulário oferece um link **Continuar pelo WhatsApp** com a mensagem
  pronta (número em `WHATSAPP`, no topo de `js/form.js`).

**Mudou alguma coisa na função?** O código fica em `supabase/functions/lead-site/index.ts`.
Depois de editar, publicar de novo (Supabase CLI):

```bash
supabase functions deploy lead-site --no-verify-jwt --project-ref uprmkigkvjneuvuvwzyr
```

> `--no-verify-jwt` é intencional: o formulário é público e a função faz a própria validação.

---

## Publicação

**Métricas:** o Vercel Web Analytics está ativo no projeto `kodha`. O site carrega
`/_vercel/insights/script.js` (só fora do `localhost`); se o painel da Vercel indicar outro
caminho para o script, trocar no fim do `index.html`.

Qualquer hospedagem estática serve (Vercel, Netlify, GitHub Pages ou FTP em `public_html`).
Sobe a pasta inteira.

O site está na **Vercel** em `https://kodha.vercel.app`. Quando houver domínio próprio,
trocar `https://kodha.vercel.app/` em:

- `index.html`: `canonical`, `og:url`, `og:image`, `twitter:image` e o bloco JSON-LD
- `robots.txt`: linha `Sitemap:`
- `sitemap.xml`: `loc` e `lastmod`

---

## Pendências

- [ ] Número real do WhatsApp em **dois lugares**: `WHATSAPP` em `js/form.js` e o link
      `wa.me` do rodapé no `index.html`
- [ ] Domínio próprio: acrescentar em `ORIGENS_PERMITIDAS` da função `lead-site` (e publicar
      de novo) e trocar em `index.html`, `robots.txt` e `sitemap.xml`
- [ ] Projetos, **MC Personal Consultoria**: capa `assets/img/thumb-mcpc.webp`
- [ ] Projetos, **Raquel** (fotografia): página em criação. Quando ficar pronta, trocar a
      capa provisória pela thumb, pôr o link no título e definir o tipo de projeto
- [ ] Projetos, "Ver mais projetos": hoje só mostra um aviso. Quando existir a página de
      projetos, trocar o `<button>` por um link e apagar `js/projects.js`

---

## Identidade visual

Aplicada a partir do **KODHA — Manual da Marca v1.0**.

- **Cores:** carvão `#0B0B0F` como base, branco `#F8F8FA` no conteúdo, cinza `#A1A1B0`
  no apoio e Azul Quasar `#3F6BFF` só como energia (CTAs, foco, ícones e destaques).
- **Tipografia:** Montserrat em todo o site (títulos em SemiBold/Bold, texto em
  Regular/Medium, tracking aberto em rótulos e navegação); Jura só no nome da marca.
- **Logo:** a versão oficial com degradê, em WebP com fundo transparente:
  `simbolo-kodha.webp` (115×128) no header e no rodapé, e `simbolo-kodha-grande.webp`
  (461×512) no hero. O nome **KODHA** é escrito em **Jura** (variável `--flogo`).
- **Movimento:** convergir → conectar → avançar. Entradas de ~760 ms, hover de ~300 ms,
  tudo desligado em `prefers-reduced-motion`.
- **Fio de conexão:** o traço azul que percorre a página é a ideia de conexão do
  símbolo aplicada à composição.

---

## Autores

**KODHA**: Elisson (estratégia e design) e Marcus Carvalho (tecnologia e desenvolvimento).
