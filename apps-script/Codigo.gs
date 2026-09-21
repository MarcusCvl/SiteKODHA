/**
 * KODHA — recebimento de leads do site
 * ---------------------------------------------------------------------------
 * 1. Crie (ou abra) a planilha que vai guardar os leads.
 * 2. Extensões → Apps Script, cole este arquivo por cima do Codigo.gs.
 * 3. Ajuste ID_PLANILHA e NOME_ABA abaixo.
 * 4. Implantar → Nova implantação → tipo "App da Web"
 *      Executar como:  Eu
 *      Quem pode acessar:  Qualquer pessoa
 * 5. Copie a URL gerada e cole em APPS_SCRIPT_URL, no arquivo
 *    assets/js/main.js do site.
 *
 * Teste rápido: abra a URL no navegador — deve responder {"status":"ok"}.
 */

// Cole aqui o ID da planilha (o trecho entre /d/ e /edit na URL do Sheets).
// Deixe vazio para usar a planilha à qual este script está vinculado.
var ID_PLANILHA = '';
var NOME_ABA = 'Leads';

var COLUNAS = [
  'Data/Hora',
  'Nome',
  'Negócio',
  'Telefone',
  'E-mail',
  'Serviço',
  'Mensagem',
  'Origem',
  'Página'
];

function doPost(e) {
  var trava = LockService.getScriptLock();
  try {
    trava.waitLock(20000);

    var dados = lerCorpo(e);
    if (!dados || !dados.nome) {
      return responder({ status: 'erro', mensagem: 'Dados incompletos.' });
    }

    var aba = obterAba();
    aba.appendRow([
      new Date(),
      dados.nome || '',
      dados.negocio || '',
      dados.telefone || '',
      dados.email || '',
      dados.servico || '',
      dados.mensagem || '',
      dados.origem || 'site-kodha',
      dados.pagina || ''
    ]);

    return responder({ status: 'ok' });
  } catch (erro) {
    return responder({ status: 'erro', mensagem: String(erro) });
  } finally {
    try { trava.releaseLock(); } catch (ignorado) {}
  }
}

function doGet() {
  return responder({ status: 'ok', servico: 'KODHA — leads do site' });
}

/** Aceita tanto JSON cru (text/plain) quanto formulário tradicional. */
function lerCorpo(e) {
  if (!e) return null;
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (erro) {
      // cai para os parâmetros nomeados
    }
  }
  return e.parameter && Object.keys(e.parameter).length ? e.parameter : null;
}

function obterAba() {
  var planilha = ID_PLANILHA
    ? SpreadsheetApp.openById(ID_PLANILHA)
    : SpreadsheetApp.getActiveSpreadsheet();

  var aba = planilha.getSheetByName(NOME_ABA);
  if (!aba) aba = planilha.insertSheet(NOME_ABA);

  if (aba.getLastRow() === 0) {
    aba.appendRow(COLUNAS);
    aba.getRange(1, 1, 1, COLUNAS.length)
      .setFontWeight('bold')
      .setBackground('#0B0B0F')
      .setFontColor('#F8F8FA');
    aba.setFrozenRows(1);
    aba.setColumnWidth(1, 150);
    aba.setColumnWidth(7, 320);
  }
  return aba;
}

function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Roda uma vez pelo editor para conferir se a planilha e a aba estão certas. */
function testarGravacao() {
  doPost({
    postData: {
      contents: JSON.stringify({
        nome: 'Teste KODHA',
        negocio: 'Interno',
        telefone: '(32) 99999-9999',
        email: 'teste@kodha.com.br',
        servico: 'Site institucional',
        mensagem: 'Linha de teste — pode apagar.',
        origem: 'teste-manual'
      })
    }
  });
}
