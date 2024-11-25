-- Função para calcular o total de minutos trabalhados
CREATE OR REPLACE FUNCTION calculate_total_minutes(p_user_id uuid, p_month int, p_year int)
RETURNS integer AS $$
DECLARE
    v_total integer;
BEGIN
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (
            CASE 
                WHEN end_time < start_time THEN
                    (end_time::time + INTERVAL '24 hours') - start_time::time
                ELSE
                    end_time::time - start_time::time
            END
        ))/60 + 
        EXTRACT(HOURS FROM night_time::interval) * 60 +
        EXTRACT(MINUTES FROM night_time::interval)
    )::integer, 0)
    INTO v_total
    FROM time_entries
    WHERE user_id = p_user_id
    AND month = p_month
    AND year = p_year;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Função auxiliar para garantir que o registro existe
CREATE OR REPLACE FUNCTION ensure_monthly_hours(
    p_user_id uuid,
    p_year integer,
    p_month integer
) RETURNS void AS $$
BEGIN
    INSERT INTO monthly_hours (user_id, year, month, total_worked_minutes)
    VALUES (p_user_id, p_year, p_month, 0)
    ON CONFLICT (user_id, year, month) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular e atualizar o total
CREATE OR REPLACE FUNCTION update_monthly_hours_total(
    p_user_id uuid,
    p_year integer,
    p_month integer
) RETURNS void AS $$
DECLARE
    v_total integer;
BEGIN
    -- Garantir que o registro existe
    PERFORM ensure_monthly_hours(p_user_id, p_year, p_month);
    
    -- Calcular o novo total
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (
            CASE 
                WHEN end_time < start_time THEN
                    (end_time::time + INTERVAL '24 hours') - start_time::time
                ELSE
                    end_time::time - start_time::time
            END
        ))/60 + 
        EXTRACT(HOURS FROM night_time::interval) * 60 +
        EXTRACT(MINUTES FROM night_time::interval)
    )::integer, 0)
    INTO v_total
    FROM time_entries
    WHERE user_id = p_user_id
    AND month = p_month
    AND year = p_year;

    -- Atualizar o total
    UPDATE monthly_hours 
    SET 
        total_worked_minutes = v_total,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id 
    AND month = p_month 
    AND year = p_year;
END;
$$ LANGUAGE plpgsql;

-- Corrigir a função update_monthly_hours existente
CREATE OR REPLACE FUNCTION update_monthly_hours()
RETURNS trigger AS $$
DECLARE
  v_month int;
  v_year int;
  v_user_id uuid;
  v_count int;
BEGIN
  -- Determinar o mês, ano e user_id baseado no registro afetado
  IF TG_OP = 'DELETE' THEN
    v_month := OLD.month;
    v_year := OLD.year;
    v_user_id := OLD.user_id;
  ELSE
    v_month := NEW.month;
    v_year := NEW.year;
    v_user_id := NEW.user_id;
  END IF;

  -- Verificar se ainda existem registros
  SELECT COUNT(*) INTO v_count
  FROM time_entries
  WHERE user_id = v_user_id
    AND month = v_month
    AND year = v_year
    AND CASE 
      WHEN TG_OP = 'DELETE' THEN id != OLD.id
      ELSE true
    END;

  -- Se não houver registros (ou só houver o que está sendo deletado), zerar o total
  IF v_count = 0 THEN
    INSERT INTO monthly_hours (user_id, year, month, total_worked_minutes)
    VALUES (v_user_id, v_year, v_month, 0)
    ON CONFLICT (user_id, year, month)
    DO UPDATE SET 
      total_worked_minutes = 0,
      updated_at = timezone('utc'::text, now());
  ELSE
    -- Caso contrário, calcular o novo total
    WITH calculated_total AS (
      SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (
          CASE
            WHEN end_time < start_time THEN
              (end_time::time + INTERVAL '24 hours') - start_time::time
            ELSE
              end_time::time - start_time::time
          END
        ))/60 + 
        EXTRACT(HOURS FROM night_time::interval) * 60 +
        EXTRACT(MINUTES FROM night_time::interval)
      )::integer, 0) as total_minutes
      FROM time_entries
      WHERE user_id = v_user_id
        AND month = v_month
        AND year = v_year
        AND CASE 
          WHEN TG_OP = 'DELETE' THEN id != OLD.id
          ELSE true
        END
    )
    INSERT INTO monthly_hours (user_id, year, month, total_worked_minutes)
    SELECT v_user_id, v_year, v_month, total_minutes
    FROM calculated_total
    ON CONFLICT (user_id, year, month)
    DO UPDATE SET 
      total_worked_minutes = EXCLUDED.total_worked_minutes,
      updated_at = timezone('utc'::text, now());
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recriar os triggers
DROP TRIGGER IF EXISTS update_monthly_hours_after_delete ON time_entries;
DROP TRIGGER IF EXISTS update_monthly_hours_after_insert ON time_entries;

CREATE TRIGGER update_monthly_hours_after_insert
    AFTER INSERT ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_hours();

CREATE TRIGGER update_monthly_hours_before_delete
    BEFORE DELETE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_hours();
