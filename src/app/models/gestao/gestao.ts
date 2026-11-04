/** Tipo do item: 'P' = produto (tem estoque), 'S' = serviço. */
export type TipoItem = 'P' | 'S';

/** Situação do pedido/atendimento na tabela atendimento (status_atendimento). */
export type StatusPedido = 'P' | 'F' | 'C';

/** Item do catálogo ou da gestão de produtos/serviços, já convertido para uso interno. */
export interface ItemCatalogo {
  id: number;
  nome: string;
  categoria: string;
  idCategoria: number;
  descricao: string;
  preco: number;
  ativo: boolean;
  tipoItem: TipoItem;
  unidade: string;
  codigoPreco: number;
  estoque?: number;
}

export interface Categoria {
  id: number;
  nome: string;
  totalItens: number;
}

/** Funcionário como exibido nas telas (vem de GET /api/Funcionario). */
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

/** Linha do carrinho de compras (guardada no navegador). */
export interface ItemCarrinho {
  id: number;
  nome: string;
  categoria: string;
  tipoItem: TipoItem;
  preco: number;
  quantidade: number;
  estoque?: number;
}

/** Movimento do estoque: entrada registrada ou baixa automática de pedido. */
export interface MovimentoEstoque {
  tipo: 'Entrada' | 'Baixa';
  data: string;
  idItem: number;
  produto: string;
  quantidade: number;
  valorUnitario: number;
  referencia: string;
}
