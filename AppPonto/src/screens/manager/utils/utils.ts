export function parseTimeInput(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return hour * 60 + minute;
}

export function formatTimeFromMinutes(minutes: number) {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const minute = Math.max(0, minutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

export function formatTimeMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }

  const hour = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2);
  const minute = digits.length === 3 ? digits.slice(1, 3) : digits.slice(2, 4);

  return `${hour}:${minute}`;
}

export function formatHours(minutes: number) {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const minute = Math.max(0, minutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
}
