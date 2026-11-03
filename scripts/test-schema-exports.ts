/**
 * Compile-time Type Safety and Schema Export Verification Suite
 * Validated by `npm run typecheck` (tsc --noEmit)
 */
import {
  roles,
  rolesRelations,
  type Role,
  type NewRole,
  permissions,
  permissionsRelations,
  type Permission,
  type NewPermission,
  userRoles,
  userRolesRelations,
  type UserRole,
  type NewUserRole,
  rolePermissions,
  rolePermissionsRelations,
  type RolePermission,
  type NewRolePermission,
  users,
  usersRelations,
  type User,
  type NewUser,
  type SafeUser,
  toSafeUser,
  employees,
  employeesRelations,
  type Employee,
  type NewEmployee,
  sessions,
  sessionsRelations,
  type Session,
  type NewSession,
  customers,
  customersRelations,
  type Customer,
  type NewCustomer,
  orders,
  ordersRelations,
  type Order,
  type NewOrder,
} from "@/db/schema";

// 1. Verify Role Type Assertions
const _testRole: Role = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "admin",
  displayName: "Administrator",
  description: "System Administrator",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const _testNewRole: NewRole = {
  name: "operator",
  displayName: "Operator",
  description: "Sales Operator",
};

// 2. Verify Permission Type Assertions (Key-based)
const _testPermission: Permission = {
  id: "00000000-0000-0000-0000-000000000001",
  key: "users.read",
  code: "users.read",
  name: "Read Users",
  module: "users",
  description: "View user list",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const _testNewPermission: NewPermission = {
  key: "employees.create",
  description: "Create employee profiles",
};

// 3. Verify User-Roles Join Table Assertions
const _testUserRole: UserRole = {
  userId: "00000000-0000-0000-0000-000000000002",
  roleId: "00000000-0000-0000-0000-000000000000",
  assignedAt: new Date(),
};

const _testNewUserRole: NewUserRole = {
  userId: "00000000-0000-0000-0000-000000000002",
  roleId: "00000000-0000-0000-0000-000000000000",
};

// 4. Verify Role-Permissions Join Table Assertions
const _testRolePermission: RolePermission = {
  roleId: "00000000-0000-0000-0000-000000000000",
  permissionId: "00000000-0000-0000-0000-000000000001",
  createdAt: new Date(),
};

const _testNewRolePermission: NewRolePermission = {
  roleId: "00000000-0000-0000-0000-000000000000",
  permissionId: "00000000-0000-0000-0000-000000000001",
};

// 5. Verify User Type Assertions (including emailVerified and SafeUser)
const _testUser: User = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "admin@projectcall.uz",
  passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummy",
  isActive: true,
  emailVerified: true,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const _testNewUser: NewUser = {
  email: "new.operator@projectcall.uz",
  passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummy",
  isActive: true,
  emailVerified: false,
};

const _safeUser: SafeUser = toSafeUser(_testUser);

// 6. Verify Employee Type Assertions
const _testEmployee: Employee = {
  id: "00000000-0000-0000-0000-000000000003",
  userId: "00000000-0000-0000-0000-000000000002",
  employeeCode: "EMP-001",
  firstName: "Ali",
  lastName: "Valiyev",
  phone: "+998901234567",
  position: "Manager",
  department: "Sales",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const _testNewEmployee: NewEmployee = {
  userId: "00000000-0000-0000-0000-000000000002",
  employeeCode: "EMP-002",
  firstName: "Vali",
  lastName: "Aliyev",
};

// 7. Verify Session Type Assertions
const _testSession: Session = {
  id: "00000000-0000-0000-0000-000000000004",
  userId: "00000000-0000-0000-0000-000000000002",
  token: "abcdef1234567890",
  ipAddress: "127.0.0.1",
  userAgent: "Mozilla/5.0",
  expiresAt: new Date(),
  createdAt: new Date(),
};

const _testNewSession: NewSession = {
  userId: "00000000-0000-0000-0000-000000000002",
  token: "token123",
  expiresAt: new Date(),
};

// 8. Verify Customer Type Assertions
const _testCustomer: Customer = {
  id: "00000000-0000-0000-0000-000000000005",
  name: "Alisher Navoiy",
  phone: "+998901234567",
  email: "navoiy@sheriyat.uz",
  company: "Adabiyot MCHJ",
  status: "active",
  notes: "Asosiy mijoz",
  assignedEmployeeId: "00000000-0000-0000-0000-000000000003",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const _testNewCustomer: NewCustomer = {
  name: "Bobur Mirzo",
  phone: "+998909876543",
  company: "Tarix XK",
  status: "lead",
};

// 9. Verify Order Type Assertions
const _testOrder: Order = {
  id: "00000000-0000-0000-0000-000000000006",
  orderNumber: "ORD-202611-0001",
  customerId: "00000000-0000-0000-0000-000000000005",
  employeeId: "00000000-0000-0000-0000-000000000003",
  amount: "1500000.00",
  status: "completed",
  notes: "To'liq to'landi",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const _testNewOrder: NewOrder = {
  orderNumber: "ORD-202611-0002",
  customerId: "00000000-0000-0000-0000-000000000005",
  amount: "500000.00",
  status: "pending",
};

// Silence unused variable warnings
void _testRole;
void _testNewRole;
void _testPermission;
void _testNewPermission;
void _testUserRole;
void _testNewUserRole;
void _testRolePermission;
void _testNewRolePermission;
void _testUser;
void _testNewUser;
void _safeUser;
void _testEmployee;
void _testNewEmployee;
void _testSession;
void _testNewSession;
void _testCustomer;
void _testNewCustomer;
void _testOrder;
void _testNewOrder;
void roles;
void rolesRelations;
void permissions;
void permissionsRelations;
void userRoles;
void userRolesRelations;
void rolePermissions;
void rolePermissionsRelations;
void users;
void usersRelations;
void employees;
void employeesRelations;
void sessions;
void sessionsRelations;
void customers;
void customersRelations;
void orders;
void ordersRelations;
