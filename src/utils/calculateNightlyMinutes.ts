/**
 * Calcula os minutos adicionais noturnos (10min por hora entre 23h e 5h)
 */
export const calculateNightlyMinutes = (startTime: string, endTime: string): number => {
  // Criar datas base para comparação
  const start = new Date(`2000-01-01T${startTime}`);
  let end = new Date(`2000-01-01T${endTime}`);
  
  // Se o horário final for menor que o inicial, adicionar 1 dia
  if (end < start) {
    end = new Date(`2000-01-02T${endTime}`);
  }

  // Definir período noturno (23h às 5h)
  const nightStart = new Date(`2000-01-01T23:00:00`);
  const nightEnd = new Date(`2000-01-02T05:00:00`);
  
  // Ajustar nightStart e nightEnd se o turno passar da meia-noite
  if (end.getDate() > start.getDate()) {
    nightEnd.setDate(nightEnd.getDate() + 1);
  }

  // Verificar se há interseção com o período noturno
  const periodStart = start < nightStart ? nightStart : start;
  const periodEnd = end > nightEnd ? nightEnd : end;

  if (periodStart >= periodEnd) {
    return 0;
  }

  // Calcular horas completas no período noturno
  const nightlyHours = Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60));
  
  // Retornar 10 minutos por hora completa
  return nightlyHours * 10;
};
