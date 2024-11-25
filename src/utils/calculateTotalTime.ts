export const calculateTotalTime = (startTime: string, endTime: string, nightTime: string): string => {
  // Converter horários para minutos (usando apenas HH:MM)
  const [startHours, startMinutes] = startTime.substring(0, 5).split(':').map(Number);
  const [endHours, endMinutes] = endTime.substring(0, 5).split(':').map(Number);
  const [nightHours, nightMinutes] = nightTime.substring(0, 5).split(':').map(Number);

  // Calcular total de minutos do período normal
  let start = new Date(2000, 0, 1, startHours, startMinutes);
  let end = new Date(2000, 0, 1, endHours, endMinutes);
  
  // Se o horário final for menor que o inicial, adicionar 1 dia
  if (end < start) {
    end = new Date(2000, 0, 2, endHours, endMinutes);
  }
  
  // Calcular diferença em minutos
  const normalMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  
  // Adicionar minutos do período noturno
  const nightlyMinutes = (nightHours * 60) + nightMinutes;
  
  // Somar total
  const totalMinutes = normalMinutes + nightlyMinutes;
  
  // Converter para formato HH:mm
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
