-- Tabela para armazenar o total de horas trabalhadas por mês
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

-- Trigger para atualizar o campo updated_at
create or replace function update_monthly_hours_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_monthly_hours_updated_at
  before update on monthly_hours
  for each row
  execute function update_monthly_hours_updated_at();

-- Função para atualizar o total de horas trabalhadas no mês
create or replace function update_monthly_hours()
returns trigger as $$
declare
  v_month int;
  v_year int;
  v_total_minutes int;
begin
  -- Determinar o mês e ano baseado no registro afetado
  if TG_OP = 'DELETE' then
    v_month := extract(month from old.date);
    v_year := extract(year from old.date);
  else
    v_month := extract(month from new.date);
    v_year := extract(year from new.date);
  end if;

  -- Calcular o total de minutos trabalhados no mês
  with time_calc as (
    select
      sum(
        extract(epoch from (
          case
            when end_time < start_time then
              (date_trunc('day', date) + end_time + interval '1 day')
            else
              (date_trunc('day', date) + end_time)
          end
          -
          (date_trunc('day', date) + start_time)
        )) / 60
        +
        -- Adicionar minutos do tempo noturno
        (
          extract(hour from night_time) * 60 +
          extract(minute from night_time)
        )
      )::int as total_minutes
    from time_entries
    where user_id = coalesce(new.user_id, old.user_id)
      and extract(month from date) = v_month
      and extract(year from date) = v_year
  )
  select coalesce(total_minutes, 0) into v_total_minutes from time_calc;

  -- Inserir ou atualizar o registro na tabela monthly_hours
  insert into monthly_hours (user_id, year, month, total_worked_minutes)
  values (coalesce(new.user_id, old.user_id), v_year, v_month, v_total_minutes)
  on conflict (user_id, year, month)
  do update set total_worked_minutes = excluded.total_worked_minutes;

  return coalesce(new, old);
end;
$$ language plpgsql;

-- Trigger para atualizar monthly_hours quando houver mudanças em time_entries
create trigger update_monthly_hours_on_time_entries
  after insert or update or delete on time_entries
  for each row
  execute function update_monthly_hours();

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

-- Função para popular a tabela monthly_hours com dados históricos
create or replace function populate_monthly_hours()
returns void as $$
declare
  v_user record;
  v_year int;
  v_month int;
begin
  -- Para cada usuário
  for v_user in select distinct user_id from time_entries loop
    -- Para cada mês único nas time_entries
    for v_year, v_month in
      select distinct
        extract(year from date)::int as year,
        extract(month from date)::int as month
      from time_entries
      where user_id = v_user.user_id
    loop
      -- Calcular total de minutos trabalhados
      with time_calc as (
        select
          sum(
            extract(epoch from (
              case
                when end_time < start_time then
                  (date_trunc('day', date) + end_time + interval '1 day')
                else
                  (date_trunc('day', date) + end_time)
              end
              -
              (date_trunc('day', date) + start_time)
            )) / 60
            +
            -- Adicionar minutos do tempo noturno
            (
              extract(hour from night_time) * 60 +
              extract(minute from night_time)
            )
          )::int as total_minutes
        from time_entries
        where user_id = v_user.user_id
          and extract(year from date) = v_year
          and extract(month from date) = v_month
      )
      insert into monthly_hours (user_id, year, month, total_worked_minutes)
      select
        v_user.user_id,
        v_year,
        v_month,
        coalesce((select total_minutes from time_calc), 0)
      on conflict (user_id, year, month)
      do update set total_worked_minutes = excluded.total_worked_minutes;
    end loop;
  end loop;
end;
$$ language plpgsql;

-- Executar a função para popular a tabela
select populate_monthly_hours();
