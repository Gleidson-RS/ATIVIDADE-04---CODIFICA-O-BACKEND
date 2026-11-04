import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovimentoEstoque } from '../../models/gestao/gestao';

export interface EntradaEstoqueDados {
  idItem: number;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
}

// Formato de GET /api/Estoque/movimentacoes (MovimentoEstoqueDTO).
interface MovimentoApi {
  tipo?: string;
  data?: string;
  idItem?: number;
  produto?: string | null;
  quantidade?: number;
  valorUnitario?: number;
  referencia?: string | null;
}

/** Entradas de produto e histórico do estoque (entradas e baixas automáticas). */
@Injectable({ providedIn: 'root' })
export class EstoqueService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Estoque`;

  constructor(private http: HttpClient) {}

  registrarEntrada(dados: EntradaEstoqueDados): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/entrada`, dados);
  }

  listarMovimentos(): Observable<MovimentoEstoque[]> {
    return this.http.get<MovimentoApi[]>(`${this.apiUrl}/movimentacoes`).pipe(
      map(lista => (lista ?? []).map(m => ({
        tipo: m.tipo === 'Baixa' ? 'Baixa' as const : 'Entrada' as const,
        data: String(m.data ?? '').substring(0, 10),
        idItem: Number(m.idItem ?? 0),
        produto: String(m.produto ?? ''),
        quantidade: Number(m.quantidade ?? 0),
        valorUnitario: Number(m.valorUnitario ?? 0),
        referencia: String(m.referencia ?? '')
      })))
    );
  }
}
