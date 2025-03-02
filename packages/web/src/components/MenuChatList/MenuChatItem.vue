<template>
  <div class="menu-chat-item" :class="{
    'menu-chat-item--active': isActive
  }" @mouseleave="isShowPopover=false">
    <router-link class="menu-chat-item__link" :to="link">{{ chat.name }}</router-link>
    <el-popover popper-class="default" v-model:visible="isShowPopover" placement="right-start"
                :popper-style="popperStyle"
                :popper-options="popperOptions"
                trigger="click" :show-arrow="false">
      <template #reference>
        <span class="menu-chat-item__svg_wrapper">
          <ThreeDotsIcon/>
        </span>
      </template>
      <div class="menu-chat-item__popover">
        <h4>{{ chat.name }}</h4>
        <div v-if="chat.description" class="menu-chat-item__popover-description">{{ chat.description }}</div>
        <div class="menu-chat-item__popover-date">
          <span class="menu-chat-item__popover-date-title">Date</span>
          <span class="menu-chat-item__popover-date-value">{{ transformDate(chat.date) }}</span>
        </div>
        <div class="menu-chat-item__popover-date">
          <span class="menu-chat-item__popover-date-title">Last change</span>
          <span class="menu-chat-item__popover-date-value">{{ transformDate(chat.last_modified) }}</span>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import {ChatData} from "@/types/chat.d";
import {computed, ref} from "vue";
import ThreeDotsIcon from '@/assets/images/icons/three-dots.svg';
import {dayjs} from "element-plus";
import {useRoute} from "vue-router";

const isShowPopover = ref(false);
const route = useRoute();

const popperOptions = {
  modifiers: [{
    name: 'offset',
    options: {
      offset: [0, 10],
    },
  },]
}

const popperStyle = {
  minWidth: '250px',
}

const props = defineProps<{
  chat: ChatData
}>();

const link = computed(() => {
  return `/chat-bot/view/${props.chat.technical_id}`;
})

function transformDate(dateStr) {
  return dayjs(dateStr).format('DD/MM/YYYY')
}

const isActive = computed(() => {
  return props.chat.technical_id === route.params.technicalId;
})
</script>

<style lang="scss" scoped>
.menu-chat-item {
  border: 1px solid transparent;
  border-radius: 4px;
  margin-bottom: 6px;
  transition: all 0.5s;
  display: flex;
  align-items: center;

  &__link {
    padding: 8px 8px 8px 0;
    color: var(--text-color-regular);
    text-decoration: none;
    display: block;
    transition: all 0.5s;
    flex-grow: 1;
  }

  &__svg_wrapper {
    padding: 8px;
    display: flex;
    align-items: center;
    cursor: pointer;
    opacity: 0;
    transition: all 1s;
    align-self: stretch;

    svg {
      fill: var(--text-color-regular);
    }
  }

  &:hover, &--active {
    border-color: var(--border-color-active-menu);
    background: var(--bg-active-menu);
  }

  &:hover &__link, &--active &__link {
    padding-left: 8px;
  }

  &--active &__link {
    font-weight: 500;
  }

  &:hover &__svg_wrapper {
    opacity: 1;
  }


  &__popover {
    font-size: 16px;

    h4 {
      color: var(--text-header);
      margin: 0 0 8px 0;
    }
  }

  &__popover-description {
    margin-bottom: 8px;
  }

  &__popover-date {
    display: flex;
    margin-bottom: 8px;
  }

  &__popover-date:last-child {
    margin-bottom: 0;
  }

  &__popover-date-title {
    width: 120px;
  }

}
</style>
