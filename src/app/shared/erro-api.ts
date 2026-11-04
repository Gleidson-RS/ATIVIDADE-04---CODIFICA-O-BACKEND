import { HttpErrorResponse } from '@angular/common/http';

// Pega a mensagem enviada pelo back-end ({ mensagem }) ou o título do ProblemDetails.
function detalheDoCorpo(corpo: unknown): string {
  if (typeof corpo === 'string') {
    return corpo.length <= 200 ? corpo.trim() : '';
  }
  const dados = corpo as { mensagem?: unknown; title?: unknown } | null;
  return String(dados?.mensagem ?? dados?.title ?? '').trim();
}

// Converte um erro do HttpClient em uma mensagem clara para o usuário.
export function mensagemErroApi(erro: unknown, acao: string): string {
  const e = erro as HttpErrorResponse;
  const detalhe = detalheDoCorpo(e?.error);

  if (e?.status === 0) {
    return `Não foi possível ${acao}: sem conexão com a API. Verifique se o back-end está em execução.`;
  }
  if (e?.status === 400) {
    return `Não foi possível ${acao}: ${detalhe || 'dados rejeitados pela API.'}`;
  }
  if (e?.status === 404) {
    return `Não foi possível ${acao}: ${detalhe || 'registro não encontrado.'}`;
  }
  if (e?.status === 409) {
    return `Não foi possível ${acao}: ${detalhe || 'já existe um registro com estes dados.'}`;
  }
  if (e?.status >= 500) {
    return `Não foi possível ${acao}: erro interno na API (${e.status}).`;
  }
  return `Não foi possível ${acao}. Tente novamente.`;
}
