import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ App Users (PIN System) ============
  appUsers: router({
    list: publicProcedure.query(async () => {
      return await db.getAllAppUsers();
    }),

    create: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        nameEn: z.string().optional(),
        role: z.enum(["portfolio_manager", "project_manager"]),
        pin: z.string().length(4).regex(/^\d{4}$/),
      }))
      .mutation(async ({ input }) => {
        await db.createAppUser(input);
        return { success: true };
      }),

    verifyPin: publicProcedure
      .input(z.object({
        userId: z.number(),
        pin: z.string().length(4).regex(/^\d{4}$/),
      }))
      .mutation(async ({ input }) => {
        const valid = await db.verifyAppUserPin(input.userId, input.pin);
        if (!valid) throw new Error("Invalid PIN");
        const user = await db.getAppUserById(input.userId);
        return { success: true, user };
      }),

    updatePin: publicProcedure
      .input(z.object({
        userId: z.number(),
        currentPin: z.string().length(4).regex(/^\d{4}$/),
        newPin: z.string().length(4).regex(/^\d{4}$/),
      }))
      .mutation(async ({ input }) => {
        const valid = await db.verifyAppUserPin(input.userId, input.currentPin);
        if (!valid) throw new Error("Invalid current PIN");
        await db.updateAppUserPin(input.userId, input.newPin);
        return { success: true };
      }),

    adminUpdatePin: publicProcedure
      .input(z.object({
        userId: z.number(),
        newPin: z.string().length(4).regex(/^\d{4}$/),
      }))
      .mutation(async ({ input }) => {
        // Portfolio manager can override any user's PIN without knowing current PIN
        await db.updateAppUserPin(input.userId, input.newPin);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAppUser(input.userId);
        return { success: true };
      }),

    updateName: publicProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string().min(1),
        nameEn: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateAppUserName(input.userId, input.name, input.nameEn);
        return { success: true };
      }),
  }),

  // ============ Project Phases ============
  projectPhases: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectPhases(input.projectId);
      }),

    create: publicProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        durationDays: z.number().min(0).default(0),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createProjectPhase({
          projectId: input.projectId,
          name: input.name,
          durationDays: input.durationDays,
          sortOrder: input.sortOrder ?? 0,
        });
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        durationDays: z.number().min(0).optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProjectPhase(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProjectPhase(input.id);
        return { success: true };
      }),
  }),

  // ============ Projects ============
  projects: router({
    list: publicProcedure
      .input(z.object({
        appUserId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        if (input?.appUserId) {
          return await db.getProjectsByAppUser(input.appUserId);
        }
        return await db.getAllProjects();
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        manager: z.string().optional(),
        coordinator: z.string().optional(),
        phase: z.enum(["Concept", "Schematic", "DD", "CD", "Tender", "Construction"]).default("Concept"),
        overheadMultiplier: z.string().default("2.5"),
        targetMargin: z.string().default("20"),
        currency: z.string().default("SAR"),
        startDate: z.string(),
        endDate: z.string(),
        appUserId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createProject({
          userId: 1,
          appUserId: input.appUserId ?? null,
          name: input.name,
          code: input.code,
          manager: input.manager,
          coordinator: input.coordinator,
          phase: input.phase,
          totalContractValue: "0",
          overheadMultiplier: input.overheadMultiplier,
          targetMargin: input.targetMargin,
          currency: input.currency,
          startDate: input.startDate,
          endDate: input.endDate,
          stoppageDays: 0,
          percentComplete: "0",
          isPaused: false,
        });
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        code: z.string().optional(),
        manager: z.string().optional(),
        coordinator: z.string().optional(),
        phase: z.enum(["Concept", "Schematic", "DD", "CD", "Tender", "Construction"]).optional(),
        overheadMultiplier: z.string().optional(),
        targetMargin: z.string().optional(),
        currency: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        stoppageDays: z.number().optional(),
        percentComplete: z.string().optional(),
        isPaused: z.boolean().optional(),
        pauseStartDate: z.string().nullable().optional(),
        appUserId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateProject(id, data as any);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteProject(input.id);
      }),

    transfer: publicProcedure
      .input(z.object({
        projectId: z.number(),
        newAppUserId: z.number(),
        newManagerName: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await db.transferProject(input.projectId, input.newAppUserId, input.newManagerName);
        return { success: true };
      }),
  }),

  // ============ Staff ============
  staff: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectStaff(input.projectId);
      }),

    create: publicProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        role: z.string(),
        baseRate: z.string(),
        location: z.enum(["Riyadh", "Cairo"]).default("Cairo"),
      }))
      .mutation(async ({ input }) => {
        return await db.createStaff(input);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteStaff(input.id);
      }),
  }),

  // ============ Budget Labor ============
  budgetLabor: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectBudgetLabor(input.projectId);
      }),

    create: publicProcedure
      .input(z.object({
        projectId: z.number(),
        staffId: z.number(),
        hours: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.createBudgetLabor(input);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteBudgetLabor(input.id);
      }),
  }),

  // ============ Budget Expenses ============
  budgetExpenses: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectBudgetExpenses(input.projectId);
      }),

    create: publicProcedure
      .input(z.object({
        projectId: z.number(),
        category: z.string(),
        amount: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.createBudgetExpense(input);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteBudgetExpense(input.id);
      }),
  }),

  // ============ Time Logs ============
  timeLogs: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectTimeLogs(input.projectId);
      }),

    create: publicProcedure
      .input(z.object({
        projectId: z.number(),
        staffId: z.number(),
        hours: z.string(),
        phase: z.string(),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.createTimeLog(input);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteTimeLog(input.id);
      }),
  }),

  // ============ Expenses ============
  expenses: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectExpenses(input.projectId);
      }),

    create: publicProcedure
      .input(z.object({
        projectId: z.number(),
        category: z.string(),
        amount: z.string(),
        description: z.string().optional(),
        reimbursable: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        return await db.createExpense(input);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteExpense(input.id);
      }),
  }),

  // ============ Payments ============
  // totalContractValue is auto-recalculated after every create/delete
  payments: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectPayments(input.projectId);
      }),

    create: publicProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().min(1),
        type: z.enum(["Contract", "VO"]).default("Contract"),
        amount: z.string(),
        date: z.string(),
        requirements: z.string().optional(),
        status: z.enum(["Pending", "Due", "Claimed", "Invoiced", "PaidPartial", "PaidFull"]).default("Pending"),
        paidAmount: z.string().default("0"),
      }))
      .mutation(async ({ input }) => {
        await db.createPayment(input); // auto-recalcs contract value
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        type: z.enum(["Contract", "VO"]).optional(),
        amount: z.string().optional(),
        date: z.string().optional(),
        requirements: z.string().optional(),
        status: z.enum(["Pending", "Due", "Claimed", "Invoiced", "PaidPartial", "PaidFull"]).optional(),
        paidAmount: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePayment(id, data as any);
      }),

    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["Pending", "Due", "Claimed", "Invoiced", "PaidPartial", "PaidFull"]),
        paidAmount: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePayment(id, data as any);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deletePayment(input.id); // auto-recalcs contract value
      }),
  }),

  // ============ Project Events (Duration Log) ============
  projectEvents: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectEvents(input.projectId);
      }),

    togglePause: publicProcedure
      .input(z.object({
        projectId: z.number(),
        reason: z.string().min(5, "السبب مطلوب (5 أحرف على الأقل)"),
        recordedBy: z.string().optional().default("مجهول"),
        today: z.string(), // YYYY-MM-DD
      }))
      .mutation(async ({ input }) => {
        return await db.toggleProjectPause(
          input.projectId,
          input.reason,
          input.recordedBy,
          input.today
        );
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteProjectEvent(input.id);
      }),

    extendEndDate: publicProcedure
      .input(z.object({
        projectId: z.number(),
        pausedDays: z.number().min(1),
        currentEndDate: z.string(),
        recordedBy: z.string().optional().default("مجهول"),
        today: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { addWorkingDays } = await import("../shared/workingDays.js");
        const newEndDate = addWorkingDays(input.currentEndDate, input.pausedDays);
        await db.updateProject(input.projectId, { endDate: newEndDate } as any);
        await db.createProjectEvent({
          projectId: input.projectId,
          eventType: "extension",
          eventDate: input.today,
          reason: `تمديد تلقائي بـ ${input.pausedDays} يوم عمل بسبب أيام التوقف المتراكمة. تاريخ الانتهاء الجديد: ${newEndDate}`,
          recordedBy: input.recordedBy,
        });
        return { newEndDate };
      }),
  }),

  // ============ Portfolio (Portfolio Manager View) ============
  portfolio: router({
    summary: publicProcedure.query(async () => {
      return await db.getPortfolioSummary();
    }),

    claimsAndDebts: publicProcedure.query(async () => {
      return await db.getPortfolioClaimsAndDebts();
    }),
  }),

  // ============ AI Integration ============
  ai: router({
    generateReport: publicProcedure
      .input(z.object({ projectData: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "أنت مستشار مالي متخصص في إدارة مشاريع التصميم المعماري." },
              { role: "user", content: `قم بتحليل البيانات التالية وإنشاء تقرير مالي شامل:\n${input.projectData}` }
            ],
          });
          return { report: response.choices[0]?.message?.content || "فشل في توليد التقرير" };
        } catch (error) {
          throw new Error("فشل في توليد التقرير. يرجى المحاولة مرة أخرى.");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
