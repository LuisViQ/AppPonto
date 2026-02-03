import { parseTimeInput } from "../utils/utils";
import type { Weekday } from "../utils/constants";

export type ParsedRange = { startMinutes: number; endMinutes: number };

export function normalizeWeekday(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  const normalized = Math.round(parsed);
  if (normalized < 0 || normalized > 6) {
    return null;
  }
  return normalized as Weekday;
}

export function parseRangesInput(
  ranges: Array<{ startTime: string; endTime: string }>,
): { ranges?: ParsedRange[]; error?: string } {
  if (!ranges || ranges.length === 0) {
    return { error: "Informe ao menos um horário" };
  }

  const parsed = ranges.map((range) => {
    const startMinutes = parseTimeInput(range.startTime);
    const endMinutes = parseTimeInput(range.endTime);
    return { startMinutes, endMinutes };
  });

  if (
    parsed.some(
      (range) => range.startMinutes === null || range.endMinutes === null,
    )
  ) {
    return { error: "Horário inválido" };
  }
  if (
    parsed.some(
      (range) => (range.endMinutes as number) <= (range.startMinutes as number),
    )
  ) {
    return { error: "Fim deve ser maior que início" };
  }

  const sorted = [...parsed]
    .map((range) => ({
      startMinutes: range.startMinutes as number,
      endMinutes: range.endMinutes as number,
    }))
    .sort((a, b) => a.startMinutes - b.startMinutes);

  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].startMinutes < sorted[i - 1].endMinutes) {
      return { error: "Horários conflitantes" };
    }
  }

  return { ranges: sorted };
}

export function parseDayRangeInput(params: {
  weekday: number | null;
  startTime: string;
  endTime: string;
}) {
  const weekday = normalizeWeekday(params.weekday);
  if (weekday === null) {
    return { error: "Dia da semana inválido" };
  }

  const startMinutes = parseTimeInput(params.startTime);
  const endMinutes = parseTimeInput(params.endTime);
  if (startMinutes === null || endMinutes === null) {
    return { error: "Horário inválido" };
  }
  if (endMinutes <= startMinutes) {
    return { error: "Fim deve ser maior que início" };
  }

  return { weekday, startMinutes, endMinutes };
}
