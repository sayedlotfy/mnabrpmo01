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

  // ============ Projects ============
  projects: router({
    list: publicProcedure.query(async () => {
      return await db.getAllProjects();
    }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string(),
        code: z.string(),
        manager: z.string().optional(),
        coordinator: z.string().optional(),
        totalContractValue: z.string(),
        overheadMultiplier: z.string().default("2.5"),
        targetMargin: z.string().default("20"),
        currency: z.string().default("SAR"),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProject({
          ...input,
          userId: 1,
        });
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        code: z.string().optional(),
        manager: z.string().optional(),
        coordinator: z.string().optional(),
        totalContractValue: z.string().optional(),
        overheadMultiplier: z.string().optional(),
        targetMargin: z.string().optional(),
        currency: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        stoppageDays: z.number().optional(),
        percentComplete: z.string().optional(),
        isPaused: z.boolean().optional(),
        pauseStartDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateProject(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteProject(input.id);
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
  payments: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectPayments(input.projectId);
      }),

    create: publicProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string(),
        type: z.enum(["Contract", "VO"]).default("Contract"),
        amount: z.string(),
        date: z.string(),
        requirements: z.string().optional(),
        status: z.enum(["Pending", "Due", "Claimed", "Invoiced", "PaidPartial", "PaidFull"]).default("Pending"),
      }))
      .mutation(async ({ input }) => {
        return await db.createPayment(input);
      }),

    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["Pending", "Due", "Claimed", "Invoiced", "PaidPartial", "PaidFull"]),
        paidAmount: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePayment(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deletePayment(input.id);
      }),
  }),

  // ============ AI Integration ============
  ai: router({
    generateReport: publicProcedure
      .input(z.object({
        projectData: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const prompt = `أنت مستشار مالي متخصص في إدارة مشاريع التصميم المعماري. قم بتحليل البيانات التالية وإنشاء تقرير شامل باللغة العربية يتضمن:
1. تحليل الأداء المالي الحالي
2. مؤشرات القيمة المكتسبة (EVM)
3. التوصيات لتحسين الربحية
4. تحذيرات من المخاطر المالية

البيانات:
${input.projectData}

قدم التقرير بشكل منظم ومهني.`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "أنت مستشار مالي متخصص في إدارة مشاريع التصميم المعماري." },
              { role: "user", content: prompt }
            ],
          });

          return {
            report: response.choices[0]?.message?.content || "فشل في توليد التقرير",
          };
        } catch (error) {
          console.error("AI Report Generation Error:", error);
          throw new Error("فشل في توليد التقرير. يرجى المحاولة مرة أخرى.");
        }
      }),

    categorizeExpense: publicProcedure
      .input(z.object({
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const prompt = `صنف المصروف التالي إلى إحدى الفئات: Sub-Consultant, Travel, Printing, Materials, Others
          
المصروف: ${input.description}

أجب بكلمة واحدة فقط (الفئة).`;

          const response = await invokeLLM({
            messages: [
              { role: "user", content: prompt }
            ],
          });

          const content = response.choices[0]?.message?.content;
          const category = typeof content === 'string' ? content.trim() : "Others";
          return { category };
        } catch (error) {
          console.error("AI Categorization Error:", error);
          return { category: "Others" };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
