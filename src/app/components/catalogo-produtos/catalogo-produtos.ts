import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ItemCatalogo } from '../../models/gestao/gestao';
import { DadosApiService } from '../../services/api/dados-api';
import { mensagemErroApi } from '../../shared/erro-api';

@Component({
  selector: 'app-catalogo-produtos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogo-produtos.html',
  styleUrl: './catalogo-produtos.css'
})
export class CatalogoProdutos {
  readonly produtos = signal<ItemCatalogo[]>([]);
  readonly categoria = signal('Todas');
  readonly busca = signal('');
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly categorias = computed(() => [
    'Todas',
    ...new Set(this.produtos().map(produto => produto.categoria))
  ]);
  readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    return this.produtos().filter(produto => {
      const correspondeCategoria = this.categoria() === 'Todas' || produto.categoria === this.categoria();
      const correspondeBusca = !termo ||
        produto.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
        produto.descricao.toLocaleLowerCase('pt-BR').includes(termo);
      return produto.ativo && correspondeCategoria && correspondeBusca;
    });
  });

  constructor(private dadosApi: DadosApiService) {
    this.atualizar();
  }

  atualizar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.dadosApi.listarItensCatalogo()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: itens => this.produtos.set(itens.filter(item => item.tipoItem === 'P')),
        error: erro => this.erro.set(mensagemErroApi(erro, 'carregar o catálogo de produtos'))
      });
  }

}
