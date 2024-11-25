-- Remover a função existente
drop function if exists populate_monthly_hours();

-- Criar uma versão mais simples da função
create or replace function populate_monthly_hours()
returns text as $$
declare
  v_debug text := '';
  v_count int := 0;
  v_record record;
begin
  -- Inserir todos os registros de uma vez
  insert into monthly_hours (user_id, year, month, total_worked_minutes)
  select
    user_id,
    extract(year from date)::int as year,
    extract(month from date)::int as month,
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
  group by user_id, extract(year from date), extract(month from date)
  on conflict (user_id, year, month)
  do update set 
    total_worked_minutes = excluded.total_worked_minutes,
    updated_at = timezone('utc'::text, now());
  
  get diagnostics v_count = row_count;
  v_debug := v_debug || format('Registros atualizados: %s', v_count) || chr(10);
  
  -- Verificar os registros
  v_debug := v_debug || chr(10) || 'Registros em monthly_hours:' || chr(10);
  for v_record in
    select user_id, year, month, total_worked_minutes
    from monthly_hours
    order by user_id, year, month
  loop
    v_debug := v_debug || format('- User %s: %s/%s = %s minutos', 
      v_record.user_id, v_record.year, v_record.month, v_record.total_worked_minutes) || chr(10);
  end loop;

  return v_debug;
end;
$$ language plpgsql;

-- Executar a função
select populate_monthly_hours();
