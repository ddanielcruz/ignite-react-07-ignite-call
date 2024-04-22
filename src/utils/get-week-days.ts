export function getWeekDays() {
  const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' })
  return Array.from({ length: 7 }, (_, index) => index).map((day) => {
    const weekDay = formatter.format(new Date(Date.UTC(2021, 5, day)))
    return weekDay.charAt(0).toUpperCase() + weekDay.slice(1)
  })
}
