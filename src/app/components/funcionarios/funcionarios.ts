import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Pessoas } from '../../models/pessoas/pessoa';
import { Enderecos } from '../../models/enderecos/enderecos';

import { Funcionario } from '../../models/gestao/gestao';
import { FuncionarioService } from '../../services/funcionario/funcionario-service';
import { PessoaService } from '../../services/pessoa/pessoa-service'; 

import { somenteDigitos } from '../../shared/validadores';

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

  // A API devolve camelCase (idPessoa, cpf, dataNascimento...). Normaliza para uso interno.
  private normalizar(p: any): { id: number; nome: string; cpf: string; email: string; telefone: string; ativo: string } {
    return {
      id: Number(p?.idPessoa ?? p?.idpessoa ?? p?.IdPessoa ?? p?.id),
      nome: String(p?.nome ?? ''),
      cpf: somenteDigitos(String(p?.cpf ?? p?.CPF ?? '')),
      email: String(p?.email ?? ''),
      telefone: somenteDigitos(String(p?.telefone ?? '')),
      ativo: String(p?.ativoPessoa ?? p?.AtivoPessoa ?? 'S')
    };
  }

  carregar(): void {
    forkJoin({
      funcionarios: this.funcionarioService.listarFuncionarios(),
      pessoas: this.pessoaService.listarPessoas()
    }).subscribe({
      next: ({ funcionarios, pessoas }) => {

        const base = pessoas.map(p => this.normalizar(p));

        const lista: Funcionario[] = funcionarios.map((item: any) => {
          const dadosFunc = this.normalizar(item);
          const idPessoa = dadosFunc.id;
          const pessoa = base.find(p => p.id === idPessoa);

          return {
            id: idPessoa,
            nome: pessoa?.nome || dadosFunc.nome,
            cpf: pessoa?.cpf || dadosFunc.cpf,
            email: pessoa?.email || dadosFunc.email,
            telefone: pessoa?.telefone || dadosFunc.telefone,
            cargo: item.cargo,
            dataAdmissao: item.dataAdmissao?.substring(0, 10) ?? '',
            ativo: (pessoa?.ativo ?? dadosFunc.ativo).toUpperCase() === 'S'
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

  // MODO DE TESTE: sem verificações de CPF, e-mail, telefone, datas ou duplicidade.
  //  - Editando: substitui cargo/data de admissão.
  //  - Novo: se já existe pessoa com o mesmo CPF *e* mesmo nome, reutiliza essa pessoa
  //    (e, se ela já for funcionária, o registro é substituído).
  //    Se não existe (ou o nome é outro), cadastra uma nova pessoa, mesmo repetindo o CPF.
  salvar(): void {
    this.mensagem.set('');
    this.erro.set(false);

    const nome = this.nome.trim();
    const cpfLimpo = somenteDigitos(this.cpf);
    const cargo = this.cargo.trim();
    const dataAdmissao = this.dataAdmissao;

    const idEmEdicao = this.editandoId();

    if (idEmEdicao !== null) {
      this.gravarFuncionario(idEmEdicao, cpfLimpo, cargo, dataAdmissao, true,
        'Funcionário atualizado com sucesso no banco de dados.');
      return;
    }

    this.pessoaService.listarPessoas().subscribe({
      next: pessoas => {
        const existente = pessoas.map(p => this.normalizar(p)).find(p =>
          p.cpf === cpfLimpo &&
          p.nome.trim().toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR')
        );

        if (existente) {
          const jaFuncionario = this.funcionarios().some(f => f.id === existente.id);
          this.gravarFuncionario(existente.id, cpfLimpo, cargo, dataAdmissao, jaFuncionario,
            jaFuncionario
              ? 'Funcionário já existia: dados substituídos.'
              : 'Funcionário cadastrado com sucesso no banco de dados.');
          return;
        }

        // Não existe: cria uma nova pessoa (mesmo que o CPF já exista com outro nome).
        const pessoa = new Pessoas();
        pessoa.nome = nome;
        pessoa.CPF = cpfLimpo;
        pessoa.datanascimento = '2000-01-01';
        pessoa.sexo = 'O';
        pessoa.email = this.email.trim();
        pessoa.telefone = somenteDigitos(this.telefone);
        pessoa.AtivoPessoa = this.ativo ? 'S' : 'N';
        pessoa.Enderecos = [new Enderecos()];

        this.pessoaService.adicionarPessoa(pessoa).subscribe({
          next: () => {
            // A API pode não devolver o id: busca a pessoa recém-criada (maior id com esse CPF/nome).
            this.pessoaService.listarPessoas().subscribe({
              next: lista => {
                const criada = lista
                  .map(p => this.normalizar(p))
                  .filter(p => p.cpf === cpfLimpo && p.nome.trim() === nome)
                  .sort((a, b) => b.id - a.id)[0];

                if (!criada) {
                  this.falhar('A pessoa foi criada, mas não foi possível localizá-la para vincular como funcionário.');
                  return;
                }

                this.gravarFuncionario(criada.id, cpfLimpo, cargo, dataAdmissao, false,
                  'Funcionário cadastrado com sucesso no banco de dados.');
              },
              error: erro => {
                console.error('Erro ao consultar pessoas:', erro);
                this.falhar('Não foi possível consultar as pessoas cadastradas.');
              }
            });
          },
          error: erro => {
            console.error('Erro ao cadastrar pessoa:', erro);
            this.falhar('Não foi possível cadastrar a pessoa do funcionário.');
          }
        });
      },

      error: erro => {
        console.error('Erro ao consultar pessoas:', erro);
        this.falhar('Não foi possível consultar as pessoas cadastradas.');
      }
    });
  }

  // substituir = true → PUT (já existe); false → POST (não existe). Se o POST bater em
  // conflito (já era funcionário), cai para PUT e substitui.
  private gravarFuncionario(
    idpessoa: number,
    cpf: string,
    cargo: string,
    dataAdmissao: string,
    substituir: boolean,
    textoSucesso: string
  ): void {
    const dados = { idpessoa, idPessoa: idpessoa, cpf, cargo, dataAdmissao };

    const concluir = () => {
      this.mensagem.set(textoSucesso);
      this.erro.set(false);
      this.carregar();
      this.limparFormulario();
    };

    const falha = (erro: any) => {
      console.error('Erro ao gravar funcionário:', erro);
      const corpo = erro?.error;
      const campos = corpo?.errors
        ? Object.entries(corpo.errors).map(([k, v]) => `${k}: ${[v].flat().join(' ')}`).join(' | ')
        : '';
      const detalhe = typeof corpo === 'string' ? corpo : (campos || corpo?.mensagem || corpo?.title || '');
      this.falhar(`Não foi possível gravar o funcionário (HTTP ${erro?.status ?? '?'}). ${detalhe}`.trim());
    };

    if (substituir) {
      this.funcionarioService.alterarFuncionario(idpessoa, dados)
        .subscribe({ next: concluir, error: falha });
      return;
    }

    this.funcionarioService.adicionarFuncionario(dados).subscribe({
      next: concluir,
      error: erro => {
        if ((erro as { status?: number })?.status === 409) {
          this.funcionarioService.alterarFuncionario(idpessoa, dados)
            .subscribe({ next: concluir, error: falha });
          return;
        }
        falha(erro);
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
