import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "../home/home.component";
import { authAdminGuard } from "../guards/auth.guard";
import { AuthGuard } from "../../user/auth.guard";
import { ApprovalsComponent } from "../approvals/approvals.component";
import { UserManagementComponent } from "../user-management/user-management.component";
import { ActivitiesComponent } from "../activities/activities.component";



const routes: Routes = [
    {
    path: '', 
        component: HomeComponent, 
        canActivate: [AuthGuard], 
        data: { role: 'admin' },
        children: [
          { path: 'approvals', component: ApprovalsComponent },
          { path :"" , component:UserManagementComponent},
          {path: 'logs', component: ActivitiesComponent},

        ]
    }
];



  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
  export class  AdminRoutingModule  { }
