import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TodoFilter from './TodoFilter';
import type { TodoFilterParams } from '@/features/todo/types/todo-types';

const mockCategories = [
  { id: 'cat-1', name: '업무', is_default: true, user_id: null, created_at: '2026-05-14T00:00:00Z' },
  { id: 'cat-2', name: '운동', is_default: false, user_id: 'u1', created_at: '2026-05-14T00:00:00Z' },
];

function renderFilter(
  filterParams: TodoFilterParams = {},
  onFilterChange = vi.fn()
) {
  return render(
    <TodoFilter
      filterParams={filterParams}
      onFilterChange={onFilterChange}
      categories={mockCategories}
    />
  );
}

describe('TodoFilter', () => {
  it('전체/미완료/완료 탭이 렌더링된다', () => {
    renderFilter();
    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '미완료' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument();
  });

  it('카테고리 드롭다운이 렌더링된다', () => {
    renderFilter();
    expect(screen.getByRole('combobox', { name: '카테고리 필터' })).toBeInTheDocument();
  });

  it('카테고리 옵션이 표시된다', () => {
    renderFilter();
    expect(screen.getByRole('option', { name: '업무' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '운동' })).toBeInTheDocument();
  });

  it('is_completed 미설정 시 "전체" 탭이 활성 상태이다', () => {
    renderFilter({});
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('is_completed=false 시 "미완료" 탭이 활성 상태이다', () => {
    renderFilter({ is_completed: false });
    expect(screen.getByRole('button', { name: '미완료' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('is_completed=true 시 "완료" 탭이 활성 상태이다', () => {
    renderFilter({ is_completed: true });
    expect(screen.getByRole('button', { name: '완료' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('"미완료" 탭 클릭 시 is_completed: false로 onFilterChange가 호출된다', () => {
    const onFilterChange = vi.fn();
    renderFilter({}, onFilterChange);
    fireEvent.click(screen.getByRole('button', { name: '미완료' }));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ is_completed: false }));
  });

  it('"완료" 탭 클릭 시 is_completed: true로 onFilterChange가 호출된다', () => {
    const onFilterChange = vi.fn();
    renderFilter({}, onFilterChange);
    fireEvent.click(screen.getByRole('button', { name: '완료' }));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ is_completed: true }));
  });

  it('"전체" 탭 클릭 시 is_completed 없이 onFilterChange가 호출된다', () => {
    const onFilterChange = vi.fn();
    renderFilter({ is_completed: true }, onFilterChange);
    fireEvent.click(screen.getByRole('button', { name: '전체' }));
    const called = onFilterChange.mock.calls[0][0] as TodoFilterParams;
    expect(called.is_completed).toBeUndefined();
  });

  it('카테고리 선택 시 category_id와 함께 onFilterChange가 호출된다', () => {
    const onFilterChange = vi.fn();
    renderFilter({}, onFilterChange);
    fireEvent.change(screen.getByRole('combobox', { name: '카테고리 필터' }), {
      target: { value: 'cat-1' },
    });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: 'cat-1' })
    );
  });

  it('카테고리 "전체" 선택 시 category_id 없이 onFilterChange가 호출된다', () => {
    const onFilterChange = vi.fn();
    renderFilter({ category_id: 'cat-1' }, onFilterChange);
    fireEvent.change(screen.getByRole('combobox', { name: '카테고리 필터' }), {
      target: { value: '' },
    });
    const called = onFilterChange.mock.calls[0][0] as TodoFilterParams;
    expect(called.category_id).toBeUndefined();
  });
});
