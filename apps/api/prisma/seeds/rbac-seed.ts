import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRBAC() {
  console.log('🌱 Seeding RBAC data...');

  // ============================================
  // 1. CREATE PERMISSIONS
  // ============================================
  console.log('\n📋 Creating permissions...');

  const permissions = [
    // Client permissions
    { resource: 'clients', action: 'create', displayName: 'Create Clients', category: 'Clients' },
    { resource: 'clients', action: 'read', displayName: 'View Clients', category: 'Clients' },
    { resource: 'clients', action: 'update', displayName: 'Edit Clients', category: 'Clients' },
    { resource: 'clients', action: 'delete', displayName: 'Delete Clients', category: 'Clients', isDangerous: true },
    { resource: 'clients', action: 'export', displayName: 'Export Clients', category: 'Clients' },

    // Asset permissions
    { resource: 'assets', action: 'create', displayName: 'Upload Assets', category: 'Content' },
    { resource: 'assets', action: 'read', displayName: 'View Assets', category: 'Content' },
    { resource: 'assets', action: 'update', displayName: 'Edit Assets', category: 'Content' },
    { resource: 'assets', action: 'delete', displayName: 'Delete Assets', category: 'Content', isDangerous: true },
    { resource: 'assets', action: 'download', displayName: 'Download Assets', category: 'Content' },

    // Gallery permissions
    { resource: 'galleries', action: 'create', displayName: 'Create Galleries', category: 'Content' },
    { resource: 'galleries', action: 'read', displayName: 'View Galleries', category: 'Content' },
    { resource: 'galleries', action: 'update', displayName: 'Edit Galleries', category: 'Content' },
    { resource: 'galleries', action: 'delete', displayName: 'Delete Galleries', category: 'Content' },
    { resource: 'galleries', action: 'share', displayName: 'Share Galleries', category: 'Content' },

    // Invoice permissions
    { resource: 'invoices', action: 'create', displayName: 'Create Invoices', category: 'Finance' },
    { resource: 'invoices', action: 'read', displayName: 'View Invoices', category: 'Finance' },
    { resource: 'invoices', action: 'update', displayName: 'Edit Invoices', category: 'Finance' },
    { resource: 'invoices', action: 'delete', displayName: 'Delete Invoices', category: 'Finance', isDangerous: true },
    { resource: 'invoices', action: 'send', displayName: 'Send Invoices', category: 'Finance' },
    { resource: 'invoices', action: 'void', displayName: 'Void Invoices', category: 'Finance', isDangerous: true },

    // Payment permissions
    { resource: 'payments', action: 'create', displayName: 'Record Payments', category: 'Finance' },
    { resource: 'payments', action: 'read', displayName: 'View Payments', category: 'Finance' },
    { resource: 'payments', action: 'update', displayName: 'Edit Payments', category: 'Finance' },
    { resource: 'payments', action: 'delete', displayName: 'Delete Payments', category: 'Finance', isDangerous: true },
    { resource: 'payments', action: 'refund', displayName: 'Refund Payments', category: 'Finance', isDangerous: true },

    // Contract permissions
    { resource: 'contracts', action: 'create', displayName: 'Create Contracts', category: 'Legal' },
    { resource: 'contracts', action: 'read', displayName: 'View Contracts', category: 'Legal' },
    { resource: 'contracts', action: 'update', displayName: 'Edit Contracts', category: 'Legal' },
    { resource: 'contracts', action: 'delete', displayName: 'Delete Contracts', category: 'Legal', isDangerous: true },
    { resource: 'contracts', action: 'send', displayName: 'Send Contracts', category: 'Legal' },

    // Proposal permissions
    { resource: 'proposals', action: 'create', displayName: 'Create Proposals', category: 'Sales' },
    { resource: 'proposals', action: 'read', displayName: 'View Proposals', category: 'Sales' },
    { resource: 'proposals', action: 'update', displayName: 'Edit Proposals', category: 'Sales' },
    { resource: 'proposals', action: 'delete', displayName: 'Delete Proposals', category: 'Sales' },
    { resource: 'proposals', action: 'send', displayName: 'Send Proposals', category: 'Sales' },

    // User management permissions
    { resource: 'users', action: 'create', displayName: 'Create Users', category: 'Admin', isDangerous: true },
    { resource: 'users', action: 'read', displayName: 'View Users', category: 'Admin' },
    { resource: 'users', action: 'update', displayName: 'Edit Users', category: 'Admin' },
    { resource: 'users', action: 'delete', displayName: 'Delete Users', category: 'Admin', isDangerous: true },
    { resource: 'users', action: 'impersonate', displayName: 'Impersonate Users', category: 'Admin', isDangerous: true },

    // Role management permissions
    { resource: 'roles', action: 'create', displayName: 'Create Roles', category: 'Admin', isDangerous: true },
    { resource: 'roles', action: 'read', displayName: 'View Roles', category: 'Admin' },
    { resource: 'roles', action: 'update', displayName: 'Edit Roles', category: 'Admin', isDangerous: true },
    { resource: 'roles', action: 'delete', displayName: 'Delete Roles', category: 'Admin', isDangerous: true },
    { resource: 'roles', action: 'assign', displayName: 'Assign Roles', category: 'Admin', isDangerous: true },

    // Audit permissions
    { resource: 'audit', action: 'read', displayName: 'View Audit Logs', category: 'Admin' },
    { resource: 'audit', action: 'export', displayName: 'Export Audit Logs', category: 'Admin' },

    // Settings permissions
    { resource: 'settings', action: 'read', displayName: 'View Settings', category: 'Admin' },
    { resource: 'settings', action: 'update', displayName: 'Edit Settings', category: 'Admin', isDangerous: true },

    // Accounting permissions
    { resource: 'accounting', action: 'read', displayName: 'View Accounting', category: 'Finance' },
    { resource: 'accounting', action: 'reconcile', displayName: 'Reconcile Accounts', category: 'Finance' },
    { resource: 'accounting', action: 'close-period', displayName: 'Close Periods', category: 'Finance', isDangerous: true },
    { resource: 'accounting', action: 'journal', displayName: 'Create Journal Entries', category: 'Finance' },

    // Records permissions (WORM compliance)
    { resource: 'records', action: 'create', displayName: 'Archive Records', category: 'Compliance' },
    { resource: 'records', action: 'read', displayName: 'View Records', category: 'Compliance' },
    { resource: 'records', action: 'legal-hold', displayName: 'Apply Legal Hold', category: 'Compliance', isDangerous: true },
    { resource: 'records', action: 'dispose', displayName: 'Dispose Records', category: 'Compliance', isDangerous: true },
  ];

  const createdPermissions: any[] = [];

  for (const perm of permissions) {
    const name = `${perm.resource}:${perm.action}`;
    const permission = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: {
        ...perm,
        name,
        isSystem: true,
        isActive: true,
      },
    });
    createdPermissions.push(permission);
    console.log(`  ✓ ${name}`);
  }

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // ============================================
  // 2. CREATE ROLES
  // ============================================
  console.log('\n👥 Creating roles...');

  // Super Admin - Full access
  const superAdmin = await prisma.systemRole.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      displayName: 'Super Administrator',
      description: 'Full system access with all permissions',
      level: 100,
      isSystem: true,
      isDefault: false,
      isActive: true,
    },
  });
  console.log('  ✓ SUPER_ADMIN');

  // Admin - Most permissions except dangerous system operations
  const admin = await prisma.systemRole.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      displayName: 'Administrator',
      description: 'Full access to business operations',
      level: 80,
      isSystem: true,
      isDefault: false,
      isActive: true,
    },
  });
  console.log('  ✓ ADMIN');

  // Manager - Business operations, no system admin
  const manager = await prisma.systemRole.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      displayName: 'Manager',
      description: 'Manage clients, content, and finances',
      level: 60,
      isSystem: true,
      isDefault: false,
      isActive: true,
    },
  });
  console.log('  ✓ MANAGER');

  // Editor - Content management
  const editor = await prisma.systemRole.upsert({
    where: { name: 'EDITOR' },
    update: {},
    create: {
      name: 'EDITOR',
      displayName: 'Editor',
      description: 'Manage content, galleries, and assets',
      level: 40,
      isSystem: true,
      isDefault: false,
      isActive: true,
    },
  });
  console.log('  ✓ EDITOR');

  // Viewer - Read-only access
  const viewer = await prisma.systemRole.upsert({
    where: { name: 'VIEWER' },
    update: {},
    create: {
      name: 'VIEWER',
      displayName: 'Viewer',
      description: 'Read-only access to content and data',
      level: 20,
      isSystem: true,
      isDefault: true,
      isActive: true,
    },
  });
  console.log('  ✓ VIEWER');

  // Accountant - Finance-focused
  const accountant = await prisma.systemRole.upsert({
    where: { name: 'ACCOUNTANT' },
    update: {},
    create: {
      name: 'ACCOUNTANT',
      displayName: 'Accountant',
      description: 'Manage invoices, payments, and accounting',
      level: 50,
      isSystem: true,
      isDefault: false,
      isActive: true,
    },
  });
  console.log('  ✓ ACCOUNTANT');

  console.log('✅ Created 6 roles');

  // ============================================
  // 3. ASSIGN PERMISSIONS TO ROLES
  // ============================================
  console.log('\n🔗 Assigning permissions to roles...');

  // Helper to assign permissions
  const assignPermissions = async (roleId: string, permissionNames: string[]) => {
    for (const permName of permissionNames) {
      const permission = createdPermissions.find(p => p.name === permName);
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId,
            permissionId: permission.id,
          },
        });
      }
    }
  };

  // Super Admin - ALL permissions
  await assignPermissions(superAdmin.id, createdPermissions.map(p => p.name));
  console.log('  ✓ SUPER_ADMIN: All permissions');

  // Admin - Most permissions except super dangerous ones
  const adminPerms = createdPermissions
    .filter(p => 
      !(p.name === 'users:impersonate' || 
        p.name === 'roles:delete' || 
        p.name === 'accounting:close-period')
    )
    .map(p => p.name);
  await assignPermissions(admin.id, adminPerms);
  console.log(`  ✓ ADMIN: ${adminPerms.length} permissions`);

  // Manager - Business operations
  const managerPerms = [
    'clients:create', 'clients:read', 'clients:update', 'clients:export',
    'assets:create', 'assets:read', 'assets:update', 'assets:download',
    'galleries:create', 'galleries:read', 'galleries:update', 'galleries:share',
    'invoices:create', 'invoices:read', 'invoices:update', 'invoices:send',
    'payments:create', 'payments:read', 'payments:update',
    'contracts:create', 'contracts:read', 'contracts:update', 'contracts:send',
    'proposals:create', 'proposals:read', 'proposals:update', 'proposals:send',
    'users:read',
    'audit:read',
    'settings:read',
  ];
  await assignPermissions(manager.id, managerPerms);
  console.log(`  ✓ MANAGER: ${managerPerms.length} permissions`);

  // Editor - Content management
  const editorPerms = [
    'clients:read',
    'assets:create', 'assets:read', 'assets:update', 'assets:download',
    'galleries:create', 'galleries:read', 'galleries:update', 'galleries:share',
    'proposals:read',
    'contracts:read',
  ];
  await assignPermissions(editor.id, editorPerms);
  console.log(`  ✓ EDITOR: ${editorPerms.length} permissions`);

  // Viewer - Read-only
  const viewerPerms = [
    'clients:read',
    'assets:read',
    'galleries:read',
    'invoices:read',
    'payments:read',
    'contracts:read',
    'proposals:read',
  ];
  await assignPermissions(viewer.id, viewerPerms);
  console.log(`  ✓ VIEWER: ${viewerPerms.length} permissions`);

  // Accountant - Finance-focused
  const accountantPerms = [
    'clients:read', 'clients:update',
    'invoices:create', 'invoices:read', 'invoices:update', 'invoices:send', 'invoices:void',
    'payments:create', 'payments:read', 'payments:update', 'payments:refund',
    'accounting:read', 'accounting:reconcile', 'accounting:journal',
    'audit:read', 'audit:export',
  ];
  await assignPermissions(accountant.id, accountantPerms);
  console.log(`  ✓ ACCOUNTANT: ${accountantPerms.length} permissions`);

  console.log('\n✅ RBAC seed complete!');
  console.log('\n📊 Summary:');
  console.log(`   • ${createdPermissions.length} permissions`);
  console.log(`   • 6 roles`);
  console.log(`   • SUPER_ADMIN (level 100) - Full access`);
  console.log(`   • ADMIN (level 80) - Business operations`);
  console.log(`   • MANAGER (level 60) - Content & finance`);
  console.log(`   • ACCOUNTANT (level 50) - Finance-focused`);
  console.log(`   • EDITOR (level 40) - Content management`);
  console.log(`   • VIEWER (level 20) - Read-only (default)`);
}

seedRBAC()
  .catch((e) => {
    console.error('Error seeding RBAC:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });