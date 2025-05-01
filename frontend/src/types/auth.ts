
export interface User {
  id: string;
  name: string;
  email: string;
  role: string; 
  phone?:string;
  
  avatar?: string;
  subscription?: UserSubscription;
  preferences?: UserPreferences;
}


export interface UserSubscription {
  plan: string;
  validUntil: string;
  paymentHistory?: PaymentHistory[];
  paymentMethod?: PaymentMethod;
}

export interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: string;
}

export interface PaymentMethod {
  type: string;
  lastFour: string;
  expiryDate: string;
  cardholderName: string;
}

export interface UserPreferences {
  theme: string;
  notifications: boolean;
  energyGoal: number;
  language: string;
  currency: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
  language?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}