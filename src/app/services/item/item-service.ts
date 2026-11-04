import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemCatalogo, TipoItem } from '../../models/gestao/gestao';
import { CategoriaApi, CategoriaService } from '../categoria/categoria-service';

// Dados de um produto/serviço para criar ou alterar.
export interface ItemFormulario {
  nome: string;
  descricao: string;
  idCategoria: number;
  preco: number;
  ativo: boolean;
  unidade?: string;
  codigoPreco?: number;
}

// GET /api/ProdutoItem (schema Produto): dados do produto + item aninhado em iditemNavigation.
interface ProdutoItemApi {
  iditem?: number;
  codigoPreco?: number;
  precoVenda?: number | null;
  unidade?: string | null;
  estoque?: { quantidadeEstoque?: number } | null;
  iditemNavigation?: ItemApi | null;
}

interface ItemApi {
  iditem?: number;
  idcategoria?: number;
  item1?: string | null;
  descricaoItem?: string | null;
  preco?: number | null;
  tipoItem?: string | null;
  ativoProdutoServico?: string | null;
}

// GET /api/Servico (endpoint do back-end ASP.NET Core, ver backend-patch).
interface ServicoApi {
  idItem?: number;
  idCategoria?: number;
  categoria?: string | null;
  nome?: string | null;
  descricao?: string | null;
  preco?: number | null;
  tipoItem?: string | null;
  ativo?: string | null;
}

/**
 * Catálogo e gestão de produtos (tabela produto + item + estoque) e serviços (tabela item, tipo 'S').
 * Um único serviço cobre os dois tipos porque as telas de catálogo e de gestão são as mesmas.
 */
@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly apiBase = environment.apiBaseUrl;
  private readonly produtosUrl = `${this.apiBase}/ProdutoItem`;
  private readonly servicosUrl = `${this.apiBase}/Servico`;

  constructor(private http: HttpClient, private categorias: CategoriaService) {}

  listar(tipo: TipoItem): Observable<ItemCatalogo[]> {
    return tipo === 'P' ? this.listarProdutos() : this.listarServicos();
  }

  criar(tipo: TipoItem, dados: ItemFormulario): Observable<unknown> {
    const url = tipo === 'P' ? this.produtosUrl : this.servicosUrl;
    return this.http.post(url, this.montarCorpo(tipo, dados), { responseType: 'text' });
  }

  atualizar(tipo: TipoItem, id: number, dados: ItemFormulario): Observable<unknown> {
    const url = tipo === 'P' ? this.produtosUrl : this.servicosUrl;
    return this.http.put(`${url}/${id}`, this.montarCorpo(tipo, dados), { responseType: 'text' });
  }

  excluir(tipo: TipoItem, id: number): Observable<unknown> {
    const url = tipo === 'P' ? this.produtosUrl : this.servicosUrl;
    return this.http.delete(`${url}/${id}`, { responseType: 'text' });
  }

  private listarProdutos(): Observable<ItemCatalogo[]> {
    return forkJoin({
      categorias: this.http.get<CategoriaApi[]>(`${this.apiBase}/Categorium`),
      produtos: this.http.get<ProdutoItemApi[]>(this.produtosUrl)
    }).pipe(
      map(({ categorias, produtos }) => {
        const nomes = new Map<number, string>();
        for (const c of categorias ?? []) {
          const id = Number(c.idcategoria ?? c.idCategoria ?? 0);
          if (id) nomes.set(id, String(c.categoria ?? 'Sem categoria'));
        }

        const itens: ItemCatalogo[] = [];
        for (const produto of produtos ?? []) {
          const item = produto.iditemNavigation;
          if (!item) continue;

          const id = Number(produto.iditem ?? item.iditem ?? 0);
          const nome = String(item.item1 ?? '').trim();
          const idCategoria = Number(item.idcategoria ?? 0);
          // precoVenda é o preço de venda; item.preco é o preço base cadastrado.
          const precoVenda = Number(produto.precoVenda ?? 0);
          const preco = precoVenda > 0 ? precoVenda : Number(item.preco ?? 0);
          const quantidade = produto.estoque?.quantidadeEstoque;

          if (!id || !nome) continue;

          itens.push({
            id,
            nome,
            categoria: nomes.get(idCategoria) ?? 'Sem categoria',
            idCategoria,
            descricao: String(item.descricaoItem ?? ''),
            preco,
            ativo: this.estaAtivo(item.ativoProdutoServico),
            tipoItem: 'P',
            unidade: String(produto.unidade ?? '').trim(),
            codigoPreco: Number(produto.codigoPreco ?? 1),
            ...(quantidade !== undefined && quantidade !== null
              ? { estoque: Number(quantidade) }
              : {})
          });
        }
        return itens;
      })
    );
  }

  private listarServicos(): Observable<ItemCatalogo[]> {
    return this.http.get<ServicoApi[]>(this.servicosUrl).pipe(
      map(servicos => (servicos ?? [])
        .map(s => ({
          id: Number(s.idItem ?? 0),
          nome: String(s.nome ?? '').trim(),
          categoria: String(s.categoria ?? 'Sem categoria'),
          idCategoria: Number(s.idCategoria ?? 0),
          descricao: String(s.descricao ?? ''),
          preco: Number(s.preco ?? 0),
          ativo: this.estaAtivo(s.ativo),
          tipoItem: 'S' as const,
          unidade: '',
          codigoPreco: 0
        }))
        .filter(s => s.id > 0 && s.nome.length > 0))
    );
  }

  // Produto: ProdutoDTO do Swagger. Serviço: ServicoDTO do back-end (ver backend-patch).
  private montarCorpo(tipo: TipoItem, d: ItemFormulario): unknown {
    if (tipo === 'S') {
      return {
        idCategoria: d.idCategoria,
        nome: d.nome.trim(),
        descricao: d.descricao.trim(),
        preco: d.preco,
        ativo: d.ativo ? 'S' : 'N'
      };
    }
    return {
      idCategoria: d.idCategoria,
      item: d.nome.trim(),
      descricaoItem: d.descricao.trim(),
      preco: d.preco,
      tipoItem: 'P',
      ativoProdutoServico: d.ativo ? 'S' : 'N',
      codigoPreco: d.codigoPreco ?? 1,
      precoVenda: d.preco,
      unidade: (d.unidade ?? 'UN').trim().toUpperCase()
    };
  }

  private estaAtivo(valor: string | null | undefined): boolean {
    const status = String(valor ?? 'S').trim().toUpperCase();
    return !['N', '0', 'FALSE', 'INATIVO', 'INACTIVE'].includes(status);
  }
}
