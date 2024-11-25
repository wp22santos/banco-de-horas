export const formatDateWithDay = (dateStr: string): string => {
  const date = new Date(dateStr);
  
  const days = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado'
  ];

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const dayName = days[date.getDay()];

  return `${day}/${month}/${year} - ${dayName}`;
};
