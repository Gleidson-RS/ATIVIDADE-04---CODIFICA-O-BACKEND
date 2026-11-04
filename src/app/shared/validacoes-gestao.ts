// Validações dos formulários de gestão (categorias, produtos, serviços, funcionários,
// entradas de estoque e pedidos). Cada função devolve { campo: mensagem } só com os erros.

type Erros = Record<string, string>;

const texto = (valor: unknown): string => String(valor ?? '').trim();

const dataHojeIso = (): string => {
  const agora = new Date();
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export interface DadosCategoria {
  nome: string;
}

export function validarCategoria(d: DadosCategoria): Erros {
  const erros: Erros = {};
  const nome = texto(d.nome);
  if (nome.length < 3) erros['nome'] = 'Informe o nome da categoria (mínimo de 3 caracteres).';
  else if (nome.length > 35) erros['nome'] = 'O nome da categoria pode ter no máximo 35 caracteres.';
  return erros;
}

export interface DadosItemGestao {
  nome: string;
  descricao: string;
  idCategoria: number | null;
  preco: number | null;
  unidade?: string;
}

export function validarItemGestao(d: DadosItemGestao, tipo: 'P' | 'S'): Erros {
  const erros: Erros = {};
  const nome = texto(d.nome);
  const descricao = texto(d.descricao);

  if (nome.length < 3) erros['nome'] = 'Informe o nome (mínimo de 3 caracteres).';
  else if (nome.length > 40) erros['nome'] = 'O nome pode ter no máximo 40 caracteres.';

  if (descricao.length < 5) erros['descricao'] = 'Descreva o item (mínimo de 5 caracteres).';
  else if (descricao.length > 200) erros['descricao'] = 'A descrição pode ter no máximo 200 caracteres.';

  if (!d.idCategoria) erros['idCategoria'] = 'Selecione uma categoria.';

  if (d.preco === null || !Number.isFinite(d.preco)) erros['preco'] = 'Informe o preço.';
  else if (d.preco <= 0) erros['preco'] = 'O preço deve ser maior que zero.';
  else if (d.preco > 99999999.99) erros['preco'] = 'Preço acima do limite permitido.';

  if (tipo === 'P') {
    const unidade = texto(d.unidade);
    if (!unidade) erros['unidade'] = 'Informe a unidade de medida (ex.: UN, KG, CX).';
    else if (unidade.length > 10) erros['unidade'] = 'A unidade pode ter no máximo 10 caracteres.';
  }

  return erros;
}

export interface DadosFuncionario {
  idPessoa: number | null;
  cargo: string;
  dataAdmissao: string;
}

export function validarFuncionario(d: DadosFuncionario, novo: boolean): Erros {
  const erros: Erros = {};
  if (novo && !d.idPessoa) erros['idPessoa'] = 'Selecione a pessoa já cadastrada como cliente.';

  const cargo = texto(d.cargo);
  if (cargo.length < 2) erros['cargo'] = 'Informe o cargo (mínimo de 2 caracteres).';
  else if (cargo.length > 20) erros['cargo'] = 'O cargo pode ter no máximo 20 caracteres.';

  if (!d.dataAdmissao) erros['dataAdmissao'] = 'Informe a data de admissão.';
  else if (d.dataAdmissao > dataHojeIso()) erros['dataAdmissao'] = 'A data de admissão não pode ser futura.';

  return erros;
}

export interface DadosEntrada {
  idItem: number | null;
  quantidade: number | null;
  valorUnitario: number | null;
  unidade: string;
}

export function validarEntrada(d: DadosEntrada): Erros {
  const erros: Erros = {};
  if (!d.idItem) erros['idItem'] = 'Selecione o produto.';

  if (d.quantidade === null || !Number.isInteger(d.quantidade)) erros['quantidade'] = 'Informe uma quantidade inteira.';
  else if (d.quantidade <= 0) erros['quantidade'] = 'A quantidade deve ser maior que zero.';

  if (d.valorUnitario === null || !Number.isFinite(d.valorUnitario)) erros['valorUnitario'] = 'Informe o valor unitário de compra.';
  else if (d.valorUnitario < 0) erros['valorUnitario'] = 'O valor não pode ser negativo.';

  const unidade = texto(d.unidade);
  if (!unidade) erros['unidade'] = 'Informe a unidade (ex.: UN).';
  else if (unidade.length > 10) erros['unidade'] = 'A unidade pode ter no máximo 10 caracteres.';

  return erros;
}

export interface DadosAtendimento {
  idPessoa: number | null;
  idFuncionario: number | null;
  data: string;
  quantidadeLinhas: number;
}

export function validarAtendimento(d: DadosAtendimento): Erros {
  const erros: Erros = {};
  if (!d.idPessoa) erros['idPessoa'] = 'Selecione o cliente.';
  if (!d.idFuncionario) erros['idFuncionario'] = 'Selecione o funcionário responsável.';
  if (!d.data) erros['data'] = 'Informe a data do atendimento.';
  else if (d.data > dataHojeIso()) erros['data'] = 'A data do atendimento não pode ser futura.';
  if (d.quantidadeLinhas === 0) erros['itens'] = 'Adicione ao menos um item ao atendimento.';
  return erros;
}

export function validarQuantidade(valor: number | null): string {
  if (valor === null || !Number.isInteger(valor)) return 'Informe uma quantidade inteira.';
  if (valor <= 0) return 'A quantidade deve ser maior que zero.';
  return '';
}
