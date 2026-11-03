import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ItemCatalogo } from '../../models/gestao/gestao';
import { DadosApiService } from '../../services/api/dados-api';
import { mensagemErroApi } from '../../shared/erro-api';

@Component({
  selector: 'app-catalogo-servicos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogo-servicos.html',
  styleUrl: './catalogo-servicos.css'
})
export class CatalogoServicos {
  readonly servicos = signal<ItemCatalogo[]>([]);
  readonly categoria = signal('Todas');
  readonly busca = signal('');
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly categorias = computed(() => [
    'Todas',
    ...new Set(this.servicos().map(servico => servico.categoria))
  ]);
  readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    return this.servicos().filter(servico => {
      const correspondeCategoria = this.categoria() === 'Todas' || servico.categoria === this.categoria();
      const correspondeBusca = !termo ||
        servico.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
        servico.descricao.toLocaleLowerCase('pt-BR').includes(termo);
      return servico.ativo && correspondeCategoria && correspondeBusca;
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
        next: itens => this.servicos.set(itens.filter(item => item.tipoItem === 'S')),
        error: erro => this.erro.set(mensagemErroApi(erro, 'carregar o catálogo de serviços'))
      });
  }
}
