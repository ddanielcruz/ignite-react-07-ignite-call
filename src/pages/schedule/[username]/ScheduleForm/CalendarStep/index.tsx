import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { Calendar } from '@/components/Calendar'
import { api } from '@/lib/axios'

import {
  Container,
  TimePicker,
  TimePickerHeader,
  TimePickerItem,
  TimePickerList,
} from './styles'

interface Availability {
  availableTimes: number[]
  possibleTimes: number[]
}

interface BlockedDates {
  blockedWeekDays: number[]
  blockedDates: string[]
}

interface CalendarStepProps {
  onDateTimeSelected: (date: Date) => void
}

export function CalendarStep({ onDateTimeSelected }: CalendarStepProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const isDateSelected = Boolean(selectedDate)
  const weekDay = isDateSelected ? dayjs(selectedDate).format('dddd') : ''
  const formattedDate = isDateSelected
    ? dayjs(selectedDate).format('DD [de] MMMM')
    : ''

  const username = String(router.query.username)
  const { data: availability } = useQuery<Availability>({
    queryKey: ['availability', username, selectedDate],
    queryFn: async () => {
      const response = await api.get(`/users/${username}/availability`, {
        params: { date: dayjs(selectedDate).format('YYYY-MM-DD') },
      })

      return response.data
    },
    enabled: isDateSelected,
  })

  const blockedDatesPeriod = dayjs(selectedMonth).format('YYYY-MM')
  const { data: blockedDates } = useQuery<BlockedDates>({
    queryKey: ['blockedDates', username, blockedDatesPeriod],
    queryFn: async () => {
      const [year, month] = blockedDatesPeriod.split('-')
      const response = await api.get(`/users/${username}/blocked-dates`, {
        params: { year, month },
      })

      return response.data
    },
  })

  function handleSelectTime(hour: number) {
    const selectedDateTime = dayjs(selectedDate).set('hour', hour).toDate()
    onDateTimeSelected(selectedDateTime)
  }

  return (
    <Container isTimePickerOpen={isDateSelected}>
      <Calendar
        selectedDate={selectedDate}
        selectedMonth={selectedMonth}
        onDateSelected={setSelectedDate}
        onMonthSelected={setSelectedMonth}
        blockedWeekDays={blockedDates?.blockedWeekDays ?? [0, 1, 2, 3, 4, 5, 6]}
        blockedDates={blockedDates?.blockedDates.map((date) =>
          dayjs(date).toDate(),
        )}
      />
      {isDateSelected && (
        <TimePicker>
          <TimePickerHeader>
            {weekDay} <span>{formattedDate}</span>
          </TimePickerHeader>

          <TimePickerList>
            {availability?.possibleTimes.map((hour) => {
              const isAvailable = availability.availableTimes.includes(hour)
              return (
                <TimePickerItem
                  key={hour}
                  onClick={() => handleSelectTime(hour)}
                  disabled={!isAvailable}
                >
                  {hour.toString().padStart(2, '0')}:00
                </TimePickerItem>
              )
            })}
          </TimePickerList>
        </TimePicker>
      )}
    </Container>
  )
}
