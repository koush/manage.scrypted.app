<template>
    <div>
        <v-list-item-subtitle class="shrink ml-3 mr-3" v-if="modelValue.title">{{ modelValue.title }}</v-list-item-subtitle>
    <div v-html="modelValue.value"></div>
</div>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';

const modelValue = defineModel<Setting>();
</script>
