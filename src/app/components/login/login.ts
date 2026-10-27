import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { LoginService } from '../../services/login/login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  CPF = '';
  manterLogado = false;

  mensagem = signal('');
  erro = signal(false);
  carregando = signal(false);

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  entrar(): void {
    if (this.carregando()) return;

    this.mensagem.set('');
    this.erro.set(false);

    if (!this.email.trim() || !this.CPF.trim()) {
      this.mensagem.set('Preencha o e-mail e o CPF.');
      this.erro.set(true);
      return;
    }

    this.carregando.set(true);

    this.loginService
      .autenticar(this.email, this.CPF)
      .pipe(
        finalize(() => {
          this.carregando.set(false);
        })
      )
      .subscribe({
        next: (pessoa) => {
          if (!pessoa) {
            this.mensagem.set('E-mail ou CPF incorreto.');
            this.erro.set(true);
            return;
          }

          this.loginService.salvarSessao(
            pessoa,
            this.manterLogado
          );

          this.router.navigate(['/home']);
        },

        error: (erroApi) => {
          console.error('Erro ao realizar login:', erroApi);

          this.mensagem.set(
            'Não foi possível consultar a API. Verifique a URL e se o backend está funcionando.'
          );
          this.erro.set(true);
        }
      });
  }
}