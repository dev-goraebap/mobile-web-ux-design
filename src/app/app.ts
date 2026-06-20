import { Component } from '@angular/core';
import { Button } from '@/shared/ui';

// 임시 프리미티브 플레이그라운드. Phase 3에서 실제 홈 화면으로 대체한다.
@Component({
  selector: 'app-root',
  imports: [Button],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
