import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  await prisma.activityLog.deleteMany()
  await prisma.progressUpdate.deleteMany()
  await prisma.taskAssignment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.user.deleteMany()

  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@awssbgrec.com',
      name: 'Admin',
      password: adminPassword,
      role: UserRole.CORE,
    },
  })
  console.log('Created CORE user: admin@awssbgrec.com')

  const crewPassword = await bcrypt.hash('Crew@123', 12)
  const crewUser = await prisma.user.create({
    data: {
      email: 'crew@awssbgrec.com',
      name: 'Crew Member',
      password: crewPassword,
      role: UserRole.CREW,
    },
  })
  console.log('Created CREW user: crew@awssbgrec.com')

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
