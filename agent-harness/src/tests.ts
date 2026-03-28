export interface TestCase {
  name: string;
  description: string;
  request: string;
  expectedInterfaces: string[];
  expectedPattern: RegExp[];
}

export const TEST_CASES: TestCase[] = [
  {
    name: 'Simple Switch',
    description: 'Basic OnOff implementation with console logging',
    request: `Create a Scrypted script that acts as a simple switch. 

Requirements:
- Implement the OnOff interface
- When turned on, log "Switch ON" to the console
- When turned off, log "Switch OFF" to the console
- Set the device type to Switch after initialization
- Use the default export pattern

Save the script as "simple-switch.ts".`,
    expectedInterfaces: ['OnOff'],
    expectedPattern: [
      /extends ScryptedDeviceBase/,
      /implements OnOff/,
      /turnOn\s*\(/,
      /turnOff\s*\(/,
      /export default/,
    ],
  },
  {
    name: 'Device Toggle',
    description: 'Switch that toggles another device with settings',
    request: `Create a Scrypted script that toggles another device when activated.

Requirements:
- Implement OnOff and Settings interfaces
- Settings: targetDevice (choose an OnOff device to control)
- When this switch turns ON: toggle the target device (if on, turn off; if off, turn on)
- After toggling, reset this switch back to OFF after 1 second
- Set device type to Switch
- Store settings in this.storage

Save the script as "device-toggle.ts".`,
    expectedInterfaces: ['OnOff', 'Settings'],
    expectedPattern: [
      /extends ScryptedDeviceBase/,
      /implements (OnOff|Settings)/,
      /getSettings\s*\(/,
      /putSetting\s*\(/,
      /systemManager\.getDeviceById/,
      /setTimeout/,
    ],
  },
  {
    name: 'Motion Light Automation',
    description: 'Event-driven automation that turns light on with motion, off after timeout',
    request: `Create a Scrypted script that controls a light based on motion detection.

Requirements:
- Settings for: motion sensor (MotionSensor device), light (OnOff device), duration (number, default 60 seconds)
- Listen for motion events on the selected motion sensor
- When motion is detected: turn on the light
- When motion clears: wait for the configured duration, then turn off the light
- If motion is detected again during the delay, cancel the turn-off timer
- Use the event listener pattern with device.listen()
- Clean up listeners when settings change

Save the script as "motion-light.ts".`,
    expectedInterfaces: ['Settings'],
    expectedPattern: [
      /extends ScryptedDeviceBase/,
      /\.listen\s*\(/,
      /MotionSensor/,
      /motionDetected/,
      /setTimeout/,
      /clearTimeout/,
      /turnOn|\.on\s*=/,
      /turnOff/,
    ],
  },
  {
    name: 'Notifier Suppressor Mixin',
    description: 'Mixin that suppresses notifications when disabled',
    request: `Create a Scrypted script that acts as a notification suppressor using the mixin pattern.

Requirements:
- The script itself is a switch (OnOff interface)
- Implement MixinProvider to apply to Notifier devices
- When switch is ON: notifications pass through normally
- When switch is OFF: notifications are suppressed (blocked)
- Use MixinDeviceBase for the mixin wrapper class
- canMixin should only accept devices that have the Notifier interface
- getMixin returns the wrapped notifier that checks the switch state

Save the script as "notifier-suppressor.ts".`,
    expectedInterfaces: ['MixinProvider', 'OnOff'],
    expectedPattern: [
      /extends MixinDeviceBase/,
      /extends ScryptedDeviceBase/,
      /implements.*MixinProvider/,
      /implements.*OnOff/,
      /canMixin\s*\(/,
      /getMixin\s*\(/,
      /releaseMixin\s*\(/,
      /sendNotification/,
      /\.mixinProvider/,
      /\.mixinDevice/,
    ],
  },
  {
    name: 'Camera Motion Light Loop Prevention',
    description: 'Camera motion triggers light but prevents self-triggering loop',
    request: `Create a Scrypted script that turns on a light when a camera detects motion and turns it off when motion ends, WITH LOOP PREVENTION.

The problem: When the light turns off, the sudden brightness change can trigger the camera's motion sensor again, causing an infinite loop.

Requirements:
- Settings: camera (VideoCamera/MotionSensor), light (OnOff), cooldownSeconds (number, default 30)
- When camera motion is detected: turn on the light
- When camera motion ends: wait for a delay, then turn off the light
- CRITICAL: After turning the light OFF, ignore motion events from the camera for the cooldown period
- Track the cooldown state (either via timestamps or a boolean flag with timeout)
- Log when motion events are ignored due to cooldown

Save the script as "camera-motion-light.ts".`,
    expectedInterfaces: ['Settings'],
    expectedPattern: [
      /extends ScryptedDeviceBase/,
      /getSettings\s*\(/,
      /putSetting\s*\(/,
      /\.listen\s*\(/,
      /motionDetected|MotionSensor/,
      /cooldown/i,
      /setTimeout/,
      /turnOn|\.on\s*=/,
      /turnOff/,
      /clearTimeout/,
    ],
  },
  {
    name: 'Scene Controller',
    description: 'Activate multiple devices as a scene',
    request: `Create a Scrypted script that acts as a scene controller to control multiple devices at once.

Requirements:
- Implement OnOff and Settings interfaces
- Settings: devices (multiple device selection, filter to OnOff devices)
- When turned ON: turn on all configured devices
- When turned OFF: turn off all configured devices
- Use Promise.all for concurrent device control
- Handle missing devices gracefully (log warning, continue)
- Set device type to Scene

Save the script as "scene-controller.ts".`,
    expectedInterfaces: ['OnOff', 'Settings'],
    expectedPattern: [
      /extends ScryptedDeviceBase/,
      /implements (OnOff|Settings)/,
      /getSettings\s*\(/,
      /putSetting\s*\(/,
      /multiple:\s*true/,
      /deviceFilter.*OnOff/,
      /Promise\.all/,
      /turnOn/,
      /turnOff/,
      /ScryptedDeviceType\.Scene/,
    ],
  },
  {
    name: 'State Synchronizer',
    description: 'Mirror state between two devices',
    request: `Create a Scrypted script that synchronizes the on/off state between two devices.

Requirements:
- Settings: sourceDevice (OnOff device), targetDevice (OnOff device)
- Listen for state changes on the source device
- When source changes, update target to match
- Use the 'denoise' option when listening to only get actual state changes
- Handle the case where devices are the same (log warning, do nothing)
- Set device type to Automation
- Log sync actions

Save the script as "state-synchronizer.ts".`,
    expectedInterfaces: ['Settings'],
    expectedPattern: [
      /extends ScryptedDeviceBase/,
      /getSettings\s*\(/,
      /putSetting\s*\(/,
      /\.listen\s*\(/,
      /denoise:\s*true/,
      /ScryptedInterface\.OnOff/,
      /systemManager\.getDeviceById/,
      /turnOn|turnOff|\.on\s*=/,
    ],
  },
  {
    name: 'Battery Monitor',
    description: 'Monitor battery levels and send alert when low',
    request: `Create a Scrypted script that monitors battery levels of devices and logs warnings when low.

Requirements:
- Settings: devices (multiple, filter to Battery interface), threshold (number, default 20)
- Poll battery levels every 5 minutes using setInterval
- When any device's battery level drops below threshold, log a warning: "Low battery on [device name]: [level]%"
- List all monitored devices in settings (show current battery levels in setting values)
- Set device type to Sensor
- Clean up interval in constructor or when settings change

Save the script as "battery-monitor.ts".`,
    expectedInterfaces: ['Settings'],
    expectedPattern: [
      /extends ScryptedDeviceBase/,
      /getSettings\s*\(/,
      /putSetting\s*\(/,
      /setInterval/,
      /Battery/,
      /batteryLevel/,
      /threshold/,
      /console\.(warn|log|info)/,
      /deviceFilter/,
      /ScryptedDeviceType\.Sensor/,
    ],
  },
  {
    name: 'Brightness Ramp',
    description: 'Gradually ramp brightness up or down',
    request: `Create a Scrypted script that creates a brightness ramp effect for lights.

Requirements:
- Implement OnOff and Settings interfaces
- Settings: light (Brightness device), rampDuration (number, default 5 seconds)
- When turned ON: ramp brightness from 0 to 100 over the configured duration
- When turned OFF: ramp brightness from current level down to 0
- Use setInterval to update brightness in small steps
- Clean up any running ramp when starting a new one
- Store configuration in this.storage

Save the script as "brightness-ramp.ts".`,
    expectedInterfaces: ['OnOff', 'Settings'],
    expectedPattern: [
      /extends ScryptedDeviceBase/,
      /implements (OnOff|Settings)/,
      /getSettings\s*\(/,
      /putSetting\s*\(/,
      /Brightness/,
      /setBrightness/,
      /setInterval/,
      /clearInterval/,
      /brightness/,
      /deviceFilter.*Brightness/,
    ],
  },
  {
    name: 'Person Detection Light',
    description: 'Turn on light when person detected, handling per-frame detections',
    request: `Create a Scrypted script that turns on a light when a person is detected by a camera.

IMPORTANT: Cameras with object detection emit detection events for every frame where an object is seen. This means if a person stands in front of the camera for 10 seconds at 15fps, you could receive 150 detection events with className 'person'. Turning on a light 150 times is unnecessary and wasteful.

Requirements:
- Settings: camera (ObjectDetector device), light (OnOff device)
- Listen for ObjectsDetected events on the camera
- When a detection event contains a 'person' className: turn on the light
- Use cooldown/tracking to avoid repeatedly turning on the light for the same person:
  - Either track if the light is already on (check this.on or the light's state)
  - Or use a timeout/cooldown after the first detection
- When no person is detected for a period (e.g., 30 seconds), turn off the light
- Log when detections occur (but not spammy - use cooldown or state checks)
- Clean up timers and listeners properly

Save the script as "person-detection-light.ts".`,
    expectedInterfaces: ['Settings'],
    expectedPattern: [
      /extends ScryptedDeviceBase/,
      /getSettings\s*\(/,
      /putSetting\s*\(/,
      /\.listen\s*\(/,
      /ObjectDetector|ObjectsDetected/,
      /person/,
      /setTimeout|setInterval/,
      /turnOn|\.on\s*=/,
      /turnOff/,
      /clearTimeout|clearInterval/,
    ],
  },
  {
    name: 'Intercom Sound Player',
    description: 'Play sound file/URL through Intercom device with proper FFmpeg streaming',
    request: `Create a Scrypted script that plays a sound file through an Intercom device when turned on.

Requirements:
- Implement OnOff and Settings interfaces
- Settings: intercom (Intercom device), soundUrl (string, URL to mp3/wav file), duration (number, seconds to wait before auto-off)
- When turned ON: play the sound file through the intercom
- Use mediaManager.createFFmpegMediaObject() to create the audio stream
- CRITICAL: Include '-re' flag BEFORE '-i' in inputArguments so ffmpeg streams at realtime rate
  (Without '-re', ffmpeg reads the file instantly as fast as possible, which breaks intercom playback)
- Store playback state (this.on should reflect playing state)
- After the configured duration, automatically turn off and stop intercom
- When turned OFF during playback: call stopIntercom() immediately
- Handle cleanup properly (stop intercom, clear timers)

Save the script as "intercom-player.ts".`,
    expectedInterfaces: ['OnOff', 'Settings'],
    expectedPattern: [
      /extends ScryptedDeviceBase/,
      /implements (OnOff|Settings)/,
      /Intercom/,
      /startIntercom/,
      /stopIntercom/,
      /createFFmpegMediaObject/,
      /inputArguments/,
      /-re/,
      /getSettings|putSetting/,
      /setTimeout|clearTimeout/,
    ],
  },
];
