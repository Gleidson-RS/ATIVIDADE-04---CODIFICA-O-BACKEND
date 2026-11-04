import { computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { CarrinhoService } from '../services/carrinho/carrinho-service';
import { ItemService } from '../services/item/item-service';
import { ItemCatalogo, TipoItem } from '../models/gestao/gestao';
import { mensagemErroApi } from './erro-api';

export type OrdenacaoCatalogo = 'nome' | 'menor-preco' | 'maior-preco';

/**
 * Lógica comum aos catálogos de produtos e de serviços: carga pela API, busca, filtro por
 * categoria, ordenação e adição ao carrinho. Cada catálogo define apenas o tipo de item.
 */
export abstract class CatalogoBase {
  protected readonly itemService = inject(ItemService);
  protected readonly carrinho = inject(CarrinhoService);

  protected abstract readonly tipo: TipoItem;

  readonly itens = signal<ItemCatalogo[]>([]);
  readonly categoria = signal('Todas');
  readonly busca = signal('');
  readonly ordenacao = signal<OrdenacaoCatalogo>('nome');
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly aviso = signal('');
  readonly avisoErro = signal(false);

  readonly categorias = computed(() => [
    'Todas',
    ...new Set(this.itens().map(i => i.categoria))
  ]);

  readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    const categoria = this.categoria();
    const lista = this.itens().filter(i =>
      i.ativo &&
      (categoria === 'Todas' || i.categoria === categoria) &&
      (!termo ||
        i.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
        i.descricao.toLocaleLowerCase('pt-BR').includes(termo)));

    switch (this.ordenacao()) {
      case 'menor-preco': return [...lista].sort((a, b) => a.preco - b.preco);
      case 'maior-preco': return [...lista].sort((a, b) => b.preco - a.preco);
      default: return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }
  });

  atualizar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.itemService.listar(this.tipo)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: itens => this.itens.set(itens),
        error: erro => this.erro.set(mensagemErroApi(erro, `carregar o catálogo de ${this.tipo === 'P' ? 'produtos' : 'serviços'}`))
      });
  }

  limparFiltros(): void {
    this.busca.set('');
    this.categoria.set('Todas');
    this.ordenacao.set('nome');
  }

  adicionarAoCarrinho(item: ItemCatalogo): void {
    const resultado = this.carrinho.adicionar(item, 1);
    this.aviso.set(resultado.mensagem);
    this.avisoErro.set(!resultado.ok);
  }

  estoqueTexto(item: ItemCatalogo): string {
    if (item.estoque === undefined) return 'Estoque não informado';
    return item.estoque > 0 ? `${item.estoque} em estoque` : 'Sem estoque';
  }

  podeComprar(item: ItemCatalogo): boolean {
    return item.ativo && (item.tipoItem === 'S' || item.estoque === undefined || item.estoque > 0);
  }
}
