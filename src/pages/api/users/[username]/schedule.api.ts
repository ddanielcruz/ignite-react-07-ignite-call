import dayjs from 'dayjs'
import { google } from 'googleapis'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { getGoogleOAuthToken } from '@/lib/google'
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

  const scheduling = await prisma.scheduling.create({
    data: {
      userId: user.id,
      name,
      email,
      observations,
      date: schedulingDate.toDate(),
    },
  })

  const calendar = google.calendar({
    version: 'v3',
    auth: await getGoogleOAuthToken(user.id),
  })

  await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: `Ignite Call: ${name}`,
      description: observations,
      start: {
        dateTime: schedulingDate.toISOString(),
      },
      end: {
        dateTime: schedulingDate.add(1, 'hour').toISOString(),
      },
      attendees: [{ displayName: name, email }],
      conferenceData: {
        createRequest: {
          requestId: scheduling.id,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    },
  })

  return res.status(201).end()
}
