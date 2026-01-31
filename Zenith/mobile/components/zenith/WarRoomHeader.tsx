import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import { useFonts, Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { AzeretMono_500Medium } from '@expo-google-fonts/azeret-mono';

const { width } = Dimensions.get('window');

export default function WarRoomHeader() {
    const [fontsLoaded] = useFonts({
        Unbounded_700Bold,
        AzeretMono_500Medium,
    });

    const categories = ['TERRITORY UNDER ATTACK IN HSR LAYOUT', 'NEW RIVAL DETECTED: @BLAZE', 'SECTOR 7 SECURIZED'];
    const tickerText = categories.join('  ///  ') + '  ///  ';

    const translateX = useSharedValue(width);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(-width * 1.5, {
                duration: 10000,
                easing: Easing.linear,
            }),
            -1,
            false // no reverse
        );
        return () => {
            cancelAnimation(translateX);
        };
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    if (!fontsLoaded) return null;

    return (
        <View style={styles.container}>
            {/* Hexagon Avatar Section */}
            <View style={styles.avatarSection}>
                <View style={styles.hexagonBorder}>
                    <Image
                        source="https://i.pravatar.cc/150?img=11"
                        style={styles.avatar}
                        contentFit="cover"
                    />
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>LVL 42</Text>
                    </View>
                </View>
            </View>

            {/* Ticker Section */}
            <View style={styles.tickerContainer}>
                <Animated.Text style={[styles.tickerText, animatedStyle]}>
                    {tickerText}
                </Animated.Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '10%', // Top 10%
        paddingHorizontal: 16,
        paddingTop: 10, // status bar safe area buffer
        backgroundColor: '#050505',
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
        zIndex: 10,
    },
    avatarSection: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    hexagonBorder: {
        width: 64,
        height: 64,
        borderWidth: 2,
        borderColor: '#CCFF00', // Hyper-Volt
        borderRadius: 12, // Pseudo-hex (simple rounded square rotated 45deg also works, but circle with border is cleaner for MVP)
        // For actual hexagon, we'd use SVG, but let's stick to "Technical" sharp square
        transform: [{ rotate: '45deg' }],
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
    },
    avatar: {
        width: 60,
        height: 60,
        transform: [{ rotate: '-45deg' }], // Counter rotate image
        borderRadius: 8,
    },
    levelBadge: {
        position: 'absolute',
        bottom: -10,
        right: -10,
        backgroundColor: '#CCFF00',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        transform: [{ rotate: '-45deg' }], // Counter rotate badge
    },
    levelText: {
        fontFamily: 'Unbounded_700Bold',
        fontSize: 10,
        color: '#000',
    },
    tickerContainer: {
        flex: 1,
        height: 30,
        backgroundColor: '#0A0A0A',
        overflow: 'hidden',
        justifyContent: 'center',
        borderRadius: 4,
        borderLeftWidth: 2,
        borderLeftColor: '#CCFF00',
        paddingLeft: 4,
    },
    tickerText: {
        fontFamily: 'AzeretMono_500Medium',
        color: '#CCFF00',
        fontSize: 12,
        letterSpacing: 1,
        width: 800, // Ensure enough width
    },
});
