import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
} from '@angular/core';
import { gsap, Draggable, InertiaPlugin } from '@/shared/lib/gsap';

/**
 * 스와이프 가능한 리스트 행.
 * 업무: 오른쪽으로 끌면 뒤의 힌트가 드러나고, 일정 거리/속도를 넘으면 `swipe`를 한 번 알린 뒤
 * 제자리로 돌아온다. 무엇을 의미하는지(완료 토글 등)는 소비자가 정한다 — 프리미티브는 도메인을 모른다.
 *
 * 세로 스크롤(가상 스크롤)과 공존하도록 가로 제스처만 가로채고, 버튼·체크박스 탭은 방해하지 않는다.
 */
@Component({
  selector: 'ui-list-item',
  template: `
    <div class="relative overflow-hidden rounded-md">
      <!-- 스와이프로 드러나는 완료 힌트 -->
      <div
        class="absolute inset-0 flex items-center justify-start bg-green px-lg font-medium text-ink-dark"
        aria-hidden="true"
      >
        완료
      </div>
      <div data-li-surface class="relative bg-surface-indigo">
        <ng-content />
      </div>
    </div>
  `,
})
export class ListItem {
  /** 스와이프가 임계치를 넘었을 때 한 번 발생한다. */
  readonly swipe = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.setupDrag());
  }

  private setupDrag(): void {
    const surface = this.host.nativeElement.querySelector<HTMLElement>('[data-li-surface]');
    if (!surface) return;

    const emit = () => this.swipe.emit();
    InertiaPlugin.track(surface, 'x');

    const [draggable] = Draggable.create(surface, {
      type: 'x',
      // 오른쪽으로만 끌어 힌트를 드러낸다. 왼쪽으로는 안 밀린다.
      bounds: { minX: 0, maxX: surface.offsetWidth },
      edgeResistance: 0.85,
      inertia: false,
      dragClickables: false, // 체크박스·버튼 탭은 드래그로 가로채지 않는다.
      onDragEnd() {
        const x = this['x'] as number;
        const velocity = InertiaPlugin.getVelocity(surface, 'x');
        const threshold = surface.offsetWidth * 0.4;
        // 충분히 끌었거나 빠르게 튕겼으면 한 번 알리고, 어느 쪽이든 제자리로 돌아온다.
        if (x > threshold || velocity > 800) emit();
        gsap.to(surface, { x: 0, duration: 0.3, ease: 'power3.out' });
      },
    });

    this.destroyRef.onDestroy(() => draggable.kill());
  }
}
