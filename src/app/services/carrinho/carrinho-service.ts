import { computed, Injectable, signal } from '@angular/core';
import { ItemCarrinho, ItemCatalogo } from '../../models/gestao/gestao';

export interface ResultadoCarrinho {
  ok: boolean;
  mensagem: string;
}

/**
 * Carrinho de compras. Fica no navegador (localStorage) e sobrevive a recarregamentos.
 * A checagem de estoque usa o saldo informado pela API no momento da adição.
 */
@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private readonly chave = 'atividade04_carrinho';

  private readonly _itens = signal<ItemCarrinho[]>(this.ler());
  readonly itens = this._itens.asReadonly();

  readonly quantidadeTotal = computed(() =>
    this._itens().reduce((soma, i) => soma + i.quantidade, 0));

  readonly valorTotal = computed(() =>
    this._itens().reduce((soma, i) => soma + i.quantidade * i.preco, 0));

  adicionar(item: ItemCatalogo, quantidade = 1): ResultadoCarrinho {
    if (!item.ativo) {
      return { ok: false, mensagem: `“${item.nome}” está indisponível.` };
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return { ok: false, mensagem: 'Informe uma quantidade inteira maior que zero.' };
    }

    const atual = this._itens();
    const existente = atual.find(i => i.id === item.id && i.tipoItem === item.tipoItem);
    const novaQuantidade = (existente?.quantidade ?? 0) + quantidade;

    if (item.tipoItem === 'P' && item.estoque !== undefined && novaQuantidade > item.estoque) {
      return {
        ok: false,
        mensagem: item.estoque > 0
          ? `Estoque insuficiente: há ${item.estoque} unidade(s) de “${item.nome}”.`
          : `“${item.nome}” está sem estoque.`
      };
    }

    const linha: ItemCarrinho = {
      id: item.id,
      nome: item.nome,
      categoria: item.categoria,
      tipoItem: item.tipoItem,
      preco: item.preco,
      quantidade: novaQuantidade,
      ...(item.estoque !== undefined ? { estoque: item.estoque } : {})
    };

    this.gravar(existente
      ? atual.map(i => (i === existente ? linha : i))
      : [...atual, linha]);

    return { ok: true, mensagem: `“${item.nome}” adicionado ao carrinho.` };
  }

  alterarQuantidade(id: number, tipoItem: 'P' | 'S', quantidade: number): ResultadoCarrinho {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return { ok: false, mensagem: 'A quantidade deve ser um inteiro maior que zero.' };
    }
    const linha = this._itens().find(i => i.id === id && i.tipoItem === tipoItem);
    if (linha?.tipoItem === 'P' && linha.estoque !== undefined && quantidade > linha.estoque) {
      return { ok: false, mensagem: `Estoque insuficiente: há ${linha.estoque} unidade(s) de “${linha.nome}”.` };
    }
    this.gravar(this._itens().map(i =>
      i.id === id && i.tipoItem === tipoItem ? { ...i, quantidade } : i));
    return { ok: true, mensagem: '' };
  }

  remover(id: number, tipoItem: 'P' | 'S'): void {
    this.gravar(this._itens().filter(i => !(i.id === id && i.tipoItem === tipoItem)));
  }

  limpar(): void {
    this.gravar([]);
  }

  private gravar(itens: ItemCarrinho[]): void {
    this._itens.set(itens);
    try {
      localStorage.setItem(this.chave, JSON.stringify(itens));
    } catch {
      // Armazenamento indisponível (modo privado, por exemplo): o carrinho segue só em memória.
    }
  }

  private ler(): ItemCarrinho[] {
    try {
      const dados = localStorage.getItem(this.chave);
      return dados ? (JSON.parse(dados) as ItemCarrinho[]) : [];
    } catch {
      return [];
    }
  }
}
