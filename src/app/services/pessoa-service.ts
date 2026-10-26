
import { Injectable } from '@angular/core';
import { Pessoas } from '../models/pessoas/pessoa';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PessoaService {

  private readonly apiUrl = 'https://localhost:7077/api/PessoaEndereco/';

  constructor(private http: HttpClient) { }

  // Listar todas as pessoas
  listarPessoas(): Observable<Pessoas[]> {
    return this.http.get<Pessoas[]>(this.apiUrl);
  }

  // Listar uma pessoa pelo ID
  listarPessoa(id: number): Observable<Pessoas> {
    const urlApi = `${this.apiUrl}${id}`;
    return this.http.get<Pessoas>(urlApi);
  }

  // Adicionar uma pessoa
  adicionarPessoa(pessoa: Pessoas): Observable<Pessoas> {
    return this.http.post<Pessoas>(this.apiUrl, pessoa);
  }

  // Excluir uma pessoa pelo ID
  excluirPessoa(id: number): Observable<Pessoas> {
    const urlApi = `${this.apiUrl}${id}`;
    return this.http.delete<Pessoas>(urlApi);
  }

  // Alterar uma pessoa
  alterarPessoa(pessoa: Pessoas): Observable<Pessoas> {
    const urlApi = `${this.apiUrl}${pessoa.id}`;
    return this.http.put<Pessoas>(urlApi, pessoa);
  }

  // Calcular idade
  calcularIdade(datanascimento: string): number {
    if (!datanascimento) {
      return 0;
    }

    const hoje = new Date();
    const nascimento = new Date(datanascimento);

    let idade = hoje.getFullYear() - nascimento.getFullYear();

    const mes = hoje.getMonth() - nascimento.getMonth();

    if (
      mes < 0 ||
      (mes === 0 && hoje.getDate() < nascimento.getDate())
    ) {
      idade--;
    }

    return idade;
  }

  // Criar objeto pessoa
  criarpessoa(
    id: number,
    nome: string,
    cpf: number,
    datanascimento: string,
    sexo: string,
    email: string,
    telefone: number
  ): Pessoas {

    const pessoa = new Pessoas();

    pessoa.id = id;
    pessoa.nome = nome;
    pessoa.CPF = cpf;
    pessoa.datanascimento = datanascimento;
    pessoa.sexo = sexo;
    pessoa.email = email;
    pessoa.telefone = telefone;

    return pessoa;
  }

  // Limpar pessoa
  limparpessoa(): Pessoas {
    const pessoa = new Pessoas();

    pessoa.id = 0;
    pessoa.nome = '';
    pessoa.CPF = 0;
    pessoa.datanascimento = '';
    pessoa.sexo = '';
    pessoa.email = '';
    pessoa.telefone = 0;

    return pessoa;
  }
}
