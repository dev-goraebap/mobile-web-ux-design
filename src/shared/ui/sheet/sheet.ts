import {
  Component,
  DOCUMENT,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ConfigurableFocusTrapFactory, FocusTrap } from '@angular/cdk/a11y';
import { BreakpointService } from '@/shared/lib';
import { gsap, Draggable, InertiaPlugin } from '@/shared/lib/gsap';

// heading을 aria-labelledby로 연결할 때 쓸 고유 id. 한 화면에 시트가 여럿일 수 있어 카운터로 구분한다.
let nextSheetId = 0;

/**
 * 적응형 시트 — 데모의 핵심 프리미티브.
 *
 * 업무: 같은 컨텐츠를 화면 크기에 따라 표현만 바꾼다. 모바일은 바텀시트(아래에서 올라옴,
 * 끌어서 닫기, safe-area 존중), 데스크톱은 가운데 모달. 화면 코드는 이 분기를 몰라도 된다.
 *
 * 시각/제스처는 모두 캡슐화한다. 소비자는 `[(open)]`과 투영 컨텐츠만 다룬다.
 */
@Component({
  selector: 'ui-sheet',
  template: `
    <ng-template #panel>
      <div
        data-sheet-panel
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="heading() ? headingId : null"
        [attr.aria-label]="heading() ? null : ariaLabel()"
        [class]="panelClasses()"
        [style.padding-bottom]="
          bp.isMobile() ? 'calc(env(safe-area-inset-bottom) + var(--spacing-lg))' : null
        "
      >
        @if (bp.isMobile()) {
          <!-- 끌어서 닫기 손잡이. 드래그는 이 영역에서만 시작돼, 본문 입력은 그대로 쓸 수 있다. -->
          <div
            data-sheet-handle
            class="flex touch-none cursor-grab select-none items-center justify-center py-sm active:cursor-grabbing"
            aria-hidden="true"
          >
            <div class="h-1.5 w-10 rounded-pill bg-ink/25"></div>
          </div>
        }

        @if (heading(); as title) {
          <h2 [id]="headingId" [class]="headingClasses()">{{ title }}</h2>
        }

        <div [class]="bodyClasses()">
          <ng-content />
        </div>
      </div>
    </ng-template>
  `,
})
export class Sheet {
  /** 열림 상태. 양방향 바인딩(`[(open)]`)으로 소비자가 제어한다. */
  readonly open = model(false);
  /** 제목. 있으면 `aria-labelledby`로 연결한다. */
  readonly heading = input<string>();
  /** 제목이 없을 때의 접근성 레이블. heading이 있으면 무시된다. */
  readonly ariaLabel = input<string>('대화 상자');

  protected readonly bp = inject(BreakpointService);
  protected readonly headingId = `ui-sheet-h-${nextSheetId++}`;

  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private readonly focusTrapFactory = inject(ConfigurableFocusTrapFactory);
  private readonly document = inject(DOCUMENT);
  private readonly panelTpl = viewChild<TemplateRef<unknown>>('panel');

  private overlayRef?: OverlayRef;
  private focusTrap?: FocusTrap;
  private draggable?: Draggable;
  private previouslyFocused: HTMLElement | null = null;

  // Tailwind 클래스는 구현 디테일이므로 노출하지 않는다. 깊이는 그림자보다 색·라운드로(DESIGN.md),
  // 떠 있는 표면에만 단일 violet glow를 쓴다.
  protected readonly panelClasses = computed(() => {
    const base =
      'relative flex flex-col overflow-hidden bg-canvas text-ink outline-none shadow-[0_0_48px_rgba(88,101,242,0.35)]';
    return this.bp.isMobile()
      ? `${base} w-screen max-h-[90dvh] rounded-t-lg`
      : `${base} w-[min(92vw,480px)] max-h-[85dvh] rounded-lg pt-xl pb-xl`;
  });

  protected readonly headingClasses = computed(() => {
    const padX = this.bp.isMobile() ? 'px-lg pt-xs' : 'px-xl';
    return `${padX} pb-md font-display text-xl font-bold`;
  });

  protected readonly bodyClasses = computed(() => {
    const padX = this.bp.isMobile() ? 'px-lg' : 'px-xl';
    return `${padX} overflow-y-auto`;
  });

  constructor() {
    // open 상태를 단일 진실로 삼아 오버레이를 붙이고 뗀다. 백드롭·ESC·드래그는 모두 open을 false로 돌린다.
    effect(() => {
      if (this.open()) this.attach();
      else this.detach();
    });
  }

  private attach(): void {
    const tpl = this.panelTpl();
    // 뷰 초기화 전이거나 이미 떠 있으면 건너뛴다(뷰 준비 후 effect가 다시 돈다).
    if (!tpl || this.overlayRef?.hasAttached()) return;

    const mobile = this.bp.isMobile();
    this.previouslyFocused = this.document.activeElement as HTMLElement | null;

    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      // 모바일은 바닥에 붙이고, 데스크톱은 가운데. 같은 컨텐츠, 다른 자리.
      positionStrategy: mobile
        ? this.overlay.position().global().bottom('0').left('0')
        : this.overlay.position().global().centerHorizontally().centerVertically(),
      width: mobile ? '100%' : undefined,
    });

    this.overlayRef.attach(new TemplatePortal(tpl, this.vcr));
    const panelEl = this.overlayRef.overlayElement.querySelector<HTMLElement>('[data-sheet-panel]')!;

    // 포커스 가둠 + 진입 포커스. 닫을 때 직전 포커스로 되돌린다(WCAG 포커스 관리).
    // 첫 입력란이 아니라 패널 자체에 포커스를 준다 — 모바일에서 키보드가 자동으로 뜨는 것을 막는다.
    // 입력란 즉시 포커스가 필요한 폼은 소비자가 개별적으로 처리한다.
    this.focusTrap = this.focusTrapFactory.create(panelEl);
    panelEl.focus({ preventScroll: true });

    this.overlayRef.backdropClick().subscribe(() => this.open.set(false));
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.open.set(false);
      }
    });

    // 열기 애니메이션은 transform/opacity만 건드린다(컴포지터 친화).
    if (mobile) {
      gsap.fromTo(panelEl, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: 'power3.out' });
      this.setupDrag(panelEl);
    } else {
      gsap.fromTo(
        panelEl,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' },
      );
    }
  }

  private detach(): void {
    const ref = this.overlayRef;
    if (!ref?.hasAttached()) return;

    const panelEl = ref.overlayElement.querySelector<HTMLElement>('[data-sheet-panel]');
    const finish = () => {
      this.draggable?.kill();
      this.draggable = undefined;
      this.focusTrap?.destroy();
      this.focusTrap = undefined;
      ref.dispose();
      if (this.overlayRef === ref) this.overlayRef = undefined;
      this.previouslyFocused?.focus();
      this.previouslyFocused = null;
    };

    if (!panelEl) {
      finish();
      return;
    }

    // 닫기 애니메이션 후 정리한다.
    if (this.bp.isMobile()) {
      gsap.to(panelEl, { yPercent: 100, duration: 0.25, ease: 'power2.in', onComplete: finish });
    } else {
      gsap.to(panelEl, {
        opacity: 0,
        scale: 0.96,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: finish,
      });
    }
  }

  /** 끌어서 닫기. 손잡이에서만 시작하고, 떼는 순간 위치·속도로 닫을지 되돌릴지 판정한다(InertiaPlugin). */
  private setupDrag(panelEl: HTMLElement): void {
    const handle = this.overlayRef!.overlayElement.querySelector<HTMLElement>('[data-sheet-handle]');
    const maxY = this.document.documentElement.clientHeight;
    const close = () => this.open.set(false);

    InertiaPlugin.track(panelEl, 'y');
    this.draggable = Draggable.create(panelEl, {
      type: 'y',
      trigger: handle ?? panelEl,
      bounds: { minY: 0, maxY }, // 위로는 못 올리고(이미 끝까지 올라옴) 아래로만 끈다.
      edgeResistance: 1,
      inertia: false,
      allowNativeTouchScrolling: false,
      onPress() {
        gsap.killTweensOf(panelEl);
      },
      onDragEnd() {
        const dragged = this['y'] as number;
        const velocity = InertiaPlugin.getVelocity(panelEl, 'y'); // px/s
        const height = panelEl.offsetHeight || 1;
        // 절반 가까이 끌었거나 빠르게 내쳤으면 닫고, 아니면 제자리로 스냅한다.
        if (dragged > height * 0.4 || velocity > 900) {
          close();
        } else {
          gsap.to(panelEl, { y: 0, duration: 0.3, ease: 'power3.out' });
        }
      },
    })[0];
  }
}
