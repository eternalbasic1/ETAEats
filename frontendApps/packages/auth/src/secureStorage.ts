import * as SecureStore from 'expo-secure-store';

let appPrefix = 'eta';

export function setAppPrefix(prefix: string): void {
  appPrefix = prefix;
}

export const tokenStore = {
  async get(): Promise<{ access: string; refresh: string } | null> {
    const [access, refresh] = await Promise.all([
      SecureStore.getItemAsync(`${appPrefix}.access`),
      SecureStore.getItemAsync(`${appPrefix}.refresh`),
    ]);
    return access && refresh ? { access, refresh } : null;
  },

  async set(access: string, refresh: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(`${appPrefix}.access`, access, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
      SecureStore.setItemAsync(`${appPrefix}.refresh`, refresh, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
    ]);
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(`${appPrefix}.access`),
      SecureStore.deleteItemAsync(`${appPrefix}.refresh`),
    ]);
  },
};
