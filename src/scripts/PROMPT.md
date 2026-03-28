# Creating Scrypted Scripts

Scripts are a lightweight, user-editable way to add automations, devices, and features to Scrypted. They are written in TypeScript and run directly in the Scrypted runtime.

## Key Differences from Plugins

- **No npm dependencies** - Scripts cannot install or import npm packages
- **Built-in modules only** - Use `require()` for Node.js built-in modules (e.g., `fs`, `os`, `http`, `crypto`, `child_process`)
- **Automatic compilation** - TypeScript is compiled automatically when saved
- **Single file** - Each script is a single TypeScript file

## CRITICAL: No Imports Needed

**All types, classes, and globals are automatically available in the script context. DO NOT use import statements.**

```typescript
// ❌ WRONG - Do NOT import anything
import { ScryptedDeviceBase, OnOff } from '@scrypted/sdk';

// ✓ CORRECT - Types are available globally, just use them
export default class MySwitch extends ScryptedDeviceBase implements OnOff {
    // ...
}
```

The following are available **without import**:
- Classes: `ScryptedDeviceBase`, `MixinDeviceBase`, `StorageSettings`
- Enums: `ScryptedInterface`, `ScryptedDeviceType`, `ScryptedMimeTypes`, `LockState`
- Interfaces: `OnOff`, `Brightness`, `Notifier`, `Settings`, `MotionSensor`, `Camera`, `VideoCamera`, `PanTiltZoom`, `MediaPlayer`, `StartStop`, `Lock`, `Entry`, `Scene`, `MixinProvider`, `BinarySensor`, `Thermometer`, `HumiditySensor`, and all others listed below
- Globals: `sdk`, `systemManager`, `deviceManager`, `mediaManager`, `endpointManager`, `console`, `device`, `localStorage`

## Core Concepts

### What is a Device?

In Scrypted, everything is a **Device**. A device represents any entity that can be controlled, monitored, or interacted with. This includes:

- Physical hardware (lights, cameras, sensors, locks)
- Virtual/software devices (scripts, automations, notifiers)
- Services (APIs, webhooks, cloud integrations)

Every device has:
- **id** - Unique identifier
- **name** - User-visible name
- **type** - Device category (Light, Switch, Camera, etc.)
- **interfaces** - Capabilities the device supports (OnOff, Brightness, etc.)
- **state** - Current values (on/off status, brightness level, etc.)

### Interfaces Define Capabilities

Scrypted uses **interfaces** to define what a device can do. Interfaces are like capability contracts - a device "implements" an interface by providing specific methods and properties.

**Common Interfaces:**

| Interface | Methods | Properties | Purpose |
|-----------|---------|------------|---------|
| `OnOff` | `turnOn()`, `turnOff()` | `on` | Binary switch control |
| `Brightness` | `setBrightness(n)` | `brightness` | Dimming (0-100) |
| `Camera` | `takePicture()` | - | Taking snapshots |
| `VideoCamera` | `getVideoStream()` | `videoStreamOptions` | Live streams |
| `Notifier` | `sendNotification()` | - | Push notifications |
| `MotionSensor` | - | `motionDetected` | Motion detection events |
| `Settings` | `getSettings()`, `putSetting()` | - | Configuration UI |

**A single device can implement multiple interfaces:**

```typescript
// A dimmable light implements both OnOff and Brightness
class DimmableLight extends ScryptedDeviceBase implements OnOff, Brightness {
    // OnOff methods
    turnOn() { this.on = true; }
    turnOff() { this.on = false; }
    
    // Brightness method
    setBrightness(level: number) { this.brightness = level; }
}
```

### Device Types

The `type` property indicates the device category. This affects how the device appears in the UI and which platforms it syncs to:

```typescript
ScryptedDeviceType.Switch      // Basic toggle
ScryptedDeviceType.Light       // Lighting device
ScryptedDeviceType.Camera      // Camera
ScryptedDeviceType.Sensor      // Sensor
ScryptedDeviceType.Notifier    // Notification service
ScryptedDeviceType.Doorbell    // Video doorbell
```

**Type vs Interface:** The type is cosmetic/UI-focused, while interfaces define actual functionality. A device might be type `Camera` but implement `OnOff` to control a built-in light.

### State Management

Device state flows through properties on `this`:

```typescript
// Reading state reads from Scrypted's state manager
const isOn = this.on;        // Gets current value

// Writing state updates Scrypted and fires events
this.on = true;              // → Triggers OnOff event
this.brightness = 75;        // → Triggers Brightness event
```

**State Changes Propagate:**
1. You set a property: `this.on = true`
2. Scrypted stores the value
3. Event listeners are notified
4. UI updates, HomeKit syncs, etc.

### Events and Listeners

Devices can listen to each other's events:

```typescript
const light = systemManager.getDeviceById<OnOff>('light-id');

// Listen for OnOff changes
const listener = light.listen(ScryptedInterface.OnOff, (source, details, value) => {
    console.log('Light is now:', value ? 'ON' : 'OFF');
});

// Always clean up listeners when done
listener.removeListener();
```

**Event Data Types:**

| Interface | Event Data |
|-----------|------------|
| `OnOff` | `boolean` - true/false |
| `Brightness` | `number` - 0-100 |
| `MotionSensor` | `boolean` - motion detected/cleared |
| `BinarySensor` | `boolean` - triggered/cleared |
| `Camera` | `MediaObject` - captured image |

### Mixins: Extending Other Devices

**Mixins are one of Scrypted's most powerful features.** They allow your script to "wrap" or "extend" other devices, adding or modifying their behavior.

**Use Cases:**
- Add notification filtering to any notifier
- Add logging to device actions
- Transform or reroute commands
- Add safety checks before actions
- Bridge protocols

**How Mixins Work:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Scrypted System                         │
│                                                             │
│  When a device is accessed, check if mixins are applied:    │
│                                                             │
│  Original Device (e.g., Pushover Notifier)                  │
│           ↓                                                 │
│  Mixin 1: Notification Filter (your script)                 │
│           ↓                                                 │
│  External caller (HomeKit, NVR, Automation)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Mixin Flow:**

1. Your script implements `MixinProvider` interface
2. User enables your mixin on a target device (in device settings)
3. Scrypted calls `canMixin(type, interfaces)` - should this mixin apply?
4. Scrypted calls `getMixin(device, interfaces, state)` - return wrapper object
5. Your wrapper intercepts calls and can modify/forward/pass-through
6. When mixin is removed, `releaseMixin()` is called

**Example - Notification Suppressor:**

```typescript
// Target device: Pushover, Scrypted NVR, etc.
// Your mixin: NotificationFilter (suppresses notifications when disabled)

class NotificationFilterMixin extends MixinDeviceBase<Notifier> implements Notifier {
    constructor(
        public mixinProvider: NotificationFilter,  // Your script
        options: MixinDeviceOptions<Notifier>      // Target device info
    ) {
        super(options);
    }

    // Intercept sendNotification
    async sendNotification(title: string, options?: NotifierOptions, media?: MediaObject | string, icon?: MediaObject | string): Promise<void> {
        // Check parent script's state
        if (!this.mixinProvider.notificationsEnabled) {
            this.console.warn('Blocked notification:', title);
            return;  // Suppress!
        }
        
        // Pass through to original device
        return this.mixinDevice.sendNotification(title, options, media, icon);
    }
}

export default class NotificationFilter extends ScryptedDeviceBase implements MixinProvider, OnOff {
    notificationsEnabled = true;

    constructor(nativeId: ScryptedNativeId) {
        super(nativeId);
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
            device.on = true;
        });
    }

    async turnOn() { this.notificationsEnabled = true; this.on = true; }
    async turnOff() { this.notificationsEnabled = false; this.on = false; }

    // Called by Scrypted: "Should this mixin apply to this device?"
    async canMixin(type: ScryptedDeviceType, interfaces: string[]): Promise<string[]> {
        // Only apply to devices that have the Notifier interface
        if (!interfaces.includes(ScryptedInterface.Notifier)) {
            return;  // Return nothing = don't apply
        }
        // Return list of interfaces we're providing (same as original)
        return [ScryptedInterface.Notifier];
    }

    // Called by Scrypted: "Give me the wrapped device"
    async getMixin(mixinDevice: any, mixinDeviceInterfaces: ScryptedInterface[], mixinDeviceState: WritableDeviceState): Promise<any> {
        return new NotificationFilterMixin(this, {
            mixinDevice,              // The original device
            mixinDeviceInterfaces,    // Interfaces it has
            mixinDeviceState,         // Its state object
            mixinProviderNativeId: this.nativeId,
        });
    }

    // Called when mixin is removed
    async releaseMixin(id: string, mixinDevice: any): Promise<void> {
        // Cleanup if needed
    }
}
```

**Key Mixin Concepts:**

- `mixinProvider` = your script (the filter/controller)
- `mixinDevice` = the device being wrapped (the original implementation)
- `MixinDeviceBase` = base class that handles state passthrough
- You intercept method calls on matching interfaces
- Call `this.mixinDevice.method()` to pass through to original
- Return nothing to suppress/block an action

### Scripts vs Plugins vs Mixins

| | Scripts | Plugins | Mixins |
|---|---------|---------|--------|
| **Purpose** | Quick automations, virtual devices | Full integrations, drivers | Extend existing devices |
| **Dependencies** | Built-in modules only | Any npm package | Same as container |
| **Distribution** | Code paste | npm package | Part of script/plugin |
| **Complexity** | Simple to medium | Complex | Medium |
| **Best For** | Home automation, custom logic | Hardware integration, services | Behavior modification |

### The Script Device Itself

When you create a script, it becomes a device in Scrypted:

1. Save script → Device appears in Scrypted
2. Script runs → Device instance created
3. Implement interfaces → Device gets capabilities (OnOff, Settings, etc.)
4. Set device type → Determines how it appears in UI

```typescript
// Make your script appear as a Switch
setTimeout(() => {
    systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
});
```

### Script Lifecycle

1. **Load** - Script is compiled and instantiatied
2. **Constructor** - Initial setup, timers, event listeners
3. **Runtime** - Responds to method calls, events
4. **Settings Change** - Settings UI updated, listeners may be reset
5. **Unload** - Clean up timers, listeners (when script removed)

### Accessing Other Devices

```typescript
// Get device by ID (check Script settings URL for IDs)
const light = systemManager.getDeviceById<OnOff & Brightness>('device-id-here');

// Get device by name
const camera = systemManager.getDeviceByName<VideoCamera>('Front Door Camera');

// Type assertion for interface access
const door = systemManager.getDeviceById('door-id') as ScryptedDevice & Lock;
await door.lock();
```

## Available Globals

The following are automatically available in the script context:

```typescript
// SDK
sdk                           // The full Scrypted SDK object
systemManager: SystemManager  // Find and interact with devices
deviceManager: DeviceManager  // Device lifecycle and storage
mediaManager: MediaManager    // Media object handling
endpointManager: any              // (reserved for future use)

// Base classes
ScryptedDeviceBase            // Base class for scripts
MixinDeviceBase               // Base class for mixins
StorageSettings               // Helper for managing settings

// Enums
ScryptedInterface             // Interface identifiers (e.g., ScryptedInterface.OnOff)
ScryptedDeviceType            // Device types (e.g., ScryptedDeviceType.Switch)
ScryptedMimeTypes             // MIME type constants

// Instance references
device                        // The script device instance
console                       // Script console (logs to device Log panel)
localStorage                  // Alias for device storage
log                           // Device logger (log.i, log.w, log.e)

// Node.js
require                       // Import built-in Node.js modules only
```

## Script Structure

All scripts follow this pattern:

```typescript
export default class MyScript extends ScryptedDeviceBase implements OnOff {
    constructor(nativeId: ScryptedNativeId) {
        super(nativeId);
        // Set device type after initialization
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
            if (device.on === undefined) {
                device.on = false;
            }
        });
    }

    async turnOn(): Promise<void> {
        this.on = true;
        this.console.info("Switch turned on");
    }

    async turnOff(): Promise<void> {
        this.on = false;
        this.console.info("Switch turned off");
    }
}
```

### Export Patterns

Scripts can export:
- A class (instantiated with `nativeId`)
- A function (executed immediately)
- An object

```typescript
// Class pattern (most common)
export default class MyDevice extends ScryptedDeviceBase implements OnOff {
    // ...
}

// Function pattern (for one-time automations)
export default async function() {
    const light = systemManager.getDeviceById('light-id');
    await light.turnOn();
}
```

## Device State

Access and modify device state through properties on `this`:

```typescript
// Reading state
const isOn = this.on;           // OnOff interface
const brightness = this.brightness; // Brightness interface

// Writing state (triggers events)
this.on = true;
this.brightness = 50;

// The 'device' global also works
device.on = true;
```

## Storage

Use `this.storage` (a Web `Storage` interface) for persistent data:

```typescript
// Store values
this.storage.setItem('myKey', 'value');
this.storage.setItem('config', JSON.stringify({ foo: 'bar' }));

// Retrieve values
const value = this.storage.getItem('myKey');
const config = JSON.parse(this.storage.getItem('config') || '{}');

// Remove values
this.storage.removeItem('myKey');

// Clear all
this.storage.clear();
```

## Logging

Use `this.console` or `console` to log to the device's Log panel:

```typescript
this.console.log('Info message');
this.console.info('Info message');
this.console.warn('Warning message');
this.console.error('Error message');

// Or use the global console
console.log('Also works');
```

## Settings

Implement `Settings` interface to provide a configuration UI:

```typescript
export default class MyDevice extends ScryptedDeviceBase implements Settings, OnOff {
    async getSettings(): Promise<Setting[]> {
        return [
            {
                key: 'targetDevice',
                title: 'Target Device',
                description: 'Select a device to control',
                type: 'device',
                value: this.storage.getItem('targetDevice'),
                deviceFilter: `interfaces.includes("${ScryptedInterface.OnOff}")`,
            },
            {
                key: 'duration',
                title: 'Duration (seconds)',
                type: 'number',
                value: this.storage.getItem('duration') || '10',
            },
            {
                key: 'enabled',
                title: 'Enabled',
                type: 'boolean',
                value: this.storage.getItem('enabled') === 'true',
            },
            {
                key: 'mode',
                title: 'Mode',
                choices: ['auto', 'manual', 'off'],
                value: this.storage.getItem('mode') || 'auto',
            },
        ];
    }

    async putSetting(key: string, value: SettingValue): Promise<void> {
        this.storage.setItem(key, value?.toString());
        this.onDeviceEvent(ScryptedInterface.Settings, undefined);
    }
}
```

### Settings Types

- `string` - Text input
- `password` - Password field (masked)
- `number` / `integer` - Numeric input
- `boolean` - Toggle switch
- `device` - Device picker (use `deviceFilter` to filter)
- `button` - Action button
- `textarea` - Multi-line text
- `clippath` - Clipping path editor
- `date` / `time` / `datetime` - Date/time pickers

### Multiple Device Selection

```typescript
{
    key: 'cameras',
    title: 'Cameras',
    type: 'device',
    multiple: true,
    deviceFilter: `interfaces.includes("${ScryptedInterface.VideoCamera}")`,
    value: this.getJSON('cameras'),
}
```

## Using StorageSettings Helper

The `StorageSettings` class simplifies settings management:

```typescript
export default class MyDevice extends ScryptedDeviceBase implements Settings {
    storageSettings = new StorageSettings(this, {
        targetDevice: {
            title: 'Target Device',
            type: 'device',
            deviceFilter: `interfaces.includes("${ScryptedInterface.OnOff}")`,
            onPut: () => this.updateDevice(), // Callback when changed
        },
        duration: {
            title: 'Duration',
            type: 'number',
            defaultValue: 10,
        },
        unit: {
            title: 'Temperature Unit',
            choices: ['C', 'F'],
            defaultValue: 'C',
        },
    });

    async getSettings(): Promise<Setting[]> {
        return this.storageSettings.getSettings();
    }

    async putSetting(key: string, value: SettingValue): Promise<void> {
        return this.storageSettings.putSetting(key, value);
    }

    // Access values
    someMethod() {
        const device = this.storageSettings.values.targetDevice;
        const duration = this.storageSettings.values.duration;
    }
}
```

## Finding Devices

Use `systemManager` to find and interact with other devices:

```typescript
// By ID
const device = systemManager.getDeviceById('device-id');
const light = systemManager.getDeviceById<OnOff & Brightness>('light-id');

// By name
const camera = systemManager.getDeviceByName('Front Door Camera');

// Get all device states
const allDevices = systemManager.getSystemState();
```

## Automation Patterns

### Event Listeners

Listen for device events:

```typescript
// Listen on a specific device
const light = systemManager.getDeviceById<OnOff>('light-id');
const listener = light.listen(ScryptedInterface.OnOff, (source, details, data) => {
    console.log('Light state:', data);
    // data is the new on/off state
});

// Remove listener when done
listener.removeListener();

// Listen for motion
const motionSensor = systemManager.getDeviceById<MotionSensor>('motion-id');
motionSensor.listen(ScryptedInterface.MotionSensor, (source, details, eventData) => {
    if (eventData === true) {
        console.log('Motion detected!');
    }
});

// Listen on any device (system-wide)
systemManager.listen((source, details, data) => {
    console.log('Event from', source?.name, details.eventInterface, data);
});
```

### DENOISE Option

Only trigger on actual state changes:

```typescript
const listener = device.listen({
    event: ScryptedInterface.OnOff,
    denoise: true,  // Only fires on change
}, (source, details, data) => {
    console.log('State changed to:', data);
});
```

### WATCH Mode

Passively observe without polling:

```typescript
const listener = device.listen({
    event: ScryptedInterface.OnOff,
    watch: true,  // Passive, won't trigger polling
}, (source, details, data) => {
    console.log('Observed:', data);
});
```

### Timers and Intervals

```typescript
// One-time timer
const timeout = setTimeout(() => {
    console.log('Delayed action');
}, 5000);

// Clear if needed
clearTimeout(timeout);

// Repeating interval
const interval = setInterval(() => {
    console.log('Periodic check');
}, 60000); // Every minute

// Clear when done
clearInterval(interval);
```

### Common Automation Example

```typescript
export default class MotionLightAutomation extends ScryptedDeviceBase implements Settings {
    private motionListener: EventListenerRegister;
    private timeout: any;
    
    storageSettings = new StorageSettings(this, {
        motionSensor: {
            title: 'Motion Sensor',
            type: 'device',
            deviceFilter: `interfaces.includes("${ScryptedInterface.MotionSensor}")`,
        },
        light: {
            title: 'Light',
            type: 'device',
            deviceFilter: `interfaces.includes("${ScryptedInterface.OnOff}")`,
        },
        duration: {
            title: 'Duration (seconds)',
            type: 'number',
            defaultValue: 60,
        },
    });

    constructor(nativeId: ScryptedNativeId) {
        super(nativeId);
        this.setupListener();
    }

    private setupListener() {
        this.motionListener?.removeListener();
        
        const sensor = this.storageSettings.values.motionSensor as ScryptedDevice & MotionSensor;
        if (!sensor) return;

        this.motionListener = sensor.listen(ScryptedInterface.MotionSensor, async (source, details, motionDetected) => {
            if (motionDetected) {
                clearTimeout(this.timeout);
                const light = this.storageSettings.values.light as ScryptedDevice & OnOff;
                await light?.turnOn();
            } else {
                this.timeout = setTimeout(async () => {
                    const light = this.storageSettings.values.light as ScryptedDevice & OnOff;
                    await light?.turnOff();
                }, this.storageSettings.values.duration * 1000);
            }
        });
    }

    async getSettings(): Promise<Setting[]> {
        return this.storageSettings.getSettings();
    }

    async putSetting(key: string, value: SettingValue): Promise<void> {
        await this.storageSettings.putSetting(key, value);
        if (key === 'motionSensor') {
            this.setupListener();
        }
    }
}
```

## Interfaces Reference

### OnOff - Binary Switch

```typescript
interface OnOff {
    turnOn(): Promise<void>;
    turnOff(): Promise<void>;
    on?: boolean;  // Read/write state
}
```

### Brightness - Dimmable Light

```typescript
interface Brightness {
    setBrightness(brightness: number): Promise<void>;
    brightness?: number;  // 0-100
}
```

### ColorSettingRgb - RGB Light

```typescript
interface ColorSettingRgb {
    setRgb(r: number, g: number, b: number): Promise<void>;
    rgb?: { r: number, g: number, b: number };  // 0-255
}
```

### ColorSettingHsv - HSV Light

```typescript
interface ColorSettingHsv {
    setHsv(hue: number, saturation: number, value: number): Promise<void>;
    hsv?: { h: number, s: number, v: number };  // h: 0-360, s/v: 0-1
}
```

### ColorSettingTemperature - Color Temperature Light

```typescript
interface ColorSettingTemperature {
    setColorTemperature(kelvin: number): Promise<void>;
    colorTemperature?: number;
    getTemperatureMinK(): Promise<number>;
    getTemperatureMaxK(): Promise<number>;
}
```

### Notifier - Send Notifications

```typescript
interface Notifier {
    sendNotification(
        title: string, 
        options?: NotifierOptions, 
        media?: string | MediaObject, 
        icon?: string | MediaObject
    ): Promise<void>;
}

interface NotifierOptions {
    body?: string;
    subtitle?: string;
    image?: string;
    actions?: NotificationAction[];
    // ... more options
}
```

```typescript
export default class DiscordNotifier extends ScryptedDeviceBase implements Notifier, Settings {
    async sendNotification(title: string, options?: NotifierOptions, media?: string | MediaObject): Promise<void> {
        const webhook = this.storage.getItem('webhook');
        await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: options?.body || title }),
        });
    }
}
```

### PanTiltZoom - PTZ Camera Control

```typescript
interface PanTiltZoom {
    ptzCommand(command: PanTiltZoomCommand): Promise<void>;
}

interface PanTiltZoomCommand {
    pan?: number;    // -1 to 1 (-180° to 180°)
    tilt?: number;   // -1 to 1
    zoom?: number;   // -1 to 1
    // Absolute positioning:
    panDegrees?: number;
    tiltDegrees?: number;
    zoomMagnitude?: number;
}
```

```typescript
const camera = systemManager.getDeviceById<PanTiltZoom>('camera-id');
await camera.ptzCommand({ pan: 0.5 });  // Pan right
await camera.ptzCommand({ zoom: 0.1 }); // Zoom in slightly
```

### StartStop - Media Control

```typescript
interface StartStop {
    start(): Promise<void>;
    stop(): Promise<void>;
    running?: boolean;
}
```

### MediaPlayer - Media Playback

```typescript
interface MediaPlayer {
    load(media: string | MediaObject, options?: MediaPlayerLoadOptions): Promise<void>;
    play(): Promise<void>;
    pause(): Promise<void>;
    stop(): Promise<void>;
    seek(ms: number): Promise<void>;
    mediaStatus?: MediaStatus;
}
```

### Scene - Scene Activation

```typescript
interface Scene {
    activate(): Promise<void>;
    activateDeactivateScene?(deactivate: boolean): Promise<void>;
}
```

### Lock - Door Lock

```typescript
interface Lock {
    lock(): Promise<void>;
    unlock(): Promise<void>;
    lockState?: LockState;  // Locked, Unlocked, Jammed, Unsecured
}

enum LockState {
    Locked = 'Locked',
    Unlocked = 'Unlocked',
    Jammed = 'Jammed',
    Unsecured = 'Unsecured',
}
```

### Entry - Garage/Door

```typescript
interface Entry {
    open(): Promise<void>;
    close(): Promise<void>;
    entryState?: EntryState;
}
```

### BinarySensor / MotionSensor

```typescript
interface BinarySensor {
    binaryState?: boolean;
}

interface MotionSensor {
    motionDetected?: boolean;
}

// Listen for motion
motionSensor.listen(ScryptedInterface.MotionSensor, (source, details, detected) => {
    if (detected) console.log('Motion!');
});
```

### Thermometer / HumiditySensor

```typescript
interface Thermometer {
    temperature?: number;  // Celsius
    temperatureUnit?: TemperatureUnit;
}

interface HumiditySensor {
    humidity?: number;  // 0-100
}
```

### Camera / VideoCamera

```typescript
interface Camera {
    takePicture(options?: RequestPictureOptions): Promise<MediaObject>;
}

interface VideoCamera {
    getVideoStream(options?: RequestMediaStreamOptions): Promise<MediaObject>;
    getVideoStreamOptions(): Promise<ResponseMediaStreamOptions[]>;
}
```

### Intercom - Two-Way Audio

```typescript
interface Intercom {
    startIntercom(media: MediaObject): Promise<void>;
    stopIntercom(): Promise<void>;
    intercomActive?: boolean;
}
```

### VideoCameraMask - Privacy Masks

```typescript
interface VideoCameraMask {
    getPrivacyMasks(): Promise<PrivacyMaskSettings>;
    setPrivacyMasks(masks: PrivacyMaskSettings): Promise<void>;
}
```

### VideoTextOverlays - Camera Overlays

```typescript
interface VideoTextOverlays {
    getVideoTextOverlays(): Promise<{ [id: string]: VideoTextOverlay }>;
    setVideoTextOverlay(id: string, overlay: VideoTextOverlay): Promise<void>;
}
```

### Settings - Device Configuration

```typescript
interface Settings {
    getSettings(): Promise<Setting[]>;
    putSetting(key: string, value: SettingValue): Promise<void>;
}
```

### MixinProvider - Device Extensions

See the Mixin Pattern section below.

## Mixin Pattern

Mixins extend or intercept functionality of other devices. Use `MixinDeviceBase`:

```typescript
class NotifierFilterMixin extends MixinDeviceBase<Notifier> implements Notifier {
    constructor(
        public mixinProvider: NotifierFilter,
        options: MixinDeviceOptions<Notifier>
    ) {
        super(options);
    }

    async sendNotification(title: string, options?: NotifierOptions, media?: MediaObject | string, icon?: MediaObject | string): Promise<void> {
        // Intercept and filter
        if (!this.mixinProvider.enabled) {
            this.console.warn('Notification blocked:', title);
            return;
        }
        
        // Pass through to original device
        return this.mixinDevice.sendNotification(title, options, media, icon);
    }
}

export default class NotifierFilter extends ScryptedDeviceBase implements MixinProvider, OnOff {
    constructor(nativeId: ScryptedNativeId) {
        super(nativeId);
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
            if (device.on === undefined) device.on = true;
        });
    }

    async turnOff() { this.on = false; }
    async turnOn() { this.on = true; }

    async canMixin(type: ScryptedDeviceType, interfaces: string[]): Promise<string[]> {
        // Only apply to Notifier devices
        if (!interfaces.includes(ScryptedInterface.Notifier)) return;
        return [ScryptedInterface.Notifier];
    }

    async getMixin(mixinDevice: any, mixinDeviceInterfaces: ScryptedInterface[], mixinDeviceState: WritableDeviceState): Promise<any> {
        return new NotifierFilterMixin(this, {
            mixinDevice,
            mixinDeviceInterfaces,
            mixinDeviceState,
            mixinProviderNativeId: this.nativeId,
        });
    }

    async releaseMixin(id: string, mixinDevice: any): Promise<void> {
        // Cleanup if needed
    }
}
```

## Media Objects

Create and convert media objects using `mediaManager`:

```typescript
// Create from URL
const mo = await mediaManager.createMediaObjectFromUrl('https://example.com/image.jpg');

// Create from data
const buffer = Buffer.from([/* image data */]);
const mo = await mediaManager.createMediaObject(buffer, 'image/jpeg');

// Create FFmpeg input
const ffmpegMo = await mediaManager.createFFmpegMediaObject({
    inputArguments: ['-i', 'rtsp://camera.local/stream'],
});

// Convert to buffer
const jpegBuffer = await mediaManager.convertMediaObjectToBuffer(mo, 'image/jpeg');

// Convert to URL
const url = await mediaManager.convertMediaObjectToUrl(mo, 'image/jpeg');
```

## Intercom Audio Playback

Use `Intercom` interface to play audio through two-way audio devices (cameras, smart speakers):

```typescript
// CRITICAL: Use '-re' flag when playing audio files through Intercom
// Without '-re', ffmpeg reads the file as fast as possible, overwhelming the stream
const audioMo = await mediaManager.createFFmpegMediaObject({
    inputArguments: ['-re', '-i', 'https://example.com/alert.mp3'],
});

const intercom = systemManager.getDeviceById<Intercom>(deviceId);
await intercom.startIntercom(audioMo);

// Call stopIntercom() to cancel playback early
await intercom.stopIntercom();
```

The `-re` flag tells ffmpeg to read input at native frame rate (realtime), essential for streaming audio to intercoms.

## Fetch API

Scripts have access to `fetch` for HTTP requests:

```typescript
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// POST request
const response = await fetch('https://api.example.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'value' }),
});
```

## Helper Function: JSON Storage

```typescript
getJSON(key: string): any {
    try {
        return JSON.parse(this.storage.getItem(key));
    } catch {
        return null;
    }
}

setJSON(key: string, value: any): void {
    this.storage.setItem(key, JSON.stringify(value));
}
```

## Helper Function: Device Type Initialization

```typescript
// Common pattern for switch-type scripts
setTimeout(() => {
    systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
    if (device.on === undefined) {
        device.on = false;
    }
});
```

## Common Device Types

```typescript
ScryptedDeviceType.Switch      // Basic switch
ScryptedDeviceType.Light       // Light
ScryptedDeviceType.Camera      // Camera
ScryptedDeviceType.Sensor      // Generic sensor
ScryptedDeviceType.Notifier    // Notification service
ScryptedDeviceType.Bridge      // Hub/bridge device
ScryptedDeviceType.Display     // Display device
ScryptedDeviceType.Speaker     // Speaker
ScryptedDeviceType.Doorbell    // Doorbell
ScryptedDeviceType.Lock        // Lock
ScryptedDeviceType.Thermostat  // Thermostat
// ... and more
```

## Full Script Examples

### Minimal Switch

```typescript
export default class MinimalSwitch extends ScryptedDeviceBase implements OnOff {
    constructor(nativeId: ScryptedNativeId) {
        super(nativeId);
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
            if (device.on === undefined) device.on = false;
        });
    }

    async turnOff(): Promise<void> {
        this.on = false;
        this.console.info("Switch is Off");
    }

    async turnOn(): Promise<void> {
        this.on = true;
        this.console.info("Switch is On");
    }
}
```

### Device Toggle Button

```typescript
class DeviceToggle extends ScryptedDeviceBase implements OnOff, Settings {
    timeout: any;

    constructor(nativeId: string) {
        super(nativeId);
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
        });
    }

    async turnOn() {
        this.on = true;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.on = false, 1000);

        const target = systemManager.getDeviceById<OnOff>(this.storage.getItem('device'));
        await target?.turnOn();
    }

    async turnOff() {
        this.on = false;
    }

    async getSettings(): Promise<Setting[]> {
        return [
            {
                title: 'Target Device',
                key: 'device',
                value: this.storage.getItem('device'),
                type: 'device',
                deviceFilter: `interfaces.includes("${ScryptedInterface.OnOff}")`,
            },
        ];
    }

    async putSetting(key: string, value: SettingValue) {
        this.storage.setItem(key, value?.toString());
        this.onDeviceEvent(ScryptedInterface.Settings, undefined);
    }
}

export default DeviceToggle;
```

### Extension Toggle (Mixin Enabler)

```typescript
class ExtensionToggle extends ScryptedDeviceBase implements Settings, OnOff {
    constructor(nativeId: string) {
        super(nativeId);
        setTimeout(() => {
            systemManager.getDeviceById(this.id).setType(ScryptedDeviceType.Switch);
        });
    }

    async getSettings(): Promise<Setting[]> {
        return [
            {
                key: 'devices',
                type: 'device',
                title: 'Devices',
                multiple: true,
                value: this.getJSON('devices'),
            },
            {
                key: 'extension',
                type: 'device',
                title: 'Extension',
                deviceFilter: `interfaces.includes('${ScryptedInterface.MixinProvider}')`,
                value: this.getJSON('extension'),
            },
        ];
    }

    async putSetting(key: string, value: SettingValue): Promise<void> {
        this.storage.setItem(key, JSON.stringify(value));
        this.onDeviceEvent(ScryptedInterface.Settings, undefined);
    }

    async turnOff(): Promise<void> {
        const ids = this.getJSON('devices') as string[];
        const extension = this.getJSON('extension');
        for (const id of ids) {
            const device = systemManager.getDeviceById(id);
            device?.setMixins(device.mixins.filter(m => m !== extension));
        }
        this.on = false;
    }

    async turnOn(): Promise<void> {
        const ids = this.getJSON('devices') as string[];
        const extension = this.getJSON('extension') as string;
        for (const id of ids) {
            const device = systemManager.getDeviceById(id);
            device?.setMixins([...device.mixins, extension]);
        }
        this.on = true;
    }

    getJSON(key: string): any {
        try {
            return JSON.parse(this.storage.getItem(key));
        } catch {
            return [];
        }
    }
}

export default ExtensionToggle;
```
