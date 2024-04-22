import type { User as PrismaUser } from '@prisma/client'
import { NextApiRequest, NextApiResponse, NextPageContext } from 'next'
import type { Adapter, AdapterUser } from 'next-auth/adapters'
import { destroyCookie, parseCookies } from 'nookies'

import { prisma } from '../prisma'

function adaptPrismaUser(user: PrismaUser): AdapterUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name ?? '',
    email: user.email ?? '',
    emailVerified: null,
    avatarUrl: user.avatarUrl ?? '',
  }
}

export function PrismaAdapter(
  req: NextApiRequest | NextPageContext['req'],
  res: NextApiResponse | NextPageContext['res'],
): Adapter {
  return {
    async createUser(user) {
      const cookies = parseCookies({ req })
      const userIdCookieName = '@ignitecall:userId'
      const userIdOnCookies = cookies[userIdCookieName]

      if (!userIdOnCookies) {
        throw new Error('User ID not found on cookies')
      }

      const prismaUser = await prisma.user.update({
        where: { id: userIdOnCookies },
        data: {
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      })

      destroyCookie({ res }, userIdCookieName, { path: '/' })

      return adaptPrismaUser(prismaUser)
    },

    async deleteUser(userId) {
      await prisma.user.delete({ where: { id: userId } })
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } })
      return user ? adaptPrismaUser(user) : null
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } })
      return user ? adaptPrismaUser(user) : null
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const prismaAccount = await prisma.account.findUnique({
        select: { user: true },
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      })

      if (!prismaAccount) {
        return null
      }

      return adaptPrismaUser(prismaAccount.user)
    },

    async updateUser(user) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      })

      return adaptPrismaUser(updatedUser)
    },

    async linkAccount(account) {
      await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refreshToken: account.refresh_token,
          accessToken: account.access_token,
          expiresAt: account.expires_at,
          tokenType: account.token_type,
          scope: account.scope,
          idToken: account.id_token,
          sessionState: account.session_state,
        },
      })
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await prisma.account.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      })
    },

    async createSession({ sessionToken, userId, expires }) {
      return await prisma.session.create({
        data: {
          sessionToken,
          userId,
          expires,
        },
      })
    },

    async getSessionAndUser(sessionToken) {
      const prismaSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: true,
        },
      })

      if (!prismaSession) {
        return null
      }

      const { user, ...session } = prismaSession
      return { session, user: adaptPrismaUser(user) }
    },

    async updateSession({ sessionToken, ...data }) {
      const session = await prisma.session.update({
        where: { sessionToken },
        data,
      })

      return session
    },

    async deleteSession(sessionToken) {
      await prisma.session.delete({ where: { sessionToken } })
    },
  }
}
