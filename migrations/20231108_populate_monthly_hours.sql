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
