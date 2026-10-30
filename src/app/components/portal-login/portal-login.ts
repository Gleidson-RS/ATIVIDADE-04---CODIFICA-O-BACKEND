import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminAuth } from '../../services/admin-auth/admin-auth';

@Component({
  selector: 'app-portal-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './portal-login.html',
  styleUrl: '../login/login.css'
})
export class PortalLogin {
  senha = '';
  mensagem = signal('');

  constructor(
    private auth: AdminAuth,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  entrar(): void {
    if (!this.senha) {
      this.mensagem.set('Informe a senha de administrador.');
      return;
    }

    if (!this.auth.entrar(this.senha)) {
      this.mensagem.set('Senha incorreta.');
      this.senha = '';
      return;
    }

    // Só aceita retorno para rotas internas
    const retorno = this.route.snapshot.queryParamMap.get('retorno') ?? '';
    const destino = retorno.startsWith('/') && !retorno.startsWith('//') ? retorno : '/portal';
    this.router.navigateByUrl(destino);
  }
}
