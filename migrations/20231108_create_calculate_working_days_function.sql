-- Função para calcular dias úteis no mês
create or replace function calculate_working_days(
  p_month int,
  p_year int,
  p_user_id uuid
) returns int as $$
declare
  v_date date;
  v_last_day date;
  v_working_days int := 0;
  v_non_accounting_days int;
begin
  -- Primeiro dia do mês
  v_date := date_trunc('month', make_date(p_year, p_month, 1));
  
  -- Último dia do mês
  v_last_day := (date_trunc('month', v_date) + interval '1 month - 1 day')::date;
  
  -- Buscar dias não contábeis do usuário no mês
  select coalesce(sum(days), 0)
  into v_non_accounting_days
  from non_accounting_entries
  where user_id = p_user_id
    and date >= v_date
    and date <= v_last_day;
  
  -- Contar dias úteis (excluindo sábados e domingos)
  while v_date <= v_last_day loop
    -- Se não for sábado (6) nem domingo (0)
    if extract(dow from v_date) not in (0, 6) then
      v_working_days := v_working_days + 1;
    end if;
    v_date := v_date + interval '1 day';
  end loop;
  
  -- Subtrair dias não contábeis
  return greatest(0, v_working_days - v_non_accounting_days);
end;
$$ language plpgsql;
