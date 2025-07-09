import { ref } from "vue";

export const isPwa = ref(!!window.matchMedia('(display-mode: standalone)'));
