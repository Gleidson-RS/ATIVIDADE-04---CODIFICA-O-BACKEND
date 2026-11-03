import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Funcionario } from '../../models/gestao/gestao';
import { FuncionarioService } from '../../services/funcionario/funcionario-service';
import { PessoaService } from '../../services/pessoa/pessoa-service'; 

import {
  cpfValido,
  emailValido,
  somenteDigitos,
  telefoneValido
} from '../../shared/validadores';

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
      !termo || [
        item.nome,
        item.cpf,
        item.email,
        item.cargo
      ].some(valor =>
        String(valor ?? '').toLocaleLowerCase('pt-BR').includes(termo)
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

  constructor(
    private funcionarioService: FuncionarioService,
    private pessoaService: PessoaService
  ) {
    this.carregar();
  }

  carregar(): void {
    forkJoin({
      funcionarios: this.funcionarioService.listarFuncionarios(),
      pessoas: this.pessoaService.listarPessoas()
    }).subscribe({
      next: ({ funcionarios, pessoas }) => {

        const lista: Funcionario[] = funcionarios.map(item => {

          const idPessoa = Number(item.idPessoa ?? item.idpessoa);

          const pessoa = pessoas.find(
            p => Number(p.id) === idPessoa
          );

          return {
            id: idPessoa,
            nome: pessoa?.nome ?? item.nome ?? '',
            cpf: somenteDigitos(String(pessoa?.CPF ?? '')),
            email: pessoa?.email ?? '',
            telefone: somenteDigitos(String(pessoa?.telefone ?? '')),
            cargo: item.cargo,
            dataAdmissao: item.dataAdmissao?.substring(0, 10) ?? '',
            ativo: String(pessoa?.AtivoPessoa ?? 'S').toUpperCase() === 'S'
          };
        });

        this.funcionarios.set(lista);
      },

      error: erro => {
        console.error('Erro ao carregar funcionários:', erro);
        this.falhar('Não foi possível carregar os funcionários. Verifique se a API está funcionando.');
      }
    });
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

    if (
      nome.length < 3 ||
      cpfLimpo.length !== 11 ||
      !emailValido(email) ||
      !telefoneValido(telefoneLimpo) ||
      cargo.length < 2 ||
      !dataAdmissao ||
      dataAdmissao > this.dataAtual()
    ) {
      this.falhar(
        'Preencha todos os campos corretamente. Confira CPF, e-mail, telefone e data de admissão.'
      );
      return;
    }

    const cpfDuplicado = this.funcionarios().some(item =>
      item.cpf === cpfLimpo && item.id !== this.editandoId()
    );

    if (cpfDuplicado) {
      this.falhar('Esta pessoa já está cadastrada como funcionário.');
      return;
    }

    const idEmEdicao = this.editandoId();

    if (idEmEdicao !== null) {

      this.funcionarioService.alterarFuncionario(idEmEdicao, {
        idpessoa: idEmEdicao,
        cargo,
        dataAdmissao
      }).subscribe({
        next: () => {
          this.mensagem.set('Funcionário atualizado com sucesso no banco de dados.');
          this.carregar();
          this.limparFormulario();
        },
        error: erro => {
          console.error('Erro ao atualizar funcionário:', erro);
          this.falhar('Não foi possível atualizar o funcionário.');
        }
      });

      return;
    }

    // Localiza uma pessoa já cadastrada pelo CPF.
    this.pessoaService.listarPessoas().subscribe({
      next: pessoas => {

        const pessoaEncontrada = pessoas.find(p =>
          somenteDigitos(String(p.CPF ?? '')) === cpfLimpo
        );

        if (!pessoaEncontrada) {
          this.falhar(
            'Pessoa não encontrada. Cadastre primeiro essa pessoa no sistema de clientes.'
          );
          return;
        }

        this.funcionarioService.adicionarFuncionario({
          idpessoa: pessoaEncontrada.id,
          cargo,
          dataAdmissao
        }).subscribe({
          next: () => {
            this.mensagem.set('Funcionário cadastrado com sucesso no banco de dados.');
            this.carregar();
            this.limparFormulario();
          },
          error: erro => {
            console.error('Erro ao cadastrar funcionário:', erro);
            this.falhar(
              'Não foi possível cadastrar o funcionário. Verifique se essa pessoa já está cadastrada como funcionário.'
            );
          }
        });
      },

      error: erro => {
        console.error('Erro ao consultar pessoas:', erro);
        this.falhar('Não foi possível consultar as pessoas cadastradas.');
      }
    });
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
    if (!confirm(`Deseja excluir o funcionário ${funcionario.nome}?`)) {
      return;
    }

    this.funcionarioService.excluirFuncionario(funcionario.id).subscribe({
      next: () => {
        this.carregar();

        if (this.editandoId() === funcionario.id) {
          this.limparFormulario();
        }

        this.mensagem.set('Funcionário excluído do banco de dados.');
        this.erro.set(false);
      },

      error: erro => {
        console.error('Erro ao excluir funcionário:', erro);
        this.falhar(
          'Não foi possível excluir o funcionário. Verifique se existem atendimentos vinculados a ele.'
        );
      }
    });
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

    const local = new Date(
      agora.getTime() - agora.getTimezoneOffset() * 60000
    );

    return local.toISOString().slice(0, 10);
  }

  private falhar(texto: string): void {
    this.mensagem.set(texto);
    this.erro.set(true);
  }
}