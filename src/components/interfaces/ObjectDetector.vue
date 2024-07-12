<template>
  <svg  :viewBox="`0 0 ${svgWidth} ${svgHeight}`">
    <rect v-for="r in svgContents.rects" :x="r.boundingBox[0]" :y="r.boundingBox[1]" :width="r.boundingBox[2]" :height="r.boundingBox[3]" :stroke="r.stroke" :stroke-width="r.strokeWidth" fill="none" />
    <text v-for="t in svgContents.texts" :x="t.point[0]" :y="t.point[1]" fill="white" :font-size="fontSize" background>
      <tspan v-for="ts in t.tspans" :dy="`${ts.dy}em`">{{ ts.content }}</tspan>
    </text>
  </svg>
</template>
<script setup lang="ts">
import { getDeviceFromId, registerListener } from '@/id-device';
import { ObjectDetector, ObjectsDetected, Point, ScryptedInterface } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
const props = defineProps<{
  id: string;
}>();
const device = getDeviceFromId<ObjectDetector>(() => props.id);
const detected = ref<ObjectsDetected>();

registerListener(device, {
  event: ScryptedInterface.ObjectDetector,
}, (source, details, data) => {
  detected.value = data;
});

const svgWidth = computed(()=> {
  return detected.value?.inputDimensions?.[0] || 1920;
});

const svgHeight = computed(()=> {
  return detected.value?.inputDimensions?.[1] || 1080;
});

const fontSize = computed(() => {
  return 15 * svgWidth.value / 1080;
});

watch(() => props.id, () => detected.value = undefined);

interface SvgContents {
  rects: {
    boundingBox: [number, number, number, number];
    stroke: string;
    strokeWidth: number;
  }[];
  texts: {
    point:  Point;
    tspans: {
      content: string;
      dy: number;
    }[];
  }[];
}

const svgContents = computed<SvgContents>(() => {
  const ret: SvgContents = {
    rects: [],
    texts: [],
  };

  for (const d of detected.value?.detections || []) {
    const boundingBox = d.boundingBox;
    let stroke = 'red';
    if (d.className !== 'motion') {
      let content = `${d.className} ${(d.score * 100).toFixed(0)}%`;
      stroke = 'blue';
      ret.texts.push({
        point: [boundingBox[0], boundingBox[1]],
        tspans: [
          {
            content,
            dy: -.3,
          },
        ]
      });

      if (d.label) {
        content = d.label;
        ret.texts.push({
          point: [boundingBox[0], boundingBox[1]],
          tspans: [
            {
              content,
              dy: -1.3,
            },
          ]
        });

      }
    }

    ret.rects.push({
      boundingBox,
      stroke,
      strokeWidth: 2,
    });

  }

  return ret;
});

</script>
