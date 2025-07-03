<template>
  <v-btn v-if="!editing" :size="size" density="compact" variant="text"
    :append-icon="editIcon ? getFaPrefix('fa-pencil') : undefined" @click="editing = true; emit('editing');"
    v-on:keyup.enter="save">{{ modelValue }}</v-btn>
  <v-form v-else @submit="save" style="width: 100%;">
    <component :items="items" :is="component" hide-details style="transform: scale(.60, .60); transform-origin: 0 50%; width: 166.66%;"
      density="compact" variant="outlined" v-model="internalModelValue">
      <template v-slot:append-inner>
        <v-btn class="pa-0 inner-btn" variant="text" @click="cancel">
          <v-icon>{{ getFaPrefix('fa-cancel') }}</v-icon>
        </v-btn>
        <v-btn class="pa-0 inner-btn" color="success" variant="text" @click="save">
          <v-icon>{{ getFaPrefix('fa-check') }}</v-icon>
        </v-btn>
      </template>
    </component>
  </v-form>
</template>
<script setup lang="ts">
import { getFaPrefix } from '@/util/device-icons';
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
  (event: 'editing'): void;
  (event: 'cancel'): void;
  (event: 'save', value: string): void;
}>();

const internalModelValue = ref(modelValue.value);
watch(() => modelValue.value, () => {
  internalModelValue.value = modelValue.value;
});

const editing = ref(false);

function cancel() {
  internalModelValue.value = modelValue.value;
  editing.value = false;
  emit('cancel');
}

function save() {
  editing.value = false;
  modelValue.value = internalModelValue.value;
  emit('save', internalModelValue.value);
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
