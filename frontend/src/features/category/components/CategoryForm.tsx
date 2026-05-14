import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Category } from '@/features/category/types/category-types';
import { updateCategory } from '@/features/category/api/category-api';
import { useCreateCategory } from '@/features/category/hooks/use-create-category';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';

interface CategoryFormProps {
  mode: 'create' | 'edit';
  category?: Category;
  onClose: () => void;
}

export default function CategoryForm({ mode, category, onClose }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [error, setError] = useState('');

  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();

  const queryClient = useQueryClient();
  const { mutate: editCategory, isPending: isEditing } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) => updateCategory(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
  });

  useEffect(() => {
    if (category) setName(category.name);
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }
    if (mode === 'create') {
      createCategory({ name: trimmed }, { onSuccess: onClose });
    } else if (category) {
      editCategory({ id: category.id, data: { name: trimmed } });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={mode === 'create' ? '카테고리 생성 폼' : '카테고리 수정 폼'}
    >
      <Input
        label="카테고리 이름"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError('');
        }}
        error={error}
        placeholder="카테고리 이름 입력"
      />
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          취소
        </Button>
        <Button type="submit" size="sm" loading={isCreating || isEditing}>
          {mode === 'create' ? '생성' : '수정'}
        </Button>
      </div>
    </form>
  );
}
