import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria } from '../../models/gestao/gestao';

// Formato retornado por GET /api/Categorium (schema Categorium do Swagger).
export interface CategoriaApi {
  idcategoria?: number;
  idCategoria?: number;
  categoria?: string | null;
  items?: unknown[] | null;
}

/** Acesso à tabela categoria pela API Categorium. */
@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Categorium`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Categoria[]> {
    return this.http.get<CategoriaApi[]>(this.apiUrl).pipe(
      map(lista => (lista ?? [])
        .map(c => ({
          id: Number(c.idcategoria ?? c.idCategoria ?? 0),
          nome: String(c.categoria ?? '').trim(),
          totalItens: c.items?.length ?? 0
        }))
        .filter(c => c.id > 0)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
    );
  }

  // A tabela categoria não tem AUTO_INCREMENT: o identificador é informado pelo cliente.
  criar(id: number, nome: string): Observable<unknown> {
    return this.http.post(this.apiUrl, { idcategoria: id, categoria: nome, items: [] });
  }

  atualizar(id: number, nome: string): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/${id}`, { idcategoria: id, categoria: nome, items: [] }, { responseType: 'text' });
  }

  excluir(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
}
