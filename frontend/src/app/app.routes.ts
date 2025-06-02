import { Routes } from '@angular/router';
import { NotfoundComponent } from './notfound/notfound.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const routes: Routes = [
    {path: 'collaborateur',loadChildren:()=>import ("./user/user.module").then(m=>m.UserModule)},
    
    { path: 'rh', loadChildren: () => import("./Rh/rh.module").then(m => m.rhModule) },


    { path: 'admin', loadChildren: () => import("./admin/admin-module/admin-module.module").then(m => m.AdminModuleModule)  },
    { 
      path: '',
      loadChildren: () => import('./auth/auth/auth.module').then(m => m.AuthModule)
    },
    { path: 'forgot-password', component: ForgotPasswordComponent },

    { 
        path: 'reset-password', 
        component: ResetPasswordComponent 
      },


    
    {path:"**",component:NotfoundComponent},


];
