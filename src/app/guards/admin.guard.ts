import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuth } from '../services/admin-auth/admin-auth';

// Bloqueia as rotas do portal para quem não digitou a senha de administrador.
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AdminAuth);
  const router = inject(Router);

  return auth.autenticado()
    ? true
    : router.createUrlTree(['/portal-login'], { queryParams: { retorno: state.url } });
};
