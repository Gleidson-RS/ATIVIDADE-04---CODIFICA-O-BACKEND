
import { Injectable } from '@angular/core';
import { Pessoas } from '../../models/pessoas/pessoa';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PessoaService {

  private readonly apiUrl =
    'https://localhost:7077/api/PessoaEndereco/';

  constructor(private http: HttpClient) {}

  listarPessoas(): Observable<Pessoas[]> {
    return this.http.get<Pessoas[]>(this.apiUrl);
  }

  listarPessoa(id: number): Observable<Pessoas> {
    return this.http.get<Pessoas>(`${this.apiUrl}${id}`);
  }

  adicionarPessoa(pessoa: Pessoas): Observable<Pessoas> {
    return this.http.post<Pessoas>(this.apiUrl, pessoa);
  }

  // responseType 'text': se a API devolver 204 / texto simples em vez de JSON,
  // o HttpClient não dá erro de parse e o "next" é chamado normalmente.
  excluirPessoa(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}${id}`, { responseType: 'text' });
  }

  alterarPessoa(id: number, pessoa: unknown): Observable<string> {
    return this.http.put(`${this.apiUrl}${id}`, pessoa, { responseType: 'text' });
  }

  calcularIdade(datanascimento: string): number {
    if (!datanascimento) return 0;

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

  limpapessoa(): Pessoas {
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
