import { StatusBar } from 'expo-status-bar';
import { FlatList, StyleSheet } from 'react-native';
import { MD3DarkTheme, PaperProvider, Appbar, Card, Avatar, Chip } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { Event } from 'tesler-core';
import { formatReason } from 'tesler-core';

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

// Placeholder data until a native TeslaCam file-system reader lands (see tesler-desktop's window.sentinel).
const MOCK_CLIPS: Event[] = [
  {
    root: '/TeslaCam/SentryClips/2026-07-20_18-42-11',
    timestamp: new Date('2026-07-20T18:42:11'),
    city: 'San Francisco',
    est_lat: 37.7749,
    est_lon: -122.4194,
    reason: 'sentry_aware_object_detection',
    camera: 0,
  },
  {
    root: '/TeslaCam/SentryClips/2026-07-20_09-15-03',
    timestamp: new Date('2026-07-20T09:15:03'),
    city: 'Oakland',
    est_lat: 37.8044,
    est_lon: -122.2712,
    reason: 'user_interaction_honk',
    camera: 0,
  },
];

const ClipCard = ({ event }: { event: Event }) => (
  <Card style={styles.card} mode="outlined">
    <Card.Title
      title={event.city}
      subtitle={event.timestamp.toLocaleString()}
      left={(props) => <Avatar.Icon {...props} icon="car-side" style={styles.avatar} />}
    />
    <Card.Content>
      <Chip icon="alert-circle-outline" compact>
        {formatReason(event.reason)}
      </Chip>
    </Card.Content>
  </Card>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <Appbar.Header>
            <Appbar.Content title="TesLEr" subtitle="Sentry Mode Viewer" />
            <Appbar.Action icon="refresh" onPress={() => {}} />
          </Appbar.Header>
          <FlatList
            data={MOCK_CLIPS}
            keyExtractor={(item) => item.root}
            renderItem={({ item }) => <ClipCard event={item} />}
            contentContainerStyle={styles.list}
          />
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
  list: {
    padding: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#1a1a1a',
  },
  avatar: {
    backgroundColor: '#e31937',
  },
});

