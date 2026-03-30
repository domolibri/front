import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Register } from './onboarding/register/register';
import { RegisterSuccess } from './onboarding/register-success/register-success';
import { Dashboard } from './onboarding/dashboard/dashboard';
import { Login } from './onboarding/login/login';
import { VerifyEmail } from './onboarding/verify-email/verify-email';
import { VerifyEmailFailed } from './onboarding/verify-email-failed/verify-email-failed';
import { ForgotPassword } from './onboarding/forgot-password/forgot-password';
import { ResetPassword } from './onboarding/reset-password/reset-password';
import { authGuard } from './shared/auth-guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'cadastro', component: Register },
  { path: 'cadastro/sucesso', component: RegisterSuccess },
  { path: 'onboarding/verify-email', component: VerifyEmail },
  { path: 'onboarding/verify-email-failed', component: VerifyEmailFailed },
  { path: 'esqueci-senha', component: ForgotPassword },
  { path: 'redefinir-senha', component: ResetPassword },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
