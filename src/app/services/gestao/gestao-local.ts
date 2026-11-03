import { Injectable } from '@angular/core';
import { EntradaEstoque, Funcionario } from '../../models/gestao/gestao';

/**
 * Armazenamento local usado apenas onde o Swagger não oferece endpoints:
 * cadastro demonstrativo de funcionários e lançamentos locais de estoque.
 */
@Injectable({ providedIn: 'root' })
export class GestaoLocalService {
  private readonly chaves = {
    funcionarios: 'atividade04_demo_funcionarios',
    entradas: 'atividade04_demo_entradas',
    ajustesEstoque: 'atividade04_demo_ajustes_estoque'
  };

  constructor() {
    this.inicializarDadosDemo();
  }

  listarFuncionarios(): Funcionario[] {
    return this.ler<Funcionario[]>(this.chaves.funcionarios, []);
  }

  salvarFuncionario(dados: Omit<Funcionario, 'id'>): Funcionario {
    const lista = this.listarFuncionarios();
    const funcionario: Funcionario = { ...dados, id: this.proximoId(lista) };
    lista.push(funcionario);
    this.gravar(this.chaves.funcionarios, lista);
    return funcionario;
  }

  atualizarFuncionario(funcionario: Funcionario): void {
    const lista = this.listarFuncionarios().map(item =>
      item.id === funcionario.id ? { ...funcionario } : item
    );
    this.gravar(this.chaves.funcionarios, lista);
  }

  excluirFuncionario(id: number): void {
    this.gravar(
      this.chaves.funcionarios,
      this.listarFuncionarios().filter(item => item.id !== id)
    );
  }

  listarEntradas(): EntradaEstoque[] {
    return this.ler<EntradaEstoque[]>(this.chaves.entradas, []);
  }

  /** Registra entrada local para um produto vindo da API. Não altera o MySQL. */
  registrarEntradaCatalogo(
    produtoId: number,
    produtoNome: string,
    quantidade: number,
    observacao: string
  ): EntradaEstoque | null {
    if (!Number.isInteger(produtoId) || produtoId <= 0 || !Number.isInteger(quantidade) || quantidade <= 0) {
      return null;
    }

    const ajustes = this.ler<Record<string, number>>(this.chaves.ajustesEstoque, {});
    ajustes[String(produtoId)] = (ajustes[String(produtoId)] ?? 0) + quantidade;
    this.gravar(this.chaves.ajustesEstoque, ajustes);

    const entradas = this.listarEntradas();
    const entrada: EntradaEstoque = {
      id: this.proximoId(entradas),
      produtoId,
      produtoNome,
      quantidade,
      data: new Date().toISOString(),
      observacao: observacao.trim()
    };
    entradas.unshift(entrada);
    this.gravar(this.chaves.entradas, entradas);
    return entrada;
  }

  ajusteEstoqueLocal(produtoId: number): number {
    const ajustes = this.ler<Record<string, number>>(this.chaves.ajustesEstoque, {});
    return Number(ajustes[String(produtoId)] ?? 0);
  }

  private inicializarDadosDemo(): void {
    if (localStorage.getItem(this.chaves.funcionarios) === null) {
      this.gravar(this.chaves.funcionarios, []);
    }
    if (localStorage.getItem(this.chaves.entradas) === null) {
      this.gravar(this.chaves.entradas, []);
    }
    if (localStorage.getItem(this.chaves.ajustesEstoque) === null) {
      this.gravar(this.chaves.ajustesEstoque, {});
    }
  }

  private proximoId(lista: Array<{ id: number }>): number {
    return lista.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
  }

  private ler<T>(chave: string, padrao: T): T {
    try {
      const valor = localStorage.getItem(chave);
      return valor ? JSON.parse(valor) as T : padrao;
    } catch {
      return padrao;
    }
  }

  private gravar(chave: string, valor: unknown): void {
    localStorage.setItem(chave, JSON.stringify(valor));
  }
}
