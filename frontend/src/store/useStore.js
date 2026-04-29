import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // Auth
      token: null,
      user: null,
      // Theme
      theme: 'dark',
      isSidebarOpen: true,
      playgroundDraft: '',
      // Analytics (NOT persisted — live data only)
      analytics: {
        totalRequests: 0,
        cacheHitRate: 0,
        avgLatency: 0,
        totalCost: 0,
        recentRequests: [],
        costOverTime: [],
        keySourceBreakdown: { user: 0, system: 0 }
      },
      // WS connection state
      wsConnected: false,

      // Actions
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setPlaygroundDraft: (playgroundDraft) => set({ playgroundDraft }),
      clearPlaygroundDraft: () => set({ playgroundDraft: '' }),

      setTheme: (theme) => {
        set({ theme })
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        get().setTheme(next)
      },

      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      updateAnalytics: (data) =>
        set((state) => ({ analytics: { ...state.analytics, ...data } })),

      setAnalyticsFull: (data) =>
        set((state) => ({ analytics: { ...state.analytics, ...data } })),

      setWsConnected: (wsConnected) => set({ wsConnected }),

      logout: () => {
        set({ token: null, user: null })
        localStorage.removeItem('np-store')
      }
    }),
    {
      name: 'np-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen,
        playgroundDraft: state.playgroundDraft
      })
    }
  )
)

export default useStore
