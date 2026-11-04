import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Funcionario, ItemCatalogo, TipoItem } from '../../models/gestao/gestao';
import { FuncionarioService } from '../../services/funcionario/funcionario-service';
import { ItemService } from '../../services/item/item-service';
import { AtendimentoApi, PedidoService } from '../../services/pedido/pedido-service';
import { PessoaResumo, PessoaService } from '../../services/pessoa/pessoa-service';
import { mensagemErroApi } from '../../shared/erro-api';
import { validarAtendimento, validarQuantidade } from '../../shared/validacoes-gestao';

interface LinhaAtendimento {
  uid: number;
  tipo: TipoItem;
  idItem: number | null;
  quantidade: number;
}

/**
 * Registro de atendimentos: um cliente, um funcionário responsável e um ou mais itens
 * (serviços e/ou produtos). O pedido é gravado via POST /api/Pedido, que dá baixa no estoque.
 */
@Component({
  selector: 'app-atendimentos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './atendimentos.html',
  styleUrl: './atendimentos.css'
})
export class Atendimentos {
  private readonly pessoaService = inject(PessoaService);
  private readonly funcionarioService = inject(FuncionarioService);
  private readonly itemService = inject(ItemService);
  private readonly pedidoService = inject(PedidoService);

  readonly clientes = signal<PessoaResumo[]>([]);
  readonly funcionarios = signal<Funcionario[]>([]);
  readonly servicos = signal<ItemCatalogo[]>([]);
  readonly produtos = signal<ItemCatalogo[]>([]);
  readonly atendimentos = signal<AtendimentoApi[]>([]);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly erro = signal('');
  readonly mensagem = signal('');
  readonly tentou = signal(false);

  private proximoUid = 1;

  readonly idCliente = signal<number | null>(null);
  readonly idFuncionario = signal<number | null>(null);
  readonly data = signal(this.dataHoje());
  readonly linhas = signal<LinhaAtendimento[]>([this.novaLinha('S')]);

  readonly erros = computed(() => validarAtendimento({
    idPessoa: this.idCliente(),
    idFuncionario: this.idFuncionario(),
    data: this.data(),
    quantidadeLinhas: this.linhas().length
  }));

  readonly totalEstimado = computed(() =>
    this.linhas().reduce((soma, linha) => soma + this.precoDaLinha(linha) * linha.quantidade, 0));

  constructor() {
    this.carregarDados();
  }

  erroCampo(campo: string): string {
    return this.tentou() ? (this.erros()[campo] ?? '') : '';
  }

  carregarDados(): void {
    this.carregando.set(true);
    this.erro.set('');
    forkJoin({
      clientes: this.pessoaService.listarResumo(),
      funcionarios: this.funcionarioService.listar(),
      servicos: this.itemService.listar('S'),
      produtos: this.itemService.listar('P'),
      atendimentos: this.pedidoService.listar()
    }).pipe(finalize(() => this.carregando.set(false))).subscribe({
      next: dados => {
        this.clientes.set(dados.clientes);
        this.funcionarios.set(dados.funcionarios);
        this.servicos.set(dados.servicos.filter(s => s.ativo));
        this.produtos.set(dados.produtos.filter(p => p.ativo));
        this.atendimentos.set(dados.atendimentos ?? []);
      },
      error: erro => this.erro.set(mensagemErroApi(erro, 'carregar os dados do atendimento'))
    });
  }

  atualizarLista(): void {
    this.pedidoService.listar().subscribe({
      next: lista => this.atendimentos.set(lista ?? []),
      error: erro => this.erro.set(mensagemErroApi(erro, 'atualizar os atendimentos'))
    });
  }

  itensDoTipo(tipo: TipoItem): ItemCatalogo[] {
    return tipo === 'S' ? this.servicos() : this.produtos();
  }

  novaLinha(tipo: TipoItem): LinhaAtendimento {
    return { uid: this.proximoUid++, tipo, idItem: null, quantidade: 1 };
  }

  adicionarLinha(): void {
    this.linhas.update(lista => [...lista, this.novaLinha('S')]);
  }

  removerLinha(uid: number): void {
    this.linhas.update(lista => lista.length > 1 ? lista.filter(l => l.uid !== uid) : lista);
  }

  alterarLinha(uid: number, campo: Partial<LinhaAtendimento>): void {
    this.linhas.update(lista => lista.map(l => (l.uid === uid ? { ...l, ...campo } : l)));
  }

  itemDaLinha(linha: LinhaAtendimento): ItemCatalogo | undefined {
    return this.itensDoTipo(linha.tipo).find(i => i.id === linha.idItem);
  }

  precoDaLinha(linha: LinhaAtendimento): number {
    return this.itemDaLinha(linha)?.preco ?? 0;
  }

  erroLinha(linha: LinhaAtendimento): string {
    if (!this.tentou()) return '';
    if (!linha.idItem) return 'Selecione o item.';
    const item = this.itemDaLinha(linha);
    const erroQuantidade = validarQuantidade(linha.quantidade);
    if (erroQuantidade) return erroQuantidade;
    if (item?.tipoItem === 'P' && item.estoque !== undefined && linha.quantidade > item.estoque) {
      return `Estoque insuficiente (${item.estoque} disponível).`;
    }
    return '';
  }

  salvar(): void {
    this.tentou.set(true);
    this.erro.set('');
    this.mensagem.set('');

    const linhas = this.linhas();
    const ids = linhas.map(l => l.idItem);
    const duplicado = ids.some((id, i) => id !== null && ids.indexOf(id) !== i);

    if (Object.keys(this.erros()).length > 0 || linhas.some(l => this.erroLinha(l))) {
      this.erro.set('Corrija os campos destacados antes de registrar.');
      return;
    }
    if (duplicado) {
      this.erro.set('O mesmo item não pode aparecer duas vezes no atendimento. Ajuste a quantidade em uma única linha.');
      return;
    }

    this.salvando.set(true);
    this.pedidoService.criar({
      idPessoa: Number(this.idCliente()),
      dataAtendimento: this.data(),
      itens: linhas.map(l => ({
        idItem: Number(l.idItem),
        idFuncionario: Number(this.idFuncionario()),
        quantidade: l.quantidade,
        valorUnitario: this.precoDaLinha(l)
      }))
    }).pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: pedido => {
        this.mensagem.set(`Atendimento #${pedido.idAtendimento} registrado. Estoque atualizado.`);
        this.limparFormulario();
        this.atualizarLista();
      },
      error: erro => this.erro.set(mensagemErroApi(erro, 'registrar o atendimento'))
    });
  }

  limparFormulario(): void {
    this.idCliente.set(null);
    this.idFuncionario.set(null);
    this.data.set(this.dataHoje());
    this.linhas.set([this.novaLinha('S')]);
    this.tentou.set(false);
  }

  formatarData(valor: string | undefined): string {
    if (!valor) return '—';
    const data = new Date(`${valor.substring(0, 10)}T00:00:00`);
    return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString('pt-BR');
  }

  formatarItens(atendimento: AtendimentoApi): string {
    return (atendimento.itens ?? []).map(item =>
      `${item.item ?? `Item #${item.idItem ?? '?'}`} (x${item.quantidade ?? 1})`
    ).join(', ') || '—';
  }

  formatarFuncionarios(atendimento: AtendimentoApi): string {
    const nomes = (atendimento.itens ?? []).map(item =>
      item.nomeFuncionario || (item.idFuncionario ? `ID ${item.idFuncionario}` : 'Não informado'));
    return [...new Set(nomes)].join(', ') || '—';
  }

  rotuloStatus(atendimento: AtendimentoApi): string {
    return this.pedidoService.rotuloStatus(atendimento.statusAtendimento);
  }

  dataHoje(): string {
    const agora = new Date();
    return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
}
