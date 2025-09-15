import {createRouter, createWebHashHistory} from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("../views/Workflow.vue"),
      meta: {
        layout: "sidebar",
      },
    },
  ],
})

export default router
