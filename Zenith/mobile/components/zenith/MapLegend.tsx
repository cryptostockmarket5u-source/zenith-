import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

interface MapLegendProps {
    type: 'HEATMAP' | 'AQI' | 'SAFETY' | null;
}

export default function MapLegend({ type }: MapLegendProps) {
    if (!type) return null;

    const renderAQI = () => (
        <View style={styles.content}>
            <Text style={styles.title}>AIR QUALITY (US AQI)</Text>
            <View style={styles.row}>
                <View style={[styles.box, { backgroundColor: '#00E5FF' }]} />
                <Text style={styles.label}>Good (0-50)</Text>
            </View>
            <View style={styles.row}>
                <View style={[styles.box, { backgroundColor: '#FFFF00' }]} />
                <Text style={styles.label}>Moderate (51-100)</Text>
            </View>
            <View style={styles.row}>
                <View style={[styles.box, { backgroundColor: '#FF7F00' }]} />
                <Text style={styles.label}>Sensitive (101-150)</Text>
            </View>
            <View style={styles.row}>
                <View style={[styles.box, { backgroundColor: '#FF0000' }]} />
                <Text style={styles.label}>Unhealthy (150+)</Text>
            </View>
        </View>
    );

    const renderHeatmap = () => (
        <View style={styles.content}>
            <Text style={styles.title}>TERRITORY ACTIVITY</Text>
            <View style={styles.gradientBar} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.label}>Low</Text>
                <Text style={styles.label}>Contested</Text>
                <Text style={styles.label}>High</Text>
            </View>
        </View>
    );

    const renderSafety = () => (
        <View style={styles.content}>
            <Text style={styles.title}>SAFETY SCORES</Text>
            <View style={styles.row}>
                <View style={[styles.box, { backgroundColor: '#00FF00', borderColor: '#FFFFFF', borderWidth: 1 }]} />
                <Text style={styles.label}>Verified Safe Zone</Text>
            </View>
            <View style={styles.row}>
                <View style={[styles.box, { backgroundColor: '#FF0000', borderColor: '#FFFFFF', borderWidth: 1 }]} />
                <Text style={styles.label}>Reported Incident</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Fallback View logic for Android stability similar to MapControls */}
            <View style={styles.backdrop} />
            {type === 'AQI' && renderAQI()}
            {type === 'HEATMAP' && renderHeatmap()}
            {type === 'SAFETY' && renderSafety()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 120, // Below top bar
        left: 16,
        width: 160,
        borderRadius: 12,
        overflow: 'hidden',
        padding: 12,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(28, 28, 30, 0.85)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    content: {
        zIndex: 1,
    },
    title: {
        color: '#8E8E93',
        fontSize: 10,
        fontWeight: '900',
        marginBottom: 8,
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    box: {
        width: 12,
        height: 12,
        borderRadius: 3,
        marginRight: 8,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600'
    },
    gradientBar: {
        height: 4,
        width: '100%',
        borderRadius: 2,
        backgroundColor: '#2A4858', // Placeholder for gradient
        marginBottom: 4,
        // In RN styling gradients is hard without library, using solid for now or could use multiple views
        // Simple trick:
        borderWidth: 0,
    }
});
