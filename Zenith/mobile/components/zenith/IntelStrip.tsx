import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Reusable Stat Card
const StatCard = ({ icon, label, value, alert }: { icon: any, label: string, value: string, alert?: string }) => (
    <View style={styles.card}>
        <View style={styles.headerRow}>
            <Ionicons name={icon} size={16} color="#666" />
            <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.value}>{value}</Text>
        {alert && <Text style={styles.alert}>{alert}</Text>}
    </View>
);

export default function IntelStrip() {
    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <StatCard
                    icon="pulse"
                    label="STRIDE AI"
                    value="92% EFF."
                    alert="HEEL STRIKE DETECTED"
                />
                <StatCard
                    icon="sunny"
                    label="WEATHER"
                    value="34°C"
                    alert="PACE THROTTLED -10s"
                />
                <StatCard
                    icon="timer"
                    label="WEEKLY VOL"
                    value="42.5 KM"
                    alert="TOP 5% OF CLAN"
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: '15%', // Next 15%
        backgroundColor: '#050505',
    },
    scrollContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 12, // Gap between cards
    },
    card: {
        width: 160,
        padding: 12,
        backgroundColor: '#121212',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 4, // Sharp corners
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    label: {
        color: '#666',
        fontSize: 10,
        fontFamily: 'AzeretMono_500Medium',
    },
    value: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'Unbounded_700Bold',
        letterSpacing: -0.5,
    },
    alert: {
        color: '#CCFF00', // Hyper-Volt
        fontSize: 9,
        marginTop: 4,
        fontFamily: 'AzeretMono_500Medium',
    }
});
