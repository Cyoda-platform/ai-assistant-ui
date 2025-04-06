import {createRouter, createWebHashHistory, createWebHistory} from 'vue-router'
import useAuthStore from "@/stores/auth.ts";
import useAssistantStore from "../stores/assistant";
import {isInIframe} from "../helpers/HelperIframe";

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


const params = new URLSearchParams(window.location.search)

let firstVisit = !params.has('authState');
router.beforeEach(async (to, from, next) => {
  const assistantStore = useAssistantStore();
  if (firstVisit) {
    firstVisit = false;
    const {data} = await assistantStore.getChats();
    if (data.chats.length === 0 || isInIframe) {
      return next({path: "/"});
    } else {
      return next({path: "/home"});
    }
  }
  next();
});

export default router
