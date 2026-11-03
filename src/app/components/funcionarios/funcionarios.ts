import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Funcionario } from '../../models/gestao/gestao';
import { GestaoLocalService } from '../../services/gestao/gestao-local';
import { cpfValido, emailValido, somenteDigitos, telefoneValido } from '../../shared/validadores';

@Component({
  selector: 'app-funcionarios',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './funcionarios.html',
  styleUrl: './funcionarios.css'
})
export class Funcionarios {
  readonly funcionarios = signal<Funcionario[]>([]);
  readonly busca = signal('');
  readonly mensagem = signal('');
  readonly erro = signal(false);
  readonly editandoId = signal<number | null>(null);
  readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    return this.funcionarios().filter(item =>
      !termo || [item.nome, item.cpf, item.email, item.cargo].some(valor =>
        valor.toLocaleLowerCase('pt-BR').includes(termo)
      )
    );
  });

  nome = '';
  cpf = '';
  email = '';
  telefone = '';
  cargo = '';
  readonly hoje = this.dataAtual();
  dataAdmissao = this.hoje;
  ativo = true;

  constructor(private gestao: GestaoLocalService) {
    this.carregar();
  }

  carregar(): void {
    this.funcionarios.set(this.gestao.listarFuncionarios());
  }

  salvar(): void {
    this.mensagem.set('');
    this.erro.set(false);

    const nome = this.nome.trim();
    const cpfLimpo = somenteDigitos(this.cpf);
    const email = this.email.trim().toLowerCase();
    const telefoneLimpo = somenteDigitos(this.telefone);
    const cargo = this.cargo.trim();
    const dataAdmissao = this.dataAdmissao;

    if (nome.length < 3 || !cpfValido(cpfLimpo) || !emailValido(email) ||
        !telefoneValido(telefoneLimpo) || cargo.length < 2 ||
        !dataAdmissao || dataAdmissao > this.dataAtual()) {
      this.falhar('Preencha todos os campos corretamente. Confira CPF, e-mail, telefone e data de admissão.');
      return;
    }

    const cpfDuplicado = this.funcionarios().some(item =>
      item.cpf === cpfLimpo && item.id !== this.editandoId()
    );
    if (cpfDuplicado) {
      this.falhar('Já existe um funcionário cadastrado com este CPF.');
      return;
    }

    const dados = { nome, cpf: cpfLimpo, email, telefone: telefoneLimpo, cargo, dataAdmissao, ativo: this.ativo };
    const idEmEdicao = this.editandoId();
    if (idEmEdicao === null) {
      this.gestao.salvarFuncionario(dados);
      this.mensagem.set('Funcionário cadastrado com sucesso neste navegador.');
    } else {
      this.gestao.atualizarFuncionario({ ...dados, id: idEmEdicao });
      this.mensagem.set('Cadastro do funcionário atualizado.');
    }

    this.carregar();
    this.limparFormulario();
  }

  editar(funcionario: Funcionario): void {
    this.editandoId.set(funcionario.id);
    this.nome = funcionario.nome;
    this.cpf = funcionario.cpf;
    this.email = funcionario.email;
    this.telefone = funcionario.telefone;
    this.cargo = funcionario.cargo;
    this.dataAdmissao = funcionario.dataAdmissao;
    this.ativo = funcionario.ativo;
    this.mensagem.set('Editando o cadastro selecionado.');
    this.erro.set(false);
  }

  excluir(funcionario: Funcionario): void {
    if (!confirm(`Deseja excluir o funcionário ${funcionario.nome}?`)) return;
    this.gestao.excluirFuncionario(funcionario.id);
    this.carregar();
    if (this.editandoId() === funcionario.id) this.limparFormulario();
    this.mensagem.set('Funcionário excluído deste navegador.');
    this.erro.set(false);
  }

  cancelarEdicao(): void {
    this.limparFormulario();
    this.mensagem.set('Edição cancelada.');
    this.erro.set(false);
  }

  private limparFormulario(): void {
    this.editandoId.set(null);
    this.nome = '';
    this.cpf = '';
    this.email = '';
    this.telefone = '';
    this.cargo = '';
    this.dataAdmissao = this.hoje;
    this.ativo = true;
  }

  private dataAtual(): string {
    const agora = new Date();
    const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private falhar(texto: string): void {
    this.mensagem.set(texto);
    this.erro.set(true);
  }
}
