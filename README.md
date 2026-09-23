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
│   ├── menu.js                     menu hambúrguer, overlay e header fixo
│   ├── reveal.js                   animação de entrada e ano do rodapé
│   ├── connector.js                desenha o fio azul conforme a página rola
│   └── form.js                     validação, máscara de telefone e envio
└── apps-script/
    └── Codigo.gs                   recebe os leads na planilha do Google
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

O formulário envia os dados para um app da web do Google Apps Script, que grava cada
lead numa linha da planilha.

1. Criar (ou abrir) a planilha de leads no Google Sheets.
2. **Extensões → Apps Script** e colar o conteúdo de `apps-script/Codigo.gs`.
3. Script vinculado à própria planilha: deixar `ID_PLANILHA` vazio. Planilha separada:
   colar o ID dela (o trecho entre `/d/` e `/edit` na URL).
4. **Implantar → Nova implantação → App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Colar a URL gerada no topo de `js/form.js`:

   ```js
   const SCRIPT_URL = "https://script.google.com/macros/s/AKfy.../exec";
   const WHATSAPP = "5532999999999";
   ```

A aba `Leads` e o cabeçalho são criados no primeiro envio, com as colunas:
Data/Hora · Nome · Negócio · Telefone · E-mail · Serviço · Mensagem · Origem · Página.

**Sem `SCRIPT_URL`**, o formulário monta a mensagem e abre o WhatsApp de `WHATSAPP`.
Assim o site funciona antes de a planilha estar pronta.

> - O envio usa `Content-Type: text/plain` de propósito, porque evita o preflight de CORS
>   do Apps Script. Não trocar para `application/json`.
> - O campo `website` é um honeypot: fica fora da tela. Se vier preenchido, é bot, e o
>   formulário finge sucesso sem enviar nada.

---

## Publicação

Qualquer hospedagem estática serve (Vercel, Netlify, GitHub Pages ou FTP em `public_html`).
Sobe a pasta inteira.

Antes de publicar, trocar o domínio de exemplo `https://kodha.com.br/` em:

- `index.html`: `canonical`, `og:url`, `og:image`, `twitter:image` e o bloco JSON-LD
- `robots.txt`: linha `Sitemap:`
- `sitemap.xml`: `loc` e `lastmod`

---

## Pendências

- [ ] `js/form.js`: preencher `SCRIPT_URL` e o número real de `WHATSAPP`
- [ ] Domínio real em `index.html`, `robots.txt` e `sitemap.xml`
- [ ] Projetos, **MC Personal Consultoria**: capa `assets/img/thumb-mcpc.webp`
- [ ] Projetos, **Raquel** (fotografia): página em criação. Quando ficar pronta, trocar a
      capa provisória pela thumb, pôr o link no título e definir o tipo de projeto
- [ ] Projetos, "Ver mais projetos": hoje aponta para o contato. Apontar para o
      portfólio quando existir

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
