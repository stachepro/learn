import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Testler saf fonksiyonları kapsar; DOM ya da tarayıcı API'si gerekmez
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
