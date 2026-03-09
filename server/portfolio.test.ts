import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module with correct function names
vi.mock("./db", () => ({
  getDb: vi.fn(),
  hashPin: vi.fn((pin: string) => `hashed_${pin}`),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  createAppUser: vi.fn().mockResolvedValue({ id: 3 }),
  getAllAppUsers: vi.fn().mockResolvedValue([
    { id: 1, name: "سيد | مدير التصميم", nameEn: "Sayed | Design Director", role: "portfolio_manager", isActive: true },
    { id: 2, name: "مهندس تجريبي", nameEn: "Test Engineer", role: "project_manager", isActive: true },
  ]),
  verifyAppUserPin: vi.fn().mockImplementation(async (userId: number, pin: string) => {
    // Simulate PIN verification: userId=1 has PIN 1234
    if (userId === 1 && pin === "1234") return true;
    if (userId === 2 && pin === "5678") return true;
    return false;
  }),
  getAppUserById: vi.fn().mockImplementation(async (userId: number) => {
    if (userId === 1) return { id: 1, name: "سيد | مدير التصميم", nameEn: "Sayed | Design Director", role: "portfolio_manager" };
    return null;
  }),
  updateAppUserPin: vi.fn(),
  deleteAppUser: vi.fn(),
  getAllProjects: vi.fn().mockResolvedValue([]),
  getProjectsByAppUser: vi.fn().mockResolvedValue([]),
  getProjectById: vi.fn().mockResolvedValue(null),
  createProject: vi.fn().mockResolvedValue({ id: 1 }),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  recalcProjectContractValue: vi.fn(),
  getPortfolioSummary: vi.fn().mockResolvedValue({
    projects: [],
    totals: { totalContractValue: 0, totalCollected: 0, totalExpenses: 0, avgCpi: 0, avgProfitability: 0, activeProjects: 0, atRiskProjects: 0 },
    monthlyCashFlow: [],
    quarterlyCashFlow: [],
  }),
  getProjectStaff: vi.fn().mockResolvedValue([]),
  createStaff: vi.fn(),
  deleteStaff: vi.fn(),
  getProjectBudgetLabor: vi.fn().mockResolvedValue([]),
  createBudgetLabor: vi.fn(),
  deleteBudgetLabor: vi.fn(),
  getProjectBudgetExpenses: vi.fn().mockResolvedValue([]),
  createBudgetExpense: vi.fn(),
  deleteBudgetExpense: vi.fn(),
  getProjectTimeLogs: vi.fn().mockResolvedValue([]),
  createTimeLog: vi.fn(),
  deleteTimeLog: vi.fn(),
  getProjectExpenses: vi.fn().mockResolvedValue([]),
  createExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getProjectPayments: vi.fn().mockResolvedValue([]),
  createPayment: vi.fn(),
  updatePayment: vi.fn(),
  deletePayment: vi.fn(),
}));

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("appUsers.list", () => {
  it("returns list of active users", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.appUsers.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].role).toBe("portfolio_manager");
  });
});

describe("appUsers.verifyPin", () => {
  it("returns success for correct PIN", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.appUsers.verifyPin({ userId: 1, pin: "1234" });
    expect(result.success).toBe(true);
    expect(result.user?.role).toBe("portfolio_manager");
  });

  it("throws error for wrong PIN", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.appUsers.verifyPin({ userId: 1, pin: "9999" })).rejects.toThrow("Invalid PIN");
  });

  it("rejects PIN that is not 4 digits", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.appUsers.verifyPin({ userId: 1, pin: "12" })).rejects.toThrow();
  });

  it("rejects non-numeric PIN", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.appUsers.verifyPin({ userId: 1, pin: "abcd" })).rejects.toThrow();
  });
});

describe("portfolio.summary", () => {
  it("returns portfolio summary with required fields", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.portfolio.summary();
    expect(result).toHaveProperty("projects");
    expect(result).toHaveProperty("totals");
    expect(result).toHaveProperty("monthlyCashFlow");
    expect(result).toHaveProperty("quarterlyCashFlow");
    expect(result.totals).toHaveProperty("totalContractValue");
    expect(result.totals).toHaveProperty("avgCpi");
    expect(result.totals).toHaveProperty("avgProfitability");
    expect(result.totals).toHaveProperty("activeProjects");
    expect(result.totals).toHaveProperty("atRiskProjects");
  });
});

describe("projects.create", () => {
  it("creates a project with required fields", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.projects.create({
      name: "مشروع اختبار",
      code: "TST-001",
      appUserId: 1,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });
    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
  });

  it("rejects project with empty name", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.projects.create({
      name: "",
      code: "TST-001",
      appUserId: 1,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    })).rejects.toThrow();
  });

  it("rejects project with empty code", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.projects.create({
      name: "مشروع اختبار",
      code: "",
      appUserId: 1,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    })).rejects.toThrow();
  });
});
