import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PessoaService } from '../../services/pessoa-service';
import { Pessoas } from '../../models/pessoas/pessoa';
import { Enderecos } from '../../models/enderecos/enderecos';

@Component({
  selector: 'app-cadastro',
  imports: [FormsModule],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css'
})
export class Cadastro {

  nome = '';
  CPF = 0;
  datanascimento = '';
  sexo = '';
  email = '';
  telefone = 0;
  AtivoPessoa = 'S';

  CEP = '';
  Numero = '';
  Complemento = '';

  constructor(private pessoaService: PessoaService) { }

  cadastrar(): void {

    const pessoa = new Pessoas();

    pessoa.nome = this.nome;
    pessoa.CPF = this.CPF;
    pessoa.datanascimento = this.datanascimento;
    pessoa.sexo = this.sexo;
    pessoa.email = this.email;
    pessoa.telefone = this.telefone;
    pessoa.AtivoPessoa = this.AtivoPessoa;

    const endereco = new Enderecos();

    endereco.CEP = this.CEP;
    endereco.numero = String(this.Numero);
    endereco.complemento = this.Complemento;

pessoa.Enderecos = [endereco];

console.log('CEP enviado:', pessoa.Enderecos[0].CEP);
console.log('Tamanho do CEP:', pessoa.Enderecos[0].CEP.length);
console.log('CEP:', JSON.stringify(pessoa.Enderecos[0].CEP));
console.log('Quantidade de caracteres:', pessoa.Enderecos[0].CEP.length);
console.log('Objeto enviado:', JSON.stringify(pessoa));

    this.pessoaService.adicionarPessoa(pessoa).subscribe({
      next: (resposta) => {
        console.log('Pessoa cadastrada com sucesso:', resposta);
        alert('Cadastro realizado com sucesso!');

        this.limparFormulario();
      },
      error: (erro) => {
        console.error('Erro ao cadastrar pessoa:', erro);
        console.error('Detalhes da API:', erro.error);
        alert('Erro ao realizar cadastro. Confira os dados e tente novamente.');
      }
    });
  }

  limparFormulario(): void {
    this.nome = '';
    this.CPF = 0;
    this.datanascimento = '';
    this.sexo = '';
    this.email = '';
    this.telefone = 0;
    this.AtivoPessoa = 'S';

    this.CEP = '';
    this.Numero = '';
    this.Complemento = '';
  }
}