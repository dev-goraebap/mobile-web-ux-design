import { WritableSignal, effect, signal } from '@angular/core';

/**
 * localStorage에 동기화되는 쓰기 가능 시그널.
 * 업무: 설정처럼 단순한 키-값을 영속화하는 추상화다. 도메인을 모른다(FSD: shared).
 * 값이 바뀔 때마다 직렬화해 저장하고, 초기값은 저장된 값이 있으면 그것을 쓴다.
 *
 * 주입 컨텍스트에서 호출해야 한다(`effect` 사용) — 서비스 필드 초기화 등.
 */
export function localStorageSignal<T>(key: string, initialValue: T): WritableSignal<T> {
  const stored = localStorage.getItem(key);
  const state = signal<T>(stored !== null ? (JSON.parse(stored) as T) : initialValue);
  effect(() => localStorage.setItem(key, JSON.stringify(state())));
  return state;
}
