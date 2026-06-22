# 이 프로젝트 (에이전트 온보딩)

반응형 웹 UX 전략 데모. 영화 카탈로그 도메인 위에서 데스크톱·모바일 웹 각각에 맞는 인터랙션(적응형 모달/페이지·뒤로가기·제스처·safe-area)을 구현·검증한다. SSR은 다루지 않는다(자매 프로젝트 `angular-ssr-design`의 주제).
스택: Angular 22 + CDK + Tailwind v4, CSR PWA, IndexedDB(Dexie) + localStorage.

## 먼저 읽을 문서 (순서)

1. `docs/01.기획/프로젝트-브리프.md` — 확정 범위·기능·스택·도메인 모델 (상태의 단일 진실 소스)
2. `docs/01.기획/` 리서치 3종 — `리서치.md`(기술 스택), `모바일-인터랙션-리서치.md`(웹/모바일 UX 패턴), `데이터-저장-리서치.md`(브라우저 저장소)
3. `docs/02.설계/` — 기술·UX 결정을 담은 ADR 모음 (`README.md`가 인덱스)

기획(무엇을·왜) → 리서치(검토한 선택지·근거) → 설계(ADR로 내린 결정) 순으로 좁혀진다.

## 도구

- 상세 Angular 모범 사례는 아래 규칙 외에 Angular MCP(`ng mcp`)와 `angular-developer` 스킬로 보강한다.
- 현재 진행 상황은 docs 문서와 git log 이력으로 파악한다.

---

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
