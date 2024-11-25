export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' 
    ? new Date(date + 'T12:00:00Z')  // Add noon UTC time to avoid timezone issues
    : date;
    
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
