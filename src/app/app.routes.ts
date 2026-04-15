import { Routes } from '@angular/router';
import { authGuard } from './shared/auth-guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then((m) => m.Home) },
  { path: 'login', loadComponent: () => import('./onboarding/login/login').then((m) => m.Login) },
  { path: 'cadastro', loadComponent: () => import('./onboarding/register/register').then((m) => m.Register) },
  {
    path: 'cadastro/convite',
    loadComponent: () => import('./onboarding/register/register-invite').then((m) => m.RegisterInvite),
  },
  {
    path: 'cadastro/sucesso',
    loadComponent: () => import('./onboarding/register-success/register-success').then((m) => m.RegisterSuccess),
  },
  {
    path: 'onboarding/verify-email',
    loadComponent: () => import('./onboarding/verify-email/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'onboarding/verify-email-failed',
    loadComponent: () => import('./onboarding/verify-email-failed/verify-email-failed').then((m) => m.VerifyEmailFailed),
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./onboarding/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'redefinir-senha',
    loadComponent: () => import('./onboarding/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: '',
    loadComponent: () => import('./shared/app-shell/app-shell').then((m) => m.AppShell),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./onboarding/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'branding',
        loadComponent: () => import('./onboarding/branding/branding').then((m) => m.Branding),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./usuarios/usuario-list.component').then((m) => m.UsuarioListComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
