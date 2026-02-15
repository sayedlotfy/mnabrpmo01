import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  projects, 
  staff, 
  budgetLabor, 
  budgetExpenses, 
  timeLogs, 
  expenses, 
  payments,
  InsertProject,
  InsertStaff,
  InsertBudgetLabor,
  InsertBudgetExpense,
  InsertTimeLog,
  InsertExpense,
  InsertPayment
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
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

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Projects ============
export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projects).values(data);
  return result;
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getProjectById(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateProject(projectId: number, userId: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(projects)
    .set(data)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

export async function deleteProject(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete all related data first
  await db.delete(staff).where(eq(staff.projectId, projectId));
  await db.delete(budgetLabor).where(eq(budgetLabor.projectId, projectId));
  await db.delete(budgetExpenses).where(eq(budgetExpenses.projectId, projectId));
  await db.delete(timeLogs).where(eq(timeLogs.projectId, projectId));
  await db.delete(expenses).where(eq(expenses.projectId, projectId));
  await db.delete(payments).where(eq(payments.projectId, projectId));
  
  return await db.delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
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
  
  return await db.insert(payments).values(data);
}

export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(payments).set(data).where(eq(payments.id, id));
}

export async function deletePayment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(payments).where(eq(payments.id, id));
}
