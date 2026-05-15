import { useState, useEffect } from 'react';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '@/features/todo/types/todo-types';
import { useCreateTodo } from '@/features/todo/hooks/use-create-todo';
import { useUpdateTodo } from '@/features/todo/hooks/use-update-todo';
import { useCategories } from '@/features/category/hooks/use-categories';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';

interface TodoFormProps {
  mode: 'create' | 'edit';
  todo?: Todo;
  onClose: () => void;
}

function toLocalDateStr(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TodoForm({ mode, todo, onClose }: TodoFormProps) {
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [dueDate, setDueDate] = useState(todo?.due_date ? toLocalDateStr(todo.due_date) : '');
  const [categoryId, setCategoryId] = useState(todo?.category_id ?? '');
  const [titleError, setTitleError] = useState('');

  const { data: categories } = useCategories();
  const { mutate: createTodo, isPending: isCreating } = useCreateTodo();
  const { mutate: updateTodo, isPending: isUpdating } = useUpdateTodo();

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description ?? '');
      setDueDate(todo.due_date ? toLocalDateStr(todo.due_date) : '');
      setCategoryId(todo.category_id ?? '');
    }
  }, [todo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('제목을 입력해주세요.');
      return;
    }

    if (mode === 'create') {
      const data: CreateTodoRequest = { title: title.trim() };
      if (description.trim()) data.description = description.trim();
      if (dueDate) data.due_date = dueDate;
      if (categoryId) data.category_id = categoryId;
      createTodo(data, { onSuccess: onClose });
    } else if (todo) {
      const data: UpdateTodoRequest = { title: title.trim() };
      data.description = description.trim() || undefined;
      if (dueDate) data.due_date = dueDate;
      if (categoryId) data.category_id = categoryId;
      updateTodo({ id: todo.id, data }, { onSuccess: onClose });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={mode === 'create' ? '할일 생성 폼' : '할일 수정 폼'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="제목 *"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleError('');
          }}
          error={titleError}
          placeholder="할일 제목 입력"
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label
            style={{ fontSize: '1.4rem', color: '#464748', marginBottom: '6px' }}
          >
            설명
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명 입력 (선택)"
            rows={3}
            style={{
              padding: '12px 16px',
              fontSize: '1.6rem',
              fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
              color: '#242428',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E5E5E5',
              borderRadius: '8px',
              outline: 'none',
              resize: 'vertical',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label
            style={{ fontSize: '1.4rem', color: '#464748', marginBottom: '6px' }}
          >
            카테고리
          </label>
          <select
            aria-label="카테고리 선택"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{
              height: '48px',
              padding: '0 16px',
              fontSize: '1.6rem',
              fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
              color: '#242428',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E5E5E5',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">기본 카테고리 자동 배정</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="마감일"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          취소
        </Button>
        <Button type="submit" size="sm" loading={isCreating || isUpdating}>
          {mode === 'create' ? '추가' : '저장'}
        </Button>
      </div>
    </form>
  );
}
