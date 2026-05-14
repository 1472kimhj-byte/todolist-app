import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { logout } from '@/features/auth/api/auth-api';
import { useCategories } from '@/features/category/hooks/use-categories';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { useThemeStore } from '@/shared/store/theme-store';
import { Moon, Sun } from 'lucide-react';
import CategoryList from '@/features/category/components/CategoryList';
import TodoFilter from '@/features/todo/components/TodoFilter';
import TodoList from '@/features/todo/components/TodoList';
import TodoForm from '@/features/todo/components/TodoForm';
import type { TodoFilterParams } from '@/features/todo/types/todo-types';

export default function TodoListPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [filterParams, setFilterParams] = useState<TodoFilterParams>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(max-width: 1023px)');

  const handleSelectCategory = (id: string | null) => {
    setSelectedCategoryId(id);
    setFilterParams((prev) => {
      const next = { ...prev };
      if (id === null) {
        delete next.category_id;
      } else {
        next.category_id = id;
      }
      return next;
    });
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  };

  const handleFilterChange = (params: TodoFilterParams) => {
    setFilterParams(params);
  };

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await logout(refreshToken);
      } catch {
        // 실패해도 로컬 상태 초기화 진행
      }
    }
    clearAuth();
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      <nav
        aria-label="메인 네비게이션"
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--bg-secondary)',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 24px',
          boxShadow: 'var(--nav-shadow)',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMobile && (
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              aria-label="카테고리 메뉴"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          <span
            style={{
              fontSize: isMobile ? '1.8rem' : '2.0rem',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              color: '#6157EA',
            }}
          >
            {isMobile ? 'Todo' : 'TodoListApp'}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
            }}
          >
            {theme === 'dark' ? (
              <Sun size={20} color="#E5E5E5" />
            ) : (
              <Moon size={20} color="#464748" />
            )}
          </button>
          <Link
            to="/profile"
            style={{
              fontSize: '1.4rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '8px 10px',
              borderRadius: '9999px',
            }}
          >
            {user?.name ?? '프로필'}
          </Link>
          <button
            onClick={() => void handleLogout()}
            aria-label="로그아웃"
            style={{
              backgroundColor: 'transparent',
              color: '#6157EA',
              border: 'none',
              padding: '8px 12px',
              fontSize: '1.4rem',
              fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
              borderRadius: '9999px',
              cursor: 'pointer',
            }}
          >
            로그아웃
          </button>
        </div>
      </nav>

      <div
        style={{
          display: 'flex',
          maxWidth: '1280px',
          margin: '0 auto',
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        {/* 사이드바 - 데스크톱/태블릿 */}
        {!isMobile && (
          <aside
            style={{
              width: isTablet ? '200px' : '240px',
              minWidth: isTablet ? '200px' : '240px',
              backgroundColor: 'var(--bg-primary)',
              borderRight: '1px solid var(--border-subtle)',
            }}
          >
            <CategoryList
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
            />
          </aside>
        )}

        {/* 사이드바 - 모바일 오버레이 */}
        {isMobile && showMobileSidebar && (
          <div
            style={{
              position: 'fixed',
              top: '56px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 90,
            }}
            onClick={() => setShowMobileSidebar(false)}
          >
            <div
              style={{
                width: '240px',
                height: '100%',
                backgroundColor: 'var(--bg-secondary)',
                boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <CategoryList
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={handleSelectCategory}
              />
            </div>
          </div>
        )}

        <main style={{ flex: 1, padding: isMobile ? '16px' : '24px', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <TodoFilter
              filterParams={filterParams}
              onFilterChange={handleFilterChange}
              categories={categories}
            />
            <button
              onClick={() => setShowAddForm(true)}
              aria-label="할일 추가"
              style={{
                backgroundColor: '#6157EA',
                color: '#FFFFFF',
                border: 'none',
                padding: '0 20px',
                fontSize: '1.5rem',
                fontWeight: 600,
                fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
                borderRadius: '9999px',
                cursor: 'pointer',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              + 추가
            </button>
          </div>

          <TodoList filterParams={filterParams} />
        </main>
      </div>

      {showAddForm && (
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
              padding: isMobile ? '20px' : '28px',
              maxWidth: '480px',
              width: 'calc(100% - 32px)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <h3
              style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '20px',
              }}
            >
              할일 추가
            </h3>
            <TodoForm mode="create" onClose={() => setShowAddForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
