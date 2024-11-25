export const calculateHourBalance = (worked: string, expected: string) => {
  const [workedHours, workedMinutes] = worked.split(':').map(Number);
  const [expectedHours, expectedMinutes] = expected.split(':').map(Number);
  
  let totalMinutes = (workedHours * 60 + workedMinutes) - (expectedHours * 60 + expectedMinutes);
  const sign = totalMinutes < 0 ? '-' : '';
  totalMinutes = Math.abs(totalMinutes);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
