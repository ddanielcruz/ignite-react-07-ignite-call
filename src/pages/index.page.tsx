import { Heading } from '@ignite-ui/react'
import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Ignite Call</title>
      </Head>
      <main>
        <Heading as="h1">Home</Heading>
      </main>
    </>
  )
}
