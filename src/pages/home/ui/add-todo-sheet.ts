import {
  Component,
  ElementRef,
  effect,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Button, Sheet } from '@/shared/ui';

/**
 * 할 일 추가 시트 — 적응형 Sheet의 첫 실사용처.
 * 업무: 제목 한 줄을 받아 `add`로 올린다. 시트는 모바일 바텀시트/데스크톱 모달로 알아서 분기한다.
 */
@Component({
  selector: 'home-add-todo-sheet',
  imports: [Sheet, Button],
  template: `
    <ui-sheet [(open)]="open" heading="할 일 추가">
      <form class="flex flex-col gap-md pb-lg" (submit)="$event.preventDefault(); submit()">
        <input
          #titleInput
          class="rounded-md bg-surface-indigo px-md py-sm text-ink outline-none placeholder:text-ink/40"
          placeholder="무엇을 할까요?"
          [value]="title()"
          (input)="title.set($any($event.target).value)"
          aria-label="할 일 제목"
        />
        <button ui-button variant="cta" type="submit" [disabled]="!title().trim()">추가</button>
      </form>
    </ui-sheet>
  `,
})
export class AddTodoSheet {
  readonly open = model(false);
  readonly add = output<string>();

  protected readonly title = signal('');
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  constructor() {
    // 입력이 목적인 폼이므로 열릴 때 입력란에 포커스를 준다(시트 기본값과 반대로 opt-in).
    effect(() => {
      if (this.open()) {
        const input = this.titleInput();
        if (input) setTimeout(() => input.nativeElement.focus(), 50);
      }
    });
  }

  protected submit(): void {
    const trimmed = this.title().trim();
    if (!trimmed) return;
    this.add.emit(trimmed);
    this.title.set('');
    this.open.set(false);
  }
}
