import { useState } from 'react'

import { CalendarStep } from './CalendarStep'
import { ConfirmStep } from './ConfirmStep'

export function ScheduleForm() {
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null)

  function handleDateTimeSelected(date: Date) {
    setSelectedDateTime(date)
  }

  function handleClearSelectedDateTime() {
    setSelectedDateTime(null)
  }

  if (!selectedDateTime) {
    return <CalendarStep onDateTimeSelected={handleDateTimeSelected} />
  }

  return (
    <ConfirmStep
      schedulingDate={selectedDateTime}
      onCancel={handleClearSelectedDateTime}
    />
  )
}
