import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Register } from './onboarding/register/register';
import { Dashboard } from './onboarding/dashboard/dashboard';
import { authGuard } from './shared/auth-guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'cadastro', component: Register },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
