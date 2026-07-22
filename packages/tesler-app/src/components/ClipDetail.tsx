import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Appbar,
    Avatar,
    Card,
    Chip,
    Dialog,
    Portal,
    Button,
    SegmentedButtons,
    Text,
} from 'react-native-paper';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { Areas, Event, Videos } from 'tesler-core';
import { formatReason } from 'tesler-core';
import { deleteClip, listVideos, readEvent, readThumbBase64 } from '../sentinel';

interface ClipDetailProps {
    clipUri: string;
    onBack: () => void;
    onDeleted: () => void;
}

const CAMERAS: { area: Areas; label: string; key: keyof Videos }[] = [
    { area: 'front', label: 'Front', key: 'fronts' },
    { area: 'back', label: 'Back', key: 'backs' },
    { area: 'left_repeater', label: 'Left', key: 'lefts' },
    { area: 'right_repeater', label: 'Right', key: 'rights' },
];

const ClipDetail = ({ clipUri, onBack, onDeleted }: ClipDetailProps) => {
    const [event, setEvent] = useState<Event>();
    const [thumb, setThumb] = useState<string>();
    const [videos, setVideos] = useState<Videos>();
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [playingArea, setPlayingArea] = useState<Areas>();
    const [segmentIndex, setSegmentIndex] = useState(0);

    useEffect(() => {
        setStatus('loading');
        setPlayingArea(undefined);
        setSegmentIndex(0);
        Promise.all([readEvent(clipUri), readThumbBase64(clipUri).catch(() => undefined), listVideos(clipUri)])
            .then(([evt, thumbB64, vids]) => {
                setEvent(evt);
                setThumb(thumbB64);
                setVideos(vids);
                setStatus('ready');
            })
            .catch(() => setStatus('error'));
    }, [clipUri]);

    const segments = useMemo(() => {
        if (!playingArea || !videos) return undefined;
        const camera = CAMERAS.find((c) => c.area === playingArea);
        return camera ? videos[camera.key] : undefined;
    }, [playingArea, videos]);

    const currentSource = segments?.[segmentIndex];

    const player = useVideoPlayer(currentSource ?? null, (p) => {
        p.play();
    });

    useEffect(() => {
        if (!currentSource) return;
        player.replace(currentSource);
        player.play();
    }, [currentSource, player]);

    // Auto-advance to the next 1-minute segment for the selected camera, like tesler-desktop's Viewers.tsx.
    useEventListener(player, 'playToEnd', () => {
        setSegmentIndex((i) => i + 1);
    });

    const handleDelete = () => {
        setConfirmDelete(false);
        setDeleting(true);
        deleteClip(clipUri).then(onDeleted).catch(() => setDeleting(false));
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={onBack} />
                <Appbar.Content title={event?.city ?? 'Clip'} subtitle={event?.timestamp.toLocaleString()} />
                <Appbar.Action icon="delete-outline" disabled={status !== 'ready' || deleting} onPress={() => setConfirmDelete(true)} />
            </Appbar.Header>

            {status === 'loading' && <ActivityIndicator style={styles.loader} />}
            {status === 'error' && <Text style={styles.error}>Failed to load clip</Text>}

            {status === 'ready' && event && (
                <View style={styles.content}>
                    <Card style={styles.infoCard} mode="outlined">
                        {thumb && <Card.Cover source={{ uri: `data:image/png;base64,${thumb}` }} style={styles.thumb} />}
                        <Card.Title
                            title={event.city}
                            subtitle={event.timestamp.toLocaleString()}
                            left={(props) => <Avatar.Icon {...props} icon="car-side" style={styles.avatar} />}
                        />
                        {event.reason && (
                            <Card.Content>
                                <Chip icon="alert-circle-outline" compact>
                                    {formatReason(event.reason)}
                                </Chip>
                            </Card.Content>
                        )}
                    </Card>

                    <Text variant="titleMedium" style={styles.sectionTitle}>Videos</Text>
                    <SegmentedButtons
                        value={playingArea ?? ''}
                        onValueChange={(value) => {
                            setSegmentIndex(0);
                            setPlayingArea(value as Areas);
                        }}
                        buttons={CAMERAS.map(({ area, label, key }) => ({
                            value: area,
                            label,
                            disabled: !videos || videos[key].length === 0,
                        }))}
                    />

                    {playingArea && currentSource ? (
                        <VideoView style={styles.video} player={player} nativeControls contentFit="contain" />
                    ) : playingArea ? (
                        <Text style={styles.error}>No video found for this camera</Text>
                    ) : (
                        <Text style={styles.hint}>Pick a camera above to watch this clip</Text>
                    )}
                </View>
            )}

            <Portal>
                <Dialog visible={confirmDelete} onDismiss={() => setConfirmDelete(false)}>
                    <Dialog.Title>Delete clip?</Dialog.Title>
                    <Dialog.Content>
                        <Text>This will permanently delete this clip and all its videos.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setConfirmDelete(false)}>Cancel</Button>
                        <Button onPress={handleDelete}>Delete</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

export default ClipDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 12,
        gap: 12,
    },
    loader: {
        marginTop: 24,
    },
    error: {
        textAlign: 'center',
        marginTop: 24,
        opacity: 0.8,
    },
    hint: {
        textAlign: 'center',
        marginTop: 24,
        opacity: 0.6,
    },
    infoCard: {
        backgroundColor: '#1a1a1a',
    },
    thumb: {
        borderRadius: 0,
    },
    avatar: {
        backgroundColor: '#e31937',
    },
    sectionTitle: {
        marginTop: 8,
    },
    video: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
});
