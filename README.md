# Angular Responsive UX

> 모바일 웹 UI를 네이티브 앱에 가깝게 다듬는 방법을 하나씩 검증하는 데모 프로젝트입니다.
> 바텀시트, 제스처, safe-area, 네이티브 스크롤 감성 같은 패턴을 직접 구현하며,
> 그 과정에서 내린 설계 결정과 근거를 함께 기록합니다.

이 프로젝트는 완성된 UI 라이브러리를 채택하는 대신, **디자인을 직접 소유하는** 쪽을 택했습니다. 그 선택의 의미와 비용을 아래에 정리합니다.

---

## 기술 결정

| 항목 | 결정 |
|------|------|
| 프레임워크 | Angular 22 — standalone · signals · 새 control flow |
| UI 토대 | Angular CDK 단독 — 동작과 접근성만, 스타일 없음 |
| 스타일 | Tailwind CSS v4 — 자체 디자인 토큰으로 매핑 |
| 렌더링 | CSR (클라이언트 전용) — app-shell 모델 |
| 앱 형태 | PWA — service worker + manifest |

### CDK와 Tailwind를 함께 쓰는 이유

UI 라이브러리를 선택할 때의 핵심 트레이드오프는 **스타일 제어권**입니다.

Ionic이나 Material 컴포넌트는 마크업을 Shadow DOM 안에 캡슐화합니다. 캡슐화는 컴포넌트의 스타일을 외부로부터 보호한다는 이점이 있지만, 그 대가로 바깥에서 정의한 Tailwind 클래스가 컴포넌트 내부까지 닿지 못합니다. 디자인의 상당 부분을 라이브러리의 디자인 언어에 위임하게 됩니다.

Angular CDK는 다른 모델을 따릅니다. CDK는 **헤드리스 프리미티브** — 위치 계산, 포커스 트랩, 백드롭, 접근성처럼 구현이 까다로운 동작만 디렉티브와 서비스로 제공하고, 화면에 렌더링되는 마크업은 전부 애플리케이션의 light DOM에 남깁니다. 그 결과 Tailwind가 모든 요소에 적용됩니다. 디자인 자유도와 검증된 동작·접근성을 동시에 얻기 위해 이 조합을 택했습니다.

### CSR을 사용하는 이유

이 프로젝트는 클라이언트 사이드 렌더링(CSR)을 사용합니다. 그 배경을 정확히 짚으려면, 먼저 서버 사이드 렌더링(SSR)의 이점을 인정하는 데서 시작하는 것이 옳습니다.

SSR에는 분명한 이점이 있습니다. 서버가 완성된 HTML을 내려주므로 첫 화면이 빠르게 그려지고(First Contentful Paint), 검색 엔진과 소셜 미리보기가 콘텐츠를 바로 읽을 수 있습니다. 초기 렌더링 부담이 사용자 기기에서 서버로 옮겨가므로 저사양 환경에서도 유리합니다. 최신 메타프레임워크 대부분이 SSR을 기본으로 되살린 이유가 여기에 있습니다.

다만 이 이점을 **풍부한 클라이언트 상호작용과 동시에** 누리려 할 때 조율 비용이 생깁니다. 서버가 그린 HTML 위에 클라이언트 자바스크립트가 이벤트와 상태를 다시 연결하는 과정(하이드레이션)이 필요하고, 어떤 화면을 서버에서 그리고 어떤 화면을 클라이언트에 맡길지 라우트 단위로 결정해야 합니다. 이 조율 자체가 하나의 설계 영역입니다.

그런데 이 프로젝트의 화면을 구성하는 요소 대부분 — 바텀시트, 제스처, safe-area, 스크롤 감성 — 은 브라우저 런타임에 의존합니다. 서버에는 이들을 미리 렌더링할 정보가 없으므로, SSR이 가져다줄 이점이 여기서는 작습니다. 반면 SSR을 도입하면 클라이언트 전용 코드를 서버 환경에서 보호하고 하이드레이션을 조율하는 비용이 더해집니다. 이 맥락에서는 CSR의 단순함이 더 큰 이득입니다.

SSR과 CSR을 라우트별로 조율해 양쪽의 이점을 함께 취하는 방법 — 하이드레이션 전략, 부분 하이드레이션, 라우트별 렌더 모드 — 은 그 자체로 깊이 있는 주제입니다. 이 데모의 취지와는 결이 다르므로, 별도 프로젝트에서 다룹니다.

> 기술 스택 선택의 배경은 [docs/01.기획/리서치.md](docs/01.%EA%B8%B0%ED%9A%8D/%EB%A6%AC%EC%84%9C%EC%B9%98.md)에, 확정된 범위와 기능은 [docs/01.기획/프로젝트-브리프.md](docs/01.%EA%B8%B0%ED%9A%8D/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EB%B8%8C%EB%A6%AC%ED%94%84.md)에 정리되어 있습니다.

---

## 아키텍처

책임을 네 개의 층으로 나눕니다.

```
1. 디자인 시스템 (소유)   ── Tailwind 토큰 + 토큰으로 감싼 자체 컴포넌트
2. 헤드리스 프리미티브     ── Angular CDK (동작·접근성, 스타일 없음)
3. 모바일 UX 레이어        ── CDK + CSS + GSAP (적응형·제스처·애니메이션)
4. PWA 셸                  ── service worker · manifest · 오프라인 캐싱
```

1~3층이 "어떻게 느껴지는가"(본질), 4층은 "어떻게 전달되는가"(마감)입니다. 이 중 3층, 모바일 UX 레이어가 작업의 대부분을 차지하며, 여기서 책임을 나눕니다.

- **CDK가 담당** — Overlay(바텀시트·모달), BreakpointObserver(적응형 분기), Scrolling(가상 스크롤), A11y(FocusTrap·LiveAnnouncer), Portal. 검증된 동작은 다시 만들지 않습니다.
- **GSAP이 담당** — 고수준 제스처(Draggable + InertiaPlugin로 끌어서 닫기·스와이프, 속도 기반 스냅/닫기 판정)와 열기·닫기 애니메이션(transform·opacity만). CSS만으로 안 되는 "던진 속도 측정"이 필요해 도입했습니다.
- **CSS가 담당** — safe-area `env(safe-area-inset-*)`, 적응형 내비 방향 전환(반응형 유틸리티), 테마 토큰 스왑·전환.

여기에 한 가지 원칙을 적용합니다. **Tailwind 클래스는 구현 디테일이며, 공개 API가 아닙니다.** 디자인 시스템은 클래스 이름이 아니라 컴포넌트를 노출합니다. 클래스 이름을 외부에 노출하면 그것이 사실상의 API가 되어, 이후 내부 구현을 바꾸기 어려워지기 때문입니다.

---

## 시작하기

### 요구 사항

- Node.js 22.22.3+ / 24.15.0+ / 26.0.0+ (Angular 22 기준, Node 20 미지원)
- npm 11+

### 개발 서버

```bash
npm start        # = ng serve, http://localhost:4200
```

소스를 저장하면 화면이 자동으로 갱신됩니다. 데스크톱에서 창 폭을 1024px 경계로 넓혔다 줄이면
시트(모달 ↔ 바텀시트)와 내비(레일 ↔ 탭바)가 전환되는 걸 볼 수 있습니다.

### 같은 WiFi에서 모바일로 보기

개발 서버를 LAN에 노출합니다.

```bash
npm start -- --host 0.0.0.0
```

PC의 WiFi IPv4 주소를 확인합니다.

```bash
# Windows — "무선 LAN 어댑터 Wi-Fi"의 IPv4 주소
ipconfig
# macOS
ipconfig getifaddr en0
# Linux
hostname -I
```

폰을 **같은 WiFi**에 두고 `http://<그-IP>:4200`을 엽니다 (예: `http://192.168.0.10:4200`).

> 💡 안 열리면 **방화벽**이 Node를 막는 경우가 많습니다 — 실행 시 뜨는 허용 창에서 **개인 네트워크**를 허용하세요(Windows).
>
> ⚠️ 이건 **개발 서버라 서비스 워커가 꺼져 있습니다.** 모바일 UX(시트·제스처·safe-area)는 이걸로 충분히 확인되고, 설치·오프라인은 아래 "PWA 로컬 테스트"를 보세요.

### 빌드

```bash
npm run build    # dist/ 에 프로덕션 빌드 산출
```

### PWA 로컬 테스트 (설치 · 오프라인)

서비스 워커는 `enabled: !isDevMode()`라 **프로덕션 빌드에서만** 동작합니다. 빌드 후 정적 서버로 띄웁니다.

```bash
npm run build
npx http-server dist/angular-responsive-ux/browser -p 8080 -c-1
# http://localhost:8080
```

- **데스크톱** — `localhost`는 보안 컨텍스트라 그대로 됩니다.
  - DevTools → Application → **Service Workers**에서 등록 확인
  - DevTools → Network → **Offline** 체크 후 새로고침 → 오프라인 동작 확인
  - 주소창 설치 아이콘 또는 앱 내 **설정 → 앱 설치**로 설치
- **모바일에서 설치/오프라인까지** 보려면 ⚠️ **HTTPS가 필요**합니다. LAN IP(`http://192.168...`)는 보안 컨텍스트가 아니라 서비스 워커가 등록되지 않습니다. HTTPS 터널을 쓰세요.

  ```bash
  npx cloudflared tunnel --url http://localhost:8080   # 또는 ngrok
  ```

  출력된 `https://...` 주소를 폰에서 열면 설치·오프라인을 테스트할 수 있습니다.

### 테스트 (Vitest)

```bash
npm test
```

---

## 구현 현황

핵심 데모 범위(디자인 시스템 → 모바일 UX → PWA)가 구현되어 있습니다.

- [x] **디자인 토큰** — `styles.css` `@theme`(Discord 기반), 다크 기본 + 라이트 스왑
- [x] **프리미티브** — Button · Sheet · ListItem · Snackbar · Checkbox (`shared/ui`)
- [x] **적응형 Sheet** — CDK Overlay + BreakpointObserver, 끌어서 닫기(GSAP)
- [x] **적응형 Nav** — 하단 탭바 ↔ 사이드 레일
- [x] **데이터 레이어** — Dexie + liveQuery → signal, 영속 저장 요청
- [x] **할 일 기능** — 가상 스크롤 목록, 추가(시트)·완료 토글·삭제·되돌리기
- [x] **테마 전환** — 설정에서 다크/라이트, localStorage 영속
- [x] **PWA 셸** — service worker · manifest · 설치 흐름

> 클라이언트 전용 동작(제스처·storage·DOM 접근)은 `afterNextRender()` 등으로 렌더 시점을 명확히 둡니다. CSR이어도 이 규율을 지키면 이후 별도 SSR 프로젝트로 옮길 여지가 남습니다.

---

## 코드 스캐폴딩

```bash
ng generate component features/bottom-sheet   # 컴포넌트
ng generate --help                            # 전체 스키매틱 목록
```

## 참고 자료

- [Angular CLI 명령 레퍼런스](https://angular.dev/tools/cli)
- [Angular CDK](https://material.angular.dev/cdk/categories)
- [Tailwind CSS v4](https://tailwindcss.com/)
