import dayjs from 'dayjs'
import { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '@/lib/prisma'

const EMPTY_RESPONSE = {
  availableTimes: [],
  possibleTimes: [],
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  const username = String(req.query.username)
  const { date } = req.query

  if (!date) {
    return res.status(400).json({ message: 'Date not provided.' })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  const refDate = dayjs(String(date))
  if (!refDate.isValid()) {
    return res.status(400).json({ message: 'Invalid date.' })
  }

  const isPastDate = refDate.endOf('day').isBefore(dayjs())
  if (isPastDate) {
    return res.status(400).json(EMPTY_RESPONSE)
  }

  const userAvailability = await prisma.userTimeInterval.findFirst({
    where: {
      userId: user.id,
      weekDay: refDate.day(),
    },
  })

  if (!userAvailability) {
    return res.json(EMPTY_RESPONSE)
  }

  const { timeStartInMinutes, timeEndInMinutes } = userAvailability
  const startHour = timeStartInMinutes / 60
  const endHour = timeEndInMinutes / 60
  const possibleTimes = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  )

  const blockedTimes = await prisma.scheduling.findMany({
    select: { date: true },
    where: {
      userId: user.id,
      date: {
        gte: refDate.startOf('day').toDate(),
        lte: refDate.endOf('day').toDate(),
      },
    },
  })

  const availableTimes = possibleTimes.filter((time) => {
    const isTimeBlocked = blockedTimes.some(
      (blockedTime) => blockedTime.date.getHours() === time,
    )

    const isPastTime = refDate.set('hour', time).isBefore(new Date())

    return !isTimeBlocked && !isPastTime
  })

  return res.json({
    availableTimes,
    possibleTimes,
  })
}
