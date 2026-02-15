import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table - stores all project information
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the project
  name: text("name").notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  manager: text("manager"),
  coordinator: text("coordinator"),
  totalContractValue: decimal("totalContractValue", { precision: 15, scale: 2 }).notNull(),
  overheadMultiplier: decimal("overheadMultiplier", { precision: 5, scale: 2 }).notNull().default("2.5"),
  targetMargin: decimal("targetMargin", { precision: 5, scale: 2 }).notNull().default("20"),
  currency: varchar("currency", { length: 10 }).notNull().default("SAR"),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }).notNull(),
  stoppageDays: int("stoppageDays").notNull().default(0),
  percentComplete: decimal("percentComplete", { precision: 5, scale: 2 }).notNull().default("0"),
  isPaused: boolean("isPaused").notNull().default(false),
  pauseStartDate: varchar("pauseStartDate", { length: 30 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Staff/Resources table - team members working on projects
 */
export const staff = mysqlTable("staff", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  baseRate: decimal("baseRate", { precision: 10, scale: 2 }).notNull(), // Hourly rate
  location: mysqlEnum("location", ["Riyadh", "Cairo"]).notNull().default("Cairo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;

/**
 * Budget Labor - estimated hours per staff member
 */
export const budgetLabor = mysqlTable("budgetLabor", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  staffId: int("staffId").notNull(),
  hours: decimal("hours", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BudgetLabor = typeof budgetLabor.$inferSelect;
export type InsertBudgetLabor = typeof budgetLabor.$inferInsert;

/**
 * Budget Expenses - estimated non-labor costs
 */
export const budgetExpenses = mysqlTable("budgetExpenses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BudgetExpense = typeof budgetExpenses.$inferSelect;
export type InsertBudgetExpense = typeof budgetExpenses.$inferInsert;

/**
 * Time Logs - actual hours worked by staff
 */
export const timeLogs = mysqlTable("timeLogs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  staffId: int("staffId").notNull(),
  hours: decimal("hours", { precision: 10, scale: 2 }).notNull(),
  phase: varchar("phase", { length: 100 }).notNull(),
  description: text("description"),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimeLog = typeof timeLogs.$inferSelect;
export type InsertTimeLog = typeof timeLogs.$inferInsert;

/**
 * Expenses - actual non-labor costs (ODCs)
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  reimbursable: boolean("reimbursable").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Payments - contract payments and variation orders
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: text("title").notNull(),
  type: mysqlEnum("type", ["Contract", "VO"]).notNull().default("Contract"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  requirements: text("requirements"),
  status: mysqlEnum("status", ["Pending", "Due", "Claimed", "Invoiced", "PaidPartial", "PaidFull"]).notNull().default("Pending"),
  paidAmount: decimal("paidAmount", { precision: 15, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  staff: many(staff),
  budgetLabor: many(budgetLabor),
  budgetExpenses: many(budgetExpenses),
  timeLogs: many(timeLogs),
  expenses: many(expenses),
  payments: many(payments),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  project: one(projects, {
    fields: [staff.projectId],
    references: [projects.id],
  }),
  budgetLabor: many(budgetLabor),
  timeLogs: many(timeLogs),
}));

export const budgetLaborRelations = relations(budgetLabor, ({ one }) => ({
  project: one(projects, {
    fields: [budgetLabor.projectId],
    references: [projects.id],
  }),
  staff: one(staff, {
    fields: [budgetLabor.staffId],
    references: [staff.id],
  }),
}));

export const budgetExpensesRelations = relations(budgetExpenses, ({ one }) => ({
  project: one(projects, {
    fields: [budgetExpenses.projectId],
    references: [projects.id],
  }),
}));

export const timeLogsRelations = relations(timeLogs, ({ one }) => ({
  project: one(projects, {
    fields: [timeLogs.projectId],
    references: [projects.id],
  }),
  staff: one(staff, {
    fields: [timeLogs.staffId],
    references: [staff.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  project: one(projects, {
    fields: [expenses.projectId],
    references: [projects.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  project: one(projects, {
    fields: [payments.projectId],
    references: [projects.id],
  }),
}));
