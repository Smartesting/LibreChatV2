export const parseDatetimeLocalToDate = (value: string, timeZone: string) => {
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(localDate);
  const tzHour = Number(parts.find((p) => p.type === 'hour')?.value ?? hour);

  const diff = tzHour - localDate.getUTCHours();
  localDate.setUTCHours(localDate.getUTCHours() - diff);

  return localDate;
};

export const formatDateInTimezone = (date: string | Date, timeZone: string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
};

export const formatDateToTimezoneLocalString = (date: Date, timeZone: string): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date).reduce(
    (acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};
