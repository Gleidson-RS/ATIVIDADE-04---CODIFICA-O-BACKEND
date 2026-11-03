import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Funcionario } from '../../models/gestao/gestao';

/** Formato devolvido pelo endpoint /api/Funcionario. */
interface FuncionarioApi {
  idPessoa?: number;
  idpessoa?: number;
  Idpessoa?: number;
  nome?: string | null;
  cpf?: string | number | null;
  email?: string | null;
  telefone?: string | number | null;
  ativoPessoa?: string | null;
  cargo?: string | null;
  dataAdmissao?: string | null;
  data_admissao?: string | null;
}

export interface NovoFuncionarioApi {
  cpf: string;
  cargo: string;
  dataAdmissao: string;
}

export interface AtualizarFuncionarioApi {
  cargo: string;
  dataAdmissao: string;
}

@Injectable({ providedIn: 'root' })
export class FuncionarioService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Funcionario`;

  constructor(private http: HttpClient) {}

  listarFuncionarios(): Observable<Funcionario[]> {
    return this.http.get<FuncionarioApi[]>(this.apiUrl).pipe(
      map(registros => (registros ?? []).map(item => this.converter(item)))
    );
  }

  adicionarFuncionario(dados: NovoFuncionarioApi): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl, dados);
  }

  atualizarFuncionario(
    idPessoa: number,
    dados: AtualizarFuncionarioApi
  ): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${idPessoa}`, dados);
  }

  excluirFuncionario(idPessoa: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idPessoa}`);
  }

  private converter(item: FuncionarioApi): Funcionario {
    const statusPessoa = String(item.ativoPessoa ?? 'S').trim().toUpperCase();

    return {
      id: Number(item.idPessoa ?? item.idpessoa ?? item.Idpessoa ?? 0),
      nome: String(item.nome ?? ''),
      cpf: String(item.cpf ?? '').replace(/\D/g, '').padStart(11, '0'),
      email: String(item.email ?? ''),
      telefone: String(item.telefone ?? ''),
      cargo: String(item.cargo ?? ''),
      dataAdmissao: String(item.dataAdmissao ?? item.data_admissao ?? ''),
      ativo: !['N', '0', 'FALSE', 'INATIVO', 'INACTIVE'].includes(statusPessoa)
    };
  }
}
