import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Avatar, Card, Chip, IconButton, Text } from 'react-native-paper';
import type { Event } from 'tesler-core';
import { formatReason } from 'tesler-core';
import { deleteClip, readEvent, readThumbBase64 } from '../sentinel';

interface ClipCardProps {
    clipUri: string;
    onPress: (clipUri: string) => void;
    onDeleted: (clipUri: string) => void;
}

const ClipCard = ({ clipUri, onPress, onDeleted }: ClipCardProps) => {
    const [event, setEvent] = useState<Event>();
    const [thumb, setThumb] = useState<string>();
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        Promise.all([readEvent(clipUri), readThumbBase64(clipUri).catch(() => undefined)])
            .then(([evt, thumbB64]) => {
                setEvent(evt);
                setThumb(thumbB64);
                setStatus('ready');
            })
            .catch(() => setStatus('error'));
    }, [clipUri]);

    if (status === 'error') {
        return (
            <Card style={styles.card} mode="outlined">
                <Card.Content>
                    <Text variant="bodyMedium">Failed to load clip</Text>
                </Card.Content>
            </Card>
        );
    }

    return (
        <Card style={styles.card} mode="outlined" onPress={() => status === 'ready' && onPress(clipUri)}>
            {thumb && <Card.Cover source={{ uri: `data:image/png;base64,${thumb}` }} style={styles.thumb} />}
            <Card.Title
                title={event?.city ?? 'Loading…'}
                subtitle={event?.timestamp.toLocaleString()}
                left={(props) => <Avatar.Icon {...props} icon="car-side" style={styles.avatar} />}
                right={(props) => (
                    <IconButton
                        {...props}
                        icon="delete-outline"
                        disabled={status !== 'ready' || deleting}
                        onPress={() => {
                            setDeleting(true);
                            deleteClip(clipUri)
                                .then(() => onDeleted(clipUri))
                                .catch(() => setDeleting(false));
                        }}
                    />
                )}
            />
            {event?.reason && (
                <Card.Content>
                    <Chip icon="alert-circle-outline" compact>
                        {formatReason(event.reason)}
                    </Chip>
                </Card.Content>
            )}
        </Card>
    );
};

export default ClipCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1a1a1a',
    },
    thumb: {
        borderRadius: 0,
    },
    avatar: {
        backgroundColor: '#e31937',
    },
});
