<template>
  <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`">
    <rect v-for="r in svgContents.rects" :x="r.boundingBox[0]" :y="r.boundingBox[1]" :width="r.boundingBox[2]"
      :height="r.boundingBox[3]" :stroke="r.stroke" :stroke-width="r.strokeWidth" :fill="r.fill" />

    <defs>
      <filter x="0" y="0" width="1" height="1" id="solid">
        <feFlood flood-color="blue" result="bg" />
        <feMerge>
          <feMergeNode in="bg" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <text v-for="t in svgContents.texts"  filter="url(#solid)" :x="t.point[0]" :y="t.point[1]" fill="white" :font-size="fontSize" background>
      <tspan v-for="ts in t.tspans" :dy="`${ts.dy}em`">{{ ts.content }}</tspan>
    </text>
  </svg>
</template>
<script setup lang="ts">
import { ObjectsDetected, Point } from '@scrypted/types';
import { computed } from 'vue';
const props = defineProps<{
  detected?: ObjectsDetected;
}>();

const svgWidth = computed(() => {
  return props.detected?.inputDimensions?.[0] || 1920;
});

const svgHeight = computed(() => {
  return props.detected?.inputDimensions?.[1] || 1080;
});

const fontSize = computed(() => {
  return 15 * svgWidth.value / 1080;
});

interface SvgContents {
  rects: {
    boundingBox: [number, number, number, number];
    stroke?: string;
    strokeWidth?: number;
    fill: string;
  }[];
  texts: {
    point: Point;
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

  for (const d of props.detected?.detections || []) {
    const boundingBox = d.boundingBox;
    let stroke = 'red';
    if (d.className !== 'motion' && d.className) {
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

      // get a bounding box for the two texts
      // const textbb: [number, number, number, number] = [...boundingBox];
      // if (!d.label) {
      //   textbb[3] = 30;
      //   textbb[1] -= 30;
      // }
      // else {
      //   textbb[3] = 60;
      //   textbb[1] -= 60;
      // }

      // ret.rects.push({
      //   boundingBox: textbb,
      //   fill: '#0000FF40',
      // });
    }

    ret.rects.push({
      boundingBox,
      stroke,
      strokeWidth: 2,
      fill: 'none',
    });

  }

  return ret;
});

</script>
