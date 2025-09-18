import {createRouter, createWebHashHistory} from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: "/home",
            redirect: "/",
        },
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
