"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (credentials: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load auth details from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Handle protected route guards
  useEffect(() => {
    if (isLoading) return;

    const publicPages = ["/login", "/register", "/"];
    const isPublicPage = publicPages.includes(pathname);

    if (!token && !isPublicPage) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (token && (pathname === "/login" || pathname === "/register")) {
      router.push("/dashboard");
    }
  }, [token, pathname, isLoading, router]);

  const login = async (credentials: any) => {
    try {
      const response = await apiClient.post("/api/v1/auth/login", credentials);
      const { token: jwtToken, email, name, role } = response.data;
      
      const loggedUser = { name, email, role };
      
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(loggedUser));
      
      setToken(jwtToken);
      setUser(loggedUser);
      
      router.push("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  const register = async (credentials: any) => {
    try {
      const response = await apiClient.post("/api/v1/auth/register", credentials);
      const { token: jwtToken, email, name, role } = response.data;
      
      const loggedUser = { name, email, role };
      
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(loggedUser));
      
      setToken(jwtToken);
      setUser(loggedUser);
      
      router.push("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
