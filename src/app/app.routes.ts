import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { ClienteComponent } from './components/cliente/cliente';
import { AdminComponent } from './components/admin/admin';
import { authGuard, noAuthGuard } from './guards/auth.guard';

export const routes: Routes = [
	{ path: '', redirectTo: '/cliente', pathMatch: 'full' },
	{ path: 'login', component: LoginComponent, canActivate: [noAuthGuard] },
	{ path: 'cliente', component: ClienteComponent, canActivate: [authGuard], data: { roles: ['cliente'] } },
	{ path: 'admin', component: AdminComponent, canActivate: [authGuard], data: { roles: ['admin'] } },
	{ path: '**', redirectTo: '/login' }
];
