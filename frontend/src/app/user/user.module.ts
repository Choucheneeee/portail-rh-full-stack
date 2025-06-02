import { NgModule } from '@angular/core';
import { UserRoutingModule } from './user-routing.module';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ProfileComponent } from './profile/profile.component'; // Import standalone component

@NgModule({
  declarations: [], // No need to declare ProfileComponent here
  imports: [
    UserRoutingModule,
    RouterModule,
    ReactiveFormsModule,
    ProfileComponent // Import standalone ProfileComponent directly here
  ]
})
export class UserModule { }
