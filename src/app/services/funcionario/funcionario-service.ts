import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Funcionario {
  idPessoa?: number;
  idpessoa?: number;
  nome?: string;
  cargo: string;
  dataAdmissao: string;
}

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {

  private apiUrl = 'https://localhost:7077/api/Funcionario';

  constructor(private http: HttpClient) {}

  listarFuncionarios(): Observable<Funcionario[]> {
    return this.http.get<Funcionario[]>(this.apiUrl);
  }

  buscarFuncionario(id: number): Observable<Funcionario> {
    return this.http.get<Funcionario>(`${this.apiUrl}/${id}`);
  }

  adicionarFuncionario(funcionario: Funcionario): Observable<any> {
    return this.http.post(this.apiUrl, funcionario);
  }

  alterarFuncionario(id: number, funcionario: Funcionario): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, funcionario);
  }

  excluirFuncionario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}