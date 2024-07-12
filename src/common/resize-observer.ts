import { ref, onMounted, onUnmounted, Ref, watch, ComputedRef } from 'vue';

export function observeResize(element: Ref<HTMLElement|undefined>|ComputedRef<HTMLElement|undefined>) {
    const ret = ref<DOMRect | undefined>();

    let resizeObserver: ResizeObserver | undefined;

    function rebind() {
        resizeObserver?.disconnect();
        resizeObserver = undefined;

        update();

        const el = element.value;
        if (!el)
            return;
        resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(el);
    }

    const update = () => {
        const el = element.value;
        if (!el) {
            ret.value = undefined;
            return;
        }

        const [cr] = el.getClientRects();
        ret.value = cr;
    };

    watch(() => element.value, () => {
        rebind();
        update();
    });

    onMounted(() => {
        rebind();
        update();
    });

    rebind();
    update();

    onUnmounted(() => resizeObserver?.disconnect());
    return ret;
}
