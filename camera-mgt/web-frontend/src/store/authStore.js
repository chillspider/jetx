import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      isAuthenticated: false,
      user: null,
      token: null,
      darkMode: false,
      sidebarCollapsed: false,
      
      // Actions
      login: (userData, token) => {
        localStorage.setItem('auth_token', token);
        set({
          isAuthenticated: true,
          user: userData,
          token: token,
        });
      },
      
      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
      },
      
      toggleDarkMode: () => {
        set(state => ({ darkMode: !state.darkMode }));
      },
      
      toggleSidebar: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      
      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }));
      },
      
      // Initialize auth from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          set({
            isAuthenticated: true,
            token: token,
          });
        }
      },
    }),
    {
      name: 'carwash-auth-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);