import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("projects router", () => {
  it("should require authentication for projects.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.projects.list()).rejects.toThrow();
  });

  it("should require authentication for projects.create", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.projects.create({
        name: "Test Project",
        code: "TST-001",
        totalContractValue: "100000",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      })
    ).rejects.toThrow();
  });

  it("should require authentication for projects.get", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.projects.get({ id: 1 })).rejects.toThrow();
  });

  it("should require authentication for staff.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.staff.list({ projectId: 1 })).rejects.toThrow();
  });

  it("should require authentication for budgetLabor.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.budgetLabor.list({ projectId: 1 })).rejects.toThrow();
  });

  it("should require authentication for budgetExpenses.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.budgetExpenses.list({ projectId: 1 })).rejects.toThrow();
  });

  it("should require authentication for timeLogs.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.timeLogs.list({ projectId: 1 })).rejects.toThrow();
  });

  it("should require authentication for expenses.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.expenses.list({ projectId: 1 })).rejects.toThrow();
  });

  it("should require authentication for payments.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.payments.list({ projectId: 1 })).rejects.toThrow();
  });

  it("should accept valid project create input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This should not throw for valid input (it will hit the DB)
    // We just verify the input validation passes
    const result = await caller.projects.create({
      name: "Valid Test Project",
      code: "TST-002",
      totalContractValue: "100000",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
    expect(result).toBeDefined();
  });

  it("should validate payment status enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.payments.updateStatus({
        id: 1,
        status: "InvalidStatus" as any,
      })
    ).rejects.toThrow();
  });

  it("should validate payment type enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.payments.create({
        projectId: 1,
        title: "Test",
        type: "InvalidType" as any,
        amount: "1000",
        date: "2024-01-01",
      })
    ).rejects.toThrow();
  });

  it("should validate staff location enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.staff.create({
        projectId: 1,
        name: "Test",
        role: "Architect",
        baseRate: "100",
        location: "Dubai" as any,
      })
    ).rejects.toThrow();
  });

  it("auth.me should return user for authenticated context", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test User");
    expect(result?.openId).toBe("test-user-001");
  });

  it("auth.me should return null for unauthenticated context", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});
