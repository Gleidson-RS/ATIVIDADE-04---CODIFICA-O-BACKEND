export interface ItemCatalogo {
  id: number;
  nome: string;
  categoria: string;
  descricao: string;
  preco: number;
  ativo: boolean;
  estoque?: number;
  tipoItem?: 'P' | 'S';
}

export interface Funcionario {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo: string;
  dataAdmissao: string;
  ativo: boolean;
}

export interface Atendimento {
  id: number;
  clienteId: number;
  clienteNome: string;
  funcionarioId: number;
  funcionarioNome: string;
  tipoItem: 'Serviço' | 'Produto';
  itemId: number;
  itemNome: string;
  data: string;
  descricao: string;
  status: 'Pendente' | 'Em andamento' | 'Concluído' | 'Cancelado';
}

export interface EntradaEstoque {
  id: number;
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  data: string;
  observacao: string;
}
