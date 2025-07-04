import { computed } from 'vue';
import { getThemeManager } from './theme';

export function getSkeletonColors() { 
    const { globalTheme } = getThemeManager();
    const backgroundColor = computed(() => {
        return globalTheme.value === 'dark' ? 'black' : 'lightgray';
    })
    const waveColor = computed(() => {
        return globalTheme.value === 'dark' ? 'rgba(64, 64, 64, 0.5)' : 'rgba(255, 255, 255, 0.5)';
    })
    return {
        backgroundColor,
        waveColor,
    }    
}
