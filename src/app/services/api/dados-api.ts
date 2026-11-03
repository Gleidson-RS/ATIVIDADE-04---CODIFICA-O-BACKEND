import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ItemCatalogo } from '../../models/gestao/gestao';
import { environment } from '../../../environments/environment';

/** Formato retornado por GET /api/Categorium, conforme o Swagger fornecido. */
interface CategoriaApi {
  idcategoria?: number;
  idCategoria?: number;
  categoria?: string | null;
  items?: ItemApi[] | null;
}

interface ItemApi {
  iditem?: number;
  idItem?: number;
  item1?: string | null;
  item?: string | null;
  descricaoItem?: string | null;
  preco?: number | null;
  tipoItem?: string | null;
  ativoProdutoServico?: string | null;
  produto?: ProdutoApi | null;
}

interface ProdutoApi {
  codigoPreco?: number;
  precoVenda?: number;
  unidade?: string | null;
  estoque?: EstoqueApi | null;
}

interface EstoqueApi {
  quantidadeEstoque?: number;
}

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

export interface AtendimentoNovoApi {
  idAtendimento: number;
  idPessoa: number;
  dataAtendimento: string;
  statusAtendimento: string;
  itens: Array<{
    idAtendimento: number;
    idItem: number;
    idFuncionario: number;
    quantidade: number;
    valorUnitario: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class DadosApiService {
  private readonly apiBase = environment.apiBaseUrl;
  private readonly categoriasUrl = `${this.apiBase}/Categorium`;
  private readonly atendimentosUrl = `${this.apiBase}/Atendimento`;

  constructor(private http: HttpClient) {}

  /**
   * Usa Categorium.items porque o schema Item inclui iditem e o relacionamento
   * com Produto/Estoque. O DTO de ProdutoItem não documenta o identificador.
   */
  listarItensCatalogo(): Observable<ItemCatalogo[]> {
    return this.http.get<CategoriaApi[]>(this.categoriasUrl).pipe(
      map(categorias => {
        const itens: ItemCatalogo[] = [];

        for (const categoria of categorias ?? []) {
          const nomeCategoria = String(categoria.categoria ?? 'Sem categoria');

          for (const item of categoria.items ?? []) {
            const id = Number(item.iditem ?? item.idItem ?? 0);
            const nome = String(item.item1 ?? item.item ?? '').trim();
            const tipo = String(item.tipoItem ?? '').trim().toUpperCase();
            const ativo = this.estaAtivo(item.ativoProdutoServico);
            const precoBase = Number(item.preco ?? 0);
            const precoVenda = Number(item.produto?.precoVenda ?? 0);
            const preco = tipo === 'P' && precoVenda > 0 ? precoVenda : precoBase;
            const quantidadeEstoque = item.produto?.estoque?.quantidadeEstoque;

            // Não cria registros artificiais quando o backend retorna campos vazios.
            if (!id || !nome || (tipo !== 'P' && tipo !== 'S')) continue;

            itens.push({
              id,
              nome,
              categoria: nomeCategoria,
              descricao: String(item.descricaoItem ?? ''),
              preco,
              ativo,
              tipoItem: tipo,
              ...(quantidadeEstoque !== undefined && quantidadeEstoque !== null
                ? { estoque: Number(quantidadeEstoque) }
                : {})
            });
          }
        }

        return itens;
      })
    );
  }

  listarAtendimentos(): Observable<AtendimentoApi[]> {
    return this.http.get<AtendimentoApi[]>(this.atendimentosUrl);
  }

  criarAtendimento(dados: AtendimentoNovoApi): Observable<AtendimentoApi> {
    return this.http.post<AtendimentoApi>(this.atendimentosUrl, dados);
  }

  private estaAtivo(valor: string | null | undefined): boolean {
    const status = String(valor ?? 'S').trim().toUpperCase();
    return !['N', '0', 'FALSE', 'INATIVO', 'INACTIVE'].includes(status);
  }
}
