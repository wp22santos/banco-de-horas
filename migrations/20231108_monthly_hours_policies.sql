-- Habilitar RLS para a tabela monthly_hours
alter table monthly_hours enable row level security;

-- Criar política para permitir que usuários vejam apenas seus próprios registros
create policy "Users can view their own monthly hours"
  on monthly_hours
  for select
  using (auth.uid() = user_id);

-- Criar política para permitir que o trigger possa inserir/atualizar registros
create policy "System can manage monthly hours"
  on monthly_hours
  for all
  using (true)
  with check (true);

-- Garantir que a tabela está exposta via API
grant select on monthly_hours to authenticated;
grant insert, update on monthly_hours to authenticated;
