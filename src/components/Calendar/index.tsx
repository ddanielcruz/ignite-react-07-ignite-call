import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

import { getWeekDays } from '@/utils/get-week-days'

import {
  CalendarActions,
  CalendarBody,
  CalendarContainer,
  CalendarDay,
  CalendarHeader,
  CalendarTitle,
} from './styles'

interface CalendarWeek {
  week: number
  dayjs: Array<{
    date: dayjs.Dayjs
    disabled: boolean
  }>
}

interface CalendarProps {
  selectedDate?: Date | null
  onDateSelected?: (date: Date) => void
}

export function Calendar({ onDateSelected }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => dayjs().set('date', 1))
  const calendarWeeks = useMemo(() => {
    const daysInMonthArray = Array.from(
      { length: currentDate.daysInMonth() },
      (_, index) => currentDate.set('date', index + 1),
    )

    const firstWeekDay = currentDate.get('day')
    const previousMonthFillArray = Array.from(
      { length: firstWeekDay },
      (_, index) => currentDate.subtract(index + 1, 'day'),
    ).reverse()

    const lastDayInCurrentMonth = currentDate.endOf('month')
    const lastWeekDay = lastDayInCurrentMonth.get('day')
    const nextMonthFillArray = Array.from(
      { length: 6 - lastWeekDay },
      (_, index) => lastDayInCurrentMonth.add(index + 1, 'day'),
    )

    const today = dayjs()
    const calendarDays = [
      ...previousMonthFillArray.map((date) => ({ date, disabled: true })),
      ...daysInMonthArray.map((date) => {
        return { date, disabled: date.endOf('day').isBefore(today) }
      }),
      ...nextMonthFillArray.map((date) => ({ date, disabled: true })),
    ]

    return calendarDays.reduce<CalendarWeek[]>((acc, date, index) => {
      if (index % 7 === 0) {
        acc.push({
          week: acc.length + 1,
          dayjs: [date],
        })
      } else {
        acc[acc.length - 1].dayjs.push(date)
      }

      return acc
    }, [])
  }, [currentDate])

  const shortWeekDays = getWeekDays({ short: true })
  const currentMonth = currentDate.format('MMMM')
  const currentYear = currentDate.format('YYYY')

  function handlePreviousMonth() {
    const previousMonthDate = currentDate.subtract(1, 'month')
    setCurrentDate(previousMonthDate)
  }

  function handleNextMonth() {
    const nextMonthDate = currentDate.add(1, 'month')
    setCurrentDate(nextMonthDate)
  }

  return (
    <CalendarContainer>
      <CalendarHeader>
        <CalendarTitle>
          {currentMonth} <span>{currentYear}</span>
        </CalendarTitle>

        <CalendarActions>
          <button onClick={handlePreviousMonth} title="Mês anterior">
            <CaretLeft />
          </button>
          <button onClick={handleNextMonth} title="Próximo mês">
            <CaretRight />
          </button>
        </CalendarActions>
      </CalendarHeader>

      <CalendarBody>
        <thead>
          <tr>
            {shortWeekDays.map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calendarWeeks.map((week) => (
            <tr key={week.week}>
              {week.dayjs.map(({ date, disabled }) => (
                <td key={date.toString()}>
                  <CalendarDay
                    onClick={() => onDateSelected?.(date.toDate())}
                    disabled={disabled}
                  >
                    {date.format('D')}
                  </CalendarDay>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </CalendarBody>
    </CalendarContainer>
  )
}
