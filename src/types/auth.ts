import { User } from '@supabase/supabase-js';

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: Error | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    setError: React.Dispatch<React.SetStateAction<Error | null>>;
}
