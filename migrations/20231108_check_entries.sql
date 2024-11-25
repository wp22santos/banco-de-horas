-- Verificar registros na tabela time_entries
select 
  user_id,
  extract(year from date)::int as year,
  extract(month from date)::int as month,
  count(*) as entries,
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
where user_id = 'c4a32a52-ce95-41ad-ba36-427f012df925'
group by user_id, extract(year from date), extract(month from date)
order by year, month;
