import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem, Image, Platform } from 'react-native';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

type FeedItem = {
    id: string;
    type: 'RIVAL' | 'CLAN' | 'SYSTEM';
    text: string;
    timestamp: string;
};

import { useUserStore } from '../../stores/userStore';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiaW14MjM1MzI2IiwiYSI6ImNta3F5anEyODBzbDUzZnNhZGF2Y3c5Y2MifQ.HFKhNFIWTgdQQb3n7IL9Rg';

const getStaticMapUrl = (geojson: any) => {
    if (!geojson) return null;
    // Simplify for URL: Extract one ring of coordinates
    // In production, use Polyline encoding to save URL space
    // For MVP, simplistic fallback image if geojson too complex

    // Mapbox Static with GeoJSON Overlay
    // Format: static/geojson({geojson})/auto/600x300?access_token=...
    // Note: URL encoding essential
    try {
        const jsonString = JSON.stringify(geojson);
        return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/geojson(${encodeURIComponent(jsonString)})/auto/600x300?padding=50&access_token=${MAPBOX_TOKEN}`;
    } catch (e) {
        return null;
    }
};

const FeedItemRow = ({ item }: { item: any }) => {
    const isRun = item.type === 'RUN';
    const staticMap = isRun ? getStaticMapUrl(item.polyline) : null;

    return (
        <Animated.View
            entering={FadeInRight.delay(100).springify()}
            layout={Layout.springify()}
            style={styles.itemContainer}
        >
            <View style={styles.iconCol}>
                <Ionicons
                    name={item.type === 'RIVAL' ? 'warning' : item.type === 'CLAN' ? 'people' : isRun ? 'map' : 'hardware-chip'}
                    size={14}
                    color={item.type === 'RIVAL' ? '#FF0000' : '#CCFF00'}
                />
            </View>
            <View style={styles.textCol}>
                <Text style={[
                    styles.text,
                    { color: item.type === 'RIVAL' ? '#FF4444' : '#FFF' }
                ]}>
                    {item.text}
                </Text>
                {/* Static Map Card */}
                {isRun && (
                    <View style={styles.mapCard}>
                        {staticMap ? (
                            <Image
                                source={{ uri: staticMap }}
                                style={styles.staticMapImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.mapPlaceholder}>
                                <Ionicons name="map-outline" size={24} color="#666" />
                            </View>
                        )}
                        <View style={styles.runStats}>
                            <Text style={styles.runStatText}>{item.distance} km</Text>
                            <Text style={styles.runStatLabel}>SECTOR SECURED</Text>
                        </View>
                    </View>
                )}
            </View>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
        </Animated.View>
    );
};

export default function FrontlinesFeed() {
    const { weeklyHistory } = useUserStore();

    // Merge Real Runs with Mock System Alerts for a full feed
    const feedData = [
        ...weeklyHistory.map((run: any) => ({
            id: `run-${run.date}`,
            type: 'RUN',
            text: `Tactical Run Completed`,
            timestamp: run.date,
            distance: run.distance,
            polyline: run.polyline
        })),
        { id: '1', type: 'RIVAL', text: '@SpeedDemon just stole 2km of your turf.', timestamp: '2m ago' },
        { id: '3', type: 'SYSTEM', text: 'Sector 7 degradation warning.', timestamp: '1h ago' },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.header}>THE FRONTLINES</Text>
            <FlatList
                data={feedData}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <FeedItemRow item={item} />}
                contentContainerStyle={styles.listContent}
                scrollEnabled={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // Take remaining space (Bottom 30% approx)
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    header: {
        color: '#666',
        fontFamily: 'Unbounded_700Bold', // Fallback handled if font fails
        fontSize: 12,
        marginBottom: 12,
        letterSpacing: 1,
    },
    listContent: {
        gap: 8,
        paddingBottom: 80, // Space for FAB
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
        backgroundColor: '#0A0A0A',
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    iconCol: {
        width: 24,
        alignItems: 'center',
    },
    textCol: {
        flex: 1,
        paddingHorizontal: 8,
    },
    text: {
        fontFamily: 'AzeretMono_500Medium',
        fontSize: 12,
        // color set dynamically
    },
    timestamp: {
        color: '#444',
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    mapCard: {
        marginTop: 8,
        height: 120,
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333'
    },
    staticMapImage: { width: '100%', height: '100%' },
    mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    runStats: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.8)', padding: 6, flexDirection: 'row', justifyContent: 'space-between' },
    runStatText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
    runStatLabel: { color: '#CCFF00', fontSize: 10, fontWeight: '900' }
});
