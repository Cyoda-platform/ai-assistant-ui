import {createRouter, createWebHashHistory, createWebHistory} from 'vue-router'
import useAuthStore from "@/stores/auth.ts";
import useAssistantStore from "../stores/assistant";

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

let firstVisit = true;
router.beforeEach(async (to, from, next) => {
  const assistantStore = useAssistantStore();
  if (firstVisit) {
    firstVisit = false;
    const {data} = await assistantStore.getChats();
    if (data.chats.length > 0) {
      return next({path: "/home"});
    } else {
      return next({path: "/"});
    }
  }
  next();
});

export default router
