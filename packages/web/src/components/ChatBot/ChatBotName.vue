<template>
    <div class="chat-bot-name">
      <a :href="linkToGithub" target="_blank">
        <GithubIcon style="width: 24px"/>
        <span>{{ chatName }}</span>
      </a>
      <EditIcon/>
    </div>
</template>

<script setup lang="ts">
import GithubIcon from '@/assets/images/icons/github.svg';
import EditIcon from '@/assets/images/icons/edit.svg';
import {computed} from "vue";

const props = defineProps<{
  technicalId: string,
  chatName: string,
}>();

const linkToGithub = computed(() => {
  return `https://github.com/Cyoda-platform`
});
</script>

<style lang="scss" scoped>
.chat-bot-name {
  display: flex;
  align-items: center;
  gap: 12px;

  svg {
    fill: var(--text-color-regular);
  }

  a {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-color-regular);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  span {
    font-size: 20px;
    font-style: italic;
    font-weight: 400;
  }
}
</style>
