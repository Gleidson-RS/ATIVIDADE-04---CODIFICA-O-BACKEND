import { Injectable } from '@angular/core';
import { Pessoas } from '../../models/pessoas/pessoa';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  // Exclui um cliente pelo ID
  excluirCliente(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}${id}`, { responseType: 'text' });
  }
}
