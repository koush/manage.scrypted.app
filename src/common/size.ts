import { computed, nextTick, ref, watch } from 'vue';
import { isFullScreen } from './displaymode';
import { isWindows } from './browser';

// Extra small	xs	Small to large phone	< 600px
// Small	sm	Small to medium tablet	600px > < 960px
// Medium	md	Large tablet to laptop	960px > < 1264px*
// Large	lg	Desktop	1264px > < 1904px*
// Extra large	xl	4k and ultra-wide	> 1904px*

// this api seems unreliable. can't remember why.
// export const screenOrientation = ref(screen.orientation?.type);
// screen.orientation?.addEventListener('change', () => {
//     screenOrientation.value = screen.orientation?.type;
// });

const searchParams = new URLSearchParams(window.location.search);

const detectedTouch = ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    ((navigator as any).msMaxTouchPoints > 0);

export const isTouchDevice = ref((detectedTouch && !isWindows) || searchParams.get('display') === 'phone');

export const isTouchTablet = computed(() => {
    if (searchParams.get('display') === 'phone')
        return false;
    const minDim = Math.min(screen.width, screen.height);
    return isTouchDevice.value && minDim >= 600;
});

export const isTouchPhone = computed(() => {
    return isTouchDevice.value && !isTouchTablet.value;
});

function getWindowDimensions() {
    return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
    }
}

function getScreenDimensions() {
    return {
        width: screen.width,
        height: screen.height,
    }
}

export const windowSize = ref(getWindowDimensions());
export const screenSize = ref(getScreenDimensions());

window.addEventListener('resize', () => {
    nextTick(() => {
        windowSize.value = getWindowDimensions();
        screenSize.value = getScreenDimensions();
    })
});

window.addEventListener('orientationchange', () => {
    nextTick(() => {
        windowSize.value = getWindowDimensions();
        screenSize.value = getScreenDimensions();
    })
});

let wasPortrait: boolean;
export const isPortrait = computed(() => {
    // prevent ui shuffling while in fullscreen mode.
    if (isFullScreen.value)
        return wasPortrait;

    if (searchParams.get('display') === 'phone')
        return wasPortrait = windowSize.value.innerWidth < windowSize.value.innerHeight;
    return wasPortrait = windowSize.value.outerWidth < windowSize.value.outerHeight
});

export const isLandscape = computed(() => !isPortrait.value);
export const isTouchLandscape = computed(() => isTouchDevice.value && isLandscape.value);

watch(() => isPortrait.value, () => {
    console.log('orientation', isPortrait.value ? 'portrait' : 'landscape');
    console.log('fullscreen', isFullScreen.value ? 'fullscreen' : 'windowed');
});
