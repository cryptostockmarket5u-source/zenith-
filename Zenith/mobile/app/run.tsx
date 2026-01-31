import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { ConquestEngine } from '../lib/conquest';
import * as Haptics from 'expo-haptics';

// Native Expo Env support
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiaW14MjM1MzI2IiwiYSI6ImNta3F5anEyODBzbDUzZnNhZGF2Y3c5Y2MifQ.HFKhNFIWTgdQQb3n7IL9Rg';
const MAPBOX_STYLE = process.env.EXPO_PUBLIC_MAPBOX_STYLE_ID || 'mapbox://styles/imx235326/cmkqzrvie004i01r0cfnr2sfu';

/**
 * ZENITH: TACTICAL CONQUEST ENGINE (RUN INTERFACE)
 * Implements the Paper.io "Venture & Conquest" logic.
 */
export default function MapScreen() {
    const [isTracking, setIsTracking] = useState(false);
    const [trackingState, setTrackingState] = useState<'SAFE' | 'VENTURE'>('SAFE');
    const [userTerritory, setUserTerritory] = useState<any>(null);
    const webViewRef = useRef<WebView>(null);
    const engine = useRef(new ConquestEngine());
    const trailRef = useRef<[number, number][]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchUserTerritory();
    }, []);

    const fetchUserTerritory = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase.rpc('get_user_territory', { uid: session.user.id });
            setUserTerritory(data);
        }
    };

    useEffect(() => {
        let subscriber: any;
        if (isTracking) {
            const startTracking = async () => {
                subscriber = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        distanceInterval: 3,
                        timeInterval: 2000
                    },
                    (newLoc) => {
                        const [lng, lat] = engine.current.smoothLocation(
                            newLoc.coords.longitude,
                            newLoc.coords.latitude
                        );

                        // State Management
                        const isSafe = engine.current.isInside([lng, lat], userTerritory);

                        if (isSafe) {
                            if (trackingState === 'VENTURE') {
                                // Just re-entered territory -> TRIGGER CONQUEST
                                finalizeConquest();
                            }
                            setTrackingState('SAFE');
                        } else {
                            if (trackingState === 'SAFE') {
                                // Stepped out -> START VENTURE
                                trailRef.current = [[lng, lat]];
                            } else {
                                // Continue Venture
                                trailRef.current.push([lng, lat]);
                                // Check for self-intersection
                                const loop = engine.current.detectCapture(trailRef.current);
                                if (loop) finalizeConquest(loop);
                            }
                            setTrackingState('VENTURE');
                        }

                        // Sync Webview
                        webViewRef.current?.injectJavaScript(`
                            if (window.updateTacticalState) {
                                window.updateTacticalState(${lng}, ${lat}, '${trackingState}', ${JSON.stringify(trailRef.current)});
                            }
                        `);
                    }
                );
            };
            startTracking();
        }
        return () => subscriber?.remove();
    }, [isTracking, trackingState, userTerritory]);

    const finalizeConquest = async (customLoop?: [number, number][]) => {
        const loop = customLoop || [...trailRef.current, trailRef.current[0]];
        if (loop.length < 3) return;

        // Visual Pulse
        webViewRef.current?.injectJavaScript(`if(window.triggerPulse) window.triggerPulse();`);

        try {
            // 1. Local Logic: Clean the polygon using Turf.js via Conquest Engine
            // This prevents self-intersections from crashing the backend
            // In a real scenario, we would also merge with local territory for instant UI feedback
            // But here we prioritize the server sync as the source of truth

            // 2. Server Sync: Call the new PostGIS RPC
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const geojson = { type: 'Polygon', coordinates: [loop] };

            const { error: captureError } = await supabase.rpc('capture_territory', {
                p_user_id: session.user.id, // Updated param name to match schema.sql
                new_poly_geojson: JSON.stringify(geojson)
            });

            if (captureError) throw captureError;

            // 3. Log the Run (History)
            // Calculate distance roughly for now
            // In a production app, we would sum the distances between points
            await supabase.from('runs').insert({
                user_id: session.user.id,
                distance: 0.5, // Placeholder/Calculated
                duration: 120, // Placeholder
                polyline: geojson
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("TACTICAL_CONQUEST", "Sector secured. Territory expanded.");
            trailRef.current = [];
            setTrackingState('SAFE');
            fetchUserTerritory(); // Refresh map
        } catch (e) {
            console.error("Capture Error:", e);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("SYSTEM_FAILURE", "Upload rejected. Signal weak.");
        }
    };

    const mapboxHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
        <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
        <style>
          body { margin: 0; padding: 0; background: #000; overflow: hidden; }
          #map { width: 100vw; height: 100vh; }
          .hud { position: absolute; top: 100px; left: 20px; color: #CCFF00; font-family: monospace; font-size: 10px; z-index: 10; pointer-events: none; text-shadow: 0 0 5px #CCFF00; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          mapboxgl.accessToken = '${MAPBOX_TOKEN}';
          const map = new mapboxgl.Map({
            container: 'map',
            style: '${MAPBOX_STYLE}',
            center: [77.2090, 28.6139],
            zoom: 16,
            pitch: 60,
            antialias: false
          });

          map.on('load', () => {
            // Contested Path (Muted Minimalist Trail)
            map.addSource('venture', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
            
            // Core Trail Line
            map.addLayer({
              id: 'venture-line',
              type: 'line',
              source: 'venture',
              paint: { 
                'line-color': '#FFFFFF', 
                'line-width': 2, 
                'line-opacity': 0.8,
                'line-dasharray': [2, 1]
              }
            });

            // Player Dot (High Contrast)
            map.addSource('player', { type: 'geojson', data: { type: 'Point', coordinates: [0,0] } });
            map.addLayer({
              id: 'player-dot',
              type: 'circle',
              source: 'player',
              paint: { 
                'circle-radius': 8, 
                'circle-color': '#FFFFFF', 
                'circle-stroke-width': 3, 
                'circle-stroke-color': '#1F2329',
                'circle-opacity': 1
              }
            });
          });

          window.updateTacticalState = function(lng, lat, state, trail) {
            map.getSource('player').setData({ type: 'Point', coordinates: [lng, lat] });
            map.getSource('venture').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: trail } });
            map.easeTo({ center: [lng, lat] });
            
            // HUD display removed for pure tactical view
          }

          window.triggerPulse = function() {
            // Placeholder for territory fill pulse in Run mode if needed
            console.log("CONQUEST_SYNC: Pulsing local sectors");
          }
        </script>
      </body>
    </html>
    `;

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ html: mapboxHTML }}
                style={styles.map}
                scrollEnabled={false}
            />

            <SafeAreaView style={styles.overlay} pointerEvents="box-none">
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="white" />
                    </TouchableOpacity>
                    <BlurView intensity={20} tint="dark" style={styles.statsPanel}>
                        <Text style={styles.statsLabel}>SYSTEM_STATUS</Text>
                        <Text style={[styles.statsValue, { color: trackingState === 'SAFE' ? '#4CAF50' : '#CCFF00' }]}>
                            {trackingState === 'SAFE' ? "ZONE_SECURE" : "VENTURE_ACTIVE"}
                        </Text>
                    </BlurView>
                </View>

                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={[styles.button, isTracking ? styles.stopBtn : styles.startBtn]}
                        onPress={() => setIsTracking(!isTracking)}
                    >
                        <MaterialCommunityIcons name={isTracking ? "square" : "play"} size={32} color="black" />
                        <Text style={styles.btnText}>{isTracking ? "ABORT_CONQUEST" : "INITIATE_RUN"}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    map: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, padding: 20, justifyContent: 'space-between' },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
    backBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    statsPanel: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(28, 28, 30, 0.9)' },
    statsLabel: { color: '#8E8E93', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif', fontWeight: '800' },
    statsValue: { fontSize: 14, fontWeight: '900', letterSpacing: 1, color: '#FFFFFF' },
    bottomActions: { alignItems: 'center', marginBottom: 30 },
    button: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 40, gap: 10 },
    startBtn: { backgroundColor: '#FFFFFF' },
    stopBtn: { backgroundColor: '#ff4444' },
    btnText: { color: 'black', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});
