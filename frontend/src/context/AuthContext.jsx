import { createContext, useContext, useState, useCallback } from "react";
import { authApi } from "../services/resources";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("athens_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [institution, setInstitution] = useState(() => {
    const raw = localStorage.getItem("athens_institution");
    return raw ? JSON.parse(raw) : null;
  });

  const _setSession = (data) => {
    const { access_token, user: u, institution: inst } = data;
    localStorage.setItem("athens_token", access_token);
    localStorage.setItem("athens_user", JSON.stringify(u));
    localStorage.setItem("athens_institution", JSON.stringify(inst || null));
    setUser(u);
    setInstitution(inst || null);
    return u;
  };

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    return _setSession(res.data);
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    return _setSession(res.data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("athens_token");
    localStorage.removeItem("athens_user");
    localStorage.removeItem("athens_institution");
    setUser(null);
    setInstitution(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, institution, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
