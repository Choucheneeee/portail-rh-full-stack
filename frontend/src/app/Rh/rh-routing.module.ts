import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { authRhGuard } from "./auth-rh.guard";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { UsersComponent } from "./users/users.component";
import { RequestComponent } from "./request/request.component";
import { ChatComponent } from "./chat/chat.component";
import { AuthGuard } from "../user/auth.guard";
import { ProfileUserComponent } from "./profile-user/profile-user.component";
import { RenderMode, ServerRoute } from '@angular/ssr';
import { ProfileComponent } from "./profile/profile.component";


const routes: Routes = [
  
  { 
    path: '', 
    component: HomeComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'rh' },
    children: [
      { path: '', component: DashboardComponent }, // Default to Dashboard
      { path: 'users', component: UsersComponent } ,
      { path: 'request', component: RequestComponent }, // Default to Dashboard
      { path: 'chat', component: ChatComponent } , // User route,
      {path:'myprofile',component:ProfileComponent},

      { 
        path: 'profile/:id', 
        component: ProfileUserComponent,
        data: { 
          renderMode: 'dynamic',
          skipPrerender: true
        }
      }
      
    ] 
  }
];



  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
  export class RhRoutingModule  { }
