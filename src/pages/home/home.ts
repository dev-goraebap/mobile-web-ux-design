import { Component, inject } from '@angular/core';
import { MovieRepository, type Movie } from '@/shared/api';
import { MovieCard } from '@/entities/movie';
import { OpenMovieService } from '@/features/open-movie';
import { SearchBox } from '@/widgets/search-box/search-box';

/**
 * 홈 — 영화 카탈로그(추천 + 전체).
 * 업무: 목록에서 영화를 누르면 상세를 연다. 데스크톱은 모달, 모바일은 페이지로 갈리지만
 * 이 화면은 그 분기를 모르고 OpenMovieService에 위임한다(ADR-0002).
 */
@Component({
  selector: 'page-home',
  imports: [MovieCard, SearchBox],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-10 px-5 py-6">
      <header class="flex flex-col gap-4">
        <div>
          <h1 class="text-3xl font-bold text-foreground">영화 카탈로그</h1>
          <p class="mt-1 text-muted-foreground">
            데스크톱은 모달로, 모바일은 페이지로 — 같은 영화를 환경에 맞게 엽니다.
          </p>
        </div>
        <search-box class="lg:max-w-sm" />
      </header>

      @if (movies.featured().length) {
        <section>
          <h2 class="mb-3 text-xl font-semibold text-foreground">추천</h2>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            @for (m of movies.featured(); track m.id) {
              <movie-card [movie]="m" (open)="openMovie($event)" />
            }
          </div>
        </section>
      }

      <section>
        <h2 class="mb-3 text-xl font-semibold text-foreground">전체</h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          @for (m of movies.all(); track m.id) {
            <movie-card [movie]="m" (open)="openMovie($event)" />
          }
        </div>
      </section>
    </div>
  `,
})
export default class Home {
  protected readonly movies = inject(MovieRepository);
  private readonly opener = inject(OpenMovieService);

  protected openMovie(movie: Movie): void {
    this.opener.open(movie.id);
  }
}
