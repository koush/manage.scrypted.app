<template>
    <v-checkbox class="shrink" :readonly="modelValue.readonly" density="compact" :label="modelValue.title"
        persistent-placeholder :hint="modelValue.description" v-model="modelValue.value"
        :persistent-hint="!!modelValue.description" :hide-details="!modelValue.description"></v-checkbox>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';

const modelValue = defineModel<Setting>();

</script>
<style scoped>
.shrink {
    transform: scale(.75, .75);
    width: 133.3333%;
    transform-origin: 0% 50%;
}
</style>
