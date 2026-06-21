import { Component, computed, inject } from '@angular/core';
import { ThemeService } from '@/shared/lib';

/**
 * 설정 — 테마 전환.
 * 업무: 다크/라이트를 토글한다. 선택은 ThemeService가 영속화하고 문서에 반영한다.
 */
@Component({
  selector: 'page-settings',
  host: { class: 'block h-full' },
  template: `
    <div class="flex h-full flex-col">
      <header class="px-lg pt-xl pb-md">
        <h1 class="font-display text-3xl font-bold text-ink">설정</h1>
      </header>

      <div class="flex flex-col gap-md px-lg">
        <div class="flex items-center justify-between rounded-md bg-surface-indigo px-md py-md">
          <label id="dark-mode-label" class="text-ink">다크 모드</label>
          <button
            type="button"
            role="switch"
            [attr.aria-checked]="isDark()"
            aria-labelledby="dark-mode-label"
            (click)="theme.toggle()"
            class="relative h-7 w-12 shrink-0 rounded-pill transition-colors"
            [class]="isDark() ? 'bg-primary' : 'bg-muted'"
          >
            <span
              class="absolute top-1 size-5 rounded-pill bg-ink transition-all"
              [class]="isDark() ? 'left-6' : 'left-1'"
            ></span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export default class Settings {
  protected readonly theme = inject(ThemeService);
  protected readonly isDark = computed(() => this.theme.theme() === 'dark');
}
