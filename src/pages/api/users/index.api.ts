import { NextApiRequest, NextApiResponse } from 'next'
import { setCookie } from 'nookies'

import { prisma } from '@/lib/prisma'

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method not allowed' })
  }

  const { name, username } = request.body
  const userWithSameUsername = await prisma.user.findUnique({
    select: { id: true },
    where: { username },
  })

  if (userWithSameUsername) {
    return response
      .status(400)
      .json({ message: 'Nome de usuário já está em uso.' })
  }

  const user = await prisma.user.create({ data: { name, username } })
  setCookie({ res: response }, '@ignitecall:userId', user.id, {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
    secure: true,
    httpOnly: true,
  })

  return response.status(201).json(user)
}
