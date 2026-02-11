import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ===== 1. SEED TICKET STATUSES (LOOKUP TABLE) =====
  console.log('📊 Seeding Ticket Statuses...');
  const statuses = [
    { name: 'Draft', step_order: 1, description: 'AI-generated draft, pending admin review' },
    { name: 'New', step_order: 2, description: 'Activated by admin, awaiting assignment' },
    { name: 'Assigned', step_order: 3, description: 'Assigned to an assignee' },
    { name: 'Solving', step_order: 4, description: 'Actively being worked on' },
    { name: 'Solved', step_order: 5, description: 'Successfully resolved' },
    { name: 'Failed', step_order: 6, description: 'Could not be resolved' },
    { name: 'Renew', step_order: 7, description: 'Reopened for additional work' },
  ];

  for (const status of statuses) {
    await prisma.ticketStatus.upsert({
      where: { name: status.name },
      update: {},
      create: status,
    });
  }
  console.log('✅ Seeded 7 ticket statuses\n');

  // ===== 2. SEED CATEGORIES (LOOKUP TABLE) =====
  console.log('📁 Seeding Categories...');
  const categories = [
    { name: 'IT Support', sla_hours: 24, description: 'Information Technology issues' },
    { name: 'HR Inquiry', sla_hours: 48, description: 'Human Resources related questions' },
    { name: 'Finance', sla_hours: 72, description: 'Financial and accounting matters' },
    { name: 'Facilities', sla_hours: 24, description: 'Office facilities and maintenance' },
    { name: 'General', sla_hours: 48, description: 'General inquiries and miscellaneous' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
  console.log('✅ Seeded 5 categories\n');

  // ===== 3. SEED USERS =====
  console.log('👥 Seeding Users...');
  
  // Hash password for test users
  const hashedPassword = await bcrypt.hash('Test123!', 10);

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ceivoice.com' },
    update: {},
    create: {
      email: 'admin@ceivoice.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      is_active: true,
    },
  });

  // Assignees
  const assignee1 = await prisma.user.upsert({
    where: { email: 'it.support@ceivoice.com' },
    update: {},
    create: {
      email: 'it.support@ceivoice.com',
      name: 'IT Support Team',
      password: hashedPassword,
      role: 'ASSIGNEE',
      is_active: true,
    },
  });

  const assignee2 = await prisma.user.upsert({
    where: { email: 'hr.team@ceivoice.com' },
    update: {},
    create: {
      email: 'hr.team@ceivoice.com',
      name: 'HR Team',
      password: hashedPassword,
      role: 'ASSIGNEE',
      is_active: true,
    },
  });

  // Regular Users
  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@company.com' },
    update: {},
    create: {
      email: 'john.doe@company.com',
      name: 'John Doe',
      password: hashedPassword,
      role: 'USER',
      is_active: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@company.com' },
    update: {},
    create: {
      email: 'jane.smith@company.com',
      name: 'Jane Smith',
      password: hashedPassword,
      role: 'USER',
      is_active: true,
    },
  });

  console.log('✅ Seeded 5 users (1 admin, 2 assignees, 2 users)\n');

  // ===== 4. SEED ASSIGNEE SCOPES =====
  console.log('🎯 Seeding Assignee Scopes...');
  await prisma.assigneeScope.createMany({
    data: [
      { assignee_id: assignee1.user_id, scope_name: 'IT Support' },
      { assignee_id: assignee1.user_id, scope_name: 'Facilities' },
      { assignee_id: assignee2.user_id, scope_name: 'HR Inquiry' },
      { assignee_id: assignee2.user_id, scope_name: 'General' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Seeded assignee scopes\n');

  // ===== 5. SEED SAMPLE REQUESTS =====
  console.log('📬 Seeding Sample Requests...');
  const request1 = await prisma.request.create({
    data: {
      email: 'customer@example.com',
      message: 'My laptop is not connecting to the company VPN. I\'ve tried restarting but the issue persists.',
    },
  });

  const request2 = await prisma.request.create({
    data: {
      email: 'employee@company.com',
      message: 'I need information about the new health insurance enrollment process.',
    },
  });

  console.log('✅ Seeded 2 sample requests\n');

  // ===== 6. SEED SAMPLE TICKETS =====
  console.log('🎫 Seeding Sample Tickets...');
  
  // Get status IDs
  const draftStatus = await prisma.ticketStatus.findUnique({ where: { name: 'Draft' } });
  const newStatus = await prisma.ticketStatus.findUnique({ where: { name: 'New' } });
  const assignedStatus = await prisma.ticketStatus.findUnique({ where: { name: 'Assigned' } });
  const solvingStatus = await prisma.ticketStatus.findUnique({ where: { name: 'Solving' } });
  const solvedStatus = await prisma.ticketStatus.findUnique({ where: { name: 'Solved' } });
  
  // Get category IDs
  const itCategory = await prisma.category.findUnique({ where: { name: 'IT Support' } });
  const hrCategory = await prisma.category.findUnique({ where: { name: 'HR Inquiry' } });

  // Ticket 1: Draft status (AI-generated, pending admin review)
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'VPN Connection Issue - Unable to Access Company Network',
      summary: 'User is experiencing VPN connection problems preventing access to company network resources.',
      suggested_solution: 'Check VPN client version, verify credentials, and ensure network connectivity. May need to reinstall VPN client.',
      status_id: draftStatus!.status_id,
      category_id: itCategory!.category_id,
      creator_user_id: admin.user_id,
      priority: 'High',
    },
  });

  // Link ticket to request
  await prisma.ticketRequest.create({
    data: {
      ticket_id: ticket1.ticket_id,
      request_id: request1.request_id,
    },
  });

  // Ticket 2: New status (activated, awaiting assignment)
  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Health Insurance Enrollment Information Request',
      summary: 'Employee needs information about the health insurance enrollment process and deadlines.',
      suggested_solution: 'Provide enrollment guide, deadline information, and point of contact for benefits team.',
      status_id: newStatus!.status_id,
      category_id: hrCategory!.category_id,
      creator_user_id: admin.user_id,
      activated_by_id: admin.user_id,
      activated_at: new Date(),
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      priority: 'Medium',
    },
  });

  await prisma.ticketRequest.create({
    data: {
      ticket_id: ticket2.ticket_id,
      request_id: request2.request_id,
    },
  });

  // Ticket 3: Assigned status
  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Email Client Configuration Issue',
      summary: 'User unable to send emails from Outlook client. Receiving timeout errors.',
      suggested_solution: 'Verify SMTP settings, check firewall rules, test with webmail.',
      status_id: assignedStatus!.status_id,
      category_id: itCategory!.category_id,
      creator_user_id: user1.user_id,
      assignee_user_id: assignee1.user_id,
      activated_by_id: admin.user_id,
      activated_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      priority: 'High',
    },
  });

  // Ticket 4: Solving status (in progress)
  const ticket4 = await prisma.ticket.create({
    data: {
      title: 'Password Reset Request for HR Portal',
      summary: 'User forgot password for HR self-service portal and unable to reset via email.',
      suggested_solution: 'Verify user identity and manually reset password. Check email delivery settings.',
      status_id: solvingStatus!.status_id,
      category_id: hrCategory!.category_id,
      creator_user_id: user2.user_id,
      assignee_user_id: assignee2.user_id,
      activated_by_id: admin.user_id,
      activated_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      deadline: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36 hours from now
      priority: 'Medium',
    },
  });

  console.log('✅ Seeded 4 sample tickets\n');

  // ===== 7. SEED COMMENTS =====
  console.log('💬 Seeding Comments...');
  
  await prisma.comment.createMany({
    data: [
      {
        ticket_id: ticket3.ticket_id,
        user_id: assignee1.user_id,
        content: 'I\'ve started investigating this issue. Checking the SMTP configuration now.',
        visibility: 'PUBLIC',
      },
      {
        ticket_id: ticket4.ticket_id,
        user_id: assignee2.user_id,
        content: 'User identity verified. Proceeding with password reset.',
        visibility: 'INTERNAL',
      },
      {
        ticket_id: ticket4.ticket_id,
        user_id: user2.user_id,
        content: 'Thank you for the quick response!',
        visibility: 'PUBLIC',
      },
    ],
  });

  console.log('✅ Seeded 3 comments\n');

  // ===== 8. SEED STATUS HISTORIES =====
  console.log('📜 Seeding Status Histories...');
  
  await prisma.statusHistory.createMany({
    data: [
      {
        ticket_id: ticket2.ticket_id,
        old_status_id: draftStatus!.status_id,
        new_status_id: newStatus!.status_id,
        changed_by_id: admin.user_id,
        change_reason: 'Reviewed and activated by admin',
      },
      {
        ticket_id: ticket3.ticket_id,
        old_status_id: newStatus!.status_id,
        new_status_id: assignedStatus!.status_id,
        changed_by_id: admin.user_id,
        change_reason: 'Assigned to IT Support team',
      },
      {
        ticket_id: ticket4.ticket_id,
        old_status_id: assignedStatus!.status_id,
        new_status_id: solvingStatus!.status_id,
        changed_by_id: assignee2.user_id,
        change_reason: 'Started working on the issue',
      },
    ],
  });

  console.log('✅ Seeded status history records\n');

  // ===== 9. SEED ASSIGNMENT HISTORIES =====
  console.log('📋 Seeding Assignment Histories...');
  
  await prisma.assignmentHistory.createMany({
    data: [
      {
        ticket_id: ticket3.ticket_id,
        old_assignee_id: null,
        new_assignee_id: assignee1.user_id,
        changed_by_id: admin.user_id,
        change_reason: 'Initial assignment to IT Support',
      },
      {
        ticket_id: ticket4.ticket_id,
        old_assignee_id: null,
        new_assignee_id: assignee2.user_id,
        changed_by_id: admin.user_id,
        change_reason: 'Assigned to HR team',
      },
    ],
  });

  console.log('✅ Seeded assignment history records\n');

  // ===== 10. SEED FOLLOWERS =====
  console.log('👁️ Seeding Followers...');
  
  await prisma.follower.createMany({
    data: [
      { ticket_id: ticket3.ticket_id, user_id: user1.user_id },
      { ticket_id: ticket3.ticket_id, user_id: admin.user_id },
      { ticket_id: ticket4.ticket_id, user_id: user2.user_id },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seeded followers\n');

  // ===== 11. SEED NOTIFICATIONS =====
  console.log('🔔 Seeding Notifications...');
  
  await prisma.notification.createMany({
    data: [
      {
        ticket_id: ticket3.ticket_id,
        user_id: user1.user_id,
        type: 'assignment',
        message: 'Your ticket has been assigned to IT Support Team',
        is_read: false,
      },
      {
        ticket_id: ticket3.ticket_id,
        user_id: assignee1.user_id,
        type: 'assignment',
        message: 'You have been assigned a new ticket: Email Client Configuration Issue',
        is_read: true,
      },
      {
        ticket_id: ticket4.ticket_id,
        user_id: user2.user_id,
        type: 'status_change',
        message: 'Your ticket status changed to: Solving',
        is_read: false,
      },
    ],
  });

  console.log('✅ Seeded notifications\n');

  // ===== SUMMARY =====
  console.log('═══════════════════════════════════════════');
  console.log('✨ Database Seeding Complete!');
  console.log('═══════════════════════════════════════════');
  console.log('📊 Ticket Statuses: 7');
  console.log('📁 Categories: 5');
  console.log('👥 Users: 5 (1 admin, 2 assignees, 2 users)');
  console.log('🎯 Assignee Scopes: 4');
  console.log('📬 Requests: 2');
  console.log('🎫 Tickets: 4 (various statuses)');
  console.log('💬 Comments: 3');
  console.log('📜 Status Histories: 3');
  console.log('📋 Assignment Histories: 2');
  console.log('👁️ Followers: 3');
  console.log('🔔 Notifications: 3');
  console.log('═══════════════════════════════════════════');
  console.log('\n📝 Test Credentials:');
  console.log('   Admin: admin@ceivoice.com / Test123!');
  console.log('   IT Support: it.support@ceivoice.com / Test123!');
  console.log('   HR Team: hr.team@ceivoice.com / Test123!');
  console.log('   User 1: john.doe@company.com / Test123!');
  console.log('   User 2: jane.smith@company.com / Test123!');
  console.log('═══════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
