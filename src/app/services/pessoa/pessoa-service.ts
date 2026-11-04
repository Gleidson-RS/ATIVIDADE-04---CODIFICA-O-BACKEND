import { Injectable } from '@angular/core';
import { Pessoas } from '../../models/pessoas/pessoa';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { somenteDigitos } from '../../shared/validadores';

// O CPF é gravado como número (bigint): zeros à esquerda somem e precisam ser recompostos.
function normalizarCpf(valor: unknown): string {
  const digitos = somenteDigitos(valor);
  return digitos ? digitos.padStart(11, '0') : '';
}

/** Pessoa resumida para listas de seleção (funcionário, cliente do pedido). */
export interface PessoaResumo {
  id: number;
  nome: string;
  cpf: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class PessoaService {

  private readonly apiUrl = `${environment.apiBaseUrl}/PessoaEndereco/`;

  constructor(private http: HttpClient) {}

  listarPessoas(): Observable<Pessoas[]> {
    return this.http.get<Pessoas[]>(this.apiUrl);
  }

  /** Lista resumida e ordenada por nome, usando o id que a API devolve (idPessoa). */
  listarResumo(): Observable<PessoaResumo[]> {
    return this.listarPessoas().pipe(
      map(lista => ((lista ?? []) as any[])
        .map(p => ({
          id: Number(p.idPessoa ?? p.id ?? p.IdPessoa ?? 0),
          nome: String(p.nome ?? ''),
          cpf: normalizarCpf(p.cpf ?? p.CPF),
          email: String(p.email ?? '')
        }))
        .filter(p => p.id > 0)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
    );
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
