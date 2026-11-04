import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { ItemCatalogo, MovimentoEstoque } from '../../models/gestao/gestao';
import { EstoqueService } from '../../services/estoque/estoque-service';
import { ItemService } from '../../services/item/item-service';
import { mensagemErroApi } from '../../shared/erro-api';
import { validarEntrada } from '../../shared/validacoes-gestao';

const LIMITE_ESTOQUE_BAIXO = 3;

/**
 * Consulta de estoque e registro de entradas. Entradas gravam em entradaproduto e somam no
 * estoque; as baixas automáticas (pedidos) aparecem no histórico junto das entradas.
 */
@Component({
  selector: 'app-estoque',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './estoque.html',
  styleUrl: './estoque.css'
})
export class Estoque {
  private readonly itemService = inject(ItemService);
  private readonly estoqueService = inject(EstoqueService);

  readonly limiteBaixo = LIMITE_ESTOQUE_BAIXO;
  readonly produtos = signal<ItemCatalogo[]>([]);
  readonly movimentos = signal<MovimentoEstoque[]>([]);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly erroApi = signal('');
  readonly mensagem = signal('');
  readonly mensagemErro = signal(false);
  readonly tentou = signal(false);

  readonly busca = signal('');
  readonly filtroMovimento = signal<'Todos' | 'Entrada' | 'Baixa'>('Todos');

  readonly formIdItem = signal<number | null>(null);
  readonly formQuantidade = signal<number | null>(1);
  readonly formValor = signal<number | null>(null);
  readonly formUnidade = signal('UN');

  readonly erros = computed(() => validarEntrada({
    idItem: this.formIdItem(),
    quantidade: this.formQuantidade(),
    valorUnitario: this.formValor(),
    unidade: this.formUnidade()
  }));

  readonly produtosAtivos = computed(() => this.produtos().filter(p => p.ativo));

  readonly produtosFiltrados = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    return this.produtosAtivos().filter(p => !termo || p.nome.toLocaleLowerCase('pt-BR').includes(termo));
  });

  readonly movimentosFiltrados = computed(() => {
    const filtro = this.filtroMovimento();
    return this.movimentos().filter(m => filtro === 'Todos' || m.tipo === filtro);
  });

  readonly semEstoque = computed(() =>
    this.produtos().filter(p => p.ativo && p.estoque !== undefined && p.estoque <= 0).length);
  readonly estoqueBaixo = computed(() =>
    this.produtos().filter(p => p.ativo && p.estoque !== undefined && p.estoque > 0 && p.estoque <= LIMITE_ESTOQUE_BAIXO).length);

  constructor() {
    this.carregar();
  }

  erroCampo(campo: string): string {
    return this.tentou() ? (this.erros()[campo] ?? '') : '';
  }

  carregar(): void {
    this.carregando.set(true);
    this.erroApi.set('');
    forkJoin({
      produtos: this.itemService.listar('P'),
      movimentos: this.estoqueService.listarMovimentos()
    }).pipe(finalize(() => this.carregando.set(false))).subscribe({
      next: ({ produtos, movimentos }) => {
        this.produtos.set(produtos);
        this.movimentos.set(movimentos);
      },
      error: erro => this.erroApi.set(mensagemErroApi(erro, 'consultar o estoque'))
    });
  }

  situacao(produto: ItemCatalogo): string {
    if (produto.estoque === undefined) return 'Sem informação';
    if (produto.estoque <= 0) return 'Sem estoque';
    if (produto.estoque <= LIMITE_ESTOQUE_BAIXO) return 'Estoque baixo';
    return 'Disponível';
  }

  registrarEntrada(): void {
    this.tentou.set(true);
    this.mensagem.set('');
    if (Object.keys(this.erros()).length > 0) {
      this.falhar('Corrija os campos destacados antes de registrar a entrada.');
      return;
    }

    this.salvando.set(true);
    this.estoqueService.registrarEntrada({
      idItem: Number(this.formIdItem()),
      quantidade: Number(this.formQuantidade()),
      unidade: this.formUnidade().trim().toUpperCase(),
      valorUnitario: Number(this.formValor())
    }).pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => {
        this.sucesso(`Entrada de ${this.formQuantidade()} unidade(s) registrada e somada ao estoque.`);
        this.formQuantidade.set(1);
        this.formValor.set(null);
        this.tentou.set(false);
        this.carregar();
      },
      error: erro => this.falhar(mensagemErroApi(erro, 'registrar a entrada'))
    });
  }

  formatarData(valor: string): string {
    if (!valor) return '—';
    const data = new Date(`${valor.substring(0, 10)}T00:00:00`);
    return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString('pt-BR');
  }

  private sucesso(texto: string): void {
    this.mensagem.set(texto);
    this.mensagemErro.set(false);
  }

  private falhar(texto: string): void {
    this.mensagem.set(texto);
    this.mensagemErro.set(true);
  }
}
