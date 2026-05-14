export interface Category {
  id: string;
  name: string;
  is_default: boolean;
  user_id: string | null;
  created_at: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}
