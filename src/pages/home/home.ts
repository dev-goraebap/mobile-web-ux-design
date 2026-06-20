import { Component, computed, inject, signal } from '@angular/core';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { ListItem, SnackbarService } from '@/shared/ui';
import { TodoStore, type Todo } from '@/shared/api';
import { AddTodoSheet } from './ui/add-todo-sheet';

/**
 * 홈 — 할 일 목록.
 * 업무: 첫 기능 수직 슬라이스. 프리미티브(Sheet·ListItem·Snackbar)와 저장소(TodoStore)를 엮어
 * 추가·완료 토글·삭제를 동작시킨다. 긴 목록은 CDK 가상 스크롤로 그린다.
 */
@Component({
  selector: 'page-home',
  imports: [
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    ListItem,
    AddTodoSheet,
  ],
  host: { class: 'block' },
  template: `
    <div class="flex h-dvh flex-col">
      <header class="flex items-baseline justify-between px-lg pt-xl pb-md">
        <h1 class="font-display text-3xl font-bold text-ink">할 일</h1>
        <span class="text-ink/50">{{ remaining() }}개 남음</span>
      </header>

      @if (todos.todos().length === 0) {
        <p class="flex flex-1 items-center justify-center px-lg text-center text-ink/40">
          아직 할 일이 없습니다.<br />아래 + 버튼으로 추가하세요.
        </p>
      } @else {
        <cdk-virtual-scroll-viewport itemSize="72" class="flex-1">
          <ui-list-item
            *cdkVirtualFor="let todo of todos.todos(); trackBy: trackById"
            class="block px-md py-1"
            (swipe)="toggle(todo)"
          >
            <div class="flex h-16 items-center gap-md px-md">
              <input
                type="checkbox"
                class="size-5 shrink-0"
                [checked]="todo.done"
                (change)="toggle(todo)"
                [attr.aria-label]="todo.title + ' 완료 토글'"
              />
              <span class="flex-1 truncate text-ink" [class]="todo.done ? 'line-through opacity-50' : ''">
                {{ todo.title }}
              </span>
              <button
                type="button"
                class="min-h-[44px] px-xs text-ink/50 hover:text-magenta"
                (click)="remove(todo)"
                [attr.aria-label]="todo.title + ' 삭제'"
              >
                ✕
              </button>
            </div>
          </ui-list-item>
        </cdk-virtual-scroll-viewport>
      }

      <button
        type="button"
        class="fixed end-lg flex size-14 items-center justify-center rounded-pill bg-green text-3xl text-ink-dark shadow-[0_0_32px_rgba(53,237,126,0.45)]"
        style="bottom: calc(env(safe-area-inset-bottom) + var(--spacing-lg))"
        (click)="addOpen.set(true)"
        aria-label="할 일 추가"
      >
        +
      </button>

      <home-add-todo-sheet [(open)]="addOpen" (add)="add($event)" />
    </div>
  `,
})
export default class Home {
  protected readonly todos = inject(TodoStore);
  private readonly snackbar = inject(SnackbarService);

  protected readonly addOpen = signal(false);
  protected readonly remaining = computed(() => this.todos.todos().filter((t) => !t.done).length);

  protected readonly trackById = (_: number, todo: Todo) => todo.id;

  protected add(title: string): void {
    void this.todos.add(title);
  }

  protected async toggle(todo: Todo): Promise<void> {
    await this.todos.toggle(todo.id);
    const nowDone = !todo.done;
    const undone = await this.snackbar.open(nowDone ? '완료로 표시됨' : '완료 취소됨', {
      actionLabel: '되돌리기',
    });
    if (undone) await this.todos.toggle(todo.id);
  }

  protected async remove(todo: Todo): Promise<void> {
    await this.todos.remove(todo.id);
    const undone = await this.snackbar.open('삭제됨', { actionLabel: '되돌리기' });
    if (undone) await this.todos.restore(todo);
  }
}
