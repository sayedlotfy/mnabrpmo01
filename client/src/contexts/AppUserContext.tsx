import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AppUserRole = "portfolio_manager" | "project_manager";

export interface AppUserSession {
  id: number;
  name: string;
  nameEn?: string | null;
  role: AppUserRole;
}

interface AppUserContextType {
  currentUser: AppUserSession | null;
  setCurrentUser: (user: AppUserSession | null) => void;
  isPortfolioManager: boolean;
  logout: () => void;
}

const AppUserContext = createContext<AppUserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  isPortfolioManager: false,
  logout: () => {},
});

const SESSION_KEY = "mnabr_pmo_session";

export function AppUserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<AppUserSession | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setCurrentUser = (user: AppUserSession | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  };

  const logout = () => setCurrentUser(null);

  const isPortfolioManager = currentUser?.role === "portfolio_manager";

  return (
    <AppUserContext.Provider value={{ currentUser, setCurrentUser, isPortfolioManager, logout }}>
      {children}
    </AppUserContext.Provider>
  );
}

export function useAppUser() {
  return useContext(AppUserContext);
}
