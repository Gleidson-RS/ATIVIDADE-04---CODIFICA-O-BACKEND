import { Injectable, signal } from '@angular/core';
import { PessoaService } from '../../services/pessoa/pessoa-service';
import { Pessoas } from '../../models/pessoas/pessoa';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private readonly chaveSessao = 'pessoaLogada';

  // Signal com a pessoa logada: o menu e qualquer componente reagem sozinhos
  private readonly _pessoaLogada = signal<Pessoas | null>(this.lerSessao());
  readonly pessoaLogada = this._pessoaLogada.asReadonly();

  constructor(private pessoaService: PessoaService) {}

  autenticar(email: string, cpf: string): Observable<Pessoas | undefined> {
    const emailDigitado = email.trim().toLowerCase();
    const cpfDigitado = cpf.replace(/\D/g, '');

    return this.pessoaService.listarPessoas().pipe(
      map((pessoas: Pessoas[]) =>
        pessoas.find((pessoa: any) => {
          const emailCadastrado = String(pessoa.email ?? '')
            .trim()
            .toLowerCase();

          // A API retorna "cpf", com letras minúsculas.
          const cpfCadastrado = String(
            pessoa.cpf ?? pessoa.CPF ?? ''
          ).replace(/\D/g, '');

          return emailCadastrado === emailDigitado &&
                 cpfCadastrado === cpfDigitado;
        })
      )
    );
  }

  salvarSessao(pessoa: Pessoas, manterLogado: boolean): void {
    this.encerrarSessao();

    const armazenamento = manterLogado
      ? localStorage
      : sessionStorage;

    armazenamento.setItem(
      this.chaveSessao,
      JSON.stringify(pessoa)
    );

    this._pessoaLogada.set(pessoa);
  }

  obterPessoaLogada(): Pessoas | null {
    return this._pessoaLogada();
  }

  estaLogado(): boolean {
    return this._pessoaLogada() !== null;
  }

  encerrarSessao(): void {
    sessionStorage.removeItem(this.chaveSessao);
    localStorage.removeItem(this.chaveSessao);
    this._pessoaLogada.set(null);
  }

  private lerSessao(): Pessoas | null {
    const dados =
      sessionStorage.getItem(this.chaveSessao) ??
      localStorage.getItem(this.chaveSessao);

    if (!dados) return null;

    try {
      return JSON.parse(dados) as Pessoas;
    } catch {
      sessionStorage.removeItem(this.chaveSessao);
      localStorage.removeItem(this.chaveSessao);
      return null;
    }
  }
}