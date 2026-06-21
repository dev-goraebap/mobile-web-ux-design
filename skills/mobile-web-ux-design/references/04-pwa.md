# +층 · PWA 셸 (마감)

## 무엇을 더하는 일인가

PWA는 앞의 세 층과 성격이 다르다. 1층부터 3층까지가 어떻게 느껴지는가를 만들었다면, 이 층은 그렇게 만든 UX를 설치 가능하고 오프라인에서도 도는 앱으로 포장한다. 그래서 새로운 디자인이 아니라 능력의 추가이고, 네 층 중 프레임워크가 가장 덜 중요한 층이다. 실체가 웹 플랫폼 표준(서비스 워커, manifest, 캐시)이라 누가 만들든 같은 API 위에서 돈다.

한 가지 오해를 먼저 풀어 두면 좋다. PWA는 모바일용 웹사이트가 아니다. 평범한 웹앱에 설치와 오프라인이라는 앱 능력을 점진적으로 덧입히는 것이고, 데스크톱에도 똑같이 설치된다. 모바일과 자주 엮이는 것은 정의가 아니라 쓰임새의 강조일 뿐이다.

## 스캐폴딩과 다듬기

Angular에서는 `ng add @angular/pwa` 한 번으로 서비스 워커, manifest, 아이콘, 캐싱 설정(`ngsw-config.json`)이 한꺼번에 들어온다. 기본 설정은 앱 셸을 precache 하므로 오프라인에서 셸이 뜬다. 남는 일은 manifest를 앱에 맞게 다듬는 것이다. 이름과 테마색, `display: standalone`, 언어 정도다. 레퍼런스는 `public/manifest.webmanifest`와 `ngsw-config.json`이다.

여기서 3층의 safe-area와 다시 만난다. `index.html`의 viewport에 `viewport-fit=cover`를 넣어야 노치 기기에서 inset이 실제 값을 갖는다. 설치된 standalone 화면에서 비로소 그 여백이 의미를 갖기 때문에, 이 한 줄이 3층의 작업을 완성시킨다.

## 설치 흐름

설치는 강요하지 않고 사용자가 원할 때 유도한다. 브라우저가 설치 가능 신호(`beforeinstallprompt`)를 주면 기본 안내를 막고 이벤트를 잡아 두었다가, 우리 UI(예: 설정의 "앱 설치")에서 프롬프트를 띄운다. 설치되었거나 신호가 없으면 그 진입점은 숨긴다.

```ts
win.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  this.deferred = e;            // 잡아 둔다
  this.canInstall.set(true);    // UI에 노출
});
// 사용자가 누를 때: await this.deferred.prompt();
```

레퍼런스는 `src/shared/lib/pwa-install.ts`다.

## 로컬에서 테스트하기

서비스 워커는 보통 개발 빌드에서 꺼 둔다(`enabled: !isDevMode()`). 그래서 `ng serve`로는 PWA 동작을 볼 수 없고, 프로덕션 빌드를 정적 서버로 띄워야 한다.

```bash
npm run build
npx http-server dist/<app>/browser -p 8080 -c-1
```

데스크톱에서는 이걸로 충분하다. `localhost`는 보안 컨텍스트라 서비스 워커가 등록된다. DevTools의 Application 탭에서 등록을 확인하고, Network를 Offline으로 바꿔 새로고침하면 오프라인 동작을 본다. 설치는 주소창 아이콘이나 앱 안의 설치 버튼으로 한다.

모바일에서 설치와 오프라인까지 확인하려면 한 가지 함정을 넘어야 한다. 같은 WiFi에서 PC의 LAN IP(`http://192.168...`)로 접속하면 모바일 UX는 보이지만 서비스 워커는 등록되지 않는다. 평문 HTTP의 LAN 주소는 보안 컨텍스트가 아니기 때문이다. 이때는 HTTPS 터널을 쓴다.

```bash
npx cloudflared tunnel --url http://localhost:8080   # 또는 ngrok
```

출력된 `https://...` 주소를 폰에서 열면 설치와 오프라인을 테스트할 수 있다.
