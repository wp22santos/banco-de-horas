-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscription_status enum
CREATE TYPE subscription_status AS ENUM (
    'trialing',
    'trial_expired',
    'active',
    'past_due',
    'canceled',
    'incomplete',
    'incomplete_expired'
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status subscription_status NOT NULL DEFAULT 'trialing',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    price_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create subscription_items table for potential multiple products
CREATE TABLE IF NOT EXISTS subscription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_price_id TEXT NOT NULL,
    stripe_product_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create function to automatically create subscription record on user signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (
        user_id,
        status,
        trial_ends_at,
        current_period_start,
        current_period_end
    )
    VALUES (
        NEW.id,
        'trialing',
        TIMEZONE('utc', NOW() + INTERVAL '15 days'),
        TIMEZONE('utc', NOW()),
        TIMEZONE('utc', NOW() + INTERVAL '15 days')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update subscription updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_items_updated_at ON subscription_items;
CREATE TRIGGER update_subscription_items_updated_at
    BEFORE UPDATE ON subscription_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check trial status
CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'trialing' AND NEW.trial_ends_at < TIMEZONE('utc', NOW()) THEN
        NEW.status = 'trial_expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update trial status
DROP TRIGGER IF EXISTS check_trial_expiration ON subscriptions;
CREATE TRIGGER check_trial_expiration
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION check_trial_status();

-- Create RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only authenticated users can insert subscriptions"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies for subscription_items
CREATE POLICY "Users can view their own subscription items"
    ON subscription_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.id = subscription_id
        AND s.user_id = auth.uid()
    ));

CREATE POLICY "Only authenticated users can insert subscription items"
    ON subscription_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.id = subscription_id
        AND s.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own subscription items"
    ON subscription_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.id = subscription_id
        AND s.user_id = auth.uid()
    ));

-- Create indexes for better performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscription_items_subscription_id ON subscription_items(subscription_id);

-- Create function to get subscription status
CREATE OR REPLACE FUNCTION get_subscription_status(user_id UUID)
RETURNS TABLE (
    status subscription_status,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.status,
        s.trial_ends_at,
        s.current_period_end,
        s.status IN ('trialing', 'active') AND 
        (s.status != 'trialing' OR s.trial_ends_at > TIMEZONE('utc', NOW())) AS is_active
    FROM subscriptions s
    WHERE s.user_id = get_subscription_status.user_id
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
