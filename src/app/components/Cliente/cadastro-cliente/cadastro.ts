import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PessoaService } from '../../../services/pessoa/pessoa-service';
import { Pessoas } from '../../../models/pessoas/pessoa';
import { Enderecos } from '../../../models/enderecos/enderecos';
import { somenteDigitos, validarCliente } from '../../../shared/validadores';
import { mensagemErroApi } from '../../../shared/erro-api';

@Component({
  selector: 'app-cadastro',
  imports: [FormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css'
})
export class Cadastro {

  nome = '';
  CPF = '';
  datanascimento = '';
  sexo = '';
  email = '';
  telefone = '';
  AtivoPessoa = 'S';

  CEP = '';
  Numero = '';
  Complemento = '';

  // Sem zone.js, o estado exibido após a resposta da API fica em signals.
  enviando = signal(false);
  mensagem = signal('');
  erroGeral = signal(false);
  tocados = signal<Record<string, boolean>>({});

  readonly hoje = new Date().toISOString().substring(0, 10);

  constructor(private pessoaService: PessoaService) { }

  // Mensagem de erro do campo (só aparece depois que o usuário interagiu com ele).
  erro(campo: string): string {
    if (!this.tocados()[campo]) return '';
    return validarCliente(this)[campo] ?? '';
  }

  tocar(campo: string): void {
    this.tocados.update(t => ({ ...t, [campo]: true }));
  }

  cadastrar(): void {
    if (this.enviando()) return;

    this.mensagem.set('');
    const erros = validarCliente(this);

    if (Object.keys(erros).length > 0) {
      const todos: Record<string, boolean> = {};
      Object.keys(erros).forEach(c => (todos[c] = true));
      this.tocados.update(t => ({ ...t, ...todos }));
      this.erroGeral.set(true);
      this.mensagem.set('Corrija os campos destacados antes de cadastrar.');
      return;
    }

    const pessoa = new Pessoas();
    pessoa.nome = this.nome.trim();
    pessoa.CPF = somenteDigitos(this.CPF);
    pessoa.datanascimento = this.datanascimento;
    pessoa.sexo = this.sexo;
    pessoa.email = this.email.trim();
    pessoa.telefone = somenteDigitos(this.telefone);
    pessoa.AtivoPessoa = this.AtivoPessoa;

    const endereco = new Enderecos();
    endereco.CEP = somenteDigitos(this.CEP); // a coluna do CEP aceita 8 caracteres
    endereco.numero = String(this.Numero).trim();
    endereco.complemento = this.Complemento;
    pessoa.Enderecos = [endereco];

    this.enviando.set(true);

    this.pessoaService.adicionarPessoa(pessoa)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => {
          this.limparFormulario();
          this.erroGeral.set(false);
          this.mensagem.set('Cadastro realizado com sucesso!');
        },
        error: (erro) => {
          console.error('Erro ao cadastrar pessoa:', erro);
          this.erroGeral.set(true);
          this.mensagem.set(mensagemErroApi(erro, 'realizar o cadastro'));
        }
      });
  }

  limparFormulario(): void {
    this.nome = '';
    this.CPF = '';
    this.datanascimento = '';
    this.sexo = '';
    this.email = '';
    this.telefone = '';
    this.AtivoPessoa = 'S';

    this.CEP = '';
    this.Numero = '';
    this.Complemento = '';
    this.tocados.set({});
  }
}
