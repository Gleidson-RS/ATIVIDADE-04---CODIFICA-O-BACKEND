import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LoginService } from '../../services/login/login';
import { CarrinhoService } from '../../services/carrinho/carrinho-service';
import { DOCUMENT } from '@angular/common';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-menu',
  styleUrl: './menu.css',
  templateUrl: './menu.html',
})
export class Menu {
  private loginService = inject(LoginService);
  private router = inject(Router);
  readonly carrinho = inject(CarrinhoService);

  usuario = this.loginService.pessoaLogada;

  sair(): void {
    this.loginService.encerrarSessao();
    this.router.navigate(['/login']);
  }


private readonly documento = inject(DOCUMENT);

girarPagina(): void {
  const aplicacao = this.documento.querySelector('app-root');

  if (!aplicacao) return;

  aplicacao.classList.remove('giro-360');

  // Reinicia a animação para permitir novos cliques.
  void aplicacao.getBoundingClientRect();

  aplicacao.classList.add('giro-360');

  aplicacao.addEventListener(
    'animationend',
    () => aplicacao.classList.remove('giro-360'),
    { once: true }
  );
}

}