import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Alert } from 'react-native';
import { useEffect } from 'react';
import * as Updates from 'expo-updates';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            'Update Available',
            'An update is available! Click to restart',
            [
              { text: 'Restart', onPress: async () => await Updates.reloadAsync() }
            ],
            { cancelable: false }
          );
        }
      } catch (error) {
        console.log('Error fetching update:', error);
      }
    }
    
    if (!__DEV__) {
      checkForUpdates();
    }
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
