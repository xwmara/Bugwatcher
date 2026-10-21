/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";
import type { User } from "../types";

export interface AuthContextValue {
  user: User | null; // null = not logged in
  setUser: (user: User | null) => void;
  loginUser: (user: User) => void;
  logoutUser: () => Promise<void>;
}

// The default value is only used outside an AuthProvider (e.g. in some tests)
export const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  loginUser: () => {},
  logoutUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Restore the session after a page reload (the login cookie is still there)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.get<User>("/users/me");
        setUser(res.data);
      } catch {
        // Not logged in: nothing to restore
      }
    };
    restoreSession();
  }, []);

  const logoutUser = async () => {
    try {
      await api.post("/users/logout", {});
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    // Log out in the UI even if the request failed (e.g. server unreachable)
    setUser(null);
  };

  const loginUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
