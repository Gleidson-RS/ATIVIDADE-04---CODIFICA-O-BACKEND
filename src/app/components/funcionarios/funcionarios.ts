import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Funcionario } from '../../models/gestao/gestao';
import { FuncionarioService } from '../../services/funcionario/funcionario-service';
import { PessoaResumo, PessoaService } from '../../services/pessoa/pessoa-service';
import { mensagemErroApi } from '../../shared/erro-api';
import { validarFuncionario } from '../../shared/validacoes-gestao';

interface FormFuncionario {
  idPessoa: number | null;
  cargo: string;
  dataAdmissao: string;
}

const CARGOS_SUGERIDOS = ['Atendente', 'Vendedor', 'Técnico', 'Caixa', 'Estoquista', 'Gerente'];

/**
 * Funcionários são pessoas já cadastradas (cliente) vinculadas à tabela funcionario.
 * O cadastro da pessoa é feito em "Cadastrar cliente" e aqui apenas se define o vínculo.
 */
@Component({
  selector: 'app-funcionarios',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './funcionarios.html',
  styleUrl: './funcionarios.css'
})
export class Funcionarios {
  private readonly funcionarioService = inject(FuncionarioService);
  private readonly pessoaService = inject(PessoaService);

  readonly cargosSugeridos = CARGOS_SUGERIDOS;
  readonly funcionarios = signal<Funcionario[]>([]);
  readonly pessoas = signal<PessoaResumo[]>([]);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly busca = signal('');
  readonly editandoId = signal<number | null>(null);
  readonly form = signal<FormFuncionario>({ idPessoa: null, cargo: '', dataAdmissao: this.dataHoje() });
  readonly tentou = signal(false);
  readonly mensagem = signal('');
  readonly mensagemErro = signal(false);

  // Pessoas que ainda não são funcionárias.
  readonly pessoasDisponiveis = computed(() => {
    const vinculadas = new Set(this.funcionarios().map(f => f.id));
    return this.pessoas().filter(p => !vinculadas.has(p.id));
  });

  readonly erros = computed(() => validarFuncionario({
    idPessoa: this.form().idPessoa,
    cargo: this.form().cargo,
    dataAdmissao: this.form().dataAdmissao
  }, this.editandoId() === null));

  readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    return this.funcionarios().filter(f =>
      !termo || [f.nome, f.cpf, f.email, f.cargo].some(v => v.toLocaleLowerCase('pt-BR').includes(termo)));
  });

  constructor() {
    this.carregar();
  }

  erro(campo: string): string {
    return this.tentou() ? (this.erros()[campo] ?? '') : '';
  }

  carregar(): void {
    this.carregando.set(true);
    forkJoin({
      funcionarios: this.funcionarioService.listar(),
      pessoas: this.pessoaService.listarResumo()
    }).pipe(finalize(() => this.carregando.set(false))).subscribe({
      next: ({ funcionarios, pessoas }) => {
        this.funcionarios.set(funcionarios);
        this.pessoas.set(pessoas);
      },
      error: erro => this.falhar(mensagemErroApi(erro, 'carregar os funcionários'))
    });
  }

  salvar(): void {
    this.tentou.set(true);
    this.mensagem.set('');
    if (Object.keys(this.erros()).length > 0) {
      this.falhar('Corrija os campos destacados antes de salvar.');
      return;
    }

    const f = this.form();
    const id = this.editandoId();
    this.salvando.set(true);

    if (id !== null) {
      this.funcionarioService.alterar(id, { cargo: f.cargo.trim(), dataAdmissao: f.dataAdmissao })
        .pipe(finalize(() => this.salvando.set(false)))
        .subscribe({
          next: () => this.concluir('Funcionário atualizado com sucesso.'),
          error: erro => this.falhar(mensagemErroApi(erro, 'atualizar o funcionário'))
        });
      return;
    }

    const pessoa = this.pessoas().find(p => p.id === f.idPessoa);
    this.funcionarioService.criar({
      idPessoa: Number(f.idPessoa),
      cpf: pessoa?.cpf ?? '',
      cargo: f.cargo.trim(),
      dataAdmissao: f.dataAdmissao
    }).pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => this.concluir('Funcionário cadastrado com sucesso.'),
      error: erro => this.falhar(mensagemErroApi(erro, 'cadastrar o funcionário'))
    });
  }

  editar(funcionario: Funcionario): void {
    this.editandoId.set(funcionario.id);
    this.form.set({
      idPessoa: funcionario.id,
      cargo: funcionario.cargo,
      dataAdmissao: funcionario.dataAdmissao || this.dataHoje()
    });
    this.tentou.set(false);
    this.sucesso(`Editando ${funcionario.nome}. Pessoa e CPF não podem ser trocados aqui.`);
  }

  cancelar(exibirAviso = true): void {
    this.editandoId.set(null);
    this.form.set({ idPessoa: null, cargo: '', dataAdmissao: this.dataHoje() });
    this.tentou.set(false);
    if (exibirAviso) this.sucesso('Edição cancelada.');
  }

  excluir(funcionario: Funcionario): void {
    if (!confirm(`Remover ${funcionario.nome} da lista de funcionários? O cadastro da pessoa será mantido.`)) return;

    this.funcionarioService.excluir(funcionario.id).subscribe({
      next: () => {
        if (this.editandoId() === funcionario.id) this.cancelar(false);
        this.sucesso('Funcionário removido. O cadastro da pessoa foi mantido.');
        this.carregar();
      },
      error: erro => this.falhar(mensagemErroApi(erro, 'excluir o funcionário'))
    });
  }

  nomePessoaSelecionada(): string {
    const p = this.pessoas().find(x => x.id === this.form().idPessoa);
    return p ? `${p.nome} — CPF ${p.cpf}` : '';
  }

  private concluir(texto: string): void {
    this.sucesso(texto);
    this.cancelar(false);
    this.carregar();
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
