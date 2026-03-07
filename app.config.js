const appJson = require('./app.json');

// In production builds expo-dev-client must be excluded — it tries to connect
// to a packager that doesn't exist in release and causes an immediate crash.
const IS_PRODUCTION = process.env.APP_VARIANT === 'production';

const plugins = IS_PRODUCTION
  ? (appJson.expo.plugins || []).filter((p) => p !== 'expo-dev-client')
  : appJson.expo.plugins;

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    plugins,
    ios: {
      ...appJson.expo.ios,
      config: {
        googleMapsApiKey:
          process.env.GOOGLE_MAPS_API_KEY_IOS,
      },
    },
    android: {
      ...appJson.expo.android,
      config: {
        googleMaps: {
          apiKey:
            process.env.GOOGLE_MAPS_API_KEY_ANDROID,
        },
      },
    },
  },
};
