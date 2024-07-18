<template>
  <v-card :style="{ height: '300px', width: '100%' }">
    <l-map ref="map" :zoom="zoom()" :center="position<PointExpression>()"
      :options="{
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false,
        scrollWheelZoom: false,
        touchZoom: false,
      }">
      <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  layer-type="base"
                  name="OpenStreetMap"
                  :attribution="attribution"></l-tile-layer>
      <l-marker :lat-lng="position<LatLngTuple>()"></l-marker>
      <l-control-attribution position="bottomright" :prefix="prefix"></l-control-attribution>
    </l-map>
  </v-card>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { getDeviceFromId } from '@/id-device';
import { PositionSensor } from '@scrypted/types';
import { LatLngTuple, PointExpression } from 'leaflet';

const leaflet = await import('@vue-leaflet/vue-leaflet');
// @ts-ignore
const L = await import('leaflet');
const { LMap, LTileLayer, LMarker, LControlAttribution } = leaflet;

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<PositionSensor>(() => props.id);
const zoom = () => !device.value.position ? 2 : 16;

function position<T>() {
  return [device.value.position.latitude, device.value.position.longitude] as T;
}

const attribution = '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors';
const prefix = '<a target="blank" href="https://leafletjs.com/">Leaflet</a>';

</script>