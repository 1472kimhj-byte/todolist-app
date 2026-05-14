import { useState } from 'react';
import { useTodos } from '@/features/todo/hooks/use-todos';
import TodoItem from '@/features/todo/components/TodoItem';
import TodoForm from '@/features/todo/components/TodoForm';
import type { Todo, TodoFilterParams } from '@/features/todo/types/todo-types';

interface TodoListProps {
  filterParams?: TodoFilterParams;
}

export default function TodoList({ filterParams }: TodoListProps) {
  const { data: todos, isLoading, isError } = useTodos(filterParams);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '72px',
              backgroundColor: '#EFEFEF',
              borderRadius: '12px',
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 0',
          gap: '12px',
        }}
      >
        <p style={{ fontSize: '2.0rem', fontWeight: 600, color: '#464748' }}>
          오류가 발생했습니다
        </p>
        <p style={{ fontSize: '1.5rem', color: '#888888' }}>
          할일 목록을 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  if (!todos || todos.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 0',
          gap: '12px',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C8BDFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
        <p style={{ fontSize: '2.0rem', fontWeight: 600, color: '#464748' }}>
          할일이 없습니다
        </p>
        <p style={{ fontSize: '1.5rem', color: '#888888', textAlign: 'center' }}>
          새 할일을 추가해 보세요.
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onEdit={setEditingTodo} />
        ))}
      </div>

      {editingTodo && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(25,3,49,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '480px',
              width: 'calc(100% - 32px)',
              boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)',
            }}
          >
            <h3
              style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#190331',
                marginBottom: '20px',
              }}
            >
              할일 수정
            </h3>
            <TodoForm
              mode="edit"
              todo={editingTodo}
              onClose={() => setEditingTodo(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
