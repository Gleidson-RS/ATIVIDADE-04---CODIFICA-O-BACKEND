import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Categoria } from '../../models/gestao/gestao';
import { CategoriaService } from '../../services/categoria/categoria-service';
import { mensagemErroApi } from '../../shared/erro-api';
import { validarCategoria } from '../../shared/validacoes-gestao';

@Component({
  selector: 'app-categorias',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css'
})
export class Categorias {
  readonly categorias = signal<Categoria[]>([]);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly busca = signal('');
  readonly editandoId = signal<number | null>(null);
  readonly form = signal({ nome: '' });
  readonly tentou = signal(false);
  readonly mensagem = signal('');
  readonly mensagemErro = signal(false);

  readonly erros = computed(() => validarCategoria(this.form()));

  // A tabela categoria não tem AUTO_INCREMENT: o próximo ID é calculado a partir da lista.
  readonly proximoId = computed(() =>
    this.categorias().reduce((maior, c) => Math.max(maior, c.id), 0) + 1);

  readonly filtradas = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    return this.categorias().filter(c =>
      !termo || c.nome.toLocaleLowerCase('pt-BR').includes(termo) || String(c.id) === termo);
  });

  constructor(private categoriaService: CategoriaService) {
    this.carregar();
  }

  erro(campo: string): string {
    return this.tentou() ? (this.erros()[campo] ?? '') : '';
  }

  carregar(): void {
    this.carregando.set(true);
    this.categoriaService.listar()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: lista => this.categorias.set(lista),
        error: erro => this.falhar(mensagemErroApi(erro, 'carregar as categorias'))
      });
  }

  salvar(): void {
    this.tentou.set(true);
    this.mensagem.set('');
    if (Object.keys(this.erros()).length > 0) {
      this.falhar('Corrija os campos destacados antes de salvar.');
      return;
    }

    const nome = this.form().nome.trim();
    const id = this.editandoId();
    const novo = id === null;

    this.salvando.set(true);
    const operacao = novo
      ? this.categoriaService.criar(this.proximoId(), nome)
      : this.categoriaService.atualizar(id, nome);

    operacao.pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => {
        this.sucesso(novo ? 'Categoria cadastrada com sucesso.' : 'Categoria atualizada com sucesso.');
        this.cancelar(false);
        this.carregar();
      },
      error: erro => this.falhar(mensagemErroApi(erro, novo ? 'cadastrar a categoria' : 'atualizar a categoria'))
    });
  }

  editar(categoria: Categoria): void {
    this.editandoId.set(categoria.id);
    this.form.set({ nome: categoria.nome });
    this.tentou.set(false);
    this.mensagem.set('');
  }

  cancelar(exibirAviso = true): void {
    this.editandoId.set(null);
    this.form.set({ nome: '' });
    this.tentou.set(false);
    if (exibirAviso) this.sucesso('Edição cancelada.');
  }

  excluir(categoria: Categoria): void {
    if (categoria.totalItens > 0) {
      this.falhar(`A categoria “${categoria.nome}” tem ${categoria.totalItens} item(ns) vinculado(s). Mova ou exclua esses itens antes.`);
      return;
    }
    if (!confirm(`Excluir a categoria “${categoria.nome}”?`)) return;

    this.categoriaService.excluir(categoria.id).subscribe({
      next: () => {
        if (this.editandoId() === categoria.id) this.cancelar(false);
        this.sucesso('Categoria excluída com sucesso.');
        this.carregar();
      },
      error: () => this.falhar(
        `Não foi possível excluir “${categoria.nome}”. Verifique se ela não possui produtos ou serviços vinculados.`)
    });
  }

  private sucesso(texto: string): void {
    this.mensagem.set(texto);
    this.mensagemErro.set(false);
  }

  private falhar(texto: string): void {
    this.mensagem.set(texto);
    this.mensagemErro.set(true);
  }
}
