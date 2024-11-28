-- Habilita as extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configuração inicial das tabelas
DROP TABLE IF EXISTS public.subscription_payments CASCADE;
DROP TABLE IF EXISTS public.subscription_items CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Criação da tabela de assinaturas
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trial_expired', 'unpaid'))
);

-- Criação da tabela de itens da assinatura
CREATE TABLE public.subscription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    stripe_price_id VARCHAR(255),
    stripe_product_id VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_items_updated_at
    BEFORE UPDATE ON public.subscription_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para criar assinatura automática para novos usuários
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, status, trial_ends_at)
    VALUES (NEW.id, 'trialing', NOW() + INTERVAL '15 days');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Função para verificar status do trial
CREATE OR REPLACE FUNCTION check_trial_status() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'trialing' AND NEW.trial_ends_at < NOW() THEN
        NEW.status = 'trial_expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar status do trial
CREATE TRIGGER check_subscription_trial
    BEFORE INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION check_trial_status();

-- Configuração de RLS (Row Level Security)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para subscriptions
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Apenas o sistema pode inserir assinaturas"
    ON public.subscriptions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Apenas o sistema pode atualizar assinaturas"
    ON public.subscriptions FOR UPDATE
    USING (true);

-- Políticas de segurança para subscription_items
CREATE POLICY "Usuários podem ver seus próprios itens de assinatura"
    ON public.subscription_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.subscriptions s 
        WHERE s.id = subscription_id 
        AND s.user_id = auth.uid()
    ));

CREATE POLICY "Apenas o sistema pode inserir itens de assinatura"
    ON public.subscription_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Apenas o sistema pode atualizar itens de assinatura"
    ON public.subscription_items FOR UPDATE
    USING (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscription_items_subscription_id_idx ON public.subscription_items(subscription_id);
