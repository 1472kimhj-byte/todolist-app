import httpClient from '@/shared/api/http-client';
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoFilterParams,
} from '@/features/todo/types/todo-types';

export const getTodos = (params?: TodoFilterParams): Promise<Todo[]> =>
  httpClient
    .get<{ todos: Todo[] }>('/api/todos', { params })
    .then((res) => res.data.todos);

export const createTodo = (data: CreateTodoRequest): Promise<Todo> =>
  httpClient
    .post<{ todo: Todo }>('/api/todos', data)
    .then((res) => res.data.todo);

export const updateTodo = (id: string, data: UpdateTodoRequest): Promise<Todo> =>
  httpClient
    .patch<{ todo: Todo }>(`/api/todos/${id}`, data)
    .then((res) => res.data.todo);

export const toggleTodo = (id: string): Promise<Todo> =>
  httpClient
    .patch<{ todo: Todo }>(`/api/todos/${id}/toggle`)
    .then((res) => res.data.todo);

export const deleteTodo = (id: string): Promise<void> =>
  httpClient.delete(`/api/todos/${id}`).then(() => undefined);
