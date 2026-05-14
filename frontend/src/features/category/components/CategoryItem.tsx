import { useState } from 'react';
import type { Category } from '@/features/category/types/category-types';
import { useDeleteCategory } from '@/features/category/hooks/use-delete-category';
import Button from '@/shared/components/Button';

interface CategoryItemProps {
  category: Category;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (category: Category) => void;
}

export default function CategoryItem({ category, isSelected, onSelect, onEdit }: CategoryItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate: deleteCategory, isPending } = useDeleteCategory();

  const handleDelete = () => {
    deleteCategory(category.id, { onSuccess: () => setShowConfirm(false) });
  };

  return (
    <>
      <div
        style={{
          padding: '9px 14px',
          borderRadius: '20px',
          fontSize: '1.5rem',
          fontWeight: isSelected ? 600 : 400,
          color: isSelected ? '#6157EA' : '#464748',
          backgroundColor: isSelected ? 'rgba(97,87,234,0.1)' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background-color 120ms ease',
          marginBottom: '2px',
        }}
        onClick={() => onSelect(category.id)}
        role="button"
        aria-label={`${category.name} 선택`}
        aria-pressed={isSelected}
      >
        <span>{category.name}</span>
        {!category.is_default && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
              aria-label={`${category.name} 수정`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#888888',
                fontSize: '1.2rem',
                padding: '2px 6px',
              }}
            >
              수정
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
              aria-label={`${category.name} 삭제`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#E1535D',
                fontSize: '1.2rem',
                padding: '2px 6px',
              }}
            >
              삭제
            </button>
          </div>
        )}
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
            <p style={{ fontSize: '1.6rem', color: '#242428', marginBottom: '20px' }}>
              '{category.name}' 카테고리를 삭제하시겠습니까?
              <br />
              소속 할일은 기본 카테고리로 이동됩니다.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirm(false)}
              >
                취소
              </Button>
              <Button variant="danger" size="sm" loading={isPending} onClick={handleDelete}>
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
