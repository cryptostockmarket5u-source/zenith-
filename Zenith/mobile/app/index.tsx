import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, StatusBar, Text, TouchableOpacity, SafeAreaView, Dimensions, Platform, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    SlideInUp,
    FadeOut
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import AccountPanel from '../components/zenith/AccountPanel';
import LeaderboardList from '../components/zenith/LeaderboardList';
import ClubDiscovery from '../components/zenith/ClubDiscovery';
import FrontlinesFeed from '../components/zenith/FrontlinesFeed';
import ClubDashboard from '../components/zenith/ClubDashboard';
import ClubProfileView from '../components/zenith/ClubProfileView';
import { useUserStore } from '../stores/userStore';
import MapControls from '../components/zenith/MapControls';
import MapLegend from '../components/zenith/MapLegend';
import { fetchLocalAQI } from '../lib/googleMaps';

const { width, height } = Dimensions.get('window');
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiaW14MjM1MzI2IiwiYSI6ImNta3F5anEyODBzbDUzZnNhZGF2Y3c5Y2MifQ.HFKhNFIWTgdQQb3n7IL9Rg';
const MAPBOX_STYLE = process.env.EXPO_PUBLIC_MAPBOX_STYLE_ID || 'mapbox://styles/mapbox/dark-v11';

/**
 * ZENITH: THE WORLD CONQUEST INTERFACE
 * Fixed territory visibility and restored map consistency.
 */
export default function HomeScreen() {
    const router = useRouter();
    const webViewRef = useRef<WebView>(null);
    const { mode, setMode, isOnline, setOnlineStatus, fetchProfile, club, isChangingClub, previewClub } = useUserStore();

    // Local UI State
    const [activeSubTab, setActiveSubTab] = useState('Leaderboard');
    const [isCapturing, setIsCapturing] = useState(false);
    const [heatmapActive, setHeatmapActive] = useState(false);
    const [aqiActive, setAqiActive] = useState(false);
    const [safetyActive, setSafetyActive] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [regionMode, setRegionMode] = useState<'Country' | 'Worldwide'>('Worldwide');
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [currentTab, setCurrentTab] = useState('Play');
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState(1);
    const { selectedRun, setSelectedRun } = useUserStore();

    // Sync local activeSubTab when mode changes (optional Logic)
    useEffect(() => {
        if (mode === 'Single Player') setActiveSubTab('Leaderboard');
        else if (mode === 'My Club') {
            setActiveSubTab('Leaderboard');
            // Automatically expand when entering My Club to discover clubs
            if (!club) {
                sheetHeight.value = withSpring(SHEET_MAX_HEIGHT, { damping: 15 });
            }
        }
        else setActiveSubTab('Invites'); // Private Lobby default
    }, [mode, club]);

    // Animation state for Top Bar
    const pillPosition = useSharedValue(0); // 0: Single, 1: Club

    // Animation state for Bottom Sheet
    const SHEET_MIN_HEIGHT = 80;
    const SHEET_MAX_HEIGHT = height - 240;
    const SHEET_SELECTED_HEIGHT = height * 0.45;
    const sheetHeight = useSharedValue(SHEET_MIN_HEIGHT);
    const context = useSharedValue({ y: 0 });

    const sheetStyle = useAnimatedStyle(() => {
        return {
            height: sheetHeight.value,
        };
    });

    // Sync pill position when mode changes programmatically (e.g. after joining a club)
    useEffect(() => {
        if (mode === 'Single Player') pillPosition.value = 0;
        else if (mode === 'My Club') pillPosition.value = 1;
    }, [mode]);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            if (selectedRun) return; // LOCK: No move while member selected
            context.value = { y: sheetHeight.value };
        })
        .onUpdate((e) => {
            if (selectedRun) return; // LOCK: No move while member selected
            sheetHeight.value = Math.max(SHEET_MIN_HEIGHT, Math.min(SHEET_MAX_HEIGHT, context.value.y - e.translationY));
        })
        .onEnd(() => {
            if (selectedRun) return; // LOCK: No move while member selected
            if (sheetHeight.value > SHEET_MIN_HEIGHT + (SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT) / 2) {
                sheetHeight.value = withSpring(SHEET_MAX_HEIGHT, { damping: 15 });
            } else {
                sheetHeight.value = withSpring(SHEET_MIN_HEIGHT, { damping: 15 });
            }
        });

    const animatedPillStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: withSpring(pillPosition.value * ((width * 0.7 - 8) / 2)) }]
        };
    });

    useEffect(() => {
        // Auth Check & Initial Fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) router.replace('/auth');
            else fetchProfile(); // Hydrate store
        });

        // Delay sync to ensure map engine is ready
        const timer = setTimeout(() => syncTerritories(), 2000);

        // Realtime Subscription
        const channel = supabase
            .channel('public:territories')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'territories' }, () => {
                syncTerritories();
            })
            .subscribe();

        // Presence Mapping for Online Status
        const statusChannel = supabase.channel('user-main-status', {
            config: {
                presence: {
                    key: 'user-presence',
                },
            },
        });

        statusChannel
            .on('presence', { event: 'sync' }, () => {
                const online = statusChannel.presenceState()['user-presence'] !== undefined;
                setOnlineStatus(online);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await statusChannel.track({ online_at: new Date().toISOString() });
                    setOnlineStatus(true);
                }
            });

        return () => {
            clearTimeout(timer);
            supabase.removeChannel(channel);
            supabase.removeChannel(statusChannel);
        };
    }, []);

    const handleCaptureToggle = () => {
        const nextState = !isCapturing;
        setIsCapturing(nextState);
        webViewRef.current?.injectJavaScript(`window.toggleCaptureMode(${nextState});`);
    };

    const handleFinishCapture = async () => {
        webViewRef.current?.injectJavaScript(`
            (function() {
                const path = window.finishCapture();
                if (path) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'CAPTURE_COMPLETE',
                        path: path
                    }));
                }
            })();
        `);
    };

    const saveTerritory = async (path: any[]) => {
        try {
            // Convert path to GeoJSON Polygon
            const geojson = {
                type: 'Polygon',
                coordinates: [path.map(p => [p.lng, p.lat])]
            };

            const { error } = await supabase.rpc('capture_territory', {
                new_poly_geojson: JSON.stringify(geojson)
            });

            if (error) throw error;

            setIsCapturing(false);
            syncTerritories();
        } catch (e) {
            console.error("Save Error:", e);
        }
    };

    const onMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'CAPTURE_COMPLETE') {
                saveTerritory(data.path);
            } else if (data.type === 'LOG') {
                console.log("[WEBVIEW]", data.message);
            } else if (data.type === 'ERROR') {
                console.error("[WEBVIEW_ERROR]", data.message);
            }
        } catch (e) {
            // console.error("Message Error:", e);
        }
    };

    const syncTerritories = async () => {
        try {
            // SINGLE PLAYER LOGIC
            if (mode === 'Single Player' || mode === 'Private Lobby') {
                const { data, error } = await supabase.rpc('get_world_map');

                // MOCK PREVIEW DATA REMOVED FOR PRODUCTION
                // In production, 'data' would be the real source of truth

                const mergedData = {
                    type: 'FeatureCollection',
                    features: data?.features || []
                };

                webViewRef.current?.injectJavaScript(`
                    if (window.updateWorldTerritories) {
                        window.updateWorldTerritories(${JSON.stringify(mergedData)});
                    }
                    if (window.setMapMode) window.setMapMode('SOLO');
                `);
            }

            // CLUB LOGIC
            else if (mode === 'My Club') {
                const clubId = useUserStore.getState().club?.id;
                if (!clubId) return;

                // Fetch FeatureCollection of all member territories
                const { data, error } = await supabase.rpc('get_club_members_map', { p_club_id: clubId });

                let clubGeoJson = data;

                // Fallback to mock member locations if RPC fails
                if (error || !clubGeoJson || !clubGeoJson.features) {
                    const mockRecent = await useUserStore.getState().fetchClubRecentRuns(clubId);
                    clubGeoJson = {
                        type: 'FeatureCollection',
                        features: mockRecent.map(r => ({
                            type: 'Feature',
                            geometry: r.polyline,
                            properties: { username: r.username }
                        }))
                    };
                }

                webViewRef.current?.injectJavaScript(`
                    if (window.updateClubTerritories) {
                        window.updateClubTerritories(${JSON.stringify(clubGeoJson)});
                    }
                    if (window.setMapMode) window.setMapMode('CLUB');
                `);
            }
        } catch (e) {
            console.error("Sync Error:", e);
        }
    };

    // --- MAP CONTROL HANDLERS ---
    const handleLocate = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;

        webViewRef.current?.injectJavaScript(`
            if(window.map) {
                window.map.flyTo({
                    center: [${longitude}, ${latitude}],
                    zoom: 18,
                    pitch: 45,
                    duration: 1500,
                    essential: true
                });
            }
        `);
    };

    const handleToggleHeatmap = async () => {
        const newState = !heatmapActive;
        setHeatmapActive(newState);

        if (newState) {
            // REAL DATA: Fetch all territory centroids/polygons
            // Simple approach: Get all territories and use turf to find center, or just use polygons as heavy heat
            const { data, error } = await supabase.from('territories').select('id, geojson');

            if (data) {
                const heatPoints = {
                    type: 'FeatureCollection',
                    features: data.map((t: any) => {
                        // Convert polygon to point for heatmap or use polygon center
                        // Simplified: just use first coordinate of polygon for speed or random point inside
                        // Correct way: Centroid.
                        // Speed way for demo:
                        try {
                            const poly = JSON.parse(t.geojson);
                            const coord = poly.coordinates[0][0]; // First point
                            return {
                                type: 'Feature',
                                geometry: { type: 'Point', coordinates: coord },
                                properties: { intensity: 1 }
                            };
                        } catch (e) { return null; }
                    }).filter(Boolean)
                };

                webViewRef.current?.injectJavaScript(`
                    window.updateLayerData('heatmap-source', ${JSON.stringify(heatPoints)});
                    window.toggleLayer('heatmap-layer', true);
                `);
            }
        } else {
            webViewRef.current?.injectJavaScript(`window.toggleLayer('heatmap-layer', false);`);
        }
    };

    const handleToggleAQI = async () => {
        const newState = !aqiActive;
        setAqiActive(newState);

        if (newState) {
            // REAL DATA: Google Air Quality API
            // 1. Get current map center or user location
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = loc.coords;

                const aqiData = await fetchLocalAQI(latitude, longitude);

                if (aqiData) {
                    // Create a large coverage circle/polygon for the city based on this reading
                    // Since API is point-based, we fake a "region" fill
                    const size = 0.05; // roughly 5km box
                    const box = [
                        [longitude - size, latitude - size],
                        [longitude + size, latitude - size],
                        [longitude + size, latitude + size],
                        [longitude - size, latitude + size],
                        [longitude - size, latitude - size]
                    ];

                    const aqiGeoJSON = {
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: { type: 'Polygon', coordinates: [box] },
                            properties: { color: aqiData.color }
                        }]
                    };

                    webViewRef.current?.injectJavaScript(`
                        window.updateLayerData('aqi-source', ${JSON.stringify(aqiGeoJSON)});
                        window.toggleLayer('aqi-layer', true);
                    `);
                    console.log("AQI DATA:", aqiData);
                }
            }
        } else {
            webViewRef.current?.injectJavaScript(`window.toggleLayer('aqi-layer', false);`);
        }
    };

    const handleToggleSafety = async () => {
        const newState = !safetyActive;
        setSafetyActive(newState);

        if (newState) {
            // REAL DATA: Fetch from 'safety_reports' table
            const { data, error } = await supabase.from('safety_reports').select('*');

            let safetyFeatures: any[] = [];
            if (data && data.length > 0) {
                safetyFeatures = data.map((item: any) => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [item.lng, item.lat] },
                    properties: { type: item.type === 'safe' ? 'safe' : 'danger' }
                }));
            }

            const safetyGeoJSON = {
                type: 'FeatureCollection',
                features: safetyFeatures
            };

            webViewRef.current?.injectJavaScript(`
                window.updateLayerData('safety-source', ${JSON.stringify(safetyGeoJSON)});
                window.toggleShieldMode(true);
            `);
        } else {
            webViewRef.current?.injectJavaScript(`window.toggleShieldMode(false);`);
        }
    };

    // Map Navigation to Selected Run
    useEffect(() => {
        if (selectedRun && selectedRun.polyline && selectedRun.polyline.coordinates) {
            // Robust coordinate extraction
            let lng, lat;
            try {
                const geom = selectedRun.polyline;
                const center = geom.type === 'Polygon' ? geom.coordinates[0][0] :
                    (Array.isArray(geom.coordinates[0]) ? geom.coordinates[0] : geom.coordinates);

                lng = center[0];
                lat = center[1];

                if (isNaN(lng) || isNaN(lat)) throw new Error("Invalid Lat/Lng");
            } catch (err) {
                console.warn("[MAP] Extraction failed:", err);
                return;
            }

            console.log(`[MAP] Task: flyToMember ${selectedRun.username} at [${lng}, ${lat}]`);

            webViewRef.current?.injectJavaScript(`
                if (window.flyToMember) {
                    window.flyToMember(${lng}, ${lat}, ${JSON.stringify(selectedRun.polyline)});
                }
            `);
        } else if (!selectedRun) {
            webViewRef.current?.injectJavaScript(`
                if (window.retreatToNormal) {
                    window.retreatToNormal();
                }
            `);
        }
    }, [selectedRun]);

    // Re-sync when mode changes
    useEffect(() => {
        syncTerritories();
    }, [mode]);

    // Adjust sheet height based on member selection
    useEffect(() => {
        if (selectedRun) {
            sheetHeight.value = withSpring(SHEET_SELECTED_HEIGHT, { damping: 15 });
        } else {
            // When returning to list, expand back to max height if we were in the selection view
            if (sheetHeight.value === SHEET_SELECTED_HEIGHT) {
                sheetHeight.value = withSpring(SHEET_MAX_HEIGHT, { damping: 15 });
            }
        }
    }, [selectedRun]);

    const globeHTML = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset='utf-8' />
        <title>Zenith Conquest Map</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
        <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
        <style>
          html, body { margin: 0; padding: 0; background: #000; height: 100%; width: 100%; overflow: hidden; }
          #map { height: 100%; width: 100%; background: #1F2329 !important; }
          .tactical-hud {
            position: absolute; top: 130px; left: 20px; color: #CCFF00; font-family: monospace; font-size: 10px;
            z-index: 1000; pointer-events: none; opacity: 0.8; letter-spacing: 2px; text-transform: uppercase;
            text-shadow: 0 0 5px rgba(204, 255, 0, 0.5);
          }
          .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>

        <script>
          mapboxgl.accessToken = '${MAPBOX_TOKEN}';
          
          window.map = null;
          // TELEMETRY BRIDGE: Send logs back to React Native
          const _log = console.log;
          const _err = console.error;
          console.log = function(...args) {
            _log.apply(console, args);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', message: args.join(' ') }));
          };
          console.error = function(...args) {
            _err.apply(console, args);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: args.join(' ') }));
          };

          function updateHUD(txt) {
            console.log("HUD:", txt);
          }

          function initMap() {
            window.map = new mapboxgl.Map({
              container: 'map',
              style: '${MAPBOX_STYLE}',
              center: [78, 20],
              zoom: 3.5,
              antialias: false
            });

            window.map.on('style.load', () => {
              window.map.addSource('territories', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
              });

              // Club Territory Source
              window.map.addSource('club-territory', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
              });

              // Add Capture Source
              window.map.addSource('capture', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
              });

              // Add Selected Run Highlight Source
              window.map.addSource('selected-run', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
              });

              // TERRITORY LAYER (Below roads)
              const layers = window.map.getStyle().layers;
              let firstRoadLayer;
              for (const layer of layers) {
                if (layer.id.includes('road') || layer.id.includes('bridge') || layer.id.includes('tunnel')) {
                  firstRoadLayer = layer.id;
                  break;
                }
              }

              window.map.addLayer({
                'id': 'territories-fill',
                'type': 'fill',
                'source': 'territories',
                'paint': {
                  'fill-color': '#4A5568',
                  'fill-opacity': 0.4
                }
              }, firstRoadLayer);

              window.map.addLayer({
                'id': 'territories-outline',
                'type': 'line',
                'source': 'territories',
                'paint': {
                  'line-color': '#CBD5E0',
                  'line-width': 1,
                  'line-opacity': 0.5
                }
              });

              // CLUB LAYER
              window.map.addLayer({
                'id': 'club-layer',
                'type': 'fill',
                'source': 'club-territory',
                'layout': { 'visibility': 'none' },
                'paint': {
                  'fill-color': '#CCFF00',
                  'fill-opacity': 0.6,
                  'fill-outline-color': '#FFFFFF'
                }
              }, firstRoadLayer);

              // CAPTURE LAYER
              window.map.addLayer({
                'id': 'capture-poly',
                'type': 'fill',
                'source': 'capture',
                'paint': { 'fill-color': '#FFFFFF', 'fill-opacity': 0.1 }
              });
              
              window.map.addLayer({
                'id': 'capture-line',
                'type': 'line',
                'source': 'capture',
                'paint': { 
                  'line-color': '#FFFFFF', 
                  'line-width': 2,
                  'line-opacity': 0.8
                }
              });
              // Removed Bloom/Glow for Stealth Aesthetic

              // SELECTED RUN HIGHLIGHT LAYER (Bold & Glowing)
              window.map.addLayer({
                'id': 'selected-run-fill',
                'type': 'fill',
                'source': 'selected-run',
                'paint': {
                  'fill-color': '#FFFFFF',
                  'fill-opacity': 0.3
                }
              });

              window.map.addLayer({
                'id': 'selected-run-layer',
                'type': 'line',
                'source': 'selected-run',
                'paint': {
                  'line-color': '#FFFFFF',
                  'line-width': 4,
                  'line-opacity': 0.9
                }
              });

              // Debug style ID removed

              // --- NEW LAYERS FOR CONTROLS ---

              // 1. HEATMAP
              window.map.addSource('heatmap-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
              window.map.addLayer({
                  id: 'heatmap-layer',
                  type: 'heatmap',
                  source: 'heatmap-source',
                  layout: { visibility: 'none' },
                  paint: {
                      'heatmap-weight': 1,
                      'heatmap-intensity': 1,
                      'heatmap-color': [
                          'interpolate', ['linear'], ['heatmap-density'],
                          0, 'rgba(0,0,0,0)',
                          0.2, '#2A4858',
                          0.4, '#00E5FF',
                          0.6, '#00FF00',
                          0.8, '#CCFF00',
                          1, '#FF0000'
                      ],
                      'heatmap-radius': 25,
                      'heatmap-opacity': 0.6
                  }
              });

              // 2. AQI
              window.map.addSource('aqi-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
              window.map.addLayer({
                  id: 'aqi-layer',
                  type: 'fill',
                  source: 'aqi-source',
                  layout: { visibility: 'none' },
                  paint: {
                      'fill-color': ['get', 'color'],
                      'fill-opacity': 0.25
                  }
              });

              // 3. SAFETY
              window.map.addSource('safety-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
              window.map.addLayer({
                  id: 'safety-layer',
                  type: 'circle',
                  source: 'safety-source',
                  layout: { visibility: 'none' },
                  paint: {
                      'circle-radius': 30,
                      'circle-color': [
                          'match', ['get', 'type'],
                          'safe', '#00FF00',
                          'danger', '#FF0000',
                          '#AAAAAA'
                      ],
                      'circle-opacity': 0.4,
                      'circle-blur': 0.5
                  }
              });

            });

            window.toggleLayer = function(id, visible) {
                if (window.map && window.map.getLayer(id)) {
                    window.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
                }
            };

            window.updateLayerData = function(sourceId, data) {
                if (window.map && window.map.getSource(sourceId)) {
                    window.map.getSource(sourceId).setData(data);
                }
            };

            window.toggleShieldMode = function(enabled) {
                if (!window.map) return;
                const opacity = enabled ? 0.8 : 0;
                // Darken map
                window.map.setPaintProperty('background', 'background-color', enabled ? '#000000' : '#1F2329');
                // Highlight safe routes (simulated by showing safety layer with high index)
                window.toggleLayer('safety-layer', enabled);
                if (enabled) {
                    window.map.setPaintProperty('safety-layer', 'circle-color', '#00FF00'); // Neon Green
                    window.map.setPaintProperty('safety-layer', 'circle-opacity', 0.8);
                }
            };

            window.triggerPulse = function() {
                if (!window.map) return;
                let opacity = 0.8;
                const interval = setInterval(() => {
                    opacity -= 0.05;
                    window.map.setPaintProperty('territories-fill', 'fill-opacity', opacity);
                    if (opacity <= 0.25) {
                        clearInterval(interval);
                        window.map.setPaintProperty('territories-fill', 'fill-opacity', 0.25);
                    }
                }, 30);
            };

            window.map.on('click', (e) => {
              if (typeof isCaptureMode !== 'undefined' && isCaptureMode) {
                const coords = [e.lngLat.lng, e.lngLat.lat];
                capturePoints.push(coords);
                updateCaptureDisplay();
              }
            });

            map.on('moveend', () => {
              // HUD Coordinate update removed for performance/UI cleanup
            });
          }

          let isCaptureMode = false;
          let capturePoints = [];

          function updateCaptureDisplay() {
            if (capturePoints.length === 0) return;
            
            const features = [];
            // Line
            features.push({
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: capturePoints }
            });
            // Points
            capturePoints.forEach(p => {
              features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: p }
              });
            });

            map.getSource('capture').setData({
              type: 'FeatureCollection',
              features: features
            });
          }

          window.updateWorldTerritories = function(geoJson) {
            if (!window.map || !window.map.getSource('territories')) return;
            window.map.getSource('territories').setData(geoJson);
          };

          window.updateClubTerritories = function(geoJson) {
            if (!window.map || !window.map.getSource('club-territory')) return;
            window.map.getSource('club-territory').setData(geoJson || { type: 'FeatureCollection', features: [] });
          };

          window.setMapMode = function(mode) {
              if (!window.map) return;
              if (mode === 'CLUB') {
                  window.map.setLayoutProperty('territories-fill', 'visibility', 'none');
                  window.map.setLayoutProperty('club-layer', 'visibility', 'visible');
              } else {
                  window.map.setLayoutProperty('territories-fill', 'visibility', 'visible');
                  window.map.setLayoutProperty('club-layer', 'visibility', 'none');
              }
          };

          window.toggleCaptureMode = function(enabled) {
            isCaptureMode = enabled;
            if (!enabled) {
              capturePoints = [];
              if (window.map && window.map.getSource('capture')) {
                window.map.getSource('capture').setData({ type: 'FeatureCollection', features: [] });
              }
            }
          };

          window.flyToMember = function(lng, lat, polyline) {
            if (!window.map) return;
            if (!isFinite(lng) || !isFinite(lat)) {
              console.error("Invalid flying coordinates:", lng, lat);
              return;
            }

            try {
              window.map.flyTo({
                center: [lng, lat],
                zoom: 15.5,
                pitch: 50,
                speed: 1.2,
                curve: 1.2,
                essential: true
              });

              const src = window.map.getSource('selected-run');
              if (src) {
                src.setData({
                  type: 'Feature',
                  geometry: polyline,
                  properties: {}
                });
              }
            } catch (err) {
              console.error("flyToMember failed:", err.message);
            }
          };

          window.retreatToNormal = function() {
            if (!window.map) return;
            try {
              window.map.flyTo({
                center: [78, 20],
                zoom: 3.5,
                pitch: 0,
                speed: 0.8,
                essential: true
              });
              const src = window.map.getSource('selected-run');
              if (src) src.setData({ type: 'FeatureCollection', features: [] });
            } catch (err) {
              console.error("retreatToNormal failed:", err.message);
            }
          };

          window.finishCapture = function() {
            if (capturePoints.length < 3) return null;
            const path = capturePoints.map(p => ({ lng: p[0], lat: p[1] }));
            window.toggleCaptureMode(false);
            return path;
          };

          initMap();
        </script>
      </body>
    </html>
    `, [MAPBOX_TOKEN, MAPBOX_STYLE]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View style={styles.globeContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ html: globeHTML }}
                    style={styles.webview}
                    scrollEnabled={false}
                    bounces={false}
                    onLoadEnd={() => setTimeout(syncTerritories, 1000)}
                    onMessage={onMessage}
                />
            </View>

            {/* UI LAYOUT: NO CHANGES MADE TO LABELS OR POSITIONING */}
            {/* TOP BAR: THE CONTROLLER */}
            <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
                <View style={styles.headerRow}>
                    <View style={{ width: 44 }} />

                    <BlurView intensity={30} tint="dark" style={styles.topBarPill}>
                        <Animated.View style={[styles.activePillBackground, animatedPillStyle]} />
                        <TouchableOpacity style={styles.pillOption} onPress={() => { setMode('Single Player'); pillPosition.value = 0; }}>
                            <Text style={[styles.pillText, mode === 'Single Player' && styles.pillTextActive]}>Single Player</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.pillOption} onPress={() => { setMode('My Club'); pillPosition.value = 1; }}>
                            <Text style={[styles.pillText, mode === 'My Club' && styles.pillTextActive]}>My Club</Text>
                        </TouchableOpacity>
                    </BlurView>

                    <TouchableOpacity
                        style={styles.profileBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setIsAccountOpen(true);
                        }}
                    >
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarCircle}>
                                <Image
                                    source={{ uri: 'https://i.pravatar.cc/150?u=albert' }}
                                    style={styles.avatarImageSmall}
                                />
                            </View>
                            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#4CAF50' : '#FF3B30' }]} />
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* MAP LEGEND OVERLAY */}
            <MapLegend type={heatmapActive ? 'HEATMAP' : aqiActive ? 'AQI' : safetyActive ? 'SAFETY' : null} />

            {/* ACTION BUTTONS (STACKED on RIGHT) */}
            <View style={styles.rightActions} pointerEvents="box-none">
                <View style={styles.actionColumn}>
                    <MapControls
                        onLocate={handleLocate}
                        onToggleHeatmap={handleToggleHeatmap}
                        onToggleAQI={handleToggleAQI}
                        onToggleSafety={handleToggleSafety}
                        isHeatmapActive={heatmapActive}
                        isAQIActive={aqiActive}
                        isSafetyActive={safetyActive}
                    />
                    <View style={{ height: 20 }} />
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#FFFFFF' }]}
                        onPress={() => {
                            if (mode === 'Single Player') router.push('/run');
                        }}
                    >
                        <Ionicons name="add" size={32} color="black" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* BOTTOM SHEET: THE CONTEXT (Draggable) */}
            <View style={styles.bottomOverlay} pointerEvents="box-none">
                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[styles.bottomSheetWrapper, sheetStyle]}>
                        <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
                            <View style={styles.dragIndicatorContainer}>
                                {selectedRun ? (
                                    <View style={styles.lockIconContainer}>
                                        <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.4)" />
                                    </View>
                                ) : (
                                    <View style={styles.dragIndicator} />
                                )}
                            </View>

                            {/* Scrollable Content Container */}
                            <View style={{ flex: 1 }}>
                                <View style={styles.tabContainer}>
                                    <View style={styles.secondaryTabs}>
                                        {mode === 'Private Lobby' && ['My Lobbies', 'Invites', 'Settings'].map(tab => (
                                            <TouchableOpacity key={tab} style={styles.secTab} onPress={() => setActiveSubTab(tab)}>
                                                <Text style={[styles.secTabText, activeSubTab === tab && styles.secTabTextActive]}>{tab}</Text>
                                                {activeSubTab === tab && <View style={styles.activeIndicator} />}
                                            </TouchableOpacity>
                                        ))}
                                        {mode === 'Single Player' && ['Leaderboard', 'Events', 'Territories', 'History'].map(tab => (
                                            <TouchableOpacity key={tab} style={styles.secTab} onPress={() => setActiveSubTab(tab)}>
                                                <Text style={[styles.secTabText, activeSubTab === tab && styles.secTabTextActive]}>{tab}</Text>
                                                {activeSubTab === tab && <View style={styles.activeIndicator} />}
                                            </TouchableOpacity>
                                        ))}
                                        {mode === 'My Club' && (
                                            // Tabs are handled internally by ClubDashboard
                                            null
                                        )}
                                    </View>
                                    <View style={styles.tabDivider} />
                                </View>

                                <View style={styles.sheetContent}>
                                    {mode === 'Single Player' && activeSubTab === 'Leaderboard' && <LeaderboardList />}

                                    {previewClub && <ClubProfileView />}
                                    {!previewClub && mode === 'My Club' && (!club || isChangingClub) && <ClubDiscovery />}
                                    {!previewClub && mode === 'My Club' && club && !isChangingClub && <ClubDashboard club={club} />}

                                    {mode === 'Single Player' && activeSubTab === 'Events' && (
                                        <View style={styles.emptyStateContainer}>
                                            <Text style={styles.emptyStateText}>
                                                You don't have any events, when someone takes some of your territory it will show here.
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </BlurView>
                    </Animated.View>
                </GestureDetector>

                {/* MAIN TAB BAR - STATIC */}
                <View style={styles.mainTabBarWrapper}>
                    <BlurView intensity={30} tint="dark" style={styles.mainTabBar}>
                        <TouchableOpacity
                            style={styles.navItem}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setCurrentTab('Play');
                            }}
                        >
                            <MaterialCommunityIcons
                                name="earth"
                                size={26}
                                color={currentTab === 'Play' ? 'white' : '#444'}
                            />
                            <Text style={currentTab === 'Play' ? styles.navText : styles.navTextDim}>Play</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.navItem}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setIsAccountOpen(true);
                                setCurrentTab('Me');
                            }}
                        >
                            <Ionicons
                                name="person"
                                size={26}
                                color={currentTab === 'Me' ? 'white' : '#444'}
                            />
                            <Text style={currentTab === 'Me' ? styles.navText : styles.navTextDim}>Me</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.navItem}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setCurrentTab('Feed');
                            }}
                        >
                            <Ionicons
                                name="people-outline"
                                size={26}
                                color={currentTab === 'Feed' ? 'white' : '#444'}
                            />
                            <Text style={currentTab === 'Feed' ? styles.navText : styles.navTextDim}>Feed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/run')}>
                            <MaterialCommunityIcons name="run" size={26} color="#444" />
                            <Text style={styles.navTextDim}>Start</Text>
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </View>

            {/* FULL SCREEN ACCOUNT OVERLAY */}
            {isAccountOpen && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
                    <AccountPanel
                        isOnline={isOnline}
                        onClose={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setIsAccountOpen(false);
                            setCurrentTab('Play'); // Reset tab state
                        }}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1F2329' },
    globeContainer: { flex: 1, zIndex: 1 },
    webview: { flex: 1, backgroundColor: '#1F2329' },
    topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, zIndex: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Platform.OS === 'android' ? 45 : 10 },
    notificationBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    // TOP BAR PILL
    topBarPill: {
        flexDirection: 'row',
        width: width * 0.7,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(28, 28, 30, 0.9)',
        padding: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden'
    },
    activePillBackground: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: (width * 0.7 - 8) / 2,
        height: 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
    },
    pillOption: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2
    },
    pillText: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif'
    },
    pillTextActive: {
        color: '#000000',
        fontWeight: '900'
    },

    profileBtn: { padding: 2 },
    avatarContainer: { position: 'relative' },
    avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    avatarImageSmall: { width: '100%', height: '100%' },
    avatarInitials: { color: 'white', fontSize: 13, fontWeight: '900' },
    statusIndicator: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#ff4444', borderWidth: 2, borderColor: '#1F2329' },

    rightActions: { position: 'absolute', right: 20, bottom: 120, zIndex: 5 },
    actionColumn: { alignItems: 'center', gap: 16 },
    actionBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
    bottomSheetWrapper: { marginHorizontal: 0, borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden', marginBottom: 0 },
    blurContainer: { flex: 1, paddingVertical: 8, backgroundColor: '#1C1C1E' },
    dragIndicatorContainer: { height: 20, justifyContent: 'center', alignItems: 'center' },
    dragIndicator: { width: 44, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2 },
    lockIconContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tabContainer: { width: '100%' },
    secondaryTabs: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20 },
    secTab: { alignItems: 'center', paddingVertical: 6, minWidth: 80, position: 'relative' },
    secTabText: { color: '#8E8E93', fontSize: 13, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif' },
    secTabTextActive: { color: 'white' },
    activeIndicator: { position: 'absolute', bottom: -5, width: '100%', height: 3, backgroundColor: '#FFF', borderRadius: 2 },
    tabDivider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 0 },

    sheetContent: { flex: 1, paddingVertical: 10 },
    emptyStateContainer: { width: '100%', alignItems: 'center', paddingHorizontal: 40 },
    emptyStateText: { color: '#8E8E93', fontSize: 15, textAlign: 'center', lineHeight: 22, fontWeight: '500' },
    placeholderText: { color: '#444', fontSize: 14, fontWeight: '700' },

    mainTabBarWrapper: { backgroundColor: '#1C1C1E', paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
    mainTabBar: { height: 64, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    navText: { color: 'white', fontSize: 11, fontWeight: '900', marginTop: 6, letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif' },
    navTextDim: { color: '#444', fontSize: 11, fontWeight: '900', marginTop: 6, letterSpacing: 0.5 }
});
