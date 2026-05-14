export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiError {
  error: ApiErrorBody;
}

export type ApiResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: ApiErrorBody;
};
