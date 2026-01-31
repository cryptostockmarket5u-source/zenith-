import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface MapControlsProps {
    onLocate: () => void;
    onToggleHeatmap: () => void;
    onToggleAQI: () => void;
    onToggleSafety: () => void;
    isHeatmapActive: boolean;
    isAQIActive: boolean;
    isSafetyActive: boolean;
}

export default function MapControls({
    onLocate,
    onToggleHeatmap,
    onToggleAQI,
    onToggleSafety,
    isHeatmapActive,
    isAQIActive,
    isSafetyActive
}: MapControlsProps) {

    const handlePress = (action: () => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        action();
    };

    return (
        <View style={styles.container}>
            {/* 1. Precise Locator */}
            <Animated.View
                entering={FadeInRight.delay(100).springify()}
            >
                <TouchableOpacity style={styles.controlBtn} onPress={() => handlePress(onLocate)}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="scan-outline" size={20} color="white" />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* 2. Territorial Heatmap */}
            <Animated.View
                entering={FadeInRight.delay(200).springify()}
            >
                <TouchableOpacity
                    style={[styles.controlBtn, isHeatmapActive && styles.activeBtn]}
                    onPress={() => handlePress(onToggleHeatmap)}
                >
                    <View style={[styles.iconContainer, isHeatmapActive && styles.activeIconContainer]}>
                        <MaterialCommunityIcons
                            name="fire"
                            size={22}
                            color={isHeatmapActive ? '#FF4500' : 'white'}
                        />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* 3. Real-time AQI */}
            <Animated.View
                entering={FadeInRight.delay(300).springify()}
            >
                <TouchableOpacity
                    style={[styles.controlBtn, isAQIActive && styles.activeBtn]}
                    onPress={() => handlePress(onToggleAQI)}
                >
                    <View style={[styles.iconContainer, isAQIActive && styles.activeIconContainer]}>
                        <Feather
                            name="wind"
                            size={20}
                            color={isAQIActive ? '#00E5FF' : 'white'}
                        />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* 4. Safety Shield */}
            <Animated.View
                entering={FadeInRight.delay(400).springify()}
            >
                <TouchableOpacity
                    style={[styles.controlBtn, isSafetyActive && styles.activeBtn]}
                    onPress={() => handlePress(onToggleSafety)}
                >
                    <View style={[styles.iconContainer, isSafetyActive && styles.activeIconContainer]}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={20}
                            color={isSafetyActive ? '#CCFF00' : 'white'}
                        />
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
    },
    controlBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(28, 28, 30, 0.9)',
    },
    activeBtn: {
        borderColor: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(44, 44, 46, 1)'
    },
    iconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    activeIconContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    }
});
