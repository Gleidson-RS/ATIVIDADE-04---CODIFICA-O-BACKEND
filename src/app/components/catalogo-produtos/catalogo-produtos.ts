import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogoBase, OrdenacaoCatalogo } from '../../shared/catalogo-base';
import { TipoItem } from '../../models/gestao/gestao';

@Component({
  selector: 'app-catalogo-produtos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogo-produtos.html',
  styleUrl: './catalogo-produtos.css'
})
export class CatalogoProdutos extends CatalogoBase {
  protected readonly tipo: TipoItem = 'P';

  constructor() {
    super();
    this.atualizar();
  }

  definirOrdenacao(valor: string): void {
    this.ordenacao.set(valor as OrdenacaoCatalogo);
  }
}
