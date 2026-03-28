// Essential Scrypted SDK Types for Scripts - AMBIENT DECLARATIONS
// These types are available globally in the script context - NO IMPORTS NEEDED

// === Enums (ambient) ===

declare enum ScryptedDeviceType {
  Camera = "Camera",
  Fan = "Fan",
  Light = "Light",
  Switch = "Switch",
  Outlet = "Outlet",
  Sensor = "Sensor",
  Scene = "Scene",
  Program = "Program",
  Automation = "Automation",
  Vacuum = "Vacuum",
  Notifier = "Notifier",
  Thermostat = "Thermostat",
  Lock = "Lock",
  Display = "Display",
  Speaker = "Speaker",
  Doorbell = "Doorbell",
  Entry = "Entry",
  Garage = "Garage",
  DeviceProvider = "DeviceProvider",
  Buttons = "Buttons",
  Unknown = "Unknown",
}

declare enum ScryptedInterface {
  ScryptedDevice = "ScryptedDevice",
  OnOff = "OnOff",
  Brightness = "Brightness",
  ColorSettingTemperature = "ColorSettingTemperature",
  ColorSettingRgb = "ColorSettingRgb",
  ColorSettingHsv = "ColorSettingHsv",
  Buttons = "Buttons",
  Sensors = "Sensors",
  Notifier = "Notifier",
  StartStop = "StartStop",
  TemperatureSetting = "TemperatureSetting",
  Thermometer = "Thermometer",
  HumiditySensor = "HumiditySensor",
  Camera = "Camera",
  VideoCamera = "VideoCamera",
  PanTiltZoom = "PanTiltZoom",
  Lock = "Lock",
  Scene = "Scene",
  Entry = "Entry",
  EntrySensor = "EntrySensor",
  MediaPlayer = "MediaPlayer",
  Settings = "Settings",
  BinarySensor = "BinarySensor",
  MotionSensor = "MotionSensor",
  AmbientLightSensor = "AmbientLightSensor",
  PositionSensor = "PositionSensor",
  MixinProvider = "MixinProvider",
  Battery = "Battery",
  Online = "Online",
  Refresh = "Refresh",
  Program = "Program",
  ObjectDetector = "ObjectDetector",
  Intercom = "Intercom",
}

declare enum LockState {
  Locked = "Locked",
  Unlocked = "Unlocked",
  Jammed = "Jammed",
  Unsecured = "Unsecured",
}

declare enum TemperatureUnit {
  C = "C",
  F = "F",
}

// === Type aliases (ambient) ===

declare type ScryptedNativeId = string | undefined;
declare type EventListener = (eventSource: ScryptedDevice | undefined, eventDetails: EventDetails, eventData: any) => void | Promise<void>;
declare type SettingValue = undefined | null | string | number | boolean | string[] | number[];

// === Interfaces (ambient) ===

declare interface ScryptedDevice {
  id: string;
  name?: string;
  type?: ScryptedDeviceType | string;
  interfaces: (ScryptedInterface | string)[];
  mixins: string[];
  listen(event: ScryptedInterface | string | EventListenerOptions, callback: (eventSource: ScryptedDevice | undefined, eventDetails: EventDetails, eventData: any) => void | Promise<void>): EventListenerRegister;
  setType(type: ScryptedDeviceType): Promise<void>;
  setMixins(mixins: string[]): Promise<void>;
  probe(): Promise<boolean>;
}

declare interface EventListenerOptions {
  denoise?: boolean;
  event?: ScryptedInterface | string;
  watch?: boolean;
  mixinId?: string;
}

declare interface EventListenerRegister {
  removeListener(): void;
}

declare interface EventDetails {
  eventId: string;
  eventInterface?: string;
  eventTime: number;
  property?: string;
  mixinId?: string;
}

// Control Interfaces
declare interface OnOff {
  turnOff(): Promise<void>;
  turnOn(): Promise<void>;
  on?: boolean;
}

declare interface Brightness {
  setBrightness(brightness: number): Promise<void>;
  brightness?: number;
}

declare interface StartStop {
  start(): Promise<void>;
  stop(): Promise<void>;
  running?: boolean;
}

declare interface Lock {
  lock(): Promise<void>;
  unlock(): Promise<void>;
  lockState?: LockState;
}

declare interface Scene {
  activate(): Promise<void>;
}

declare interface Entry {
  open(): Promise<void>;
  close(): Promise<void>;
  entryOpen?: boolean | 'jammed';
}

declare interface PanTiltZoom {
  ptzCommand(command: PanTiltZoomCommand): Promise<void>;
}

declare interface PanTiltZoomCommand {
  pan?: number;
  tilt?: number;
  zoom?: number;
}

declare interface MediaPlayer {
  load(media: string | MediaObject, options?: MediaPlayerOptions): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
}

declare interface MediaPlayerOptions {
  url?: string;
  mimeType?: string;
}

// Sensor Interfaces
declare interface BinarySensor {
  binaryState?: boolean;
}

declare interface MotionSensor {
  motionDetected?: boolean;
}

declare interface ObjectDetector {
  getDetectionInput(detectionId: string, eventId?: any): Promise<MediaObject>;
  getObjectTypes(): Promise<ObjectDetectionTypes>;
}

declare interface ObjectDetectionTypes {
  classes?: ObjectDetectionClass[];
}

declare type ObjectDetectionClass = 'motion' | 'face' | 'person' | string;

declare interface ObjectsDetected {
  detections?: ObjectDetectionResult[];
  detectionId?: string;
  inputDimensions?: [number, number];
  timestamp: number;
}

declare interface ObjectDetectionResult {
  id?: string;
  className: ObjectDetectionClass;
  score?: number;
  boundingBox?: [number, number, number, number];
}

declare interface Thermometer {
  temperature?: number;
  temperatureUnit?: TemperatureUnit;
}

declare interface HumiditySensor {
  humidity?: number;
}

// Camera Interfaces
declare interface Camera {
  takePicture(options?: RequestPictureOptions): Promise<MediaObject>;
}

declare interface VideoCamera {
  getVideoStream(options?: RequestMediaStreamOptions): Promise<MediaObject>;
  getVideoStreamOptions(): Promise<ResponseMediaStreamOptions[]>;
}

declare interface RequestMediaStreamOptions {
  id?: string;
}

declare interface ResponseMediaStreamOptions {
  id: string;
  name?: string;
}

declare interface RequestPictureOptions {
  timeout?: number;
}

// Notification
declare interface Notifier {
  sendNotification(title: string, options?: NotifierOptions, media?: string | MediaObject, icon?: string | MediaObject): Promise<void>;
}

declare interface NotifierOptions {
  body?: string;
  subtitle?: string;
  image?: string;
}

// Settings
declare interface Settings {
  getSettings(): Promise<Setting[]>;
  putSetting(key: string, value: SettingValue): Promise<void>;
}

declare interface Setting {
  key?: string;
  title?: string;
  description?: string;
  type?: 'string' | 'password' | 'number' | 'boolean' | 'device' | 'button' | 'textarea';
  value?: SettingValue;
  choices?: string[];
  multiple?: boolean;
  deviceFilter?: string;
  defaultValue?: any;
}

// Mixin
declare interface MixinProvider {
  canMixin(type: ScryptedDeviceType | string, interfaces: string[]): Promise<string[] | null | undefined | void>;
  getMixin(mixinDevice: any, mixinDeviceInterfaces: ScryptedInterface[], mixinDeviceState: WritableDeviceState): Promise<any>;
  releaseMixin(id: string, mixinDevice: any): Promise<void>;
}

declare interface MixinDeviceOptions<T> {
  mixinDevice: T;
  mixinProviderNativeId: ScryptedNativeId;
  mixinDeviceInterfaces: ScryptedInterface[];
  mixinDeviceState: WritableDeviceState;
}

declare interface WritableDeviceState {
  id: string;
  setState(property: string, value: any): Promise<void>;
}

// Media
declare interface MediaObject {
  mimeType: string;
  sourceId?: string;
  convert<T>(toMimeType: string): Promise<T>;
}

declare interface FFmpegInput {
  url?: string;
  urls?: string[];
  inputArguments?: string[];
  destinationVideoBitrate?: number;
  h264EncoderArguments?: string[];
  videoDecoderArguments?: string[];
  h264FilterArguments?: string[];
  env?: { [key: string]: string };
  ffmpegPath?: string;
  mediaStreamOptions?: ResponseMediaStreamOptions;
}

declare interface Intercom {
  startIntercom(media: MediaObject): Promise<void>;
  stopIntercom(): Promise<void>;
}

// Managers
declare interface SystemManager {
  getDeviceById(id: string): ScryptedDevice;
  getDeviceById<T>(id: string): ScryptedDevice & T;
  getDeviceByName(name: string): ScryptedDevice;
  getDeviceByName<T>(name: string): ScryptedDevice & T;
  listen(callback: EventListener): EventListenerRegister;
  listenDevice(id: string, event: ScryptedInterface | string | EventListenerOptions, callback: EventListener): EventListenerRegister;
}

declare interface DeviceManager {
  getDeviceStorage(nativeId?: ScryptedNativeId): Storage;
  getDeviceConsole(nativeId?: ScryptedNativeId): Console;
  getDeviceLogger(nativeId?: ScryptedNativeId): Logger;
  onDeviceEvent(nativeId: ScryptedNativeId, eventInterface: string, eventData: any): Promise<void>;
}

declare interface MediaManager {
  createMediaObject(data: any, mimeType: string, options?: any): Promise<MediaObject>;
  createMediaObjectFromUrl(url: string, options?: any): Promise<MediaObject>;
  createFFmpegMediaObject(ffmpegInput: FFmpegInput, options?: any): Promise<MediaObject>;
  convertMediaObjectToBuffer(mediaObject: MediaObject, toMimeType: string): Promise<Buffer>;
  convertMediaObjectToLocalUrl(mediaObject: string | MediaObject, toMimeType: string): Promise<string>;
}

declare interface Logger {
  i(message: string): void;
  w(message: string): void;
  e(message: string): void;
  clear(): void;
}

// StorageSettings Helper
declare interface StorageSetting extends Omit<Setting, 'deviceFilter'> {
  deviceFilter?: string | ((test: {
    id: string;
    deviceInterface: string;
    interfaces: string[];
    type: ScryptedDeviceType;
    ScryptedDeviceType: typeof ScryptedDeviceType;
    ScryptedInterface: typeof ScryptedInterface;
  }) => boolean);
  defaultValue?: any;
  onPut?: (oldValue: any, newValue: any) => void;
}

declare interface StorageSettingsDevice {
  storage: Storage;
  onDeviceEvent(eventInterface: string, eventData: any): Promise<void>;
}

declare class StorageSettings<T extends string> implements Settings {
  values: { [key in T]: any };
  hasValue: { [key in T]: boolean };
  constructor(device: StorageSettingsDevice, settings: { [key in T]: StorageSetting });
  getSettings(): Promise<Setting[]>;
  putSetting(key: string, value: SettingValue): Promise<void>;
  getItem(key: T): any;
}

// === Base Classes (ambient, available globally) ===

declare class ScryptedDeviceBase {
  id: string;
  nativeId?: ScryptedNativeId;
  on?: boolean;
  brightness?: number;
  storage: Storage;
  console: Console;
  log: Logger;
  
  constructor(nativeId?: ScryptedNativeId);
  onDeviceEvent(eventInterface: string, eventData: any): Promise<void>;
}

declare class MixinDeviceBase<T> {
  id: string;
  nativeId?: ScryptedNativeId;
  mixinDevice: T;
  mixinDeviceInterfaces: ScryptedInterface[];
  mixinProviderNativeId: ScryptedNativeId;
  storage: Storage;
  console: Console;
  
  constructor(options: MixinDeviceOptions<T>);
  onDeviceEvent(eventInterface: string, eventData: any): Promise<void>;
}

// === Global Variables (ambient) ===

declare const sdk: {
  systemManager: SystemManager;
  deviceManager: DeviceManager;
  mediaManager: MediaManager;
  endpointManager: any;
};

declare const systemManager: SystemManager;
declare const deviceManager: DeviceManager;
declare const mediaManager: MediaManager;
declare const endpointManager: any;

// 'device' global is the script's device state (same as 'this' in the script context)
// It has all the writable state properties of ScryptedDeviceBase
declare const device: ScryptedDeviceBase & {
  on?: boolean;
  brightness?: number;
  motionDetected?: boolean;
  binaryState?: boolean;
  running?: boolean;
  lockState?: LockState;
  temperature?: number;
  humidity?: number;
};
