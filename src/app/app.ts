import { Component, inject, signal } from '@angular/core';
import { Button, Sheet } from '@/shared/ui';
import { TodoStore } from '@/shared/api';

// 임시 프리미티브 플레이그라운드. Phase 3에서 실제 홈 화면으로 대체한다.
@Component({
  selector: 'app-root',
  imports: [Button, Sheet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly sheetOpen = signal(false);

  protected readonly todos = inject(TodoStore);
  protected readonly draft = signal('');

  protected async addTodo(): Promise<void> {
    await this.todos.add(this.draft());
    this.draft.set('');
  }
}
