/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import { api } from "../api/client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

 
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);

      } catch (err) {
        console.log("Error restoring session: ", err);
      }
    }
    restoreSession();
  }, []);

  // logout
  const logoutUser = async () => {
    try {
      await api.post("/users/logout", {});
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    // Log out in the UI even if the request failed (e.g. server unreachable)
    setUser(null);
    // Navigate to homepage - handled by component that calls this
  };

  const loginUser = (userData) => { // This holds the login state.
    setUser(userData);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loginUser,
        logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
