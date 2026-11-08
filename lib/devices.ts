export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  userAgent?: string;
  // Playwright device name to use, or null for plain desktop
  playwrightDevice: string | null;
}

export const DEVICE_PRESETS: Record<string, DevicePreset> = {
  'Desktop': {
    name: 'Desktop',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    playwrightDevice: null,
  },
  'Tablet': {
    name: 'Tablet',
    width: 834,
    height: 1194,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    playwrightDevice: 'iPad Pro 11',
  },
  'Mobile (iOS)': {
    name: 'Mobile (iOS)',
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    playwrightDevice: 'iPhone 14 Pro',
  },
  'Mobile (Android)': {
    name: 'Mobile (Android)',
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    playwrightDevice: 'Pixel 7',
  },
};

export const ASPECT_RATIOS: Record<string, number> = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
};

export function getDevicePreset(deviceName: string): DevicePreset | undefined {
  return DEVICE_PRESETS[deviceName];
}

export function getDeviceFolder(deviceName: string): string {
  switch (deviceName) {
    case 'Desktop':
      return 'desktop';
    case 'Tablet':
      return 'tablet';
    case 'Mobile (iOS)':
      return 'mobile-ios';
    case 'Mobile (Android)':
      return 'mobile-android';
    default:
      return deviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
}
