-- Função para atualizar o total de horas trabalhadas no mês
create or replace function update_monthly_hours()
returns trigger as $$
declare
  v_month int;
  v_year int;
begin
  -- Determinar o mês e ano baseado no registro afetado
  if TG_OP = 'DELETE' then
    v_month := extract(month from old.date);
    v_year := extract(year from old.date);
  else
    v_month := extract(month from new.date);
    v_year := extract(year from new.date);
  end if;

  -- Atualizar o total de minutos trabalhados no mês
  insert into monthly_hours (user_id, year, month, total_worked_minutes)
  select
    coalesce(new.user_id, old.user_id) as user_id,
    v_year as year,
    v_month as month,
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
    and extract(year from date) = v_year
    and extract(month from date) = v_month
  group by user_id
  on conflict (user_id, year, month)
  do update set 
    total_worked_minutes = excluded.total_worked_minutes,
    updated_at = timezone('utc'::text, now());

  return coalesce(new, old);
end;
$$ language plpgsql;

-- Remover o trigger se já existir
drop trigger if exists update_monthly_hours_on_time_entries on time_entries;

-- Criar o trigger
create trigger update_monthly_hours_on_time_entries
  after insert or update or delete on time_entries
  for each row
  execute function update_monthly_hours();
