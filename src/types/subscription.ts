export interface SubscriptionPlan {
    id: string;
    name: string;
    type: 'monthly' | 'yearly';
    price: number;
    features: string[];
    max_users: number;
    max_hours_per_month: number;
    is_active: boolean;
    created_at: string;
}

export interface Subscription {
    id: string;
    user_id: string;
    plan_id: string;
    status: 'trial' | 'active' | 'cancelled' | 'expired';
    trial_start_date: string | null;
    trial_end_date: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionPayment {
    id: string;
    subscription_id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    payment_method: string;
    created_at: string;
}
