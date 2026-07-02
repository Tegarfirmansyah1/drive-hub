// Path: types/index.ts

export interface DriveAccount {
  id: string;
  alias_name: string;
  email: string;
  encrypted_refresh_token: string;
  created_at: string;
  quota?: {
    total: number;
    used: number;
    remaining: number;
  };
}

export interface AuthStatePayload {
  alias: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}