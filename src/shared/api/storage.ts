/**
 * 영속 저장소를 요청한다.
 * 업무: 기본 IndexedDB는 저장 공간 압박 시 브라우저가 비울 수 있다. persist를 받아 두면
 * 사용자가 직접 지우기 전까지 데이터가 유지된다. 권한이 없거나 거부돼도 앱은 정상 동작한다.
 *
 * @returns 영속 저장이 보장되면 true.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
