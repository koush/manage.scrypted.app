<template>
  <div ref="kvm" tabindex="0" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp"
    @keydown="onKeyDown" @keyup="onKeyUp" @keypress="onKeyPress">
  </div>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { getDeviceFromId } from '@/id-device';
import { Deferred } from '@scrypted/common/src/deferred';
import { KvmKeyEvent, KvmMouseEvent, StreamService } from '@scrypted/types';
import { onUnmounted, ref } from 'vue';
import { createAsyncQueue } from '../../../scrypted/common/src/async-queue';


const props = defineProps<{
  id: string;
  reconnect?: boolean;
}>();

const kvm = ref<HTMLElement>();

const device = getDeviceFromId<StreamService<(KvmKeyEvent | KvmMouseEvent)[], void>>(() => props.id);

const currentStream = asyncComputed({
  async get(state, ov: ReturnType<typeof createAsyncQueue<(KvmKeyEvent | KvmMouseEvent)[]>>) {
    const ret = createAsyncQueue<(KvmKeyEvent | KvmMouseEvent)[]>();
    ov?.end();
    if (!device.value)
      return ret;
    await device.value.connectStream(ret.queue);
    return ret;
  },
  watch: {
    id: () => props.id,
  }
});

function submitEvent(event: KvmKeyEvent | KvmMouseEvent) {
  if (!kvm.value)
    return;
  const stream = currentStream.value;
  if (!stream)
    return;
  if (stream.queued.length) {
    stream.queued[0].item.push(event);
  }
  else {
    stream.submit([event]);
  }
}

function onMouseDown(e: MouseEvent) {
  const { x, y, button } = e;
  // get client bounding
  // rect and offset x/y to get relative position
  if (!kvm.value)
    return;
  const { width, height } = kvm.value.getBoundingClientRect();
  submitEvent({
    event: 'mousedown',
    button,
    x: (x - kvm.value.offsetLeft) / width,
    y: (y - kvm.value.offsetTop) / height,
  });
}
function onMouseMove(e: MouseEvent) {
  const { x, y, button } = e;
  if (!kvm.value)
    return;
  const { width, height } = kvm.value.getBoundingClientRect();
  submitEvent({
    event: 'mousemove',
    button,
    x: (x - kvm.value.offsetLeft) / width,
    y: (y - kvm.value.offsetTop) / height,
  });
}
function onMouseUp(e: MouseEvent) {
  const { x, y, button } = e;
  if (!kvm.value)
    return;
  const { width, height } = kvm.value.getBoundingClientRect();
  submitEvent({
    event: 'mouseup',
    button,
    x: (x - kvm.value.offsetLeft) / width,
    y: (y - kvm.value.offsetTop) / height,
  });
}
function onKeyDown(e: KeyboardEvent) {
  submitEvent({
    event: 'keydown',
    key: e.key,
    code: e.code,
  })
}
function onKeyUp(e: KeyboardEvent) {
  submitEvent({
    event: 'keyup',
    key: e.key,
    code: e.code,
  })
}
function onKeyPress(e: KeyboardEvent) {
  submitEvent({
    event: 'keypress',
    key: e.key,
    code: e.code,
  })
}

const unmounted = new Deferred<void>();
onUnmounted(() => unmounted.resolve());

async function connectPty() {

}

connectPty();

</script>