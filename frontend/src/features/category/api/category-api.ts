import httpClient from '@/shared/api/http-client';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/features/category/types/category-types';

export const getCategories = (): Promise<Category[]> =>
  httpClient.get<{ categories: Category[] }>('/api/categories').then((res) => res.data.categories);

export const createCategory = (data: CreateCategoryRequest): Promise<Category> =>
  httpClient
    .post<{ category: Category }>('/api/categories', data)
    .then((res) => res.data.category);

export const updateCategory = (id: string, data: UpdateCategoryRequest): Promise<Category> =>
  httpClient
    .patch<{ category: Category }>(`/api/categories/${id}`, data)
    .then((res) => res.data.category);

export const deleteCategory = (id: string): Promise<void> =>
  httpClient.delete(`/api/categories/${id}`).then(() => undefined);
