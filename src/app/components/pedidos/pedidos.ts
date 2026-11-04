import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { StatusPedido } from '../../models/gestao/gestao';
import { AtendimentoApi, AtendimentoItemApi, PedidoService } from '../../services/pedido/pedido-service';
import { mensagemErroApi } from '../../shared/erro-api';

type FiltroStatus = 'Todos' | StatusPedido;

/** Gerenciamento de pedidos: consulta, conclusão e cancelamento (com devolução ao estoque). */
@Component({
  selector: 'app-pedidos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css'
})
export class Pedidos {
  readonly pedidos = signal<AtendimentoApi[]>([]);
  readonly carregando = signal(false);
  readonly processandoId = signal<number | null>(null);
  readonly busca = signal('');
  readonly filtroStatus = signal<FiltroStatus>('Todos');
  readonly expandido = signal<number | null>(null);
  readonly mensagem = signal('');
  readonly mensagemErro = signal(false);

  readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    const status = this.filtroStatus();
    return this.pedidos()
      .filter(p => status === 'Todos' || String(p.statusAtendimento ?? '').toUpperCase() === status)
      .filter(p => !termo ||
        String(p.nomePessoa ?? '').toLocaleLowerCase('pt-BR').includes(termo) ||
        String(p.idAtendimento ?? '') === termo)
      .sort((a, b) => Number(b.idAtendimento ?? 0) - Number(a.idAtendimento ?? 0));
  });

  readonly resumo = computed(() => {
    const lista = this.pedidos();
    const contar = (s: StatusPedido) => lista.filter(p => String(p.statusAtendimento ?? '').toUpperCase() === s).length;
    const faturado = lista
      .filter(p => String(p.statusAtendimento ?? '').toUpperCase() === 'F')
      .reduce((soma, p) => soma + this.pedidoService.total(p), 0);
    return { pendentes: contar('P'), concluidos: contar('F'), cancelados: contar('C'), faturado };
  });

  constructor(private pedidoService: PedidoService) {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.pedidoService.listar()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: lista => this.pedidos.set(lista ?? []),
        error: erro => this.falhar(mensagemErroApi(erro, 'carregar os pedidos'))
      });
  }

  total(pedido: AtendimentoApi): number {
    return this.pedidoService.total(pedido);
  }

  subtotal(linha: AtendimentoItemApi): number {
    return Number(linha.quantidade ?? 0) * Number(linha.valorUnitario ?? 0);
  }

  nomesFuncionarios(pedido: AtendimentoApi): string {
    const nomes = (pedido.itens ?? []).map(i => i.nomeFuncionario || ('ID ' + i.idFuncionario));
    return [...new Set(nomes)].join(', ') || '—';
  }

  rotuloStatus(pedido: AtendimentoApi): string {
    return this.pedidoService.rotuloStatus(pedido.statusAtendimento);
  }

  formatarData(valor: string | undefined): string {
    if (!valor) return '—';
    const data = new Date(`${valor.substring(0, 10)}T00:00:00`);
    return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString('pt-BR');
  }

  alternarDetalhes(pedido: AtendimentoApi): void {
    const id = Number(pedido.idAtendimento);
    this.expandido.set(this.expandido() === id ? null : id);
  }

  concluir(pedido: AtendimentoApi): void {
    if (!confirm(`Marcar o pedido #${pedido.idAtendimento} como concluído?`)) return;
    this.alterar(pedido, 'F', `Pedido #${pedido.idAtendimento} concluído.`, 'concluir o pedido');
  }

  cancelar(pedido: AtendimentoApi): void {
    const temProdutos = (pedido.itens ?? []).length > 0;
    const aviso = temProdutos
      ? ' As quantidades dos produtos voltarão ao estoque.'
      : '';
    if (!confirm(`Cancelar o pedido #${pedido.idAtendimento}?${aviso}`)) return;
    this.alterar(pedido, 'C', `Pedido #${pedido.idAtendimento} cancelado e estoque devolvido.`, 'cancelar o pedido');
  }

  private alterar(pedido: AtendimentoApi, status: Exclude<StatusPedido, 'P'>, sucesso: string, acao: string): void {
    const id = Number(pedido.idAtendimento);
    this.processandoId.set(id);
    this.pedidoService.alterarStatus(id, status)
      .pipe(finalize(() => this.processandoId.set(null)))
      .subscribe({
        next: () => {
          this.sucesso(sucesso);
          this.carregar();
        },
        error: erro => this.falhar(mensagemErroApi(erro, acao))
      });
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
