<template>
    <slot name="item" v-for="item in currentPage" :item="item"></slot>
    <v-pagination :length="pages.length" v-model="page" rounded density="compact"></v-pagination>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
    items?: any[];
    pageSize: number;
}>();

const page = ref(1);


const pages = computed(() => {
    const pages: any[] = [];
    for (let i = 0; i < (props.items || []).length; i += props.pageSize) {
        pages.push(props.items.slice(i, i + props.pageSize));
    }
    return pages;
});

const currentPage = computed(() => pages.value[page.value - 1]);

</script>