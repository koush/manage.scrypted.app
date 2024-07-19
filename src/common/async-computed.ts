import { computed, ref, watch, WatchSource } from 'vue';

export type WatchValues<T extends string> = {
    [key in T]: WatchSource;
};

export function asyncComputed<T, V extends string>(options: {
    get(state: {
        isCancelled: () => boolean,
        clearOldValue: () => void,
    }, oldValue: T, newWatchValue?: any, oldWatchValue?: any, watch?: V): Promise<T | undefined>,
    set?: (v: T) => void,
    watch?: WatchValues<V>,
    default?: (T | ((previousValue?: T) => T | undefined)),
    error?: T,
    console?: Console,
}) {
    return asyncComputedRaw(options).computed;
}

export function asyncComputedRaw<T, V extends string>(options: {
    get(state: {
        isCancelled: () => boolean,
        clearOldValue: () => void,
    }, oldValue: T, newWatchValue?: any, oldWatchValue?: any, watch?: V): Promise<T | undefined>,
    set?: (v: T) => void,
    watch?: WatchValues<V>,
    default?: (T | ((previousValue?: T) => T | undefined)),
    error?: T,
    console?: Console,
}) {

    const getDefault: () => T = () => {
        if (typeof options.default === 'function')
            return (options.default as (previousValue?: T) => T)(resolvedValue.value?.value);
        return options.default as T;
    }

    const resolvedValue = ref<{
        updating: boolean,
        value: T,
    }>();
    const currentValue = ref<Promise<void>>();
    const ret = computed<T>({
        get() {
            options.console?.warn('computed', resolvedValue.value)
            if (resolvedValue.value && !resolvedValue.value.updating)
                return resolvedValue.value.value;
            // initial request of the value
            if (!currentValue.value)
                currentValue.value = recompute(getDefault(), undefined, undefined);
            return getDefault();
        },
        set(value: T) {
            if (!options?.set)
                throw new Error('async computed is read only');
            resolvedValue.value = {
                updating: false,
                value,
            }
            options?.set(value);
        }
    });

    let token: string;
    const loading = ref(false);

    const updateValue = (myToken: string, value: T) => {
        if (token !== myToken)
            return;
        if (resolvedValue.value?.value === value) {
            if (resolvedValue.value)
                resolvedValue.value.updating = false;
            return;
        }
        options.console?.log('changing value')
        resolvedValue.value = {
            updating: false,
            value,
        };
        loading.value = false;
    }

    const recompute = async (oldValue: T, newWatchValue: any, oldWatchValue: any, watch?: V) => {
        const myToken = token = Math.random().toString();
        loading.value = true;

        try {
            const newValue = await options.get({
                isCancelled: () => myToken !== token,
                clearOldValue: () => resolvedValue.value = undefined,
            }, oldValue, newWatchValue, oldWatchValue, watch);
            updateValue(myToken, newValue as any);
        }
        catch (e) {
            updateValue(myToken, getDefault());
        }
    }

    for (const k of Object.keys(options.watch || {})) {
        const v: WatchSource = options.watch![k as V];
        watch(v, (n, o) => {
            currentValue.value = recompute(resolvedValue.value?.value as T, n, o, k as V);
            if (resolvedValue.value)
                resolvedValue.value.updating = true;
        });
    }
    return {
        computed: ret,
        loading,
    };
}
