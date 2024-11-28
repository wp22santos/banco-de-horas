-- Adicionar novas colunas na tabela subscriptions se não existirem
DO $$
BEGIN
    -- Adicionar coluna mercadopago_payment_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'subscriptions' 
                  AND column_name = 'mercadopago_payment_id') THEN
        ALTER TABLE subscriptions ADD COLUMN mercadopago_payment_id TEXT;
    END IF;

    -- Adicionar coluna cancel_at_period_end
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'subscriptions' 
                  AND column_name = 'cancel_at_period_end') THEN
        ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Verificar e criar a tabela subscription_payments se não existir
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT,
    mercadopago_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Atualizar políticas de segurança RLS

-- Políticas para subscription_payments
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Remover política existente se houver
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pagamentos" ON subscription_payments;

-- Criar nova política
CREATE POLICY "Usuários podem ver seus próprios pagamentos"
    ON subscription_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions s
            WHERE s.id = subscription_payments.subscription_id
            AND s.user_id = auth.uid()
        )
    );

-- Atualizar triggers
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
