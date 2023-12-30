export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}
