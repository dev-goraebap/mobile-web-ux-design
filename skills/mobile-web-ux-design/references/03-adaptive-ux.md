# 3층 · 모바일 UX

이 층이 작업의 대부분을 차지한다. 1층의 토큰과 2층의 헤드리스 동작을 가져다, 모바일에서 앱 같다는 느낌을 실제로 만드는 곳이다. 네 가지 주제, 곧 적응형과 safe-area와 제스처와 가상 스크롤이 여기서 모인다.

## 적응형에는 두 층위가 있다

반응형을 한 덩어리로 다루면 길을 잃는다. 두 층위로 나누는 편이 분명하다.

첫째는 유틸리티 반응형이다. 레이아웃은 그대로 두고 크기와 간격만, 혹은 방향만 바꾸는 경우다. 이런 전환은 CSS로 충분하며, Tailwind의 모바일 우선 접두(`tablet:`, `laptop:`)로 처리한다. 내비게이션이 좋은 예다. 하단 탭바와 사이드 레일은 같은 항목을 방향만 바꿔 배치하는 것이므로, 브레이크포인트 관찰 없이 `flex-col-reverse`와 `laptop:flex-row`만으로 전환된다(`src/widgets/app-nav/app-nav.ts`).

둘째는 구조적 적응이다. 크기 조정으로는 안 되고 레이아웃 자체가 달라지는 경우다. 이때 비로소 `BreakpointObserver`로 분기한다. 바텀시트와 모달이 그렇다. 둘은 위치도 동작도 다른 별개의 표현이라 CSS만으로는 갈리지 않는다. 기준점은 시그널 하나로 노출해 한 곳에서 관리한다.

```ts
@Service()
export class BreakpointService {
  private readonly observer = inject(BreakpointObserver);
  readonly isMobile = toSignal(
    this.observer.observe('(max-width: 767.98px)').pipe(map((s) => s.matches)),
    { initialValue: false },
  );
}
```

레퍼런스는 `src/shared/lib/breakpoint.ts`다. 어느 층위로 풀지 판단하는 기준은 단순하다. CSS로 표현이 갈리면 1층위, 갈리지 않으면 2층위다.

## 적응형 시트를 가장 먼저 만든다

시트 하나가 이후 모든 패턴의 참조 구현이 된다. 같은 컨텐츠를 모바일에서는 아래에서 올라오는 바텀시트로, 데스크톱에서는 가운데 모달로 보여 주되, 그 분기를 컴포넌트 안에 가둬 화면 코드는 신경 쓰지 않게 한다. 소비자는 열림 상태와 투영 컨텐츠만 다룬다.

```html
<ui-sheet [(open)]="open" heading="할 일 추가"> ...폼... </ui-sheet>
```

내부는 헤드리스 동작의 집합이다. CDK `Overlay`로 띄우고, `FocusTrap`으로 포커스를 가두고, 백드롭 클릭과 Esc로 닫고, `role="dialog"`, `aria-modal`, `aria-labelledby`를 엮는다. 위치 전략만 모바일과 데스크톱에서 다르게 준다. 모바일은 바닥에 붙이고 데스크톱은 가운데에 둔다. 레퍼런스는 `src/shared/ui/sheet/sheet.ts`다.

여기서 작은 함정을 하나 만난다. 시트 본문을 `overflow-y-auto`로 스크롤되게 두면, 본문 맨 위에 붙은 첫 입력란의 포커스 링(요소 바깥으로 그려지는 그림자)이 스크롤 클리핑 박스 경계에서 잘린다. 본문에 작은 상단 inset(`pt-1`)을 주어 콘텐츠를 띄우면 해결된다.

또 하나, 모바일에서 시트가 열릴 때 첫 입력란에 자동 포커스를 주면 키보드가 함께 올라온다. 접근성상 포커스를 시트 안으로 옮기는 것은 필수지만 그 대상이 입력란일 필요는 없다. 기본값은 다이얼로그 컨테이너 자체에 포커스를 주어 키보드를 띄우지 않고, 입력이 목적인 폼에서만 소비자가 입력란 포커스를 선택하게 한다.

## safe-area는 viewport-fit과 짝이다

노치가 있는 기기에서 콘텐츠가 시스템 UI에 가리지 않게 하려면 `env(safe-area-inset-*)`로 여백을 준다. 시트 하단이나 떠 있는 버튼이 대표적이다.

```css
padding-bottom: calc(env(safe-area-inset-bottom) + var(--spacing-lg));
```

다만 이 값이 실제로 0이 아닌 값을 가지려면 `index.html`의 viewport에 `viewport-fit=cover`가 있어야 한다. 이것이 빠지면 inset은 늘 0이라 코드가 맞아도 효과가 없다. 그래서 safe-area는 4층(PWA)의 standalone 맥락과도 이어진다. 브라우저 탭 안에서는 시스템이 노치 영역을 먹지만, 설치된 전체화면에서 비로소 inset이 의미를 갖는다.

## 제스처는 속도까지 본다

끌어서 닫기와 스와이프는 CSS로는 안 된다. 포인터 이벤트를 직접 짜는 길도 있지만, 던진 속도를 재는 일이 번거로워 GSAP의 `Draggable`과 `InertiaPlugin`을 쓴다. 등록은 한 곳에 모아 둔다(`src/shared/lib/gsap.ts`).

판정의 핵심은 거리와 속도를 함께 보는 것이다. 손을 떼는 순간, 충분히 끌었거나(예: 높이의 40% 초과) 빠르게 내쳤으면(예: 900px/s 초과) 닫고, 그렇지 않으면 제자리로 스냅한다. 거리만 보면 천천히 많이 끈 경우와 빠르게 살짝 튕긴 경우를 같게 취급해 손맛이 죽는다.

```ts
onDragEnd() {
  const dragged = this['y'] as number;
  const velocity = InertiaPlugin.getVelocity(panelEl, 'y');
  if (dragged > panelEl.offsetHeight * 0.4 || velocity > 900) close();
  else gsap.to(panelEl, { y: 0, duration: 0.3, ease: 'power3.out' });
}
```

제스처를 손잡이 같은 특정 영역에서만 시작하게 하고(`trigger`), 버튼이나 입력 같은 클릭 요소는 드래그로 가로채지 않게 한다(`dragClickables: false`). 가로 스와이프는 세로 스크롤과 공존해야 하므로 비드래그 방향의 네이티브 스크롤은 살려 둔다. 레퍼런스는 `src/shared/ui/sheet/sheet.ts`(세로)와 `src/shared/ui/list-item/list-item.ts`(가로)다.

스와이프 행에서 만나는 시각 함정도 적어 둔다. 둥근 모서리로 클리핑한 표면 뒤에 색 레이어(완료 힌트)를 깔면, 표면 모서리 곡선의 안티앨리어싱 너머로 뒤 색이 1px쯤 비친다. 컨테이너 배경을 표면색으로 두고 힌트를 2px 안으로 들여 같은 라운드를 주면, 곡선 뒤가 표면색이 되어 비침이 사라진다.

## 가상 스크롤은 보이는 것만 그린다

목록이 길어지면 모든 항목을 DOM에 두는 비용이 커진다. CDK의 `*cdkVirtualFor`는 화면에 보이는 항목만 렌더하고 스크롤하며 DOM을 재활용해, 항목이 수천 개여도 일정한 비용을 유지한다. 이것은 네이티브 제어 흐름(`@for`)에 가상화 대안이 아직 없어 쓰는, 의도된 예외다.

```html
<cdk-virtual-scroll-viewport itemSize="72" class="flex-1" role="list">
  <ui-list-item *cdkVirtualFor="let todo of todos(); trackBy: trackById" role="listitem" ...>
```

두 가지를 맞춰 줘야 한다. 뷰포트는 높이가 정해져야 하고(여기서는 `flex-1`), `itemSize`는 각 행의 실제 높이와 일치해야 한다. 고정 크기 전략이 측정 없이 위치를 계산하므로, 행 높이가 `itemSize`와 어긋나면 정렬이 무너진다. 항목이 재활용되면서 컴포넌트 인스턴스가 재사용된다는 점도 알아 두면 좋다. 인스턴스에 붙인 제스처(Draggable)가 그대로 살아 있어 문제없이 동작한다. 의미 구조를 위해 뷰포트에 `role="list"`, 항목에 `role="listitem"`을 더한다.
