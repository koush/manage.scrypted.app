<template>
  <template v-if="title">
    <v-row>
      <v-col class="pt-1 pb-1" cols="3" style="align-content: center;"><v-list-item-subtitle>{{ title
          }}</v-list-item-subtitle>
      </v-col>
      <v-col class="pt-1 pb-1" style="align-content: center;">
        <slot></slot>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="pt-0 pb-1" cols="3" style="align-content: center;">
      </v-col>
      <v-col class="pt-0 pb-1 ml-4 mr-4" style="align-content: center;">
        <v-list-item-subtitle style="font-size: .75rem;">{{ description }}</v-list-item-subtitle>
      </v-col>
    </v-row>
  </template>
  <slot v-else></slot>
</template>
<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
}>();
</script>
