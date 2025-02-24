<template>
  <div class="file-preview">
    <template v-if="props.file">
      <template v-if="imagePreview">
        <div class="file-preview__image">
          <div @click="dialogVisible=true" class="file-preview__image-actions">
            <MagnifyingGlassIcon/>
          </div>
          <div class="file-preview__image-format">{{ fileData.format }}</div>
          <el-image style="width: 138px; height: 138px"
                    :src="imagePreview" fit="fill"/>
        </div>
      </template>
      <template v-else>
        <div class="file-preview__doc">
          <div @click="onDownload" class="file-preview__doc-actions">
            <DownloadIcon style="width: 18px"/>
          </div>
          <div>
            <FileIcon/>
          </div>
          <div class="file-preview__description">
            <div class="file-preview__description-name">{{ fileData.name }}</div>
            <div class="file-preview__description-format">{{ fileData.format }}</div>
          </div>
        </div>
      </template>
    </template>

    <el-dialog v-model="dialogVisible">
      <div class="image-preview-wrapper">
        <img class="image-preview" :src="imagePreview" alt="Preview Image"/>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import {computed, ref, useTemplateRef} from "vue";
import FileIcon from '@/assets/images/icons/file.svg';
import MagnifyingGlassIcon from '@/assets/images/icons/magnifying-glass.svg';
import DownloadIcon from '@/assets/images/icons/download.svg';

const dialogVisible = ref(false);

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

function onDownload() {
  const url = URL.createObjectURL(props.file);

  const a = document.createElement('a');
  a.href = url;
  a.download = props.file.name || 'downloaded-file';

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

</script>

<style lang="scss">
.file-preview {
  display: inline-block;
  position: relative;
  margin-top: 14px;

  &__image {
    overflow: hidden;
    border: 1px solid #D4D7DE;
    border-radius: 8px;
    position: relative;
    width: 138px;
    height: 138px;
  }


  &__image-format {
    height: 20px;
    line-height: 20px;
    background-color: var(--color-primary);
    transform: rotate(45deg);
    text-align: center;
    color: #fff;
    text-transform: uppercase;
    position: absolute;
    z-index: 1;
    width: 100%;
    top: 15px;
    right: -40px;
    font-weight: bolder;
  }

  &__image-actions,  &__doc-actions {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    opacity: 0;
    transition: all .5s;
    cursor: pointer;

    svg {
      fill: #fff;
      width: 24px;
    }
  }

  &__doc-actions{
    border-radius: 8px;
  }

  &__image:hover &__image-actions, &__doc:hover &__doc-actions {
    opacity: 1;
  }

  &__doc {
    border-radius: 8px;
    overflow: hidden;
    background: var(--green-primary-dark);
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

  .image-preview-wrapper{
    text-align: center;
    margin-top: 16px;
  }
  .image-preview {
    max-width: 100%;
  }
}
</style>
