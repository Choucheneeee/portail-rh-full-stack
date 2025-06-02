import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotAuthGuard } from '../../user/notauth.guard';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component';
import { VerifComponent } from '../verif/verif.component';
import { NotfoundComponent } from '../../notfound/notfound.component';
import { ForgotPasswordComponent } from '../../forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '../../reset-password/reset-password.component';

const routes: Routes = [
  { path: 'register', component: RegisterComponent, canActivate: [NotAuthGuard] },
  { path: 'login', component: LoginComponent, canActivate: [NotAuthGuard] },
  { path: 'verif', component: VerifComponent, canActivate: [NotAuthGuard] },
  {path:"forgot-password",component:ForgotPasswordComponent,canActivate:[NotAuthGuard]},
  {path: 'reset-password', component: ResetPasswordComponent, canActivate: [NotAuthGuard] },

    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
        
    },
    {path:"**",component:NotfoundComponent},
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }