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
    if ((globalThis as any).webkit?.messageHandlers?.scrypted?.postMessage && localStorage.getItem('postMessage')) {
        (globalThis as any).webkit?.messageHandlers?.scrypted?.postMessage({
            type: 'windowLocationReload',
        });
    }
    else {
        window.location.reload();
    }
}
