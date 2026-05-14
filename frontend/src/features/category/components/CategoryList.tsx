import { useState } from 'react';
import { useCategories } from '@/features/category/hooks/use-categories';
import CategoryItem from '@/features/category/components/CategoryItem';
import CategoryForm from '@/features/category/components/CategoryForm';
import type { Category } from '@/features/category/types/category-types';
import Button from '@/shared/components/Button';

interface CategoryListProps {
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export default function CategoryList({ selectedCategoryId, onSelectCategory }: CategoryListProps) {
  const { data: categories, isLoading, isError } = useCategories();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const isModalOpen = showCreateForm || editingCategory !== null;

  const handleCloseModal = () => {
    setShowCreateForm(false);
    setEditingCategory(null);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '1.5rem' }}>로딩 중...</div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '16px', color: 'var(--danger-color)', fontSize: '1.5rem' }}>
        카테고리를 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 10px' }}>
      <div
        style={{
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '1.4rem',
            fontWeight: 600,
            color: '#888888',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          카테고리
        </span>
        <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(true)}>
          + 추가
        </Button>
      </div>

      <div
        role="button"
        aria-pressed={selectedCategoryId === null}
        onClick={() => onSelectCategory(null)}
        style={{
          padding: '9px 14px',
          borderRadius: '20px',
          fontSize: '1.5rem',
          fontWeight: selectedCategoryId === null ? 600 : 400,
          color: selectedCategoryId === null ? '#6157EA' : '#464748',
          backgroundColor: selectedCategoryId === null ? 'rgba(97,87,234,0.1)' : 'transparent',
          cursor: 'pointer',
          marginBottom: '2px',
          transition: 'background-color 120ms ease',
        }}
      >
        전체
      </div>

      {categories?.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          isSelected={selectedCategoryId === category.id}
          onSelect={onSelectCategory}
          onEdit={setEditingCategory}
        />
      ))}

      {isModalOpen && (
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
              maxWidth: '380px',
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
              {editingCategory ? '카테고리 수정' : '카테고리 생성'}
            </h3>
            <CategoryForm
              mode={editingCategory ? 'edit' : 'create'}
              category={editingCategory ?? undefined}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
