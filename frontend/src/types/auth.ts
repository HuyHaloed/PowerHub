
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription?: {
    plan: string;
    validUntil: string;
  };
  preferences?: {
    theme: string;
    notifications: boolean;
    energyGoal: number;
  };
}

// Response types
export interface SignupResponse {
  success: boolean;
  message: string;
  data?: {
    token?: string;
    user?: User;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}