# 2층 · 헤드리스 프리미티브 (동작·접근성)

## 헤드리스라는 발상

헤드리스 프리미티브는 스타일 없이 동작과 접근성만 제공한다. 위치 계산, 포커스 트랩, 백드롭, 키보드 처리, 라이브 리전처럼 직접 구현하면 까다롭고 틀리기 쉬운 동작만 가져오고, 화면에 그려지는 마크업은 전부 우리 것(1층)으로 남긴다. 이 분리가 1층의 소유권을 가능하게 한다. 마크업이 우리 light DOM에 있으니 Tailwind가 모든 요소에 닿는다.

진영마다 이름이 다를 뿐 발상은 같다. Angular에서는 CDK가, React에서는 React Aria(훅 중심으로 CDK와 가장 닮았다)나 Radix(컴포넌트 중심)가, Svelte에서는 Melt UI나 Bits UI가 그 자리를 맡는다. 포지셔닝의 Floating UI나 가상 스크롤의 TanStack Virtual처럼 프레임워크에 무관한 코어도 많아, 실제로 갈아끼우는 부담은 생각보다 작다.

이 레포에서는 CDK에서 바텀시트나 모달을 띄우는 `Overlay`와 `Portal`, 포커스를 가두고 되돌리는 `ConfigurableFocusTrapFactory`, 스크린리더에 알리는 `LiveAnnouncer`, 적응형 분기의 기준이 되는 `BreakpointObserver`, 그리고 긴 목록을 위한 `CdkVirtualScrollViewport`를 차용한다.

## 접근성이 왜 이 층에 사는가

접근성을 디자인의 일부로 여기면 자꾸 빠뜨리게 된다. 더 정확한 관점은 이렇다. 접근성의 실체는 대부분 "어떻게 보이는가"가 아니라 "어떻게 동작하는가, 무엇으로 인식되는가"에 있다. 포커스 관리, 키보드 상호작용, ARIA의 역할과 관계, 스크린리더 알림은 모두 외형과 분리된다. 빨간 버튼이든 파란 버튼이든 똑같이 필요하다.

그래서 접근성은 외형 층이 아니라 동작 층에 둔다. 이 배치가 주는 실익은 두 가지다. 하나는 상속이다. 프리미티브가 포커스 트랩과 알림을 한 번 제대로 구현하면, 그 위에 올린 모든 컴포넌트가 올바른 접근성을 물려받는다. 다른 하나는 견고함이다. 접근성이 아래층에 있으니 위층에서 색과 여백을 마음껏 바꿔도 포커스와 키보드와 ARIA는 흔들리지 않는다.

다만 CDK의 위치를 정직하게 짚을 필요가 있다. CDK는 저수준이다. `FocusTrap`이나 `LiveAnnouncer` 같은 부품을 줄 뿐, 컴포넌트를 자동으로 접근성 완비로 만들어 주지는 않는다. ARIA의 역할과 레이블을 엮는 일은 우리가 1층 컴포넌트에서 직접 한다. React의 Radix나 React Aria는 이 배선을 더 많이 자동화한다는 점에서 결이 다르다.

## 헤드리스 위에 디자인만 얹기

원칙을 가장 잘 보여 주는 패턴은, 네이티브 요소가 접근성과 키보드를 공짜로 줄 때 그것을 버리지 않고 외형만 칠하는 것이다. 체크박스가 좋은 예다. 네이티브 `input`에 `appearance-none`을 주어 외형만 토큰으로 다시 그리고, 키보드와 포커스와 접근성은 네이티브에 그대로 맡긴다.

```ts
@Component({
  selector: 'ui-checkbox',
  template: `
    <input type="checkbox"
           class="peer appearance-none ... checked:bg-primary
                  focus-visible:ring-2 focus-visible:ring-primary"
           [checked]="checked()"
           (change)="checkedChange.emit($any($event.target).checked)"
           [attr.aria-label]="ariaLabel()" />
    <svg class="... opacity-0 peer-checked:opacity-100"><path d="M5 12l5 5L20 7"/></svg>
  `,
})
```

레퍼런스는 `src/shared/ui/checkbox/checkbox.ts`다.

## 숨김 스타일을 빠뜨리지 않기

헤드리스 라이브러리를 쓸 때 한 가지 함정이 있다. `LiveAnnouncer`는 스크린리더용 알림 영역을 DOM에 두고 `.cdk-visually-hidden`으로 감춘다. 그런데 그 클래스를 정의하는 접근성 스타일을 불러오지 않으면, 숨겨져야 할 알림 텍스트가 화면에 그대로 드러난다. 동작은 라이브러리가 주지만 그 동작을 가리는 스타일은 우리가 포함해야 한다는 점을 잊기 쉽다.

```css
@import '@angular/cdk/overlay-prebuilt.css';
@import '@angular/cdk/a11y-prebuilt.css';   /* .cdk-visually-hidden 정의 */
```

라이브러리마다 visually-hidden(sr-only) 스타일을 직접 포함해야 하는 경우가 있으니, 알림이 처음 떴을 때 화면에 텍스트가 남지 않는지 확인하는 습관을 들이는 편이 좋다.
