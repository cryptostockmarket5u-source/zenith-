import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing
} from 'react-native-reanimated';
// Native Expo Env support
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiaW14MjM1MzI2IiwiYSI6ImNta3F5anEyODBzbDUzZnNhZGF2Y3c5Y2MifQ.HFKhNFIWTgdQQb3n7IL9Rg';
const MAPBOX_STYLE = process.env.EXPO_PUBLIC_MAPBOX_STYLE_ID || 'mapbox://styles/mapbox/dark-v11';

/**
 * ZENITH: LIVE TERRITORY HERO (MAPBOX EDITION)
 * High-fidelity tactical preview of captured sectors.
 */
export default function LiveTerritoryHero() {
    const scanLineY = useSharedValue(0);

    const staticMapboxHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
        <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
        <style>
          body { margin: 0; padding: 0; background: #000; overflow: hidden; }
          #map { width: 100vw; height: 100vh; }
          .mapboxgl-ctrl { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          mapboxgl.accessToken = '${MAPBOX_TOKEN}';
          const map = new mapboxgl.Map({
            container: 'map',
            style: '${MAPBOX_STYLE}',
            center: [77.2167, 28.6129], // Delhi
            zoom: 14,
            pitch: 45,
            interactive: false
          });
        </script>
      </body>
    </html>
    `;

    useEffect(() => {
        scanLineY.value = withRepeat(
            withTiming(250, { duration: 3000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const scanStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: scanLineY.value }],
    }));

    return (
        <View style={styles.container}>
            <View style={styles.cardBorder}>
                <WebView
                    source={{ html: staticMapboxHTML }}
                    style={styles.map}
                    scrollEnabled={false}
                />

                {/* Scanline Effect */}
                <Animated.View style={[styles.scanLine, scanStyle]} />

                {/* Overlay Content */}
                <BlurView intensity={20} tint="dark" style={styles.overlay}>
                    <View style={styles.activeIndicator}>
                        <View style={styles.dot} />
                    </View>
                </BlurView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: '35%',
        padding: 16,
        justifyContent: 'center',
    },
    cardBorder: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#CCFF00',
        overflow: 'hidden',
        backgroundColor: '#000',
        elevation: 10,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.6,
    },
    scanLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(204, 255, 0, 0.5)',
        zIndex: 2,
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
    },
    heroText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -1,
    },
    activeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#CCFF00',
        marginRight: 6,
    },
    liveText: {
        color: '#CCFF00',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
    },
});
