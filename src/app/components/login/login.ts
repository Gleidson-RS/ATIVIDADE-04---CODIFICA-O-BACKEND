
import { Component } from '@angular/core';
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

  mensagem = '';
  erro = false;
  carregando = false;

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  entrar(): void {
    if (this.carregando) return;

    this.mensagem = '';
    this.erro = false;

    if (!this.email.trim() || !this.CPF.trim()) {
      this.mensagem = 'Preencha o e-mail e o CPF.';
      this.erro = true;
      return;
    }

    this.carregando = true;

    this.loginService
      .autenticar(this.email, this.CPF)
      .pipe(
        finalize(() => {
          this.carregando = false;
        })
      )
      .subscribe({
        next: (pessoa) => {
          if (!pessoa) {
            this.mensagem = 'E-mail ou CPF incorreto.';
            this.erro = true;
            return;
          }

          this.loginService.salvarSessao(
            pessoa,
            this.manterLogado
          );

          this.router.navigate(['/tela-inicial']);
        },

        error: (erroApi) => {
          console.error('Erro ao realizar login:', erroApi);

          this.mensagem =
            'Não foi possível consultar a API. Verifique a URL e se o backend está funcionando.';
          this.erro = true;
        }
      });
  }
}
