import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Pessoas } from '../../models/pessoas/pessoa';
import { ItemCatalogo } from '../../models/gestao/gestao';
import { AtendimentoApi, DadosApiService } from '../../services/api/dados-api';
import { PessoaService } from '../../services/pessoa/pessoa-service';
import { mensagemErroApi } from '../../shared/erro-api';

interface ClienteOpcao { id: number; nome: string; }

@Component({
  selector: 'app-atendimentos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './atendimentos.html',
  styleUrl: './atendimentos.css'
})
export class Atendimentos {
  readonly clientes = signal<ClienteOpcao[]>([]);
  readonly servicos = signal<ItemCatalogo[]>([]);
  readonly produtos = signal<ItemCatalogo[]>([]);
  readonly atendimentos = signal<AtendimentoApi[]>([]);
  readonly erro = signal('');
  readonly mensagem = signal('');
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly categoriaItem = signal<'Serviço' | 'Produto'>('Serviço');
  readonly clienteId = signal<number | null>(null);
  readonly itemId = signal<number | null>(null);
  readonly itensDisponiveis = computed(() =>
    this.categoriaItem() === 'Serviço' ? this.servicos() : this.produtos()
  );

  funcionarioId: number | null = null;
  quantidade = 1;
  data = this.dataLocalAtual();

  constructor(
    private pessoaService: PessoaService,
    private dadosApi: DadosApiService
  ) {
    this.carregarDados();
  }

  carregarDados(): void {
    this.erro.set('');
    this.carregando.set(true);
    let pendentes = 3;
    const concluir = (): void => {
      pendentes--;
      if (pendentes === 0) this.carregando.set(false);
    };

    this.pessoaService.listarPessoas().pipe(finalize(concluir)).subscribe({
      next: (dados: Pessoas[]) => {
        const lista = (dados as any[]).map(pessoa => ({
          id: Number(pessoa.idPessoa ?? pessoa.id ?? pessoa.IdPessoa),
          nome: String(pessoa.nome ?? '')
        })).filter(pessoa => pessoa.id > 0 && pessoa.nome);
        this.clientes.set(lista);
      },
      error: erro => this.erro.set(mensagemErroApi(erro, 'carregar os clientes'))
    });

    this.dadosApi.listarItensCatalogo().pipe(finalize(concluir)).subscribe({
      next: itens => {
        this.servicos.set(itens.filter(item => item.ativo && item.tipoItem === 'S'));
        this.produtos.set(itens.filter(item => item.ativo && item.tipoItem === 'P'));
      },
      error: erro => this.erro.set(mensagemErroApi(erro, 'carregar serviços e produtos'))
    });

    this.dadosApi.listarAtendimentos().pipe(finalize(concluir)).subscribe({
      next: dados => this.atendimentos.set(dados ?? []),
      error: erro => this.erro.set(mensagemErroApi(erro, 'carregar os atendimentos'))
    });
  }

  carregarAtendimentos(): void {
    this.dadosApi.listarAtendimentos().subscribe({
      next: dados => this.atendimentos.set(dados ?? []),
      error: erro => this.erro.set(mensagemErroApi(erro, 'atualizar os atendimentos'))
    });
  }

  trocarTipo(tipo: 'Serviço' | 'Produto'): void {
    this.categoriaItem.set(tipo);
    this.itemId.set(null);
  }

  salvar(): void {
    this.mensagem.set('');
    this.erro.set('');

    const cliente = this.clientes().find(item => item.id === this.clienteId());
    const item = this.itensDisponiveis().find(registro => registro.id === this.itemId());
    const idFuncionario = Number(this.funcionarioId);

    if (!cliente || !item || !this.data || !Number.isInteger(idFuncionario) || idFuncionario <= 0) {
      this.erro.set('Selecione o cliente e o item, informe a data e um ID de funcionário válido.');
      return;
    }
    if (!Number.isInteger(this.quantidade) || this.quantidade <= 0) {
      this.erro.set('A quantidade deve ser um número inteiro maior que zero.');
      return;
    }
    if (this.categoriaItem() === 'Produto' && item.estoque !== undefined && item.estoque < this.quantidade) {
      this.erro.set('A quantidade solicitada é maior que o estoque informado pela API.');
      return;
    }

    this.salvando.set(true);
    this.dadosApi.criarAtendimento({
      idAtendimento: 0,
      idPessoa: cliente.id,
      dataAtendimento: this.data,
      statusAtendimento: 'P',
      itens: [{
        idAtendimento: 0,
        idItem: item.id,
        idFuncionario,
        quantidade: this.quantidade,
        valorUnitario: item.preco
      }]
    }).pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => {
        this.mensagem.set('Atendimento enviado à API.');
        this.clienteId.set(null);
        this.itemId.set(null);
        this.funcionarioId = null;
        this.quantidade = 1;
        this.data = this.dataLocalAtual();
        this.carregarAtendimentos();
      },
      error: erro => this.erro.set(mensagemErroApi(erro, 'registrar o atendimento'))
    });
  }

  formatarData(valor: string | undefined): string {
    if (!valor) return '—';
    const data = new Date(`${valor.substring(0, 10)}T00:00:00`);
    return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString('pt-BR');
  }

  formatarStatus(valor: string | null | undefined): string {
    const status = String(valor ?? '').trim().toUpperCase();
    if (status === 'P') return 'Pendente';
    return status || 'Não informado';
  }

  formatarItens(atendimento: AtendimentoApi): string {
    return (atendimento.itens ?? []).map(item =>
      `${item.item ?? `Item #${item.idItem ?? '?'}`} (x${item.quantidade ?? 1})`
    ).join(', ') || '—';
  }

  formatarFuncionarios(atendimento: AtendimentoApi): string {
    return (atendimento.itens ?? []).map(item =>
      item.nomeFuncionario || (item.idFuncionario ? `ID ${item.idFuncionario}` : 'Não informado')
    ).filter((nome, indice, todos) => todos.indexOf(nome) === indice).join(', ') || '—';
  }

  private dataLocalAtual(): string {
    const agora = new Date();
    const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
}
