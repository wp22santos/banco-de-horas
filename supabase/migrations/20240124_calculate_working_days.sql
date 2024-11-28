CREATE OR REPLACE FUNCTION calculate_working_days(
  start_date DATE,
  end_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_days INTEGER := 0;
  check_date DATE := start_date;
BEGIN
  WHILE check_date <= end_date LOOP
    -- Verifica se não é sábado (6) nem domingo (0)
    IF EXTRACT(DOW FROM check_date) NOT IN (0, 6) THEN
      total_days := total_days + 1;
    END IF;
    check_date := check_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN total_days;
END;
$$;
