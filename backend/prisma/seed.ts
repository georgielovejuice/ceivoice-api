import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ==============================================
  // 1. SETUP LOOKUP DATA
  // ==============================================
  
  const departments = ['IT', 'HR', 'Finance', 'Legal']
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { department: dept },
      update: {},
      create: { department: dept },
    })
  }

  const categories = ['Technical Support', 'Billing', 'Feature Request', 'Access Rights']
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { catagory: cat },
      update: {},
      create: { catagory: cat },
    })
  }

  // ==============================================
  // 2. CREATE USERS
  // ==============================================

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ceivoice.com',
      full_name: 'Sarah Connor',
      role: 'Admin',
      google_id: 'google_123_admin',
    },
  })

  const assigneeIT = await prisma.user.create({
    data: {
      email: 'tech_lead@ceivoice.com',
      full_name: 'Elliot Alderson',
      role: 'Assignee',
      user_departments: {
        create: { department_name: 'IT' }
      }
    },
  })

  const user1 = await prisma.user.create({
    data: { email: 'john.doe@example.com', full_name: 'John Doe', role: 'User' },
  })
  
  const user2 = await prisma.user.create({
    data: { email: 'jane.smith@example.com', full_name: 'Jane Smith', role: 'User' },
  })

  console.log('✅ Users created.')

  // ==============================================
  // 3. CREATE TICKETS
  // ==============================================

  // --- Scenario 1: Standard Ticket ---
  await prisma.ticket.create({
    data: {
      ticket_id: 'TKT-2026-001',
      original_message: 'My laptop screen keeps flickering.',
      title: 'Laptop Screen Flickering',
      summary: 'Hardware display issues.',
      suggested_solution: 'Update drivers.',
      category_name: 'Technical Support',
      status: 'Solving',
      creator_id: user1.user_id,
      assignments: {
        create: { assignee_id: assigneeIT.user_id }
      },
      comments: {
        create: [
          {
            author_id: user1.user_id,
            content: 'It happens mostly when I share my screen.',
            visibility: 'Public'
          },
          {
            author_id: assigneeIT.user_id,
            content: 'Checking warranty status.',
            visibility: 'Internal'
          }
        ]
      }
    },
  })

  // --- Scenario 2: Parent Ticket (Mass Issue) ---
  const parentTicket = await prisma.ticket.create({
    data: {
      ticket_id: 'INCIDENT-WIFI-MAIN',
      original_message: 'Nobody on the 4th floor can connect to WiFi.',
      title: '4th Floor WiFi Outage',
      category_name: 'Technical Support',
      status: 'Assigned',
      creator_id: admin.user_id,
      assignments: {
        create: { assignee_id: assigneeIT.user_id }
      }
    }
  })

  // --- Scenario 3: Merged Child Tickets ---
  
  // Create Child Ticket 1
  await prisma.ticket.create({
    data: {
      ticket_id: 'TKT-WIFI-002',
      original_message: 'Internet is down on my phone.',
      title: 'Internet Issues',
      category_name: 'Technical Support',
      status: 'Draft',
      creator_id: user1.user_id,
      parent_ticket_id: parentTicket.ticket_id, // Link to Parent
    }
  })

  // MANUALLY Add User 1 as a follower of the PARENT ticket
  // We do this separately to avoid the nesting conflict
  await prisma.ticketFollower.create({
    data: {
      ticket_id: parentTicket.ticket_id, // The Parent Ticket
      follower_id: user1.user_id         // The User who submitted the child ticket
    }
  })

  // Create Child Ticket 2
  await prisma.ticket.create({
    data: {
      ticket_id: 'TKT-WIFI-003',
      original_message: 'Cannot connect to CEI-Guest network.',
      title: 'Network Error',
      category_name: 'Technical Support',
      status: 'Draft',
      creator_id: user2.user_id,
      parent_ticket_id: parentTicket.ticket_id,
    }
  })

  // MANUALLY Add User 2 as a follower of the PARENT ticket
  await prisma.ticketFollower.create({
    data: {
      ticket_id: parentTicket.ticket_id,
      follower_id: user2.user_id
    }
  })

  console.log('✅ Tickets (including Mass Issue Merge) created.')
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })