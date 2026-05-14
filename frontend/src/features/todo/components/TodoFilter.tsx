import type { TodoFilterParams } from '@/features/todo/types/todo-types';
import type { Category } from '@/features/category/types/category-types';

interface TodoFilterProps {
  filterParams: TodoFilterParams;
  onFilterChange: (params: TodoFilterParams) => void;
  categories: Category[];
}

type CompletionFilter = 'all' | 'active' | 'completed';

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 18px',
  fontSize: '1.5rem',
  fontWeight: active ? 700 : 500,
  color: active ? '#190331' : '#464748',
  backgroundColor: active ? '#FFFFFF' : 'transparent',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  boxShadow: active ? '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)' : 'none',
  transition: 'background-color 150ms ease, box-shadow 150ms ease',
});

export default function TodoFilter({ filterParams, onFilterChange, categories }: TodoFilterProps) {
  const getCompletionTab = (): CompletionFilter => {
    if (filterParams.is_completed === true) return 'completed';
    if (filterParams.is_completed === false) return 'active';
    return 'all';
  };

  const handleTabChange = (tab: CompletionFilter) => {
    const next = { ...filterParams };
    if (tab === 'all') {
      delete next.is_completed;
    } else {
      next.is_completed = tab === 'completed';
    }
    onFilterChange(next);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const next = { ...filterParams };
    if (val === '') {
      delete next.category_id;
    } else {
      next.category_id = val;
    }
    onFilterChange(next);
  };

  const currentTab = getCompletionTab();

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
      aria-label="할일 필터"
    >
      <div
        style={{
          backgroundColor: '#F2F2F2',
          borderRadius: '12px',
          padding: '4px',
          display: 'inline-flex',
          gap: '2px',
        }}
      >
        <button
          style={tabStyle(currentTab === 'all')}
          onClick={() => handleTabChange('all')}
          aria-pressed={currentTab === 'all'}
        >
          전체
        </button>
        <button
          style={tabStyle(currentTab === 'active')}
          onClick={() => handleTabChange('active')}
          aria-pressed={currentTab === 'active'}
        >
          미완료
        </button>
        <button
          style={tabStyle(currentTab === 'completed')}
          onClick={() => handleTabChange('completed')}
          aria-pressed={currentTab === 'completed'}
        >
          완료
        </button>
      </div>

      <select
        aria-label="카테고리 필터"
        value={filterParams.category_id ?? ''}
        onChange={handleCategoryChange}
        style={{
          height: '40px',
          padding: '0 12px',
          fontSize: '1.5rem',
          fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
          color: '#242428',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E5E5E5',
          borderRadius: '8px',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="">전체 카테고리</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
