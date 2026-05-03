import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = () => {
    localStorage.removeItem("jworden_admin_session");
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    alert("Admin login is disabled in this standalone Netlify build. Public site is active; admin tools need a new auth backend before use.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth: false,
        authChecked: true,
        checkUserAuth: async () => {},
        isLoadingPublicSettings: false,
        authError: null,
        appPublicSettings: { public_settings: {} },
        logout,
        navigateToLogin,
        checkAppState: async () => null,
        setUser,
        setIsAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
