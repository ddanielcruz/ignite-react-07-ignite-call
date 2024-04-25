import { NextApiRequest, NextApiResponse, NextPageContext } from 'next'
import type { AuthOptions } from 'next-auth'
import GoogleProvider, { GoogleProfile } from 'next-auth/providers/google'

import { env } from '@/env'
import { PrismaAdapter } from '@/lib/auth/prisma-adapter'

export const makeAuthOptions = (
  req: NextApiRequest | NextPageContext['req'],
  res: NextApiResponse | NextPageContext['res'],
): AuthOptions => ({
  adapter: PrismaAdapter(req, res),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
      profile(profile: GoogleProfile) {
        return {
          id: profile.sub,
          username: '',
          name: profile.name,
          avatarUrl: profile.picture,
          email: profile.email,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      const scope = account?.scope ?? ''
      if (!scope.includes('https://www.googleapis.com/auth/calendar')) {
        return '/register/connect-calendar/?error=permissions'
      }

      return true
    },

    async session({ session, user }) {
      return {
        ...session,
        user,
      }
    },
  },
})
