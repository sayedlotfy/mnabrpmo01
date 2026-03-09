import { eq, and, desc, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createHash } from "crypto";
import {
  InsertUser, users,
  appUsers, InsertAppUser,
  projects, InsertProject,
  staff, InsertStaff,
  budgetLabor, InsertBudgetLabor,
  budgetExpenses, InsertBudgetExpense,
  timeLogs, InsertTimeLog,
  expenses, InsertExpense,
  payments, InsertPayment,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ---- PIN Hashing ----
export function hashPin(pin: string): string {
  return createHash("sha256").update(pin + "mnabr_salt_2024").digest("hex");
}

// ---- OAuth Users (legacy) ----
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ App Users (PIN System) ============
export async function createAppUser(data: { name: string; nameEn?: string; role: "portfolio_manager" | "project_manager"; pin: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const pinHash = hashPin(data.pin);
  return await db.insert(appUsers).values({
    name: data.name,
    nameEn: data.nameEn,
    role: data.role,
    pinHash,
  });
}

export async function getAllAppUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select({
    id: appUsers.id,
    name: appUsers.name,
    nameEn: appUsers.nameEn,
    role: appUsers.role,
    isActive: appUsers.isActive,
    createdAt: appUsers.createdAt,
  }).from(appUsers).where(eq(appUsers.isActive, true)).orderBy(appUsers.name);
}

export async function verifyAppUserPin(userId: number, pin: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const pinHash = hashPin(pin);
  const result = await db.select({ id: appUsers.id }).from(appUsers)
    .where(and(eq(appUsers.id, userId), eq(appUsers.pinHash, pinHash), eq(appUsers.isActive, true)))
    .limit(1);
  return result.length > 0;
}

export async function updateAppUserPin(userId: number, newPin: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const pinHash = hashPin(newPin);
  return await db.update(appUsers).set({ pinHash }).where(eq(appUsers.id, userId));
}

export async function deleteAppUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(appUsers).set({ isActive: false }).where(eq(appUsers.id, userId));
}

export async function getAppUserById(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(appUsers).where(eq(appUsers.id, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============ Projects ============
export async function getAllProjects() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(projects).orderBy(desc(projects.updatedAt));
}

export async function getProjectsByAppUser(appUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(projects)
    .where(eq(projects.appUserId, appUserId))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(projects).values(data);
}

export async function updateProject(projectId: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(projects).set(data).where(eq(projects.id, projectId));
}

export async function deleteProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(staff).where(eq(staff.projectId, projectId));
  await db.delete(budgetLabor).where(eq(budgetLabor.projectId, projectId));
  await db.delete(budgetExpenses).where(eq(budgetExpenses.projectId, projectId));
  await db.delete(timeLogs).where(eq(timeLogs.projectId, projectId));
  await db.delete(expenses).where(eq(expenses.projectId, projectId));
  await db.delete(payments).where(eq(payments.projectId, projectId));
  return await db.delete(projects).where(eq(projects.id, projectId));
}

// ---- Auto-update totalContractValue from payments ----
export async function recalcProjectContractValue(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select({ amount: payments.amount })
    .from(payments).where(eq(payments.projectId, projectId));
  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);
  await db.update(projects).set({ totalContractValue: String(total) }).where(eq(projects.id, projectId));
  return total;
}

// ============ Portfolio Summary ============
export async function getPortfolioSummary() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allProjects = await db.select().from(projects).orderBy(desc(projects.updatedAt));
  const allPayments = await db.select().from(payments);
  const allTimeLogs = await db.select().from(timeLogs);
  const allExpenses = await db.select().from(expenses);
  const allStaff = await db.select().from(staff);
  const allAppUsers = await db.select().from(appUsers).where(eq(appUsers.isActive, true));

  // Compute per-project KPIs
  const projectsWithKpis = allProjects.map(p => {
    const pPayments = allPayments.filter(pay => pay.projectId === p.id);
    const pTimeLogs = allTimeLogs.filter(tl => tl.projectId === p.id);
    const pExpenses = allExpenses.filter(ex => ex.projectId === p.id);
    const pStaff = allStaff.filter(s => s.projectId === p.id);

    const totalContractValue = Number(p.totalContractValue || 0);
    const totalCollected = pPayments.reduce((sum, pay) => {
      if (pay.status === 'PaidFull') return sum + Number(pay.amount);
      if (pay.status === 'PaidPartial') return sum + Number(pay.paidAmount || 0);
      return sum;
    }, 0);

    // Labor cost
    const laborCost = pTimeLogs.reduce((sum, tl) => {
      const s = pStaff.find(st => st.id === tl.staffId);
      return sum + Number(tl.hours) * Number(s?.baseRate || 0);
    }, 0);
    const expensesCost = pExpenses.reduce((sum, ex) => sum + Number(ex.amount), 0);
    const totalCost = laborCost + expensesCost;
    const overhead = Number(p.overheadMultiplier || 2.5);
    const totalCostWithOverhead = totalCost * overhead;
    const profit = totalContractValue - totalCostWithOverhead;
    const profitability = totalContractValue > 0 ? (profit / totalContractValue) * 100 : 0;

    // EVM
    const percentComplete = Number(p.percentComplete || 0) / 100;
    const plannedValue = totalContractValue * percentComplete;
    const earnedValue = totalContractValue * percentComplete;
    const cpi = totalCostWithOverhead > 0 ? earnedValue / totalCostWithOverhead : 0;

    return {
      ...p,
      totalCollected,
      laborCost,
      expensesCost,
      totalCost: totalCostWithOverhead,
      profit,
      profitability,
      cpi,
      plannedValue,
      earnedValue,
    };
  });

  // Monthly Cash Flow (last 12 months)
  const now = new Date();
  const monthlyCashFlow = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleString('default', { month: 'short', year: '2-digit' });

    const expected = allPayments
      .filter(pay => pay.date && pay.date.startsWith(monthKey))
      .reduce((sum, pay) => sum + Number(pay.amount), 0);

    const actual = allPayments
      .filter(pay => pay.date && pay.date.startsWith(monthKey) &&
        (pay.status === 'PaidFull' || pay.status === 'PaidPartial'))
      .reduce((sum, pay) => {
        if (pay.status === 'PaidFull') return sum + Number(pay.amount);
        return sum + Number(pay.paidAmount || 0);
      }, 0);

    return { name: monthName, expected, actual };
  });

  return {
    projects: projectsWithKpis,
    monthlyCashFlow,
    allAppUsers,
  };
}

// ============ Staff ============
export async function getProjectStaff(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(staff).where(eq(staff.projectId, projectId));
}

export async function createStaff(data: InsertStaff) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(staff).values(data);
}

export async function deleteStaff(staffId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(staff).where(eq(staff.id, staffId));
}

// ============ Budget Labor ============
export async function getProjectBudgetLabor(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(budgetLabor).where(eq(budgetLabor.projectId, projectId));
}

export async function createBudgetLabor(data: InsertBudgetLabor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(budgetLabor).values(data);
}

export async function deleteBudgetLabor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(budgetLabor).where(eq(budgetLabor.id, id));
}

// ============ Budget Expenses ============
export async function getProjectBudgetExpenses(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(budgetExpenses).where(eq(budgetExpenses.projectId, projectId));
}

export async function createBudgetExpense(data: InsertBudgetExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(budgetExpenses).values(data);
}

export async function deleteBudgetExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(budgetExpenses).where(eq(budgetExpenses.id, id));
}

// ============ Time Logs ============
export async function getProjectTimeLogs(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(timeLogs).where(eq(timeLogs.projectId, projectId)).orderBy(desc(timeLogs.createdAt));
}

export async function createTimeLog(data: InsertTimeLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(timeLogs).values(data);
}

export async function deleteTimeLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(timeLogs).where(eq(timeLogs.id, id));
}

// ============ Expenses ============
export async function getProjectExpenses(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(expenses).where(eq(expenses.projectId, projectId)).orderBy(desc(expenses.createdAt));
}

export async function createExpense(data: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(expenses).values(data);
}

export async function deleteExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(expenses).where(eq(expenses.id, id));
}

// ============ Payments ============
export async function getProjectPayments(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(payments).where(eq(payments.projectId, projectId)).orderBy(desc(payments.createdAt));
}

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payments).values(data);
  // Auto-recalculate contract value
  await recalcProjectContractValue(data.projectId);
  return result;
}

export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(payments).set(data).where(eq(payments.id, id));
  return result;
}

export async function deletePayment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Get projectId before deleting
  const row = await db.select({ projectId: payments.projectId }).from(payments).where(eq(payments.id, id)).limit(1);
  const result = await db.delete(payments).where(eq(payments.id, id));
  if (row.length > 0) await recalcProjectContractValue(row[0].projectId);
  return result;
}
