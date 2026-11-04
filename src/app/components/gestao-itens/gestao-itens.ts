import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Categoria, ItemCatalogo, TipoItem } from '../../models/gestao/gestao';
import { CategoriaService } from '../../services/categoria/categoria-service';
import { ItemFormulario, ItemService } from '../../services/item/item-service';
import { mensagemErroApi } from '../../shared/erro-api';
import { validarItemGestao } from '../../shared/validacoes-gestao';

interface FormItem {
  nome: string;
  descricao: string;
  idCategoria: number | null;
  preco: number | null;
  unidade: string;
  ativo: boolean;
}

const FORM_VAZIO: FormItem = { nome: '', descricao: '', idCategoria: null, preco: null, unidade: 'UN', ativo: true };

/**
 * Gestão (CRUD) de produtos e de serviços. A rota define o tipo pelo data: { tipo: 'P' | 'S' }.
 */
@Component({
  selector: 'app-gestao-itens',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gestao-itens.html',
  styleUrl: './gestao-itens.css'
})
export class GestaoItens {
  private readonly route = inject(ActivatedRoute);
  private readonly itemService = inject(ItemService);
  private readonly categoriaService = inject(CategoriaService);

  readonly tipo: TipoItem = this.route.snapshot.data['tipo'] === 'S' ? 'S' : 'P';
  readonly eProduto = this.tipo === 'P';
  readonly rotulo = this.eProduto ? 'produto' : 'serviço';
  readonly rotuloPlural = this.eProduto ? 'Produtos' : 'Serviços';

  readonly itens = signal<ItemCatalogo[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly busca = signal('');
  readonly filtroCategoria = signal('Todas');
  readonly editando = signal<ItemCatalogo | null>(null);
  readonly form = signal<FormItem>({ ...FORM_VAZIO });
  readonly tentou = signal(false);
  readonly mensagem = signal('');
  readonly mensagemErro = signal(false);

  readonly erros = computed(() => validarItemGestao({
    nome: this.form().nome,
    descricao: this.form().descricao,
    idCategoria: this.form().idCategoria,
    preco: this.form().preco,
    unidade: this.form().unidade
  }, this.tipo));

  readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLocaleLowerCase('pt-BR');
    const categoria = this.filtroCategoria();
    return this.itens().filter(i =>
      (categoria === 'Todas' || i.categoria === categoria) &&
      (!termo || i.nome.toLocaleLowerCase('pt-BR').includes(termo) || String(i.id) === termo));
  });

  constructor() {
    this.carregar();
  }

  capitalizarRotulo(): string {
    return this.capitalizar(this.rotulo);
  }

  erro(campo: string): string {
    return this.tentou() ? (this.erros()[campo] ?? '') : '';
  }

  carregar(): void {
    this.carregando.set(true);
    forkJoin({
      itens: this.itemService.listar(this.tipo),
      categorias: this.categoriaService.listar()
    }).pipe(finalize(() => this.carregando.set(false))).subscribe({
      next: ({ itens, categorias }) => {
        this.itens.set(itens);
        this.categorias.set(categorias);
      },
      error: erro => this.falhar(mensagemErroApi(erro, `carregar os ${this.rotuloPlural.toLowerCase()}`))
    });
  }

  salvar(): void {
    this.tentou.set(true);
    this.mensagem.set('');
    if (Object.keys(this.erros()).length > 0) {
      this.falhar('Corrija os campos destacados antes de salvar.');
      return;
    }

    const f = this.form();
    const atual = this.editando();
    const dados: ItemFormulario = {
      nome: f.nome,
      descricao: f.descricao,
      idCategoria: Number(f.idCategoria),
      preco: Number(f.preco),
      ativo: f.ativo,
      unidade: f.unidade,
      codigoPreco: atual?.codigoPreco ?? 1
    };

    this.salvando.set(true);
    const operacao = atual
      ? this.itemService.atualizar(this.tipo, atual.id, dados)
      : this.itemService.criar(this.tipo, dados);

    operacao.pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => {
        this.sucesso(atual ? `${this.capitalizar(this.rotulo)} atualizado com sucesso.` : `${this.capitalizar(this.rotulo)} cadastrado com sucesso.`);
        this.cancelar(false);
        this.carregar();
      },
      error: erro => this.falhar(mensagemErroApi(erro, atual ? `atualizar o ${this.rotulo}` : `cadastrar o ${this.rotulo}`))
    });
  }

  editar(item: ItemCatalogo): void {
    this.editando.set(item);
    this.form.set({
      nome: item.nome,
      descricao: item.descricao,
      idCategoria: item.idCategoria || null,
      preco: item.preco,
      unidade: item.unidade || 'UN',
      ativo: item.ativo
    });
    this.tentou.set(false);
    this.mensagem.set('');
  }

  cancelar(exibirAviso = true): void {
    this.editando.set(null);
    this.form.set({ ...FORM_VAZIO });
    this.tentou.set(false);
    if (exibirAviso) this.sucesso('Edição cancelada.');
  }

  alternarAtivo(item: ItemCatalogo): void {
    const dados: ItemFormulario = {
      nome: item.nome,
      descricao: item.descricao,
      idCategoria: item.idCategoria,
      preco: item.preco,
      ativo: !item.ativo,
      unidade: item.unidade,
      codigoPreco: item.codigoPreco
    };
    this.itemService.atualizar(this.tipo, item.id, dados).subscribe({
      next: () => {
        this.sucesso(`${this.capitalizar(this.rotulo)} ${item.ativo ? 'desativado' : 'ativado'}: ${item.nome}.`);
        this.carregar();
      },
      error: erro => this.falhar(mensagemErroApi(erro, `alterar o ${this.rotulo}`))
    });
  }

  excluir(item: ItemCatalogo): void {
    if (!confirm(`Excluir o ${this.rotulo} “${item.nome}”?`)) return;

    this.itemService.excluir(this.tipo, item.id).subscribe({
      next: () => {
        if (this.editando()?.id === item.id) this.cancelar(false);
        this.sucesso(`${this.capitalizar(this.rotulo)} excluído com sucesso.`);
        this.carregar();
      },
      error: () => this.falhar(
        `Não foi possível excluir “${item.nome}”. Se ele já foi usado em pedidos, desative-o em vez de excluir.`)
    });
  }

  private capitalizar(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
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
