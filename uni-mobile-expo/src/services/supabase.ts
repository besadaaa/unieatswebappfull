import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Supabase configuration - replace with your actual values
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseAnonKey = 'your-anon-key-here';

// Custom storage implementation for React Native
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (matching your web app)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'student' | 'admin' | 'cafeteria';
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          cafeteria_id: string | null;
          is_suspended: boolean;
          suspension_reason: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'student' | 'admin' | 'cafeteria';
          phone?: string | null;
          avatar_url?: string | null;
          cafeteria_id?: string | null;
          is_suspended?: boolean;
          suspension_reason?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'student' | 'admin' | 'cafeteria';
          phone?: string | null;
          avatar_url?: string | null;
          cafeteria_id?: string | null;
          is_suspended?: boolean;
          suspension_reason?: string | null;
        };
      };
      cafeterias: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          status: 'active' | 'inactive' | 'pending';
          location: string | null;
          phone: string | null;
          email: string | null;
          opening_hours: any | null;
          created_at: string;
          updated_at: string;
          rating: number | null;
          total_ratings: number;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          status?: 'active' | 'inactive' | 'pending';
          location?: string | null;
          phone?: string | null;
          email?: string | null;
          opening_hours?: any | null;
          rating?: number | null;
          total_ratings?: number;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          status?: 'active' | 'inactive' | 'pending';
          location?: string | null;
          phone?: string | null;
          email?: string | null;
          opening_hours?: any | null;
          rating?: number | null;
          total_ratings?: number;
        };
      };
      menu_items: {
        Row: {
          id: string;
          cafeteria_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          category: string | null;
          is_available: boolean;
          preparation_time: number | null;
          created_at: string;
          updated_at: string;
          rating: number | null;
          total_ratings: number;
        };
        Insert: {
          id?: string;
          cafeteria_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          category?: string | null;
          is_available?: boolean;
          preparation_time?: number | null;
          rating?: number | null;
          total_ratings?: number;
        };
        Update: {
          id?: string;
          cafeteria_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          category?: string | null;
          is_available?: boolean;
          preparation_time?: number | null;
          rating?: number | null;
          total_ratings?: number;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          cafeteria_id: string;
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
          total_amount: number;
          delivery_fee: number | null;
          service_fee: number | null;
          notes: string | null;
          estimated_delivery_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cafeteria_id: string;
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
          total_amount: number;
          delivery_fee?: number | null;
          service_fee?: number | null;
          notes?: string | null;
          estimated_delivery_time?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          cafeteria_id?: string;
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
          total_amount?: number;
          delivery_fee?: number | null;
          service_fee?: number | null;
          notes?: string | null;
          estimated_delivery_time?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          item_id: string;
          quantity: number;
          price: number;
          special_instructions: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          item_id: string;
          quantity: number;
          price: number;
          special_instructions?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          item_id?: string;
          quantity?: number;
          price?: number;
          special_instructions?: string | null;
        };
      };
    };
  };
}
