import { Injectable } from '@angular/core';
import { Pessoas } from '../../models/pessoas/pessoa';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, switchMap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private readonly apiUrl =
    'https://localhost:7077/api/PessoaEndereco/';

  constructor(private http: HttpClient) {}

  // Lista todos os clientes
  listarClientes(): Observable<Pessoas[]> {
    return this.http.get<Pessoas[]>(this.apiUrl);
  }

  // Consulta um cliente pelo ID
  consultarCliente(id: number): Observable<Pessoas> {
    return this.http.get<Pessoas>(`${this.apiUrl}${id}`);
  }

  // Edita os dados de um cliente existente
  editarCliente(id: number, cliente: unknown): Observable<string> {
    return this.http.put(`${this.apiUrl}${id}`, cliente, { responseType: 'text' });
  }

  // DELETE simples (a API dá 500 se a pessoa ainda tiver endereços)
  private deletar(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}${id}`, { responseType: 'text' });
  }

  // Exclui o cliente SEM precisar alterar o back-end:
  // 1) PUT sem endereços (a API remove os que não vierem no corpo)
  // 2) DELETE da pessoa, que agora não tem mais endereços
  // 3) Se o DELETE falhar, tenta devolver os endereços (rollback)
  excluirCliente(cliente: any): Observable<string> {
    const id = Number(cliente.id);
    const dataNasc = String(cliente.datanascimento ?? '').substring(0, 10);

    const base = {
      id,
      idPessoa: id,
      nome: cliente.nome,
      CPF: String(cliente.CPF ?? ''),
      datanascimento: dataNasc,
      sexo: cliente.sexo,
      email: cliente.email,
      telefone: String(cliente.telefone ?? ''),
      AtivoPessoa: cliente.AtivoPessoa
    };

    // Endereços sem id: se precisar restaurar, entram como novos
    const enderecosOriginais = (cliente.Enderecos ?? []).map((e: any) => ({
      CEP: String(e.cep ?? e.CEP ?? '').replace(/\D/g, ''),
      numero: String(e.numero ?? ''),
      complemento: e.complemento ?? ''
    }));

    return this.editarCliente(id, { ...base, Enderecos: [] }).pipe(
      switchMap(() =>
        this.deletar(id).pipe(
          catchError((erroDelete) =>
            this.editarCliente(id, { ...base, Enderecos: enderecosOriginais }).pipe(
              catchError(() => of('')),
              switchMap(() => throwError(() => erroDelete))
            )
          )
        )
      )
    );
  }
}
