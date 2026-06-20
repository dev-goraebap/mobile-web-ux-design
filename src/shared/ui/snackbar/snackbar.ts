import { Component, Service, inject, input, output } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { gsap } from '@/shared/lib/gsap';

/**
 * 토스트 한 줄. 메시지와 선택적 행동 버튼(되돌리기 등)을 보여 준다.
 * 표시·수명 관리는 SnackbarService가 맡고, 이 컴포넌트는 보이기만 한다.
 */
@Component({
  selector: 'ui-snackbar',
  template: `
    <div
      class="m-md flex items-center gap-md rounded-md bg-surface-onyx px-md py-sm text-ink shadow-[0_0_24px_rgba(0,0,0,0.45)]"
      style="margin-bottom: calc(env(safe-area-inset-bottom) + var(--spacing-md))"
    >
      <span class="flex-1">{{ message() }}</span>
      @if (actionLabel(); as label) {
        <button
          type="button"
          class="min-h-[44px] px-xs font-medium text-link"
          (click)="action.emit()"
        >
          {{ label }}
        </button>
      }
    </div>
  `,
})
export class Snackbar {
  readonly message = input.required<string>();
  readonly actionLabel = input<string>();
  readonly action = output<void>();
}

/** Snackbar 열기 옵션. */
export interface SnackbarConfig {
  /** 행동 버튼 레이블(예: '되돌리기'). 없으면 버튼을 숨긴다. */
  actionLabel?: string;
  /** 자동 닫힘 시간(ms). */
  durationMs?: number;
}

/**
 * 토스트 알림.
 * 업무: 짧은 피드백과 되돌리기를 한 곳에서 띄운다. 화면당 하나만 유지하고,
 * 스크린리더에는 LiveAnnouncer로 알린다(WCAG).
 */
@Service()
export class SnackbarService {
  private readonly overlay = inject(Overlay);
  private readonly announcer = inject(LiveAnnouncer);
  private current?: { dismiss: (acted: boolean) => void };

  /**
   * 토스트를 띄운다.
   * @returns 행동 버튼을 눌렀으면 true, 시간이 지나 닫혔으면 false로 resolve되는 Promise.
   */
  open(message: string, config: SnackbarConfig = {}): Promise<boolean> {
    this.current?.dismiss(false);

    const overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().bottom('0').centerHorizontally(),
      scrollStrategy: this.overlay.scrollStrategies.noop(),
    });
    const ref = overlayRef.attach(new ComponentPortal(Snackbar));
    ref.setInput('message', message);
    if (config.actionLabel) ref.setInput('actionLabel', config.actionLabel);
    this.announcer.announce(message, 'polite');

    gsap.fromTo(
      overlayRef.overlayElement,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.2, ease: 'power2.out' },
    );

    return new Promise<boolean>((resolve) => {
      let settled = false;
      const dismiss = (acted: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        sub.unsubscribe();
        if (this.current === handle) this.current = undefined;
        gsap.to(overlayRef.overlayElement, {
          y: 24,
          opacity: 0,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => overlayRef.dispose(),
        });
        resolve(acted);
      };
      const handle = { dismiss };
      this.current = handle;
      const sub = ref.instance.action.subscribe(() => dismiss(true));
      const timer = setTimeout(() => dismiss(false), config.durationMs ?? 4000);
    });
  }
}
