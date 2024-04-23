import { Avatar, Heading, Text } from '@ignite-ui/react'
import { GetStaticPaths, GetStaticProps } from 'next'

import { prisma } from '@/lib/prisma'

import { ScheduleForm } from './ScheduleForm'
import { Container, UserHeader } from './styles'

interface SchedulePageProps {
  user: {
    id: string
    name: string
    bio: string
    avatarUrl: string
  }
}

export default function SchedulePage({ user }: SchedulePageProps) {
  console.log(user.avatarUrl)
  return (
    <Container>
      <UserHeader>
        <Avatar src={user.avatarUrl} referrerPolicy="no-referrer" />
        <Heading as="h1">{user.name}</Heading>
        <Text>{user.bio}</Text>
      </UserHeader>

      <ScheduleForm />
    </Container>
  )
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<
  SchedulePageProps,
  { username: string }
> = async ({ params }) => {
  const username = params?.username ?? ''
  const user = await prisma.user.findUnique({ where: { username } })

  if (!user) {
    return { notFound: true }
  }

  const { name, bio, avatarUrl } = user
  const isComplete = name && bio && avatarUrl

  if (!isComplete) {
    return { notFound: true }
  }

  return {
    props: {
      user: {
        id: user.id,
        name,
        bio,
        avatarUrl,
      },
    },
    revalidate: 60 * 60 * 24, // 24 hours
  }
}
