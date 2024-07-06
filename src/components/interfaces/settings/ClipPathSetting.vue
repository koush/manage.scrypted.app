<template>
   <ButtonSetting :model-value="modelValue"></ButtonSetting>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import ButtonSetting from './ButtonSetting.vue';

const modelValue = defineModel<Setting>();

</script>

