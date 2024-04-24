import dayjs from 'dayjs'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const createScheduleBody = z.object({
  name: z.string().trim(),
  email: z.string().trim().email(),
  observations: z.string().optional(),
  date: z.string().datetime(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  const username = String(req.query.username)
  const user = await prisma.user.findUnique({ where: { username } })

  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  const { name, email, observations, date } = createScheduleBody.parse(req.body)
  const schedulingDate = dayjs(date).startOf('hour')

  if (schedulingDate.isBefore(dayjs())) {
    return res.status(400).json({ message: 'Cannot schedule a past date.' })
  }

  const conflictingScheduling = await prisma.scheduling.findFirst({
    where: {
      userId: user.id,
      date: schedulingDate.toDate(),
    },
  })

  if (conflictingScheduling) {
    return res
      .status(409)
      .json({ message: 'There is another scheduling at the same time.' })
  }

  await prisma.scheduling.create({
    data: {
      userId: user.id,
      name,
      email,
      observations,
      date: schedulingDate.toDate(),
    },
  })

  return res.status(201).end()
}
