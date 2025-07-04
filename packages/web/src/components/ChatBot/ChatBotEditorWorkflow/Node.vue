<template>
  <div class="node">
    <strong>{{ data.label }}</strong>

    <div v-if="data.editableCondition">
                <textarea
                    :value="data.editableCondition"
                    @input="emit('conditionChange', $event)"
                    @mousedown.stop
                    style="width: 100%; height: 150px; margin-top: 8px; resize: none"
                ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: any,
}>()

const emit = defineEmits(['conditionChange']);
</script>

<style scoped lang="scss">

</style>