import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import httpClient from '@/shared/api/http-client';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './category-api';

const mock = new MockAdapter(httpClient);

const mockCategory = {
  id: 'cat-1',
  name: '업무',
  is_default: true,
  user_id: null,
  created_at: '2026-05-14T00:00:00.000Z',
};

const mockUserCategory = {
  id: 'cat-2',
  name: '운동',
  is_default: false,
  user_id: 'user-1',
  created_at: '2026-05-14T00:00:00.000Z',
};

describe('category-api', () => {
  beforeEach(() => {
    mock.reset();
  });

  describe('getCategories()', () => {
    it('카테고리 목록을 배열로 반환한다', async () => {
      mock.onGet('/api/categories').reply(200, { categories: [mockCategory, mockUserCategory] });

      const result = await getCategories();
      expect(result).toEqual([mockCategory, mockUserCategory]);
    });

    it('빈 목록도 정상 반환한다', async () => {
      mock.onGet('/api/categories').reply(200, { categories: [] });

      const result = await getCategories();
      expect(result).toEqual([]);
    });
  });

  describe('createCategory()', () => {
    it('생성된 카테고리를 반환한다', async () => {
      mock.onPost('/api/categories').reply(201, { category: mockUserCategory });

      const result = await createCategory({ name: '운동' });
      expect(result).toEqual(mockUserCategory);
    });

    it('요청 body에 name이 포함된다', async () => {
      mock.onPost('/api/categories').reply(201, { category: mockUserCategory });

      await createCategory({ name: '운동' });
      const body = JSON.parse(mock.history['post'][0].data as string) as Record<string, unknown>;
      expect(body).toMatchObject({ name: '운동' });
    });
  });

  describe('updateCategory()', () => {
    it('수정된 카테고리를 반환한다', async () => {
      const updated = { ...mockUserCategory, name: '헬스' };
      mock.onPatch('/api/categories/cat-2').reply(200, { category: updated });

      const result = await updateCategory('cat-2', { name: '헬스' });
      expect(result).toEqual(updated);
    });

    it('올바른 엔드포인트로 요청한다', async () => {
      mock.onPatch('/api/categories/cat-2').reply(200, { category: mockUserCategory });

      await updateCategory('cat-2', { name: '운동' });
      expect(mock.history['patch'][0].url).toBe('/api/categories/cat-2');
    });
  });

  describe('deleteCategory()', () => {
    it('삭제 성공 시 undefined를 반환한다', async () => {
      mock.onDelete('/api/categories/cat-2').reply(204);

      await expect(deleteCategory('cat-2')).resolves.toBeUndefined();
    });

    it('올바른 엔드포인트로 요청한다', async () => {
      mock.onDelete('/api/categories/cat-2').reply(204);

      await deleteCategory('cat-2');
      expect(mock.history['delete'][0].url).toBe('/api/categories/cat-2');
    });
  });
});
