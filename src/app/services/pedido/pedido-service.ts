import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatusPedido } from '../../models/gestao/gestao';

// Formato de GET /api/Atendimento (AtendimentoDTO).
export interface AtendimentoItemApi {
  idAtendimento?: number;
  idItem?: number;
  item?: string | null;
  idFuncionario?: number;
  nomeFuncionario?: string | null;
  cargo?: string | null;
  quantidade?: number;
  valorUnitario?: number;
}

export interface AtendimentoApi {
  idAtendimento?: number;
  idPessoa?: number;
  nomePessoa?: string | null;
  dataAtendimento?: string;
  statusAtendimento?: string | null;
  itens?: AtendimentoItemApi[] | null;
}

/** Corpo de POST /api/Pedido (mesmo formato de AtendimentoAddPutDTO). */
export interface PedidoNovo {
  idPessoa: number;
  dataAtendimento: string;
  itens: Array<{ idItem: number; idFuncionario: number; quantidade: number; valorUnitario: number }>;
}

export interface PedidoCriado {
  idAtendimento: number;
  idPessoa: number;
  dataAtendimento: string;
  statusAtendimento: string;
  total: number;
}

/** Pedidos e atendimentos: criação com baixa automática de estoque e mudança de status. */
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly apiBase = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  listar(): Observable<AtendimentoApi[]> {
    return this.http.get<AtendimentoApi[]>(`${this.apiBase}/Atendimento`);
  }

  criar(dados: PedidoNovo): Observable<PedidoCriado> {
    const corpo = {
      idAtendimento: 0,
      idPessoa: dados.idPessoa,
      dataAtendimento: dados.dataAtendimento,
      statusAtendimento: 'P',
      itens: dados.itens.map(i => ({ idAtendimento: 0, ...i }))
    };
    return this.http.post<PedidoCriado>(`${this.apiBase}/Pedido`, corpo);
  }

  alterarStatus(id: number, status: Exclude<StatusPedido, 'P'>): Observable<unknown> {
    return this.http.put(`${this.apiBase}/Pedido/${id}/status`, { statusAtendimento: status }, { responseType: 'text' });
  }

  /** Total de um pedido somando quantidade × valor unitário de cada linha. */
  total(pedido: AtendimentoApi): number {
    return (pedido.itens ?? []).reduce(
      (soma, i) => soma + Number(i.quantidade ?? 0) * Number(i.valorUnitario ?? 0), 0);
  }

  rotuloStatus(valor: string | null | undefined): string {
    const status = String(valor ?? '').trim().toUpperCase();
    if (status === 'P') return 'Pendente';
    if (status === 'F') return 'Concluído';
    if (status === 'C') return 'Cancelado';
    return status || 'Não informado';
  }
}
