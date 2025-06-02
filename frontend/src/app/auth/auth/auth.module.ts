import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component';
import { VerifComponent } from '../verif/verif.component';
import { AuthRoutingModule } from './auth-routing.module';



@NgModule({
  declarations: [],
  imports: [
    LoginComponent,
    RegisterComponent,
    VerifComponent,
    AuthRoutingModule,
    CommonModule
  ]
})
export class AuthModule { }
