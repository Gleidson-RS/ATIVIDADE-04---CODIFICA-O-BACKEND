import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogoBase, OrdenacaoCatalogo } from '../../shared/catalogo-base';
import { TipoItem } from '../../models/gestao/gestao';

@Component({
  selector: 'app-catalogo-servicos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogo-servicos.html',
  styleUrl: './catalogo-servicos.css'
})
export class CatalogoServicos extends CatalogoBase {
  protected readonly tipo: TipoItem = 'S';

  constructor() {
    super();
    this.atualizar();
  }

  definirOrdenacao(valor: string): void {
    this.ordenacao.set(valor as OrdenacaoCatalogo);
  }
}
