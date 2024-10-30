import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./pages/input-page/input-page.component')
        .then(m => m.InputPageComponent)
  }
];
