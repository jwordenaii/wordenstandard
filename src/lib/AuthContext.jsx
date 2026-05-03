import React, { createContext, useContext, useEffect, useState } from "react";

import { authenticateWithPin, bootstrapAuth, clearAuthToken, getAccessToken } from '@/api/client'

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthStatus() {
      setIsLoadingAuth(true);
      try {
        const status = await bootstrapAuth();
        if (cancelled) return;

        const required = Boolean(status?.auth_required);
        const token = required ? await getAccessToken().catch(() => null) : null;
        setAuthRequired(required);
        setIsAuthenticated(!required || Boolean(token));
        setAccessToken(token);
        setUser(required && token ? {
          id: 'admin',
          role: 'admin',
          authMode: status?.auth_mode || 'required',
          tokenEndpoint: status?.token_endpoint || null,
        } : null);
        setAuthError(status?.token_bootstrap_error ? { type: 'pin_required', message: status.token_bootstrap_error } : null);
      } catch (error) {
        if (cancelled) return;

        setAuthRequired(true);
        setIsAuthenticated(false);
        setUser(null);
        setAuthError({ type: 'auth_status_unavailable', message: error.message || 'Unable to load auth status.' });
      } finally {
        if (!cancelled) setIsLoadingAuth(false);
      }
    }

    loadAuthStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'pin_required', message: 'Your admin session expired. Enter the PIN to continue.' });
    };

    window.addEventListener('jworden:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('jworden:auth-expired', handleAuthExpired);
  }, []);

  const logout = () => {
    localStorage.removeItem("jworden_admin_session");
    clearAuthToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  const loginWithPin = async (pin) => {
    const token = await authenticateWithPin(pin);
    setAccessToken(token);
    setIsAuthenticated(true);
    setUser({
      id: 'admin',
      role: 'admin',
      authMode: 'pin',
      tokenEndpoint: '/api/v1/auth/pin-token',
    });
    setAuthError(null);
    return token;
  };

  const navigateToLogin = () => {
    alert("Admin login is disabled in this standalone Netlify build. Public site is active; admin tools need a new auth backend before use.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        authRequired,
        isAuthenticated,
        isLoadingAuth,
        authChecked: true,
        checkUserAuth: async () => {},
        isLoadingPublicSettings: false,
        authError,
        appPublicSettings: { public_settings: {} },
        logout,
        loginWithPin,
        navigateToLogin,
        checkAppState: async () => null,
        getAccessToken,
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
