import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.luupi.app',
  appName: 'Luupi',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
}

export default config
