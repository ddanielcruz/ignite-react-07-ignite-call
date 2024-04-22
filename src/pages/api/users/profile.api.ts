import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { makeAuthOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'

const updateProfileBodySchema = z.object({
  bio: z.string().trim(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, makeAuthOptions(req, res))
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { bio } = updateProfileBodySchema.parse(req.body)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { bio },
  })

  return res.status(204).end()
}
