import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ==============================================
  // 1. SETUP LOOKUP DATA
  // ==============================================
  
  // Create Ticket Statuses
  const statuses = [
    { name: 'Draft', step_order: 1, description: 'AI-generated ticket awaiting admin review' },
    { name: 'New', step_order: 2, description: 'Ticket submitted and awaiting assignment' },
    { name: 'Assigned', step_order: 3, description: 'Ticket assigned to an assignee' },
    { name: 'Solving', step_order: 4, description: 'Assignee is working on the ticket' },
    { name: 'Solved', step_order: 5, description: 'Ticket has been resolved' },
    { name: 'Failed', step_order: 6, description: 'Ticket could not be resolved' },
    { name: 'Renew', step_order: 7, description: 'Ticket reopened after being marked solved/failed' }
  ]
  
  for (const status of statuses) {
    await prisma.ticketStatus.upsert({
      where: { name: status.name },
      update: {},
      create: status,
    })
  }

  // Create Categories
  const categories = ['Technical Support', 'Billing', 'Feature Request', 'Access Rights']
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat, sla_hours: 24 },
    })
  }

  console.log('✅ Lookup data created.')

  // ==============================================
  // 2. CREATE USERS
  // ==============================================

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ceivoice.com',
      name: 'Sarah Connor',
      role: 'ADMIN',
      google_id: 'google_123_admin',
    },
  })

  const assigneeIT = await prisma.user.create({
    data: {
      email: 'tech_lead@ceivoice.com',
      name: 'Elliot Alderson',
      role: 'ASSIGNEE',
      scopes: {
        create: { scope_name: 'IT' }
      }
    },
  })

  const user1 = await prisma.user.create({
    data: { email: 'john.doe@example.com', name: 'John Doe', role: 'USER' },
  })
  
  const user2 = await prisma.user.create({
    data: { email: 'jane.smith@example.com', name: 'Jane Smith', role: 'USER' },
  })

  console.log('✅ Users created.')

  // ==============================================
  // 3. CREATE TICKETS
  // ==============================================

  // Get status IDs
  const draftStatus = await prisma.ticketStatus.findUnique({ where: { name: 'Draft' } })
  const newStatus = await prisma.ticketStatus.findUnique({ where: { name: 'New' } })
  const assignedStatus = await prisma.ticketStatus.findUnique({ where: { name: 'Assigned' } })
  const solvingStatus = await prisma.ticketStatus.findUnique({ where: { name: 'Solving' } })
  
  // Get category ID
  const techSupportCategory = await prisma.category.findUnique({ where: { name: 'Technical Support' } })

  // --- Scenario 1: Standard Ticket with Comments ---
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Laptop Screen Flickering',
      summary: 'Hardware display issues.',
      suggested_solution: 'Update drivers.',
      status_id: solvingStatus?.status_id,
      category_id: techSupportCategory?.category_id,
      creator_user_id: user1.user_id,
      assignee_user_id: assigneeIT.user_id,
      activated_by_id: admin.user_id,
      activated_at: new Date(),
      priority: 'Medium',
    },
  })

  // Add comments
  await prisma.comment.create({
    data: {
      ticket_id: ticket1.ticket_id,
      user_id: user1.user_id,
      content: 'It happens mostly when I share my screen.',
      visibility: 'PUBLIC'
    }
  })

  await prisma.comment.create({
    data: {
      ticket_id: ticket1.ticket_id,
      user_id: assigneeIT.user_id,
      content: 'Checking warranty status.',
      visibility: 'INTERNAL'
    }
  })

  // --- Scenario 2: Assigned Ticket ---
  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Network Connectivity Issues',
      summary: 'User cannot connect to WiFi network.',
      suggested_solution: 'Check network settings and credentials.',
      status_id: assignedStatus?.status_id,
      category_id: techSupportCategory?.category_id,
      creator_user_id: user2.user_id,
      assignee_user_id: assigneeIT.user_id,
      activated_by_id: admin.user_id,
      activated_at: new Date(),
      priority: 'High',
    }
  })

  // --- Scenario 3: Draft Ticket ---
  await prisma.ticket.create({
    data: {
      title: 'Unable to Access Email',
      summary: 'User reporting email access problems.',
      suggested_solution: 'Reset password and verify account status.',
      status_id: draftStatus?.status_id,
      category_id: techSupportCategory?.category_id,
      creator_user_id: user1.user_id,
      priority: 'Low',
    }
  })

  // Add followers
  await prisma.follower.create({
    data: {
      ticket_id: ticket1.ticket_id,
      user_id: user1.user_id
    }
  })

  await prisma.follower.create({
    data: {
      ticket_id: ticket2.ticket_id,
      user_id: user2.user_id
    }
  })

  console.log('✅ Tickets created.')
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })