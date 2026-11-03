import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EntradaEstoque, ItemCatalogo } from '../../models/gestao/gestao';
import { DadosApiService } from '../../services/api/dados-api';
import { GestaoLocalService } from '../../services/gestao/gestao-local';
import { mensagemErroApi } from '../../shared/erro-api';

@Component({
  selector: 'app-estoque',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './estoque.html',
  styleUrl: './estoque.css'
})
export class Estoque {
  readonly produtos = signal<ItemCatalogo[]>([]);
  readonly entradas = signal<EntradaEstoque[]>([]);
  readonly mensagem = signal('');
  readonly erro = signal(false);
  readonly erroApi = signal('');
  readonly carregando = signal(false);

  produtoId: number | null = null;
  quantidade = 1;
  observacao = '';
  busca = '';

  constructor(
    private dadosApi: DadosApiService,
    private gestao: GestaoLocalService
  ) {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erroApi.set('');
    this.dadosApi.listarItensCatalogo()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: itens => this.produtos.set(itens.filter(item => item.tipoItem === 'P' && item.ativo)),
        error: erro => this.erroApi.set(mensagemErroApi(erro, 'consultar o estoque de produtos'))
      });
    this.entradas.set(this.gestao.listarEntradas());
  }

  get produtosFiltrados(): ItemCatalogo[] {
    const termo = this.busca.trim().toLocaleLowerCase('pt-BR');
    return this.produtos().filter(item => !termo || item.nome.toLocaleLowerCase('pt-BR').includes(termo));
  }

  estoqueAtual(produto: ItemCatalogo): number | null {
    if (produto.estoque === undefined) {
      const ajuste = this.gestao.ajusteEstoqueLocal(produto.id);
      return ajuste > 0 ? ajuste : null;
    }
    return produto.estoque + this.gestao.ajusteEstoqueLocal(produto.id);
  }

  statusEstoque(produto: ItemCatalogo): string {
    const quantidade = this.estoqueAtual(produto);
    if (quantidade === null) return 'Sem informação';
    return quantidade > 0 ? 'Disponível' : 'Sem estoque';
  }

  registrarEntrada(): void {
    this.mensagem.set('');
    this.erro.set(false);

    if (this.produtoId === null || !Number.isInteger(this.quantidade) || this.quantidade <= 0) {
      this.mensagem.set('Selecione um produto e informe uma quantidade inteira maior que zero.');
      this.erro.set(true);
      return;
    }

    const produto = this.produtos().find(item => item.id === this.produtoId);
    if (!produto) {
      this.mensagem.set('O produto selecionado não foi encontrado na API. Atualize a lista.');
      this.erro.set(true);
      return;
    }

    const entrada = this.gestao.registrarEntradaCatalogo(
      produto.id,
      produto.nome,
      this.quantidade,
      this.observacao
    );

    if (!entrada) {
      this.mensagem.set('Não foi possível registrar a entrada local.');
      this.erro.set(true);
      return;
    }

    this.entradas.set(this.gestao.listarEntradas());
    this.quantidade = 1;
    this.observacao = '';
    this.mensagem.set(`Entrada de ${entrada.quantidade} unidade(s) registrada neste navegador. O MySQL não foi alterado.`);
  }

  formatarData(valor: string): string {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? valor : data.toLocaleString('pt-BR');
  }
}
