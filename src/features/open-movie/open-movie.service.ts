import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { BreakpointService } from '@/shared/lib';
import { MovieDetail } from '@/entities/movie';

/**
 * 영화 상세 열기 — 환경에 맞는 표현으로 분기한다(ADR-0002·0003).
 * 업무: 모바일은 풀스크린 페이지로 이동하고, 데스크톱은 목록을 둔 채 모달로 띄운다.
 * 어느 쪽이든 URL은 `/movies/:id`로 동일해 공유·새로고침·뒤로가기가 일관된다.
 */
@Injectable({ providedIn: 'root' })
export class OpenMovieService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly dialog = inject(HlmDialogService);
  private readonly bp = inject(BreakpointService);

  open(id: string): void {
    if (this.bp.isMobile()) {
      void this.router.navigate(['/movies', id]);
      return;
    }

    // 데스크톱: 목록을 두고 모달로. URL을 바꿔 공유·새로고침을 살린다(canonical은 동일 라우트).
    const path = `/movies/${id}`;
    this.location.go(path);

    const ref = this.dialog.open(MovieDetail, {
      context: { movieId: id },
      contentClass: 'w-full sm:max-w-2xl',
    });

    // 기술: 뒤로가기(popstate) → 모달 닫기. CloseWatcher 일반화는 ADR-0003의 후속 작업.
    const sub = this.location.subscribe(() => ref.close());
    // 모달 안에서 라우터 이동(예: 로그인)이 일어나면 모달을 닫는다(오버레이가 새 페이지 위에 남지 않게).
    const navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationStart))
      .subscribe(() => ref.close());
    ref.closed$.subscribe(() => {
      sub.unsubscribe();
      navSub.unsubscribe();
      // X·스크림·Esc로 직접 닫은 경우 우리가 넣은 히스토리 항목을 되돌린다(desync 방지).
      if (this.location.path() === path) this.location.back();
    });
  }
}
