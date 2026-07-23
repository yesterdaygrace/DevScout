import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../services/supabase'
import LoginPage from '../pages/LoginPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import SearchPage from '../pages/SearchPage.vue'
import ProfilePage from '../pages/ProfilePage.vue'
import ComparePage from '../pages/ComparePage.vue'
import AuthCallback from '../pages/AuthCallback.vue'

const routes = [
  { path: '/login', component: LoginPage, meta: { title: 'Sign In | DevScout' } },
  { path: '/auth/callback', component: AuthCallback, meta: { title: 'Signing in...' } },
  {
    path: '/',
    component: () => import('../layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: DashboardPage, meta: { title: 'Dashboard | DevScout' } },
      { path: 'search', name: 'search', component: SearchPage, meta: { title: 'Search Developers | DevScout' } },
      { path: 'profile/:username', name: 'profile', component: ProfilePage, props: true, meta: { title: 'Developer | DevScout' } },
      { path: 'compare', name: 'compare', component: ComparePage, meta: { title: 'Compare Developers | DevScout' } },
      { path: 'searches', name: 'searches', component: () => import('../pages/SavedSearchesPage.vue'), meta: { title: 'Saved Searches | DevScout' } },
      { path: 'collections', name: 'collections', component: () => import('../pages/CollectionsPage.vue'), meta: { title: 'Collections | DevScout' } },
      { path: 'notes-search', name: 'notes-search', component: () => import('../pages/NotesSearchPage.vue'), meta: { title: 'Notes | DevScout' } },
      // Settings
      { path: 'settings/profile', name: 'settings-profile', component: () => import('../pages/settings/ProfileSettings.vue'), meta: { title: 'Profile Settings | DevScout' } },
      { path: 'settings/api', name: 'settings-api', component: () => import('../pages/settings/ApiSettings.vue'), meta: { title: 'API Settings | DevScout' } },
      { path: 'settings/appearance', name: 'settings-appearance', component: () => import('../pages/settings/AppearanceSettings.vue'), meta: { title: 'Appearance | DevScout' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  try {
    const { data } = await supabase.auth.getUser()
    const isAuthenticated = !!data.user

    if (to.meta.requiresAuth && !isAuthenticated) {
      next('/login')
    } else if (to.path === '/login' && isAuthenticated) {
      next('/')
    } else {
      next()
    }
  } catch {
    // Auth check failed (e.g. network error) — allow navigation to login
    if (to.meta.requiresAuth) {
      next('/login')
    } else {
      next()
    }
  }
})

export default router
