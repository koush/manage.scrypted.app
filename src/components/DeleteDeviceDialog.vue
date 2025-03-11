<template>
  <v-dialog max-width="320">
    <template v-slot:activator="{ props: activatorProps }">
      <slot name="activator" :activatorProps="activatorProps"></slot>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card>
        <template v-slot:title>
          <v-card-subtitle class="mt-1">Delete {{ name }}</v-card-subtitle>
        </template>
        <template v-slot:prepend>
          <v-icon size="x-small" color="error">{{ getFaPrefix('fa-trash') }}</v-icon>
        </template>
        <v-card-text>
          This action will remove {{ name }} and all provided devices from the system. This action can not be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text="Cancel" @click="isActive.value = false"></v-btn>
          <v-btn color="error" @click="isActive.value = false; deleteDevice();">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>
<script setup lang="ts">
import { connectedClient } from '@/common/client';
import { getFaPrefix } from '@/device-icons';
import { getDeviceRoute } from '@/id-device';
import { computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  id: string;
}>();

const emits = defineEmits<{
  (event: 'delete'): void;
}>();

const name = computed(() => {
  return connectedClient.value?.systemManager.getDeviceById(props.id).name;
});

const router = useRouter();
async function deleteDevice() {
  emits('delete');
  const device = connectedClient.value?.systemManager.getDeviceById(props.id);
  const providerId = device?.providerId === props.id ? undefined : device?.providerId;
  const id = props.id;
  router.replace(providerId ? getDeviceRoute(providerId) : '/component/plugin');
  await nextTick();
  await connectedClient.value?.systemManager.removeDevice(id);
}
</script>
