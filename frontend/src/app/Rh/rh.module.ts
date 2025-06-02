import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  RhRoutingModule } from './rh-routing.module';
import { UsersComponent } from './users/users.component';



@NgModule({
  declarations: [],
  imports: [
    RhRoutingModule,
    CommonModule,
    UsersComponent,
  ]
})
export class rhModule { }

//mg