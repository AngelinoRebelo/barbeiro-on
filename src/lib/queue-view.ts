export type QueueInfo = {
  position: number;
  ahead: number;
  total: number;
  waiting: boolean;
};

export function queueLabel(queue: QueueInfo) {
  if (!queue.waiting) return "Fora da fila do dia";
  if (queue.ahead === 0) return "Você é o próximo";
  if (queue.ahead === 1) return "Falta 1 para a sua vez";
  return `Faltam ${queue.ahead} para a sua vez`;
}

export function paidFrom(payments: { status: string }[] | undefined) {
  if (!payments?.length) return "UNPAID" as const;
  if (payments.some((p) => p.status === "PAID")) return "PAID" as const;
  if (payments.some((p) => p.status === "PENDING")) return "PENDING" as const;
  return "UNPAID" as const;
}
