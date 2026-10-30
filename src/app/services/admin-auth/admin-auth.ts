import { Injectable, signal } from '@angular/core';

// ATENÇÃO: esta proteção roda só no navegador (não há endpoint de autenticação
// de funcionário no back-end). Serve para restringir a navegação no portal,
// mas NÃO é segurança real: a senha fica visível no código do front-end.
@Injectable({ providedIn: 'root' })
export class AdminAuth {
  private readonly senhaAdmin = 'admin';
  private readonly chave = 'portalAdminLogado';

  private readonly _autenticado = signal(this.lerSessao());
  readonly autenticado = this._autenticado.asReadonly();

  entrar(senha: string): boolean {
    if (senha !== this.senhaAdmin) return false;
    sessionStorage.setItem(this.chave, '1');
    this._autenticado.set(true);
    return true;
  }

  sair(): void {
    sessionStorage.removeItem(this.chave);
    this._autenticado.set(false);
  }

  private lerSessao(): boolean {
    return sessionStorage.getItem(this.chave) === '1';
  }
}
