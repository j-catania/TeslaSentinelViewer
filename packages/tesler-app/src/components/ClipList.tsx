import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, SegmentedButtons, Text } from 'react-native-paper';
import { ClipType, PermissionRevokedError, listClips } from '../sentinel';
import ClipCard from './ClipCard';

interface ClipListProps {
    treeUri: string;
    onOpenClip: (clipUri: string) => void;
    onPermissionLost: () => void;
}

const ClipList = ({ treeUri, onOpenClip, onPermissionLost }: ClipListProps) => {
    const [clipType, setClipType] = useState<ClipType>('SentryClips');
    const [clipUris, setClipUris] = useState<string[]>();
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(() => {
        setLoading(true);
        listClips(treeUri, clipType)
            .then(setClipUris)
            .catch((err) => {
                if (err instanceof PermissionRevokedError) {
                    onPermissionLost();
                } else {
                    setClipUris([]);
                }
            })
            .finally(() => setLoading(false));
    }, [treeUri, clipType, onPermissionLost]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <View style={styles.container}>
            <SegmentedButtons
                style={styles.segmented}
                value={clipType}
                onValueChange={(value) => setClipType(value as ClipType)}
                buttons={[
                    { value: 'SentryClips', label: 'Sentry' },
                    { value: 'SavedClips', label: 'Saved' },
                ]}
            />
            {loading && !clipUris ? (
                <ActivityIndicator style={styles.loader} />
            ) : (
                <FlatList
                    data={clipUris}
                    keyExtractor={(uri) => uri}
                    renderItem={({ item }) => (
                        <ClipCard
                            clipUri={item}
                            onPress={onOpenClip}
                            onDeleted={(deleted) => setClipUris((prev) => prev?.filter((uri) => uri !== deleted))}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No clips found</Text>}
                    onRefresh={refresh}
                    refreshing={loading}
                />
            )}
        </View>
    );
};

export default ClipList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    segmented: {
        marginHorizontal: 12,
        marginTop: 12,
    },
    list: {
        padding: 12,
        gap: 12,
    },
    loader: {
        marginTop: 24,
    },
    empty: {
        textAlign: 'center',
        marginTop: 24,
        opacity: 0.6,
    },
});
