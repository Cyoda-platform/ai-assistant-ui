import { createRouter, createWebHistory } from 'vue-router'
import useAuthStore from "@/stores/auth.ts";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: '/home'
    },
    {
      path: "/login",
      name: "login",
      meta: {
        layout: "login",
        name: "Login",
        isPublic: true,
      },
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/home",
      name: "Home",
      meta: {
        layout: "sidebar",
        isPublic: false,
      },
      component: () => import("../views/DashboardView.vue"),
    },
    {
      path: "/chat-bot/view/:technicalId",
      name: "ChatBotView",
      meta: {
        layout: "sidebar",
        isPublic: false,
      },
      component: () => import("../views/ChatBotView.vue"),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.matched.some(record => !record.meta.isPublic)) {
    if (!authStore.isLoggedIn) {
      authStore.logout();
      return next({ path: "/login", query: { redirect: to.fullPath } });
    }
  }

  next();
});

export default router
