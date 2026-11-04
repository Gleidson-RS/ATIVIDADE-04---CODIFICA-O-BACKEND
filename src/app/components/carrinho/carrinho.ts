import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Funcionario } from '../../models/gestao/gestao';
import { CarrinhoService } from '../../services/carrinho/carrinho-service';
import { FuncionarioService } from '../../services/funcionario/funcionario-service';
import { LoginService } from '../../services/login/login';
import { PedidoCriado, PedidoService } from '../../services/pedido/pedido-service';
import { PessoaResumo, PessoaService } from '../../services/pessoa/pessoa-service';
import { AdminAuth } from '../../services/admin-auth/admin-auth';
import { mensagemErroApi } from '../../shared/erro-api';
import { validarAtendimento } from '../../shared/validacoes-gestao';

/**
 * Carrinho de compras e finalização do pedido.
 * - Cliente logado: finaliza o próprio pedido, escolhendo o funcionário que o atende.
 * - Atendente (Portal do Funcionário): também escolhe o cliente.
 * - Visitante sem login: pode montar o carrinho, mas é convidado a entrar para finalizar.
 */
@Component({
  selector: 'app-carrinho',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './carrinho.html',
  styleUrl: './carrinho.css'
})
export class Carrinho {
  private readonly carrinho = inject(CarrinhoService);
  private readonly auth = inject(AdminAuth);
  private readonly login = inject(LoginService);
  private readonly pedidoService = inject(PedidoService);
  private readonly pessoaService = inject(PessoaService);
  private readonly funcionarioService = inject(FuncionarioService);

  readonly itens = this.carrinho.itens;
  readonly quantidadeTotal = this.carrinho.quantidadeTotal;
  readonly valorTotal = this.carrinho.valorTotal;
  readonly atendente = this.auth.autenticado;

  readonly clientes = signal<PessoaResumo[]>([]);
  readonly funcionarios = signal<Funcionario[]>([]);
  readonly idCliente = signal<number | null>(null);
  readonly nomeCliente = signal('');
  readonly idFuncionario = signal<number | null>(null);
  readonly data = signal(this.dataHoje());
  readonly tentou = signal(false);
  readonly enviando = signal(false);
  readonly mensagem = signal('');
  readonly mensagemErro = signal(false);
  readonly pedidoCriado = signal<PedidoCriado | null>(null);

  readonly erros = computed(() => validarAtendimento({
    idPessoa: this.idCliente(),
    idFuncionario: this.idFuncionario(),
    data: this.data(),
    quantidadeLinhas: this.itens().length
  }));

  constructor() {
    const pessoa = this.login.obterPessoaLogada() as unknown as Record<string, unknown> | null;
    const idLogado = Number(pessoa?.['idPessoa'] ?? pessoa?.['id'] ?? 0);
    if (idLogado > 0) this.idCliente.set(idLogado);
    this.nomeCliente.set(String(pessoa?.['nome'] ?? ''));

    this.funcionarioService.listar().subscribe({
      next: lista => this.funcionarios.set(lista),
      error: erro => this.falhar(mensagemErroApi(erro, 'carregar os funcionários'))
    });
    if (this.atendente()) {
      this.pessoaService.listarResumo().subscribe({
        next: lista => this.clientes.set(lista),
        error: erro => this.falhar(mensagemErroApi(erro, 'carregar os clientes'))
      });
    }
  }

  erro(campo: string): string {
    return this.tentou() ? (this.erros()[campo] ?? '') : '';
  }

  alterarQuantidade(id: number, tipo: 'P' | 'S', quantidade: number): void {
    const resultado = this.carrinho.alterarQuantidade(id, tipo, Number(quantidade));
    if (!resultado.ok) this.falhar(resultado.mensagem);
    else this.mensagem.set('');
  }

  remover(id: number, tipo: 'P' | 'S', nome: string): void {
    this.carrinho.remover(id, tipo);
    this.sucesso(`“${nome}” removido do carrinho.`);
  }

  limpar(): void {
    if (!confirm('Esvaziar o carrinho?')) return;
    this.carrinho.limpar();
    this.sucesso('Carrinho esvaziado.');
  }

  finalizar(): void {
    this.tentou.set(true);
    this.mensagem.set('');
    this.pedidoCriado.set(null);

    if (Object.keys(this.erros()).length > 0) {
      this.falhar('Corrija os campos destacados antes de finalizar.');
      return;
    }

    const itens = this.itens().map(i => ({
      idItem: i.id,
      idFuncionario: Number(this.idFuncionario()),
      quantidade: i.quantidade,
      valorUnitario: i.preco
    }));

    this.enviando.set(true);
    this.pedidoService.criar({
      idPessoa: Number(this.idCliente()),
      dataAtendimento: this.data(),
      itens
    }).pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: pedido => {
        this.pedidoCriado.set(pedido);
        this.carrinho.limpar();
        this.tentou.set(false);
        this.sucesso(`Pedido #${pedido.idAtendimento} registrado. O estoque dos produtos foi atualizado.`);
      },
      error: erro => this.falhar(mensagemErroApi(erro, 'finalizar o pedido'))
    });
  }

  dataHoje(): string {
    const agora = new Date();
    return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
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
