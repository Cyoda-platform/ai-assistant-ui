import {createRouter, createWebHashHistory, createWebHistory} from 'vue-router'
import useAuthStore from "@/stores/auth.ts";

const router = createRouter({
  history: import.meta.env.VITE_IS_ELECTRON ? createWebHashHistory() : createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("../views/NewChatView.vue"),
    },
    {
      path: "/home",
      name: "Home",
      meta: {
        layout: "sidebar",
      },
      component: () => import("../views/DashboardView.vue"),
    },
    {
      path: "/chat-bot/view/:technicalId",
      name: "ChatBotView",
      meta: {
        layout: "default",
      },
      component: () => import("../views/ChatBotView.vue"),
    },
  ],
})

export default router
