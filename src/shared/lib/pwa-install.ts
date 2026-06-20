import { DOCUMENT, Service, inject, signal } from '@angular/core';

/** 표준 lib에 없는 설치 프롬프트 이벤트의 최소 형태. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * 홈 화면 설치 흐름.
 * 업무: 브라우저가 설치 가능 신호(beforeinstallprompt)를 주면 잡아 두었다가, 사용자가
 * 원할 때 설치 프롬프트를 띄운다. 설치되거나 이벤트가 없으면 `canInstall`은 false다.
 */
@Service()
export class PwaInstallService {
  readonly canInstall = signal(false);
  private deferred: BeforeInstallPromptEvent | null = null;

  constructor() {
    const win = inject(DOCUMENT).defaultView;
    win?.addEventListener('beforeinstallprompt', (event) => {
      // 기본 미니 인포바를 막고 우리 UI로 유도한다.
      event.preventDefault();
      this.deferred = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });
    win?.addEventListener('appinstalled', () => {
      this.deferred = null;
      this.canInstall.set(false);
    });
  }

  async install(): Promise<void> {
    if (!this.deferred) return;
    await this.deferred.prompt();
    this.deferred = null;
    this.canInstall.set(false);
  }
}
