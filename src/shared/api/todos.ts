import { Service } from '@angular/core';
import { db, type Todo } from './db';
import { liveQuerySignal } from '@/shared/lib';

/**
 * 할 일 저장소.
 * 업무: IndexedDB 접근을 한 곳에 가둔다. 화면 코드는 Dexie를 모르고, 시그널과 메서드만 쓴다.
 */
@Service()
export class TodoStore {
  /** 전체 목록(최신순). liveQuery가 DB 변경을 자동 반영하므로 별도 새로고침이 없다. */
  readonly todos = liveQuerySignal<Todo[]>(
    () => db.todos.orderBy('createdAt').reverse().toArray(),
    [],
  );

  async add(title: string): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) return;
    await db.todos.add({
      id: crypto.randomUUID(),
      title: trimmed,
      done: false,
      createdAt: Date.now(),
    });
  }

  async toggle(id: string): Promise<void> {
    const todo = await db.todos.get(id);
    if (!todo) return;
    await db.todos.update(id, { done: !todo.done });
  }

  async remove(id: string): Promise<void> {
    await db.todos.delete(id);
  }
}
