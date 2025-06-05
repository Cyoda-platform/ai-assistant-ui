<template>
  <el-drawer
      v-model="drawerVisiable"
      title="I am the title"
      direction="ltr"
      size="90%"
  >
    <SideBar/>
  </el-drawer>
</template>

<script setup lang="ts">
import {ref} from "vue";
import SideBar from "@/components/SideBar/SideBar.vue";

const drawerVisiable = ref(false);

defineExpose({drawerVisiable});

</script>