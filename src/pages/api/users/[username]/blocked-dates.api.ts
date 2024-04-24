import dayjs from 'dayjs'
import { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '@/lib/prisma'

interface SchedulingGroup {
  daySlots: number
  scheduledSlots: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  const username = String(req.query.username)
  const user = await prisma.user.findUnique({ where: { username } })

  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  const { year, month } = req.query
  if (!year || !month) {
    return res.status(400).json({ message: 'Year and month are required.' })
  }

  const refDate = dayjs(`${year}-${month}-01`)
  if (!refDate.isValid()) {
    return res.status(400).json({ message: 'Invalid date.' })
  }

  const availableWeekDays = await prisma.userTimeInterval.findMany({
    where: { userId: user.id },
  })

  const blockedWeekDays = [0, 1, 2, 3, 4, 5, 6].filter((weekDay) => {
    return !availableWeekDays.some((interval) => interval.weekDay === weekDay)
  })

  const scheduledDates = await prisma.scheduling.findMany({
    select: { date: true },
    where: {
      userId: user.id,
      date: {
        gte: refDate.toDate(),
        lt: refDate.add(1, 'month').toDate(),
      },
    },
  })

  // Calculate which dates are fully booked and should be blocked
  const groupedDates = scheduledDates.reduce<{
    [key: string]: SchedulingGroup
  }>((acc, scheduling) => {
    const date = dayjs(scheduling.date)
    const key = date.format('YYYY-MM-DD')

    if (!acc[key]) {
      const dayTimeInterval = availableWeekDays.find(
        (interval) => interval.weekDay === date.day(),
      )
      let daySlots = 0

      if (dayTimeInterval) {
        const startHour = dayTimeInterval.timeStartInMinutes / 60
        const endHour = dayTimeInterval.timeEndInMinutes / 60
        daySlots = endHour - startHour
      }

      acc[key] = { daySlots, scheduledSlots: 0 }
    }

    acc[key].scheduledSlots++

    return acc
  }, {})

  return res.json({
    blockedWeekDays,
    blockedDates: Object.entries(groupedDates)
      .filter(([, group]) => group.scheduledSlots >= group.daySlots)
      .map(([key]) => key),
  })
}
