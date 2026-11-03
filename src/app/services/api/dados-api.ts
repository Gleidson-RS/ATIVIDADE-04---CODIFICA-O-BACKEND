
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { ItemCatalogo } from '../../models/gestao/gestao';
import { environment } from '../../../environments/environment';

// pq foi feito: Interface para receber as categorias do endpoint Categorium.
interface CategoriaApi {
  idcategoria?: number;
  idCategoria?: number;
  categoria?: string | null;
}

// pq foi feito: A API retorna os dados do produto dentro de iditemNavigation.
interface ItemApi {
  iditem?: number;
  idcategoria?: number;
  item1?: string | null;
  descricaoItem?: string | null;
  preco?: number | null;
  tipoItem?: string | null;
  ativoProdutoServico?: string | null;
}

// pq foi feito: Representa o formato REAL retornado por GET /api/ProdutoItem.
interface ProdutoItemApi {
  iditem?: number;
  codigoPreco?: number;
  precoVenda?: number | null;
  unidade?: string | null;
  estoque?: EstoqueApi | null;
  iditemNavigation?: ItemApi | null;
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

// pq foi feito: Representa o JSON retornado por GET /api/Servico.
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

@Injectable({ providedIn: 'root' })
export class DadosApiService {

  private readonly apiBase = environment.apiBaseUrl;

  // pq foi feito: Mantém o endpoint de categorias para buscar os nomes.
  private readonly categoriasUrl = `${this.apiBase}/Categorium`;

  // pq foi feito: Novo endpoint que realmente retorna os produtos cadastrados.
  private readonly produtosUrl = `${this.apiBase}/ProdutoItem`;

  private readonly atendimentosUrl = `${this.apiBase}/Atendimento`;

  // pq foi feito: Endpoint responsável por listar os serviços.
  private readonly servicosUrl = `${this.apiBase}/Servico`; 

  constructor(private http: HttpClient) {}

  // pq foi feito: Busca categorias e produtos simultaneamente.
  // forkJoin espera as duas requisições terminarem antes de montar o catálogo.
  listarItensCatalogo(): Observable<ItemCatalogo[]> {

    return forkJoin({
      categorias: this.http.get<CategoriaApi[]>(this.categoriasUrl),
      produtos: this.http.get<ProdutoItemApi[]>(this.produtosUrl)
    }).pipe(

      map(({ categorias, produtos }) => {

        // pq foi feito: Cria uma associação entre ID da categoria e seu nome.
        const nomesCategorias = new Map<number, string>();

        for (const categoria of categorias ?? []) {

          const idCategoria = Number(
            categoria.idcategoria ?? categoria.idCategoria ?? 0
          );

          if (idCategoria) {
            nomesCategorias.set(
              idCategoria,
              String(categoria.categoria ?? 'Sem categoria')
            );
          }
        }

        const itens: ItemCatalogo[] = [];

        // pq foi feito: Percorre os produtos retornados por ProdutoItem.
        for (const produto of produtos ?? []) {

          // pq foi feito: Os dados principais do item estão aninhados aqui.
          const item = produto.iditemNavigation;

          if (!item) continue;

          // pq foi feito: O ID principal vem de ProdutoItem.
          const id = Number(produto.iditem ?? item.iditem ?? 0);

          const nome = String(item.item1 ?? '').trim();

          const idCategoria = Number(item.idcategoria ?? 0);

          // pq foi feito: Descobre o nome da categoria usando o ID recebido.
          const nomeCategoria =
            nomesCategorias.get(idCategoria) ?? 'Sem categoria';

          const tipo = String(item.tipoItem ?? '')
            .trim()
            .toUpperCase();

          const ativo = this.estaAtivo(item.ativoProdutoServico);

          // pq foi feito: precoVenda vem no nível principal de ProdutoItem.
          const precoBase = Number(item.preco ?? 0);
          const precoVenda = Number(produto.precoVenda ?? 0);

          const preco =
            tipo === 'P' && precoVenda > 0
              ? precoVenda
              : precoBase;

          // pq foi feito: Estoque pode ser null, então só será incluído
          // quando a API realmente informar uma quantidade.
          const quantidadeEstoque =
            produto.estoque?.quantidadeEstoque;

          // pq foi feito: Evita adicionar registros inválidos ao catálogo.
          if (!id || !nome || (tipo !== 'P' && tipo !== 'S')) {
            continue;
          }

          // pq foi feito: Converte a resposta da API para ItemCatalogo.
          itens.push({
            id,
            nome,
            categoria: nomeCategoria,
            descricao: String(item.descricaoItem ?? ''),
            preco,
            ativo,
            tipoItem: tipo as 'P' | 'S',

            ...(quantidadeEstoque !== undefined &&
                quantidadeEstoque !== null
              ? { estoque: Number(quantidadeEstoque) }
              : {})
          });
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

  // pq foi feito: Busca os serviços diretamente do novo controller.
  listarServicos(): Observable<ItemCatalogo[]> {
    return this.http.get<ServicoApi[]>(this.servicosUrl).pipe(
     map(servicos =>
       (servicos ?? [])
         .map(servico => ({
          id: Number(servico.idItem ?? 0),
          nome: String(servico.nome ?? '').trim(),
          categoria: String(servico.categoria ?? 'Sem categoria'),
          descricao: String(servico.descricao ?? ''),
          preco: Number(servico.preco ?? 0),

          // pq foi feito: Converte o status S/N para boolean.
          ativo: this.estaAtivo(servico.ativo),

          tipoItem: 'S' as const
        }))
        .filter(servico => servico.id > 0 && servico.nome.length > 0)
    )
  );
}

}
