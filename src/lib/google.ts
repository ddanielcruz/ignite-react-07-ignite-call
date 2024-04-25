import dayjs from 'dayjs'
import { google } from 'googleapis'

import { env } from '@/env'

import { prisma } from './prisma'

export async function getGoogleOAuthToken(userId: string) {
  const account = await prisma.account.findFirstOrThrow({
    where: {
      userId,
      provider: 'google',
    },
  })

  const auth = new google.auth.OAuth2({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  })

  auth.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiresAt,
  })

  if (!account.expiresAt) {
    return auth
  }

  const isTokenExpired = dayjs().isAfter(dayjs(account.expiresAt * 1000))
  if (isTokenExpired) {
    const { credentials } = await auth.refreshAccessToken()

    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token,
        expiresAt: credentials.expiry_date
          ? Math.floor(credentials.expiry_date / 1000)
          : null,
        idToken: credentials.id_token,
        scope: credentials.scope,
        tokenType: credentials.token_type,
      },
    })

    auth.setCredentials(credentials)
  }

  return auth
}
