import { HttpErrorResponse } from '@angular/common/http';

// Converte um erro do HttpClient em uma mensagem clara para o usuário.
export function mensagemErroApi(erro: unknown, acao: string): string {
  const e = erro as HttpErrorResponse;

  if (e?.status === 0) {
    return `Não foi possível ${acao}: sem conexão com a API. Verifique se o back-end está em execução.`;
  }
  if (e?.status === 400) {
    const detalhe = typeof e.error === 'string' ? e.error : e.error?.title;
    return `Não foi possível ${acao}: dados rejeitados pela API.${detalhe ? ' ' + detalhe : ''}`;
  }
  if (e?.status === 404) return `Não foi possível ${acao}: registro não encontrado.`;
  if (e?.status === 409) return `Não foi possível ${acao}: já existe um registro com estes dados.`;
  if (e?.status >= 500) return `Não foi possível ${acao}: erro interno na API (${e.status}).`;
  return `Não foi possível ${acao}. Tente novamente.`;
}
