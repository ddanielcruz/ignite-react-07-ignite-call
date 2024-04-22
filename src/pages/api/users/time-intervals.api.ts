import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { makeAuthOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'

const timeIntervalBodySchema = z.object({
  intervals: z.array(
    z.object({
      weekDay: z.number(),
      startTimeInMinutes: z.number(),
      endTimeInMinutes: z.number(),
    }),
  ),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, makeAuthOptions(req, res))
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { intervals } = timeIntervalBodySchema.parse(req.body)
  await prisma.$transaction(async (trx) => {
    await trx.userTimeInterval.deleteMany({
      where: { userId: session.user.id },
    })

    for (const interval of intervals) {
      await trx.userTimeInterval.create({
        data: {
          user: { connect: { id: session.user.id } },
          weekDay: interval.weekDay,
          timeStartInMinutes: interval.startTimeInMinutes,
          timeEndInMinutes: interval.endTimeInMinutes,
        },
      })
    }
  })

  return res.status(204).end()
}
