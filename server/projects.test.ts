import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
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

describe("projects router - public access", () => {
  it("should allow public access to projects.list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow public access to projects.get", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.get({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.name).toContain("JKP");
  });

  it("should allow public access to staff.list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.staff.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow public access to budgetLabor.list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.budgetLabor.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow public access to budgetExpenses.list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.budgetExpenses.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow public access to timeLogs.list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.timeLogs.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow public access to expenses.list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.expenses.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow public access to payments.list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payments.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should validate payment status enum", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.payments.updateStatus({
        id: 1,
        status: "InvalidStatus" as any,
      })
    ).rejects.toThrow();
  });

  it("should validate payment type enum", async () => {
    const ctx = createPublicContext();
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
    const ctx = createPublicContext();
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

  it("auth.me should return null for public context", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});
