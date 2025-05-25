import {createRouter, createWebHashHistory, createWebHistory, useRoute} from 'vue-router'
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
        layout: "sidebar",
      },
      component: () => import("../views/ChatBotView.vue"),
    },
  ],
})


const params = new URLSearchParams(window.location.search)

let firstVisit = !params.has('authState');
router.beforeEach(async (to, from, next) => {
  const assistantStore = useAssistantStore();
  const authStore = useAuthStore();

  if (firstVisit && params.has('auth0')) {
    firstVisit = false;
    return next();
  }

  if (authStore.isLoggedIn && firstVisit && Object.keys(to.params).length === 0) {
    firstVisit = false;
    if (isInIframe) {
      return next({path: "/"});
    }
    return next({path: "/home"});
  }

  if (!authStore.isLoggedIn && firstVisit && Object.keys(to.params).length === 0) {
    firstVisit = false;
    if (!assistantStore.isGuestChatsExist || isInIframe) {
      return next({path: "/"});
    } else {
      return next({path: "/home"});
    }
  }
  next();
});

export default router
