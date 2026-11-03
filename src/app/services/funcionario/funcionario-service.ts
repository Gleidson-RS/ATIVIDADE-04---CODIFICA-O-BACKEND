import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FuncionarioApi {
  idPessoa?: number;
  idpessoa?: number;
  nome?: string;
  cargo: string;
  dataAdmissao: string;
}

export interface FuncionarioCadastroApi {
  idpessoa: number;
  cargo: string;
  dataAdmissao: string;
}

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {

  private readonly apiUrl = `${environment.apiBaseUrl}/Funcionario`;

  constructor(private http: HttpClient) {}

  listarFuncionarios(): Observable<FuncionarioApi[]> {
    return this.http.get<FuncionarioApi[]>(this.apiUrl);
  }

  buscarFuncionario(id: number): Observable<FuncionarioApi> {
    return this.http.get<FuncionarioApi>(`${this.apiUrl}/${id}`);
  }

  adicionarFuncionario(dados: FuncionarioCadastroApi): Observable<unknown> {
    return this.http.post(this.apiUrl, dados);
  }

  alterarFuncionario(
    id: number,
    dados: FuncionarioCadastroApi
  ): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/${id}`, dados);
  }

  excluirFuncionario(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}