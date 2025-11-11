export function vibrate() {
    if (navigator.vibrate as any) {
        navigator.vibrate([1]);
    }
    else {
        (globalThis as any).webkit?.messageHandlers?.scrypted?.postMessage({
            type: 'vibrate',
        });
    }
}

export function windowLocationReload() {
    window.location.reload();
}

export function appWindowLocationReload() {
    if ((globalThis as any).webkit?.messageHandlers?.scrypted?.postMessage) {
        try {
            (globalThis as any).webkit?.messageHandlers?.scrypted?.postMessage({
                type: 'windowLocationReload',
            });
        }
        catch (e) {
        }
        setTimeout(windowLocationReload, 500);
    }
    else {
        windowLocationReload();
    }
}
