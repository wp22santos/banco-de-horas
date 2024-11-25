-- Função para popular a tabela monthly_hours com dados históricos (com debug)
create or replace function populate_monthly_hours()
returns text as $$
declare
  v_user record;
  v_year int;
  v_month int;
  v_debug text := '';
begin
  -- Verificar se existem usuários
  v_debug := v_debug || 'Usuários encontrados:' || chr(10);
  for v_user in select distinct user_id from time_entries loop
    v_debug := v_debug || '- User ID: ' || v_user.user_id || chr(10);
    
    -- Para cada mês único nas time_entries
    v_debug := v_debug || '  Meses encontrados:' || chr(10);
    for v_year, v_month in
      select distinct
        extract(year from date)::int as year,
        extract(month from date)::int as month
      from time_entries
      where user_id = v_user.user_id
    loop
      v_debug := v_debug || '  - ' || v_year || '/' || v_month || chr(10);
      
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
      
      v_debug := v_debug || '    Registro inserido/atualizado' || chr(10);
    end loop;
  end loop;
  
  -- Verificar se há registros na tabela monthly_hours
  v_debug := v_debug || chr(10) || 'Registros em monthly_hours:' || chr(10);
  for v_user in
    select user_id, year, month, total_worked_minutes
    from monthly_hours
    order by user_id, year, month
  loop
    v_debug := v_debug || format('- User %s: %s/%s = %s minutos', 
      v_user.user_id, v_user.year, v_user.month, v_user.total_worked_minutes) || chr(10);
  end loop;

  return v_debug;
end;
$$ language plpgsql;

-- Executar a função para popular a tabela e ver o debug
select populate_monthly_hours();
