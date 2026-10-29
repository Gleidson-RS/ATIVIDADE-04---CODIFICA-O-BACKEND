import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LoginService } from '../../services/login/login';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-menu',
  styleUrl: './menu.css',
  templateUrl: './menu.html',
})
export class Menu {
  private loginService = inject(LoginService);
  private router = inject(Router);

  usuario = this.loginService.pessoaLogada;

  sair(): void {
    this.loginService.encerrarSessao();
    this.router.navigate(['/login']);
  }
}