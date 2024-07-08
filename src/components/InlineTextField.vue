<template>
  <v-btn v-if="!editing" :size="size" density="compact" variant="text"
    :append-icon="editIcon ? getFaPrefix('fa-pencil') : undefined"
    @click="editing = true; emit('update:editing', editing);">{{ modelValue }}</v-btn>
  <component :items="items" :is="component" hide-details style="transform: scale(.60, .60); transform-origin: 0 50%;"
    density="compact" variant="outlined" v-else v-model="internalModelValue">
    <template v-slot:append-inner>
      <v-btn class="pa-0 inner-btn" variant="text" @click="cancel">
        <v-icon>{{ getFaPrefix('fa-cancel') }}</v-icon>
      </v-btn>
      <v-btn class="pa-0 inner-btn" color="success" variant="text" @click="save">
        <v-icon>{{ getFaPrefix('fa-check') }}</v-icon>
      </v-btn>
    </template>
  </component>
</template>
<script setup lang="ts">
import { getFaPrefix } from '@/device-icons';
import { computed, ref, watch } from 'vue';
import { VCombobox, VTextField } from 'vuetify/components';

const props = defineProps<{
  items?: string[];
  editIcon?: boolean;
  size?: string;
}>();

const modelValue = defineModel<string>();

const component = computed(() => {
  if (props.items)
    return VCombobox;
  return VTextField;
})

const emit = defineEmits<{
  (event: 'update:modelValue', value?: string): void;
  (event: 'update:editing', editing: boolean): void;
}>();

const internalModelValue = ref(modelValue.value);
watch(() => modelValue.value, () => {
  internalModelValue.value = modelValue.value;
});

const editing = ref(false);

function cancel() {
  internalModelValue.value = modelValue.value;
  editing.value = false;
  emit('update:editing', editing.value);
}

function save() {
  editing.value = false;
  modelValue.value = internalModelValue.value;
  emit('update:editing', editing.value);
}

</script>
<style scoped>
input {
  font-size: .5rem;
}

.inner-btn {
  min-width: 36px !important;
}
</style>
