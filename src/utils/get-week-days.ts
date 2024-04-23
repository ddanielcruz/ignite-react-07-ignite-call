interface GetWeekDaysOptions {
  short?: boolean
}

export function getWeekDays(options?: GetWeekDaysOptions) {
  const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' })
  return Array.from({ length: 7 }, (_, index) => index).map((day) => {
    const weekDay = formatter.format(new Date(Date.UTC(2021, 5, day)))
    if (options?.short) {
      return weekDay.slice(0, 3).toUpperCase().concat('.')
    }

    return weekDay.charAt(0).toUpperCase() + weekDay.slice(1)
  })
}
