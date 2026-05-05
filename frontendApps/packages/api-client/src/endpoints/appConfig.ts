import { api } from '../client';

export interface VersionCheckParams {
  app: 'passenger' | 'restaurant' | 'admin';
  version: string;
}

export interface VersionCheckResponse {
  force_update: boolean;
  update_message: string;
  android_store_url: string;
  ios_store_url: string;
}

export const appConfigEndpoints = {
  versionCheck: (params: VersionCheckParams) =>
    api.get<VersionCheckResponse>('/app-config/version-check/', { params }),
};
