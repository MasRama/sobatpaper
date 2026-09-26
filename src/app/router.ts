import { createRouter, createWebHistory, type RouteRecordRaw, type RouterScrollBehavior } from 'vue-router';
import { ChangePasswordPage, LoginPage, RegisterPage, RolesPage, useAuthSession } from '../features/auth/web';
import usersWebRoutes from './bindings/users.web';
import DashboardPage from './pages/DashboardPage.vue';
import AdminPage from './pages/AdminPage.vue';
import HomePage from './pages/HomePage.vue';
import NotFoundPage from './pages/NotFoundPage.vue';
import { ServiceDetailPage, ServicesPage } from '../features/services/web';
import { PricingPage } from '../features/pricing/web';
import { CaraKerjaPage, FaqPage, InfoPage } from '../features/content/web';
import { PortfolioPage } from '../features/portfolio/web';

export const appRoutes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/layanan',
    name: 'services',
    component: ServicesPage,
  },
  {
    path: '/layanan/:slug',
    name: 'service-detail',
    component: ServiceDetailPage,
  },
  {
    path: '/harga',
    name: 'pricing',
    component: PricingPage,
  },
  {
    path: '/cara-kerja',
    name: 'cara-kerja',
    component: CaraKerjaPage,
  },
  {
    path: '/tentang-kami',
    name: 'tentang-kami',
    component: InfoPage,
    props: { slug: 'tentang-kami' },
  },
  {
    path: '/faq',
    name: 'faq',
    component: FaqPage,
  },
  {
    path: '/portfolio',
    name: 'portfolio',
    component: PortfolioPage,
  },
  {
    path: '/kebijakan-privasi',
    name: 'kebijakan-privasi',
    component: InfoPage,
    props: { slug: 'kebijakan-privasi' },
  },
  {
    path: '/syarat-ketentuan',
    name: 'syarat-ketentuan',
    component: InfoPage,
    props: { slug: 'syarat-ketentuan' },
  },
  {
    path: '/kebijakan-refund',
    name: 'kebijakan-refund',
    component: InfoPage,
    props: { slug: 'kebijakan-refund' },
  },
  {
    path: '/disclaimer',
    name: 'disclaimer',
    component: InfoPage,
    props: { slug: 'disclaimer' },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: { guestOnly: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminPage,
    meta: { requiresAuth: true, admin: true },
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: ChangePasswordPage,
    meta: { requiresAuth: true },
  },
  ...usersWebRoutes,
  {
    path: '/roles',
    name: 'roles',
    component: RolesPage,
    meta: { requiresAuth: true, requiresPermission: 'roles.view' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
  },
] satisfies RouteRecordRaw[];

export const appScrollBehavior: RouterScrollBehavior = (to, _from, savedPosition) => {
  if (savedPosition) return savedPosition;
  if (to.hash) return { el: to.hash };
  return { top: 0 };
};

const router = createRouter({
  history: createWebHistory(),
  routes: appRoutes,
  scrollBehavior: appScrollBehavior,
});

const authSession = useAuthSession();

router.beforeEach(async (to) => {
  try {
    // Protected and guest-only destinations need a fresh server decision so
    // revoked/expired sessions and permission changes take effect on the next
    // navigation. Public pages only need the one-time bootstrap.
    if (to.meta.requiresAuth || to.meta.guestOnly) await authSession.refresh();
    else await authSession.load();
  } catch {
    // A transient server/network failure must not erase a previously valid
    // browser session. If no authenticated state has ever been established,
    // cancel protected navigation rather than converting uncertainty into a
    // logout redirect.
    if (to.meta.requiresAuth && !authSession.isAuthenticated.value) return false;
  }

  if (to.meta.requiresAuth && !authSession.isAuthenticated.value) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    };
  }

  if (
    authSession.isAuthenticated.value &&
    authSession.user.value?.mustChangePassword === true &&
    to.name !== 'change-password'
  ) {
    return { name: 'change-password' };
  }
  if (to.meta.admin === true && !authSession.hasRole('admin')) {
    return { name: 'dashboard' };
  }
  const requiredPermission = to.meta.requiresPermission;
  if (typeof requiredPermission === 'string' && !authSession.can(requiredPermission)) {
    return { name: 'dashboard' };
  }

  if (to.meta.guestOnly && authSession.isAuthenticated.value) {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
