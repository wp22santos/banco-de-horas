-- Função para recalcular o total de minutos trabalhados para um usuário em um mês específico
CREATE OR REPLACE FUNCTION recalculate_monthly_hours()
RETURNS TRIGGER AS $$
DECLARE
    total_minutes INTEGER;
BEGIN
    -- Calcular o total de minutos trabalhados
    WITH time_calculations AS (
        SELECT 
            te.user_id,
            te.month,
            te.year,
            SUM(
                EXTRACT(EPOCH FROM (
                    CASE 
                        WHEN te.end_time < te.start_time THEN
                            (te.end_time::time + INTERVAL '24 hours') - te.start_time::time
                        ELSE
                            te.end_time::time - te.start_time::time
                    END
                ))/60 + 
                -- Adiciona os minutos do tempo noturno
                EXTRACT(HOURS FROM te.night_time::interval) * 60 +
                EXTRACT(MINUTES FROM te.night_time::interval)
            )::integer as total_minutes
        FROM time_entries te
        WHERE te.user_id = OLD.user_id
        AND te.month = OLD.month
        AND te.year = OLD.year
        GROUP BY te.user_id, te.month, te.year
    )
    SELECT COALESCE(total_minutes, 0) INTO total_minutes
    FROM time_calculations;

    -- Se não houver mais registros, definir total_minutes como 0
    IF total_minutes IS NULL THEN
        total_minutes := 0;
    END IF;

    -- Atualizar ou inserir na tabela monthly_hours
    UPDATE monthly_hours 
    SET total_worked_minutes = total_minutes
    WHERE user_id = OLD.user_id 
    AND month = OLD.month 
    AND year = OLD.year;

    -- Se não existir registro, criar um novo com 0 minutos
    IF NOT FOUND THEN
        INSERT INTO monthly_hours (user_id, month, year, total_worked_minutes)
        VALUES (OLD.user_id, OLD.month, OLD.year, total_minutes);
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS update_monthly_hours_after_delete ON time_entries;
CREATE TRIGGER update_monthly_hours_after_delete
    AFTER DELETE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_monthly_hours();
