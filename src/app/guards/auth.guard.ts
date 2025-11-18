import { Injectable } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map, filter, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Espera a que el servicio termine de cargar el estado de autenticación antes de decidir
  return authService.cargando$.pipe(
    filter(cargando => cargando === false),
    take(1),
    map(() => {
      const usuario = authService.obtenerUsuarioActual();

      if (usuario) {
        const rolesPermitidos = route.data['roles'] as Array<string>;

        if (rolesPermitidos && rolesPermitidos.length > 0) {
          if (rolesPermitidos.includes(usuario.rol)) {
            return true;
          } else {
            // Devuelve UrlTree para que Angular haga la redirección correctamente
            return router.createUrlTree(['/acceso-denegado']);
          }
        }
        return true;
      } else {
        // Devuelve UrlTree a la página de login con returnUrl
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }) as UrlTree;
      }
    })
  );
};

export const noAuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Espera a que el estado deje de cargarse
  return authService.cargando$.pipe(
    filter(cargando => cargando === false),
    take(1),
    map(() => {
      const usuario = authService.obtenerUsuarioActual();

      if (!usuario) {
        return true;
      } else {
        // Redirigir según rol usando UrlTree
        if (usuario.rol === 'admin') {
          return router.createUrlTree(['/admin']);
        } else {
          return router.createUrlTree(['/cliente']);
        }
      }
    })
  );
};
