import { NgModule } from '@angular/core';
  import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './auth.guard';
import { NotAuthGuard } from './notauth.guard';
import { ProfileComponent } from './profile/profile.component';
import { FormationComponent } from './formation/formation.component';
import { CongeComponent } from './conge/conge.component';
import { AvanceComponent } from './avance/avance.component';
import { DocumentComponent } from './document/document.component';


  const routes: Routes = [


    { path: '', component: HomeComponent, canActivate: [AuthGuard], data: { role: 'collaborateur' }},
    {
      path: 'formation/:id',  // Fix the parameter syntax
      component: FormationComponent,
      canActivate: [AuthGuard],
      data: { role: 'collaborateur',
        renderMode: 'dynamic',
          skipPrerender: true
       },
    }
     ,
     {
      path: 'conge/:id',  // Fix the parameter syntax
      component: CongeComponent,
      canActivate: [AuthGuard],
      data: { role: 'collaborateur',
        renderMode: 'dynamic',
          skipPrerender: true
       },
    },
    {
      path: 'document/:id',  // Fix the parameter syntax
      component: DocumentComponent,
      canActivate: [AuthGuard],
      data: { role: 'collaborateur',
        renderMode: 'dynamic',
          skipPrerender: true
       },
    }
     ,
     {
      path: 'avance/:id',  // Fix the parameter syntax
      component: AvanceComponent,
      canActivate: [AuthGuard], 
      data: { role: 'collaborateur',
        renderMode: 'dynamic',
          skipPrerender: true
       },
    }


  ];

  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
  export class UserRoutingModule  { }
