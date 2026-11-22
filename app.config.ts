import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim() ?? '';

  return {
    ...config,
    name: config.name ?? 'Hadir.in',
    slug: config.slug ?? 'hadirin',
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        ...(googleMapsApiKey
          ? {
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            }
          : {}),
      },
    },
    extra: {
      ...config.extra,
      maps: {
        androidConfigured: Boolean(googleMapsApiKey),
      },
    },
  };
};