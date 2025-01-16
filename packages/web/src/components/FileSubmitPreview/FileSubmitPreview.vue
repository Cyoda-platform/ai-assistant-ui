<template>
  <div class="file-submit-preview">
    <template v-if="props.file">
      <CloseIcon @click="onDeleteAttach" class="file-submit-preview__icon-close"/>
      <template v-if="imagePreview">
        <el-image class="file-submit-preview__image" style="width: 100px; height: 100px"
                  :src="imagePreview" fit="fill"/>
      </template>
      <template v-else>
        <div class="file-submit-preview__doc">
          <div>
            <FileIcon/>
          </div>
          <div class="file-submit-preview__description">
            <div class="file-submit-preview__description-name">{{ fileData.name }}</div>
            <div class="file-submit-preview__description-format">{{ fileData.format }}</div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import {computed} from "vue";
import CloseIcon from '@/assets/images/icons/close.svg';
import FileIcon from '@/assets/images/icons/file.svg';
import {ElMessageBox} from "element-plus";

const props = defineProps<{
  file: File,
}>()

const emit = defineEmits(['delete']);

const imagePreview = computed(() => {
  if (props.file?.type.startsWith('image/')) {
    return URL.createObjectURL(props.file);
  }
  return null;
})

const fileData = computed(() => {
  if (props.file) {
    const fileName = props.file.name;
    return {
      name: fileName.split('.').shift(),
      format: fileName.split('.').pop(),
    }
  }

  return {};
})

function onDeleteAttach() {
  ElMessageBox.confirm("Are you sure you want to delete the file?", "Confirm!", {
    callback: async (action) => {
      if (action === "confirm") {
        emit('delete');
      }
    }
  });
}

</script>

<style lang="scss">
@use "@/assets/css/particular/variables";

.file-submit-preview {
  display: inline-block;
  position: relative;
  margin-top: 16px;
  margin-left: 16px;
  margin-right: 16px;

  &__icon-close {
    position: absolute;
    top: -10px;
    right: -10px;
    z-index: 1;
    cursor: pointer;
    opacity: 0;
    transition: all 0.5s;
  }

  &:hover &__icon-close {
    opacity: 1;
  }

  &__image {
    border-radius: 8px;
    overflow: hidden;
  }

  &__doc {
    border-radius: 8px;
    overflow: hidden;
    background: variables.$green-primary-dark;
    display: flex;
    align-items: center;
    padding: 16px;
    gap: 16px;
    min-width: 200px;
  }

  &__description {
    color: #fff;
  }

  &__description-name {
    font-size: 16px;
    margin-bottom: 4px;
    text-transform: capitalize;
  }

  &__description-format {
    text-transform: capitalize;
    font-size: 16px;
    font-weight: 100;
  }
}
</style>
