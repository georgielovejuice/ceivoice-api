import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed process...')

  // ==============================================
  // 0. CLEANUP OLD DYNAMIC DATA (For safe re-running)
  // ==============================================

  // Create Ticket Statuses
  console.log('🧹 Cleaning up old transactional data...')
  await prisma.ticketRequest.deleteMany()
  await prisma.statusHistory.deleteMany()
  await prisma.assignmentHistory.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.follower.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.request.deleteMany()

  // ==============================================
  // 1. SETUP LOOKUP DATA (Statuses & Categories)
  // ==============================================
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
      update: { step_order: status.step_order },
      create: { name: status.name, step_order: status.step_order, description: status.description, is_active: true },
    })
  }

  const categories = [
    { name: 'Technical Support', sla: 24 },
    { name: 'Billing & Payroll', sla: 48 },
    { name: 'Feature Request', sla: 168 },
    { name: 'Access Rights', sla: 12 },
    { name: 'Facilities & Hardware', sla: 24 }
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { sla_hours: cat.sla },
      create: { name: cat.name, sla_hours: cat.sla, is_active: true },
    })
  }

  // Fetch Lookups for later use
  const allStatuses = await prisma.ticketStatus.findMany()
  const statusMap = allStatuses.reduce((acc, s) => ({ ...acc, [s.name]: s.status_id }), {} as Record<string, number>)

  const allCategories = await prisma.category.findMany()
  const catMap = allCategories.reduce((acc, c) => ({ ...acc, [c.name]: c.category_id }), {} as Record<string, number>)

  // ==============================================
  // 2. CREATE USERS & SCOPES
  // ==============================================
  console.log('👥 Seeding Users...')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ceivoice.com' }, update: {},
    create: { email: 'admin@ceivoice.com', full_name: 'Sarah Connor', role: 'admin' },
  })

  const assigneeIT = await prisma.user.upsert({
    where: { email: 'tech_lead@ceivoice.com' }, update: {},
    create: { email: 'tech_lead@ceivoice.com', full_name: 'Elliot Alderson', role: 'assignee', scopes: { create: { scope_name: 'IT' } } },
  })

  const assigneeHR = await prisma.user.upsert({
    where: { email: 'hr_lead@ceivoice.com' }, update: {},
    create: { email: 'hr_lead@ceivoice.com', full_name: 'Toby Flenderson', role: 'assignee', scopes: { create: { scope_name: 'HR' } } },
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' }, update: {},
    create: { email: 'john.doe@example.com', full_name: 'John Doe', role: 'user' },
  })

  const user2 = await prisma.user.create({
    data: { email: 'jane.smith@example.com', name: 'Jane Smith', role: 'USER' },

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' }, update: {},
    create: { email: 'jane.smith@example.com', full_name: 'Jane Smith', role: 'user' },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'mike.ross@example.com' }, update: {},
    create: { email: 'mike.ross@example.com', full_name: 'Mike Ross', role: 'user' },
  })

  // ==============================================
  // 3. CREATE TICKETS & REQUESTS (Simulating varying lifecycles)
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
  console.log('🎫 Seeding Tickets & Requests...')

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Ticket 1: FULLY SOLVED (To test reporting and resolution comments)
  const req1 = await prisma.request.create({ data: { email: user1.email, message: 'I need access to the VPN.' } })
  const t1 = await prisma.ticket.create({
    data: {
      title: 'VPN Access Request',
      summary: 'User requested standard remote access.',
      status_id: statusMap['Solved'],
      category_id: catMap['Access Rights'],
      creator_user_id: user1.user_id,
      assignee_user_id: assigneeIT.user_id,
      activated_by_id: admin.user_id,
      activated_at: twoDaysAgo,
      resolved_at: new Date(),
      priority: 'High',
      created_at: twoDaysAgo,
      ticket_requests: { create: { request_id: req1.request_id } },
      status_history: {
        create: [
          { old_status_id: statusMap['New'], new_status_id: statusMap['Assigned'], changed_by_id: admin.user_id, changed_at: twoDaysAgo },
          { old_status_id: statusMap['Assigned'], new_status_id: statusMap['Solving'], changed_by_id: assigneeIT.user_id, changed_at: oneDayAgo },
          { old_status_id: statusMap['Solving'], new_status_id: statusMap['Solved'], changed_by_id: assigneeIT.user_id, changed_at: new Date() }
        ]
      }
    }
  })

  // Add a resolution comment for T1
  const t1Res = await prisma.comment.create({
    data: { ticket_id: t1.ticket_id, user_id: assigneeIT.user_id, content: 'VPN provisions granted. User successfully tested login.', visibility: 'PUBLIC' }
  })
  // Link resolution comment
  await prisma.ticket.update({ where: { ticket_id: t1.ticket_id }, data: { resolution_comment_id: t1Res.comment_id } })


  // Ticket 2: SOLVING & MASS ISSUE (Multiple users, Internal vs Public Comments)
  const reqMass1 = await prisma.request.create({ data: { email: user2.email, message: 'The main office WiFi is completely down.' } })
  const reqMass2 = await prisma.request.create({ data: { email: user3.email, message: 'Cannot connect to internet on floor 3.' } })

  await prisma.ticket.create({
    data: {
      title: 'Global Office WiFi Outage',
      summary: 'Multiple reports of WiFi failure across floors.',
      status_id: statusMap['Solving'],
      category_id: catMap['Facilities & Hardware'],
      creator_user_id: user2.user_id,
      assignee_user_id: assigneeIT.user_id,
      activated_by_id: admin.user_id,
      priority: 'Critical',
      ticket_requests: {
        create: [ { request_id: reqMass1.request_id }, { request_id: reqMass2.request_id } ]
      },
      comments: {
        create: [
          { user_id: assigneeIT.user_id, content: 'We have identified a faulty router on floor 3.', visibility: 'PUBLIC' },
          { user_id: admin.user_id, content: 'If this takes more than 2 hours, we need to notify the CEO.', visibility: 'INTERNAL' }
        ]
      }
    }
  })

  // Ticket 3: NEW (Awaiting Assignment)
  const req3 = await prisma.request.create({ data: { email: user1.email, message: 'My paycheck is missing the overtime bonus.' } })
  await prisma.ticket.create({
    data: {
      title: 'Missing Overtime Pay',
      summary: 'User reporting discrepancy in latest payroll cycle.',
      status_id: statusMap['New'],
      category_id: catMap['Billing & Payroll'],
      creator_user_id: user1.user_id,
      priority: 'High',
      ticket_requests: { create: { request_id: req3.request_id } }
    }
  })

  // Ticket 4: DRAFT (AI created, waiting for Admin)
  const req4 = await prisma.request.create({ data: { email: user3.email, message: 'Can we get dark mode on the internal dashboard?' } })
  await prisma.ticket.create({
    data: {
      title: 'Add Dark Mode to Dashboard',
      summary: 'UI enhancement request.',
      status_id: statusMap['Draft'],
      category_id: catMap['Feature Request'],
      creator_user_id: user3.user_id,
      priority: 'Low',
      ticket_requests: { create: { request_id: req4.request_id } }
    }
  })

  console.log('✅ Tickets, Histories, and Comments generated.')
  console.log('🌱 Seeding finished successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })