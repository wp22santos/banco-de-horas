-- Limpa todas as tabelas relacionadas aos usuários na ordem correta

-- Primeiro as tabelas que dependem de subscriptions
DELETE FROM public.subscription_items;

-- Tabelas públicas que dependem diretamente de users
DELETE FROM public.monthly_hours;
DELETE FROM public.non_accounting_entries;
DELETE FROM public.subscriptions;
DELETE FROM public.time_entries;

-- Tabelas do schema auth que dependem de users
DELETE FROM auth.sessions;
DELETE FROM auth.one_time_tokens;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.identities;

-- Por fim, deletamos os usuários
DELETE FROM auth.users;
