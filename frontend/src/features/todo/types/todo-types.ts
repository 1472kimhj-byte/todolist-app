export interface Todo {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  due_date?: string;
  category_id?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  due_date?: string;
  category_id?: string;
}

export interface TodoFilterParams {
  category_id?: string;
  is_completed?: boolean;
  due_date_from?: string;
  due_date_to?: string;
}
