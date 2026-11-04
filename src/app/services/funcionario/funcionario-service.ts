import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Funcionario } from '../../models/gestao/gestao';

// Formato de GET /api/Funcionario (FuncionarioRespostaDTO do back-end).
export interface FuncionarioApi {
  idPessoa?: number;
  nome?: string | null;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  ativoPessoa?: string | null;
  cargo?: string | null;
  dataAdmissao?: string | null;
}

export interface FuncionarioCadastro {
  idPessoa: number;
  cpf: string;
  cargo: string;
  dataAdmissao: string;
}

export interface FuncionarioAtualizacao {
  cargo: string;
  dataAdmissao: string;
}

/** Vínculo de funcionário (tabela funcionario) sobre uma pessoa já cadastrada. */
@Injectable({ providedIn: 'root' })
export class FuncionarioService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Funcionario`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Funcionario[]> {
    return this.http.get<FuncionarioApi[]>(this.apiUrl).pipe(
      map(lista => (lista ?? [])
        .map(f => ({
          id: Number(f.idPessoa ?? 0),
          nome: String(f.nome ?? ''),
          cpf: String(f.cpf ?? '').replace(/\D/g, ''),
          email: String(f.email ?? ''),
          telefone: String(f.telefone ?? '').replace(/\D/g, ''),
          cargo: String(f.cargo ?? ''),
          dataAdmissao: String(f.dataAdmissao ?? '').substring(0, 10),
          ativo: String(f.ativoPessoa ?? 'S').toUpperCase() === 'S'
        }))
        .filter(f => f.id > 0)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
    );
  }

  criar(dados: FuncionarioCadastro): Observable<unknown> {
    return this.http.post(this.apiUrl, dados);
  }

  alterar(id: number, dados: FuncionarioAtualizacao): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/${id}`, dados, { responseType: 'text' });
  }

  excluir(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
}
