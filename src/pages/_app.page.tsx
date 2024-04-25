import '@/lib/dayjs'

import { QueryClientProvider } from '@tanstack/react-query'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { DefaultSeo } from 'next-seo'

import { queryClient } from '@/lib/react-query'
import { globalStyles } from '@/styles/global'

globalStyles()

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <DefaultSeo
          titleTemplate="%s | Ignite Call"
          openGraph={{
            type: 'website',
            locale: 'pt_BR',
            url: 'https://www.ignitecall.com.br',
            site_name: 'Ignite Call',
          }}
        />

        <Component {...pageProps} />
      </QueryClientProvider>
    </SessionProvider>
  )
}
