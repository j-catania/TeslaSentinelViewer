import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { MD3DarkTheme, PaperProvider, Appbar, Button, Text } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ClipDetail from './src/components/ClipDetail';
import ClipList from './src/components/ClipList';
import { clearPersistedTreeUri, getPersistedTreeUri, pickTeslaCamFolder } from './src/sentinel';

// TesLEr brand colors, matching the desktop app (see tesler-desktop/src/App.scss)
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#e31937',
    background: '#121212',
    surface: '#1a1a1a',
    surfaceVariant: '#1a1a1a',
  },
};

// SAF-based TeslaCam access is Android-only for now (see docs/USB_FILE_ACCESS.md, Phase 2 covers iOS).
const SAF_SUPPORTED = Platform.OS === 'android';

export default function App() {
  // undefined = still checking for a persisted folder, null = none picked yet
  const [treeUri, setTreeUri] = useState<string | null>();
  const [selectedClip, setSelectedClip] = useState<string>();

  useEffect(() => {
    if (!SAF_SUPPORTED) {
      setTreeUri(null);
      return;
    }
    getPersistedTreeUri().then(setTreeUri);
  }, []);

  const pickFolder = useCallback(() => {
    pickTeslaCamFolder().then(setTreeUri);
  }, []);

  const changeFolder = useCallback(() => {
    clearPersistedTreeUri().then(() => setTreeUri(null));
  }, []);

  if (treeUri && selectedClip) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ClipDetail
              clipUri={selectedClip}
              onBack={() => setSelectedClip(undefined)}
              onDeleted={() => setSelectedClip(undefined)}
            />
            <StatusBar style="light" />
          </SafeAreaView>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <Appbar.Header>
            <Appbar.Content title="TesLEr" subtitle="Sentry Mode Viewer" />
            {SAF_SUPPORTED && treeUri && <Appbar.Action icon="usb" onPress={changeFolder} />}
          </Appbar.Header>

          {!SAF_SUPPORTED ? (
            <View style={styles.empty}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                TeslaCam USB access isn't available on this platform yet. It currently works on Android only
                (see docs/USB_FILE_ACCESS.md).
              </Text>
            </View>
          ) : treeUri === undefined ? null : treeUri === null ? (
            <View style={styles.empty}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Connect the Tesla USB drive and select its TeslaCam folder to view Sentry clips.
              </Text>
              <Button mode="contained" icon="folder-open-outline" onPress={pickFolder}>
                Select TeslaCam folder
              </Button>
            </View>
          ) : (
            <ClipList treeUri={treeUri} onOpenClip={setSelectedClip} onPermissionLost={() => setTreeUri(null)} />
          )}
          <StatusBar style="light" />
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.8,
  },
});

