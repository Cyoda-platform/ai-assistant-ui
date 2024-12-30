<template>
  <ChatBot :technicalId="technicalId"/>
</template>

<script setup lang="ts">
import ChatBot from "@/components/ChatBot/ChatBot.vue";
import {computed} from "vue";
import {useRoute} from "vue-router";

const route = useRoute();

const technicalId = computed(() => {
  return route.params.technicalId as string;
});

</script>
