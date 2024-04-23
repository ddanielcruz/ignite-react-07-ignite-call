import { CalendarStep } from './CalendarStep'
import { ConfirmStep } from './ConfirmStep'

export function ScheduleForm() {
  const step = 'calendar' as 'calendar' | 'confirm'
  return step === 'calendar' ? <CalendarStep /> : <ConfirmStep />
}
