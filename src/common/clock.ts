import { onUnmounted, ref, watch } from "vue";

export function setLossyAsyncInterval(interval: number, cb: () => (Promise<any> | any)) {
    let timeout: NodeJS.Timeout | undefined;
    function clear() {
        clearTimeout(timeout);
        timeout = undefined;
    }

    function reset() {
        clear();
        timeout = setTimeout(async () => {
            const t = timeout;
            try {
                await cb();
            }
            finally {
                // the callback may clear or rsset the timeout, so do not reschedule in that case.
                // reset is a weird/intentional case where the reset will allow overlapping async callbacks.
                if (t === timeout)
                    reset();
            }
        }, interval);
    }

    reset();

    return {
        clear,
        reset,
    }
}

export const nowSeconds = ref(Date.now());
setLossyAsyncInterval(1000, () => nowSeconds.value = Date.now());

export function createInterval(duration: number) {
    const count = ref(0);

    const lossyInterval = setLossyAsyncInterval(duration, () => count.value++);
    onUnmounted(lossyInterval.clear);

    function reschedule(newDuration: number) {
        duration = newDuration;
        lossyInterval.reset();
    }

    return {
        reschedule,
        count
    };
}

export function watchInterval(duration: number, callback: () => void) {
    const interval = createInterval(duration);
    watch(() => interval.count.value, callback);
    return interval;
}
