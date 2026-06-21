import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  exact: boolean;
  icon: 'list' | 'gear';
}

/**
 * 앱 내비게이션 — 두 번째 헤드라인 적응형 패턴.
 * 업무: 같은 항목을 모바일에선 하단 탭바, 데스크톱(laptop+)에선 좌측 사이드 레일로 보여 준다.
 * 레이아웃 방향만 바뀌므로 유틸리티 반응형(laptop: 접두)으로 처리한다. 활성 탭은 primary(DESIGN.md).
 */
@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive],
  host: { class: 'block' },
  template: `
    <nav
      class="flex justify-around border-t border-hairline bg-canvas
             laptop:h-full laptop:w-20 laptop:flex-col laptop:justify-start laptop:gap-xs laptop:border-t-0 laptop:border-e laptop:py-lg"
      style="padding-bottom: env(safe-area-inset-bottom)"
      aria-label="주요 메뉴"
    >
      @for (item of items; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="text-primary"
          [routerLinkActiveOptions]="{ exact: item.exact }"
          class="flex min-h-11 flex-1 flex-col items-center justify-center gap-xxs px-sm py-sm text-ink/70 transition-colors laptop:flex-none"
        >
          <span aria-hidden="true">
            @switch (item.icon) {
              @case ('list') {
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <path d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              }
              @case ('gear') {
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                  />
                </svg>
              }
            }
          </span>
          <span class="text-xs">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
})
export class AppNav {
  protected readonly items: NavItem[] = [
    { path: '/', label: '할 일', exact: true, icon: 'list' },
    { path: '/settings', label: '설정', exact: false, icon: 'gear' },
  ];
}
