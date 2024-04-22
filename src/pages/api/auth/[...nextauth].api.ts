import type { NextApiRequest, NextApiResponse } from 'next'
import NextAuth from 'next-auth'

import { makeAuthOptions } from '@/lib/auth/options'

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  return await NextAuth(req, res, makeAuthOptions(req, res))
}
