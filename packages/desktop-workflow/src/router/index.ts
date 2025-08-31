import {createRouter, createWebHashHistory} from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("../components/WrapWorkflow.vue"),
    },
  ],
})

export default router
