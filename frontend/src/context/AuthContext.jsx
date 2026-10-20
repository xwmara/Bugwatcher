/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from "react";
import { api } from "../api/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // lista de useri înregistrați
  const [users, setUsers] = useState([
    // useri demo 
    { email: "mp@mara.com", password: "1234", role: "MP" },
    { email: "tst@mara.com", password: "1234", role: "TST" },
  ]);

 
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
    await api.post("/users/logout", {});
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
        users,
        setUser,
        loginUser,
        logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
