import { ref } from 'vue';
import { isAppleMobile } from './browser';

export type DisplayMode = undefined | 'fullscreen' | 'pip';

export function canRequestFullscreen(container?: HTMLElement) {
    const untyped = container as any;
    return !!(untyped?.requestFullscreen || untyped?.webkitRequestFullscreen);
}

export function requestFullscreen(container: HTMLElement, videoElement?: HTMLVideoElement) {
    exitPictureInPicture();

    const untyped = container as any;
    const untypedVideo = videoElement as any;
    if (container.requestFullscreen) {
        // standard
        container.requestFullscreen();
    }
    else if (untyped.webkitRequestFullscreen) {
        // macos
        untyped.webkitRequestFullscreen();
    }
    else if (untypedVideo?.webkitEnterFullscreen) {
        // ios
        untypedVideo.webkitEnterFullscreen();
    }
}

export function requestPictureInPicture(container: HTMLElement, videoElement: HTMLVideoElement) {
    videoElement.requestPictureInPicture();
}

export function exitFullScreen() {
    const untyped = document as any;
    untyped.exitFullscreen?.()?.catch?.(() => { });
    untyped.mozCancelFullScreen?.();
    untyped.webkitExitFullscreen?.();
}

export function exitPictureInPicture() {
    document.exitPictureInPicture?.().catch(() => { });
}

let isScryptedFullScreen = ref(false);
function checkFullscreen() {
    return !!document.fullscreenElement || !!(document as any).webkitFullscreenElement || isScryptedFullScreen.value;
}

export const isFullScreen = ref(checkFullscreen());
export const needsFakeFullscreen = isAppleMobile;


const fullscreenListener = async () => {
    console.log('fullscreenchange');
    isFullScreen.value = checkFullscreen();
}

document.addEventListener('fullscreenchange', fullscreenListener);
document.addEventListener('webkitfullscreenchange', fullscreenListener);
addEventListener('scryptedfullscreenchange', () => {
    isScryptedFullScreen.value = !isScryptedFullScreen.value;
    fullscreenListener();
});
