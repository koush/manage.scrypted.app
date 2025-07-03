<template>
  <v-card v-if="show">
    <template v-slot:prepend>
      <v-icon size="xx-small">{{ getFaPrefix('fa-light-switch') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
        Status and Controls
      </v-card-subtitle>
    </template>

    <StateToggle v-if="hasMotionSensor" :states="motionActions" :state="device.motionDetected">
    </StateToggle>

    <StateToggle v-if="hasAudioSensor" :states="audioActions" :state="device.audioDetected">
    </StateToggle>

    <StateToggle v-if="hasOccupancySensor" :states="occupancyActions" :state="device.occupied">
    </StateToggle>

    <StateToggle v-if="hasEntrySensor" :states="entrySensorActions" :state="device.entryOpen">
    </StateToggle>

    <StateToggle v-if="hasBinarySensor" :states="binarySensorActions" :state="device.binaryState">
    </StateToggle>

    <StateToggle v-if="hasBattery" :states="batteryActions" :state="device.batteryLevel">
    </StateToggle>

    <StateToggle v-if="hasOnOff" :states="onOffActions" :state="device.on"
      :name="device.type === ScryptedDeviceType.Camera ? 'Indicator Light' : device.type"></StateToggle>

    <StateToggle v-if="hasLock" :states="lockActions" :state="device.lockState" :name="device.type"></StateToggle>

    <StateToggle v-if="hasStartStop" :states="startStopActions"
      :state="hasPause && device.paused ? 'pause' : (device.running ? 'start' : 'stop')" :name="device.type">
    </StateToggle>

    <StateToggle v-if="hasPtz" :states="ptzActions" :state="null" name="Pan/Tilt/Zoom"></StateToggle>

    <StateToggle v-if="hasPressButtons" :states="pressButtons" :state="null" name="Buttons"></StateToggle>
  </v-card>
</template>
<script setup lang="ts">
import { getDeviceFromId } from '@/util/id-device';
import { Battery, BinarySensor, EntrySensor, Lock, LockState, MotionSensor, OccupancySensor, OnOff, PanTiltZoom, Pause, PressButtons, ScryptedDeviceType, ScryptedInterface, StartStop, Buttons, AudioSensor } from '@scrypted/types';
import { computed } from 'vue';
import StateToggle from './StateToggle.vue';
import { getFaPrefix } from '@/util/device-icons';
import { connectedClient } from '../../../common/client';

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<OnOff & Lock & StartStop & Pause & PanTiltZoom & MotionSensor & BinarySensor & Battery & EntrySensor & OccupancySensor & Buttons & PressButtons & AudioSensor>(() => props.id);

const hasAudioSensor = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.AudioSensor);
});

const audioActions = computed(() => {
  if (device.value.audioDetected) {
    return [
      {
        name: 'Noise Detected',
        icon: 'fa-volume-high',
        value: true,
        click: () => { },
        disabled: true,
      }
    ];
  }

  return [
    {
      name: 'No Noise Detected',
      icon: 'fa-volume-low',
      value: undefined,
      // default: true,
      click: () => { },
      disabled: true,
    },
  ]
});

const hasMotionSensor = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.MotionSensor);
});

const motionActions = computed(() => {
  if (device.value.motionDetected) {
    return [
      {
        name: 'Motion',
        icon: 'fa-wind',
        value: true,
        click: () => { },
        disabled: true,
      }
    ];
  }

  return [
    {
      name: 'No Motion',
      icon: 'fa-empty-set',
      value: undefined,
      // default: true,
      click: () => { },
      disabled: true,
    },
  ]
});

const hasOccupancySensor = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.OccupancySensor);
});

const occupancyActions = computed(() => {
  if (device.value.occupied) {
    return [
      {
        name: 'Occupied',
        icon: 'fa-user',
        value: true,
        click: () => { },
        disabled: true,
      }
    ];
  }

  return [
    {
      name: 'Vacant',
      icon: 'fa-user-slash',
      value: undefined,
      // default: true,
      click: () => { },
      disabled: true,
    },
  ]
});

const hasBinarySensor = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.BinarySensor);
});

const binarySensorActions = computed(() => {
  if (device.value.binaryState) {
    return [
      {
        name: device.value?.type === ScryptedDeviceType.Doorbell ? 'Ringing' : 'Active',
        icon: device.value?.type === ScryptedDeviceType.Doorbell ? 'fa-bell-ring' : 'fa-sensor-on',
        value: true,
        click: () => { },
        disabled: true,
      }
    ];
  }

  return [
    {
      name: device.value?.type === ScryptedDeviceType.Doorbell ? 'Not Ringing' : 'Idle',
      icon: device.value?.type === ScryptedDeviceType.Doorbell ? 'fa-bell' : 'fa-sensor',
      value: undefined,
      click: () => { },
      disabled: true,
    },
  ];
});

const hasEntrySensor = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.EntrySensor);
});

const entrySensorActions = computed(() => {
  if (device.value.entryOpen === 'jammed') {
    return [
      {
        name: 'Jammed',
        icon: 'fa-traffic-cone',
        value: undefined as any,
        click: () => { },
        disabled: true,
        color: 'error',
      }
    ];
  }

  if (device.value.entryOpen) {
    return [
      {
        name: 'Opened',
        icon: 'fa-door-open',
        value: undefined as any,
        click: () => { },
        disabled: true,
      }
    ];
  }

  return [
    {
      name: 'Closed',
      icon: 'fa-door-closed',
      value: undefined,
      click: () => { },
      disabled: true,
    },
  ];
});

const hasBattery = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.Battery);
});

const batteryActions = computed(() => {
  return [
    {
      name: `${device.value.batteryLevel || 0}%`,
      icon: 'fa-battery-full',
      value: undefined as any,
      click: () => { },
      disabled: true,
    }
  ];
});

const hasOnOff = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.OnOff);
});

const onOffActions = computed(() => [
  {
    name: 'Off',
    icon: 'fa-toggle-off',
    value: false,
    default: true,
    click: () => device.value.turnOff(),
  },
  {
    name: 'On',
    icon: 'fa-toggle-on',
    value: true,
    click: () => device.value.turnOn(),
  },
]);

const hasLock = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.Lock);
});
const lockActions = computed(() => [
  {
    name: 'Lock',
    icon: 'fa-lock',
    value: LockState.Locked,
    click: () => device.value.lock(),
  },
  {
    name: 'Unlock',
    icon: 'fa-lock-open',
    value: LockState.Unlocked,
    default: true,
    click: () => device.value.unlock(),
  },
  {
    name: 'Jammed',
    icon: 'fa-circle-exclamation',
    value: LockState.Jammed,
    color: 'error',
  },
]);

const hasStartStop = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.StartStop);
});

const startStopActions = computed(() => {
  const ret = [
    {
      name: 'Stop',
      icon: 'fa-stop',
      value: 'stop',
      default: true,
      click: () => device.value.stop(),
    },
    {
      name: 'Start',
      icon: 'fa-play',
      value: 'start',
      click: () => device.value.start(),
    },
  ];


  if (hasPause.value) {
    ret.push(
      {
        name: 'Pause',
        icon: 'fa-circle-pause',
        value: 'pause',
        click: () => device.value.pause(),
      },
      {
        name: 'Resume',
        icon: 'fa-circle-play',
        value: 'resume',
        click: () => device.value.resume(),
      });
  }

  return ret;
});

const hasPause = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.Pause);
});


const hasPtz = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.PanTiltZoom);
});


const hasPressButtons = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.PressButtons);
});

const ptzActions = computed(() => {
  // this is actually stateless, but we want the buttons to never be active.
  const ret = [
    ...device.value.ptzCapabilities?.tilt ? [
      {
        name: 'Up',
        icon: 'fa-arrow-up',
        value: 'up',
        click: () => device.value.ptzCommand({
          tilt: .1,
        }),
      },
      {
        name: 'Down',
        icon: 'fa-arrow-down',
        value: 'down',
        click: () => device.value.ptzCommand({
          tilt: -.1,
        }),
      },
    ] : [],
    ...device.value.ptzCapabilities?.pan ? [
      {
        name: 'Left',
        icon: 'fa-arrow-left',
        value: 'left',
        click: () => device.value.ptzCommand({
          pan: -.1,
        }),
      },
      {
        name: 'Right',
        icon: 'fa-arrow-right',
        value: 'right',
        click: () => device.value.ptzCommand({
          pan: .1,
        }),
      }
    ] : [],
    ...device.value.ptzCapabilities?.zoom ? [
      {
        name: 'Zoom In',
        icon: 'fa-search-plus',
        value: 'zoomin',
        click: () => device.value.ptzCommand({
          zoom: .1,
        }),
      },
      {
        name: 'Zoom Out',
        icon: 'fa-search-minus',
        value: 'zoomout',
        click: () => device.value.ptzCommand({
          zoom: -.1,
        }),
      }] : [],
  ];

  return ret;
});

const pressButtons = computed(() => {
  console.log(connectedClient.value.systemManager.getSystemState()[device.value.id]);
  console.log('buttons', device.value.buttons);

  return (device.value.buttons || []).map(buttonId => {
    return {
      name: buttonId,
      icon: 'fa-power-off',
      value: buttonId,
      click: () => device.value.pressButton(buttonId),
    }
  });
});

const show = computed(() =>
  hasOnOff.value || hasLock.value || hasStartStop.value
  || hasPtz.value || hasMotionSensor.value || hasBinarySensor.value || hasAudioSensor.value
  || hasOccupancySensor.value
  || hasPressButtons.value
);
</script>
