// Shared auth and user types for API and web

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  lastLoginAt?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
