import { Component, computed, input } from '@angular/core';

/** 버튼 강조 단계. cta는 화면당 최고 강조 한 곳에만 쓴다(업무 규칙, DESIGN.md). */
export type ButtonVariant = 'primary' | 'cta' | 'ghost';

/**
 * 디자인 시스템 버튼.
 * 업무: 강조 단계(variant)만 노출하고, 색·라운드 같은 시각 구현은 토큰으로 캡슐화한다.
 */
@Component({
  selector: 'button[ui-button]',
  template: `<ng-content />`,
  host: {
    '[class]': 'classes()',
    '[attr.type]': 'type()',
    '[disabled]': 'disabled()',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);

  // Tailwind 클래스는 구현 디테일이므로 컴포넌트 밖으로 노출하지 않는다.
  protected readonly classes = computed(() => {
    const base =
      'inline-flex items-center justify-center min-h-[44px] font-medium transition-colors select-none disabled:opacity-50 disabled:pointer-events-none';
    const byVariant: Record<ButtonVariant, string> = {
      primary: 'bg-primary text-on-primary rounded-sm px-xl py-lg',
      cta: 'bg-green text-ink-dark rounded-sm px-xl py-sm',
      ghost: 'bg-surface-indigo text-ink rounded-lg px-md py-md',
    };
    return `${base} ${byVariant[this.variant()]}`;
  });
}
