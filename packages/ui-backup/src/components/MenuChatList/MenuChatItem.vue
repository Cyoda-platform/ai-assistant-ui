<template>
  <div v-loading="isLoadingDelete" class="menu-chat-item" :class="{
    'menu-chat-item--active': isActive
  }">
    <router-link class="menu-chat-item__link" :to="link">{{ chat.name || 'No name' }}</router-link>
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
        <div class="menu-chat-item__actions">
          <span class="menu-chat-item__popover-action-title">Actions</span>
          <span class="menu-chat-item__popover-action-btns">
             <el-tooltip
                 class="box-item"
                 effect="dark"
                 content="Rename Chat"
                 :show-after="1000"
                 placement="top"
             >
               <el-button @click="onClickRename" class="btn btn-default btn-icon">
                  <EditIcon/>
               </el-button>
             </el-tooltip>

            <el-tooltip
                class="box-item"
                effect="dark"
                content="Delete Chat"
                :show-after="1000"
                placement="top"
            >
      <el-button @click="onClickDelete" class="btn btn-default btn-icon">
        <TrashSmallIcon/>
      </el-button>
    </el-tooltip>
          </span>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import {ChatData} from "@/types/chat.d";
import {computed, ref} from "vue";
import ThreeDotsIcon from '@/assets/images/icons/three-dots.svg';
import {dayjs, ElMessageBox} from "element-plus";
import {useRoute} from "vue-router";
import EditIcon from '@/assets/images/icons/edit.svg';
import TrashSmallIcon from "@/assets/images/icons/trash-small.svg";
import eventBus from "@/plugins/eventBus";
import {DELETE_CHAT_CLEAR_INTERVALS_BY_TECHNICAL_ID, RENAME_CHAT_START} from "@/helpers/HelperConstants";
import useAssistantStore from "@/stores/assistant";
import router from "@/router";

const isShowPopover = ref(false);
const route = useRoute();
const isLoadingDelete = ref(false);
const assistantStore = useAssistantStore();

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

function onClickDelete() {
  ElMessageBox.confirm("Do you really want to remove?", "Confirm!", {
    callback: async (action) => {
      if (action === "confirm") {
        try {
          eventBus.$emit(DELETE_CHAT_CLEAR_INTERVALS_BY_TECHNICAL_ID, props.chat.technical_id);
          isLoadingDelete.value = true;
          await assistantStore.deleteChatById(props.chat.technical_id);
          await assistantStore.getChats();
          router.push('/home');
        } finally {
          isLoadingDelete.value = false;
        }
      }
    }
  });
}

function onClickRename(){
  eventBus.$emit(RENAME_CHAT_START, props.chat)
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
    font-size: 16px;
    line-height: 130%;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
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

  &__popover-date-title, &__popover-action-title {
    width: 120px;
    display: inline-block;
  }

}
</style>
