import { useState } from 'react';
import type { Todo } from '@/features/todo/types/todo-types';
import { useToggleTodo } from '@/features/todo/hooks/use-toggle-todo';
import { useDeleteTodo } from '@/features/todo/hooks/use-delete-todo';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import Button from '@/shared/components/Button';

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default function TodoItem({ todo, onEdit }: TodoItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { mutate: toggleTodo, isPending: isToggling } = useToggleTodo();
  const { mutate: deleteTodo, isPending: isDeleting } = useDeleteTodo();
  
  const isMobile = useMediaQuery('(max-width: 767px)');

  const overdue = isOverdue(todo.due_date);

  const handleDelete = () => {
    deleteTodo(todo.id, { onSuccess: () => setShowConfirm(false) });
  };

  const showActions = isMobile || isHovered;

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: todo.is_completed ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
          border: `1.5px solid var(--border-subtle)`,
          borderRadius: '12px',
          padding: '16px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          transition: 'border-color 150ms ease',
        }}
      >
        <button
          onClick={() => toggleTodo(todo.id)}
          disabled={isToggling}
          aria-label={todo.is_completed ? '미완료로 표시' : '완료로 표시'}
          style={{
            flexShrink: 0,
            width: '20px',
            height: '20px',
            borderRadius: '6px',
            border: todo.is_completed ? 'none' : '2px solid var(--border-color)',
            backgroundColor: todo.is_completed ? 'var(--primary-color)' : 'var(--bg-secondary)',
            cursor: isToggling ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 150ms ease, border-color 150ms ease',
            padding: 0,
            marginTop: '2px',
          }}
        >
          {todo.is_completed && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <span
              style={{
                fontSize: '1.6rem',
                fontWeight: 600,
                color: todo.is_completed ? 'var(--text-muted)' : 'var(--text-body)',
                textDecoration: todo.is_completed ? 'line-through' : 'none',
                transition: 'color 200ms ease',
                wordBreak: 'break-word',
              }}
            >
              {todo.title}
            </span>
            <div style={{ 
              display: 'flex', 
              gap: '4px', 
              flexShrink: 0,
              opacity: showActions ? 1 : 0,
              transition: 'opacity 150ms ease',
              pointerEvents: showActions ? 'auto' : 'none',
            }}>
              <button
                onClick={() => onEdit(todo)}
                aria-label={`${todo.title} 수정`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '1.3rem',
                  padding: '2px 6px',
                }}
              >
                수정
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                aria-label={`${todo.title} 삭제`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--danger-color)',
                  fontSize: '1.3rem',
                  padding: '2px 6px',
                }}
              >
                삭제
              </button>
            </div>
          </div>

          {todo.description && (
            <p
              style={{
                fontSize: '1.4rem',
                color: todo.is_completed ? 'var(--text-muted)' : 'var(--text-secondary)',
                marginTop: '4px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {todo.description}
            </p>
          )}

          {todo.due_date && (
            <p
              style={{
                fontSize: '1.4rem',
                fontWeight: overdue ? 500 : 400,
                color: overdue ? 'var(--danger-color)' : 'var(--text-muted)',
                marginTop: '4px',
              }}
            >
              마감: {todo.due_date}
            </p>
          )}
        </div>
      </div>

      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--modal-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '380px',
              width: 'calc(100% - 32px)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <p style={{ fontSize: '1.6rem', color: 'var(--text-body)', marginBottom: '20px' }}>
              '{todo.title}' 할일을 삭제하시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={() => setShowConfirm(false)}>
                취소
              </Button>
              <Button variant="danger" size="sm" loading={isDeleting} onClick={handleDelete}>
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
