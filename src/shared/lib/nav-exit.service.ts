import { Service, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

/**
 * 풀스크린 페이지/오버레이의 "닫기·뒤로".
 * 업무: 들어온 기록이 있으면 이전 화면으로 돌아가고(스크롤·상태 보존), 직접 링크로 진입해
 * 돌아갈 곳이 없으면 홈으로 보낸다. 풀스크린 검색·상세를 빠져나갈 때 갇히지 않게 한다.
 */
@Service()
export class NavExitService {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  backOrHome(): void {
    // 기술: 앱 내 진입 기록이 있으면(history.length > 1) 뒤로, 없으면 홈으로.
    if (history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigate(['/']);
    }
  }
}
