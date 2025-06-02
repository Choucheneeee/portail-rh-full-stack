import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'rh/profile/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'collaborateur/formation/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'collaborateur/avance/:id', 
    renderMode: RenderMode.Client
  },
  {
    path: 'collaborateur/conge/:id', 
    renderMode: RenderMode.Client
  },
  {
    path: 'collaborateur/document/:id', 
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
  
];
