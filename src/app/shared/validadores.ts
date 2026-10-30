// Validações reutilizadas nos formulários de cliente (cadastro e edição).

export function somenteDigitos(valor: unknown): string {
  return String(valor ?? '').replace(/\D/g, '');
}

export function cpfValido(valor: unknown): boolean {
  const cpf = somenteDigitos(valor);
  return cpf.length === 11;
}

export function emailValido(valor: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor ?? '').trim());
}

export function telefoneValido(valor: unknown): boolean {
  const t = somenteDigitos(valor);
  return t.length === 10 || t.length === 11;
}

export function cepValido(valor: unknown): boolean {
  return somenteDigitos(valor).length === 8;
}

export function dataNascimentoValida(valor: unknown): boolean {
  const texto = String(valor ?? '').substring(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const data = new Date(texto + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return !Number.isNaN(data.getTime()) && data <= hoje && data.getFullYear() >= 1900;
}

export interface DadosCliente {
  nome: unknown;
  email: unknown;
  CPF: unknown;
  datanascimento: unknown;
  sexo: unknown;
  telefone: unknown;
  CEP: unknown;
  Numero: unknown;
}

// Retorna a mensagem de erro de cada campo (ou '' quando o campo está válido).
export function validarCliente(d: DadosCliente): Record<string, string> {
  const erros: Record<string, string> = {};

  if (String(d.nome ?? '').trim().length < 3) erros['nome'] = 'Informe o nome completo (mínimo de 3 caracteres).';
  if (!String(d.email ?? '').trim()) erros['email'] = 'O e-mail é obrigatório.';
  else if (!emailValido(d.email)) erros['email'] = 'Informe um e-mail válido, como nome@dominio.com.';

  if (!somenteDigitos(d.CPF)) erros['CPF'] = 'O CPF é obrigatório.';
  else if (!cpfValido(d.CPF)) erros['CPF'] = 'CPF inválido. Confira os 11 dígitos.';

  if (!d.datanascimento) erros['datanascimento'] = 'A data de nascimento é obrigatória.';
  else if (!dataNascimentoValida(d.datanascimento)) erros['datanascimento'] = 'Data de nascimento inválida ou no futuro.';

  if (!d.sexo) erros['sexo'] = 'Selecione o sexo.';

  if (!somenteDigitos(d.telefone)) erros['telefone'] = 'O telefone é obrigatório.';
  else if (!telefoneValido(d.telefone)) erros['telefone'] = 'Telefone inválido. Use DDD + número (10 ou 11 dígitos).';

  if (!somenteDigitos(d.CEP)) erros['CEP'] = 'O CEP é obrigatório.';
  else if (!cepValido(d.CEP)) erros['CEP'] = 'CEP inválido. Informe 8 dígitos.';

  if (!String(d.Numero ?? '').trim()) erros['Numero'] = 'Informe o número do endereço.';

  return erros;
}
