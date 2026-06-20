import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    // 기능 라우트는 지연 로딩한다(번들 분할).
    loadComponent: () => import('@/pages/home/home'),
  },
];
