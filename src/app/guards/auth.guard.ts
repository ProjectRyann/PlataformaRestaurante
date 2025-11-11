import { Injectable } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.obtenerUsuarioActual();
  
  if (usuario) {
    const rolesPermitidos = route.data['roles'] as Array<string>;
    
    if (rolesPermitidos && rolesPermitidos.length > 0) {
      if (rolesPermitidos.includes(usuario.rol)) {
        return true;
      } else {
        // El usuario no tiene el rol requerido
        router.navigate(['/acceso-denegado']);
        return false;
      }
    }
    return true;
  } else {
    // No hay usuario autenticado
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};

export const noAuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.obtenerUsuarioActual();
  
  if (!usuario) {
    return true;
  } else {
    // El usuario ya está autenticado, redirigir según su rol
    if (usuario.rol === 'admin') {
      router.navigate(['/admin']);
    } else {
      router.navigate(['/cliente']);
    }
    return false;
  }
};
