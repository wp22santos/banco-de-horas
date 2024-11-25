-- Criar a tabela se não existir
create table if not exists monthly_hours (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  year int not null,
  month int not null,
  total_worked_minutes int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Garante que só existe um registro por usuário/mês/ano
  constraint monthly_hours_unique_user_month_year unique (user_id, year, month)
);

-- Habilitar RLS
alter table monthly_hours enable row level security;

-- Criar política para permitir que usuários vejam apenas seus próprios registros
create policy "Users can view their own monthly hours"
  on monthly_hours for select
  using (auth.uid() = user_id);

-- Criar política para permitir que o trigger possa inserir/atualizar registros
create policy "System can manage monthly hours"
  on monthly_hours for all
  using (true)
  with check (true);

-- Garantir que a tabela está exposta via API
grant select, insert, update on monthly_hours to authenticated;

-- Inserir o registro manualmente para testar
insert into monthly_hours (user_id, year, month, total_worked_minutes)
values ('c4a32a52-ce95-41ad-ba36-427f012df925', 2024, 1, 1650)
on conflict (user_id, year, month)
do update set total_worked_minutes = 1650;

-- Verificar se o registro foi inserido
select * from monthly_hours
where user_id = 'c4a32a52-ce95-41ad-ba36-427f012df925';
