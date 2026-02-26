import { useState, useCallback } from 'react';

// ============================================================
// localStorage helpers
// ============================================================
function getStore<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}
function setStore<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}
function nextId(items: { id: number }[]): number {
  return items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}

// ============================================================
// useQuery / useMutation helpers
// ============================================================
type QueryResult<T> = { data: T; isLoading: false; refetch: () => void };
type MutationResult<TInput> = {
  mutate: (input: TInput) => void;
  mutateAsync: (input: TInput) => Promise<void>;
  isPending: boolean;
};

function makeQuery<T>(fn: () => T, _enabled = true): QueryResult<T> {
  return { data: fn(), isLoading: false, refetch: () => {} };
}
function makeMutation<TInput>(fn: (input: TInput) => void): MutationResult<TInput> {
  const [isPending, setIsPending] = useState(false);
  const mutate = useCallback((input: TInput) => { fn(input); }, []);
  const mutateAsync = useCallback(async (input: TInput) => { fn(input); }, []);
  return { mutate, mutateAsync, isPending };
}

// ============================================================
// Storage keys
// ============================================================
const K = {
  projects: 'pmo_projects',
  staff: (pid: number) => `pmo_staff_${pid}`,
  budgetLabor: (pid: number) => `pmo_bl_${pid}`,
  budgetExpenses: (pid: number) => `pmo_be_${pid}`,
  timeLogs: (pid: number) => `pmo_tl_${pid}`,
  expenses: (pid: number) => `pmo_exp_${pid}`,
  payments: (pid: number) => `pmo_pay_${pid}`,
};

// ============================================================
// useUtils – invalidate = re-render trigger via React state
// ============================================================
let _rerender = () => {};
function useUtils() {
  const [, setTick] = useState(0);
  _rerender = () => setTick((t) => t + 1);
  return {
    projects: { get: { invalidate: () => _rerender() } },
    staff: { list: { invalidate: () => _rerender() } },
    budgetLabor: { list: { invalidate: () => _rerender() } },
    budgetExpenses: { list: { invalidate: () => _rerender() } },
    timeLogs: { list: { invalidate: () => _rerender() } },
    expenses: { list: { invalidate: () => _rerender() } },
    payments: { list: { invalidate: () => _rerender() } },
    auth: { me: { invalidate: () => {}, setData: () => {} } },
  };
}

// ============================================================
// TRPC-compatible object
// ============================================================
export const trpc = {
  useUtils,

  auth: {
    me: { useQuery: () => ({ data: { id: 1, username: 'local' }, isLoading: false }) },
    logout: { useMutation: (_opts?: any) => ({ mutate: () => {}, mutateAsync: async () => {}, isPending: false }) },
  },

  projects: {
    list: {
      useQuery: (_: any, opts?: any) => {
        const projects = getStore<any[]>(K.projects, []);
        return { data: { projects }, isLoading: false };
      },
    },
    get: {
      useQuery: (input: { id: number }, opts?: any) => {
        const projects = getStore<any[]>(K.projects, []);
        const project = projects.find((p) => p.id === input.id) || null;
        return { data: project, isLoading: false };
      },
    },
    create: {
      useMutation: (opts?: any) => makeMutation((input: any) => {
        const projects = getStore<any[]>(K.projects, []);
        const newP = { ...input, id: nextId(projects), createdAt: new Date().toISOString(), percentComplete: '0', currency: 'SAR', stoppageDays: 0 };
        setStore(K.projects, [...projects, newP]);
        opts?.onSuccess?.();
        _rerender();
      }),
    },
    update: {
      useMutation: (opts?: any) => makeMutation((input: any) => {
        const { id, ...rest } = input;
        const projects = getStore<any[]>(K.projects, []);
        setStore(K.projects, projects.map((p) => (p.id === id ? { ...p, ...rest } : p)));
        opts?.onSuccess?.();
        _rerender();
      }),
    },
    delete: {
      useMutation: (opts?: any) => makeMutation((input: { id: number }) => {
        const projects = getStore<any[]>(K.projects, []);
        setStore(K.projects, projects.filter((p) => p.id !== input.id));
        opts?.onSuccess?.();
        _rerender();
      }),
    },
  },

  staff: {
    list: {
      useQuery: (input: { projectId: number }, opts?: any) => {
        return makeQuery(() => getStore<any[]>(K.staff(input.projectId), []));
      },
    },
    create: {
      useMutation: (opts?: any) => makeMutation((input: any) => {
        const { projectId, ...rest } = input;
        const list = getStore<any[]>(K.staff(projectId), []);
        setStore(K.staff(projectId), [...list, { ...rest, id: nextId(list), projectId }]);
        opts?.onSuccess?.();
      }),
    },
    delete: {
      useMutation: (opts?: any) => makeMutation((input: { id: number }) => {
        const projects = getStore<any[]>(K.projects, []);
        projects.forEach((p) => {
          const list = getStore<any[]>(K.staff(p.id), []);
          if (list.find((s) => s.id === input.id)) {
            setStore(K.staff(p.id), list.filter((s) => s.id !== input.id));
          }
        });
        opts?.onSuccess?.();
      }),
    },
  },

  budgetLabor: {
    list: { useQuery: (input: { projectId: number }) => makeQuery(() => getStore<any[]>(K.budgetLabor(input.projectId), [])) },
    create: { useMutation: (opts?: any) => makeMutation((input: any) => { const { projectId, ...rest } = input; const l = getStore<any[]>(K.budgetLabor(projectId), []); setStore(K.budgetLabor(projectId), [...l, { ...rest, id: nextId(l), projectId }]); opts?.onSuccess?.(); }) },
    delete: { useMutation: (opts?: any) => makeMutation((input: { id: number }) => { const projects = getStore<any[]>(K.projects, []); projects.forEach((p) => { const l = getStore<any[]>(K.budgetLabor(p.id), []); if (l.find((x) => x.id === input.id)) setStore(K.budgetLabor(p.id), l.filter((x) => x.id !== input.id)); }); opts?.onSuccess?.(); }) },
  },

  budgetExpenses: {
    list: { useQuery: (input: { projectId: number }) => makeQuery(() => getStore<any[]>(K.budgetExpenses(input.projectId), [])) },
    create: { useMutation: (opts?: any) => makeMutation((input: any) => { const { projectId, ...rest } = input; const l = getStore<any[]>(K.budgetExpenses(projectId), []); setStore(K.budgetExpenses(projectId), [...l, { ...rest, id: nextId(l), projectId }]); opts?.onSuccess?.(); }) },
    delete: { useMutation: (opts?: any) => makeMutation((input: { id: number }) => { const projects = getStore<any[]>(K.projects, []); projects.forEach((p) => { const l = getStore<any[]>(K.budgetExpenses(p.id), []); if (l.find((x) => x.id === input.id)) setStore(K.budgetExpenses(p.id), l.filter((x) => x.id !== input.id)); }); opts?.onSuccess?.(); }) },
  },

  timeLogs: {
    list: { useQuery: (input: { projectId: number }) => makeQuery(() => getStore<any[]>(K.timeLogs(input.projectId), [])) },
    create: { useMutation: (opts?: any) => makeMutation((input: any) => { const { projectId, ...rest } = input; const l = getStore<any[]>(K.timeLogs(projectId), []); setStore(K.timeLogs(projectId), [...l, { ...rest, id: nextId(l), projectId }]); opts?.onSuccess?.(); }) },
    delete: { useMutation: (opts?: any) => makeMutation((input: { id: number }) => { const projects = getStore<any[]>(K.projects, []); projects.forEach((p) => { const l = getStore<any[]>(K.timeLogs(p.id), []); if (l.find((x) => x.id === input.id)) setStore(K.timeLogs(p.id), l.filter((x) => x.id !== input.id)); }); opts?.onSuccess?.(); }) },
  },

  expenses: {
    list: { useQuery: (input: { projectId: number }) => makeQuery(() => getStore<any[]>(K.expenses(input.projectId), [])) },
    create: { useMutation: (opts?: any) => makeMutation((input: any) => { const { projectId, ...rest } = input; const l = getStore<any[]>(K.expenses(projectId), []); setStore(K.expenses(projectId), [...l, { ...rest, id: nextId(l), projectId }]); opts?.onSuccess?.(); }) },
    delete: { useMutation: (opts?: any) => makeMutation((input: { id: number }) => { const projects = getStore<any[]>(K.projects, []); projects.forEach((p) => { const l = getStore<any[]>(K.expenses(p.id), []); if (l.find((x) => x.id === input.id)) setStore(K.expenses(p.id), l.filter((x) => x.id !== input.id)); }); opts?.onSuccess?.(); }) },
  },

  payments: {
    list: { useQuery: (input: { projectId: number }) => makeQuery(() => getStore<any[]>(K.payments(input.projectId), [])) },
    create: { useMutation: (opts?: any) => makeMutation((input: any) => { const { projectId, ...rest } = input; const l = getStore<any[]>(K.payments(projectId), []); setStore(K.payments(projectId), [...l, { ...rest, id: nextId(l), projectId, status: 'Pending', paidAmount: null }]); opts?.onSuccess?.(); }) },
    delete: { useMutation: (opts?: any) => makeMutation((input: { id: number }) => { const projects = getStore<any[]>(K.projects, []); projects.forEach((p) => { const l = getStore<any[]>(K.payments(p.id), []); if (l.find((x) => x.id === input.id)) setStore(K.payments(p.id), l.filter((x) => x.id !== input.id)); }); opts?.onSuccess?.(); }) },
    updateStatus: { useMutation: (opts?: any) => makeMutation((input: { id: number; status: string }) => { const projects = getStore<any[]>(K.projects, []); projects.forEach((p) => { const l = getStore<any[]>(K.payments(p.id), []); if (l.find((x) => x.id === input.id)) setStore(K.payments(p.id), l.map((x) => x.id === input.id ? { ...x, status: input.status } : x)); }); opts?.onSuccess?.(); }) },
  },

  ai: {
    categorizeExpense: {
      useMutation: (_opts?: any) => ({
        mutate: () => {},
        mutateAsync: async (input: { description: string }) => {
          const desc = input.description.toLowerCase();
          let category = 'Others';
          if (desc.includes('flight') || desc.includes('travel') || desc.includes('hotel') || desc.includes('سفر')) category = 'Travel';
          else if (desc.includes('print') || desc.includes('طباعة')) category = 'Printing';
          else if (desc.includes('software') || desc.includes('license') || desc.includes('برنامج')) category = 'Software License';
          else if (desc.includes('sub') || desc.includes('consultant') || desc.includes('استشاري')) category = 'Sub-Consultant';
          else if (desc.includes('commission') || desc.includes('عمولة')) category = 'Commission';
          return { category };
        },
        isPending: false,
      }),
    },
  },

  createClient: () => ({}),
};
