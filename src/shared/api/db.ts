import Dexie, { type EntityTable } from 'dexie';

/**
 * 할 일 한 건.
 * 업무: 도메인 모델의 최소 형태다. 재사용이 확인되면(Phase 3) `entities/todo`로 옮긴다.
 */
export interface Todo {
  id: string;
  title: string;
  done: boolean;
  /** 생성 시각(epoch ms). 정렬 기준이자 인덱스. */
  createdAt: number;
}

/**
 * 앱의 IndexedDB 스키마. 영속화 인프라일 뿐 업무 규칙은 두지 않는다(FSD: shared).
 */
class AppDB extends Dexie {
  // '!' — 스키마 정의 후 Dexie가 채워 넣는다.
  todos!: EntityTable<Todo, 'id'>;

  constructor() {
    super('responsive-ux');
    // id = 기본 키(문자열 UUID), done·createdAt = 인덱스(필터·정렬용).
    this.version(1).stores({
      todos: 'id, done, createdAt',
    });
  }
}

/** 단일 DB 인스턴스. 저장소 서비스만 직접 참조한다. */
export const db = new AppDB();
