import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, Dimensions, Platform, Switch } from 'react-native';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiaW14MjM1MzI2IiwiYSI6ImNta3F5anEyODBzbDUzZnNhZGF2Y3c5Y2MifQ.HFKhNFIWTgdQQb3n7IL9Rg';
const MAPBOX_STYLE = process.env.EXPO_PUBLIC_MAPBOX_STYLE_ID || 'mapbox://styles/imx235326/cmkqzrvie004i01r0cfnr2sfu';

export default function PlanRouteScreen() {
    const router = useRouter();
    const webViewRef = useRef<WebView>(null);
    const [showTerritories, setShowTerritories] = useState(true);
    const [isDrawing, setIsDrawing] = useState(false);
    const [distance, setDistance] = useState(0);
    const [area, setArea] = useState(0);

    const mapboxHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset='utf-8' />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
        <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
        <script src="https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js"></script>
        <style>
          body { margin: 0; padding: 0; background: #09090b; overflow: hidden; }
          #map { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          mapboxgl.accessToken = '${MAPBOX_TOKEN}';
          
          let isDrawing = false; 
          let draftPoints = []; 
          let masterRoute = []; 
          let lastPoint = null;

          const map = new mapboxgl.Map({
            container: 'map',
            style: '${MAPBOX_STYLE}',
            center: [77.2090, 28.6139],
            zoom: 16,
            pitch: 0,
            antialias: true,
            dragPan: true,
            touchZoomRotate: true
          });

          map.on('load', () => {
              // --- 1. TERRITORY FILL LAYER (The "Captured" Zone) ---
              map.addSource('territory', {
                  type: 'geojson',
                  data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] } }
              });

              map.addLayer({
                  id: 'territory-fill',
                  type: 'fill',
                  source: 'territory',
                  paint: {
                      'fill-color': '#FF8577', 
                      'fill-opacity': 0.3 // Matches user request
                  }
              });
              
              map.addLayer({
                  id: 'territory-border',
                  type: 'line',
                  source: 'territory',
                  layout: { 'line-join': 'round', 'line-cap': 'round' },
                  paint: {
                      'line-color': '#FF8577',
                      'line-width': 5, // Matches user request
                      'line-opacity': 1.0
                  }
              });

              // --- 2. SNAPPED ROUTE LAYER (The "Path") ---
              map.addSource('snapped', {
                  type: 'geojson',
                  data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
              });

              map.addLayer({
                  id: 'snapped-line',
                  type: 'line',
                  source: 'snapped',
                  layout: { 'line-cap': 'round', 'line-join': 'round' },
                  paint: {
                      'line-color': '#4285F4',
                      'line-width': 4,
                      'line-opacity': 1.0
                  }
              });

              // --- 3. DRAFT LAYER (Visual Feedback while drawing) ---
              map.addSource('draft', {
                  type: 'geojson',
                  data: { type: 'FeatureCollection', features: [] }
              });

              map.addLayer({
                  id: 'draft-line',
                  type: 'line',
                  source: 'draft',
                  layout: { 'line-cap': 'round', 'line-join': 'round' },
                  paint: {
                      'line-color': '#FFFFFF', 
                      'line-width': 2,
                      'line-dasharray': [2, 2],
                      'line-opacity': 0.8
                  }
              });

              map.addLayer({
                  id: 'draft-points',
                  type: 'circle',
                  source: 'draft',
                  filter: ['==', '$type', 'Point'],
                  paint: {
                      'circle-radius': 5,
                      'circle-color': '#FF8577',
                      'circle-stroke-width': 2,
                      'circle-stroke-color': '#FFFFFF'
                  }
              });
          });

          // --- INTERACTION LOGIC ---

          map.on('touchstart', (e) => {
              if (!isDrawing) return;
              e.preventDefault();
              startSegment(e.lngLat);
          });

          map.on('touchmove', (e) => {
              if (!isDrawing) return;
              e.preventDefault();
              addPoint(e.lngLat);
          });

          map.on('touchend', (e) => {
              if (!isDrawing) return;
              finishSegment();
          });

          function startSegment(lngLat) {
              draftPoints = [[lngLat.lng, lngLat.lat]];
              lastPoint = map.project(lngLat);
              updateDraftVisuals();
          }

          function addPoint(lngLat) {
              const currentPoint = map.project(lngLat);
              const dist = Math.sqrt(
                  Math.pow(currentPoint.x - lastPoint.x, 2) + 
                  Math.pow(currentPoint.y - lastPoint.y, 2)
              );

              // 10px threshold for sufficient resolution for 'tidy' to work effectively
              if (dist > 10) { 
                  draftPoints.push([lngLat.lng, lngLat.lat]);
                  lastPoint = currentPoint;
                  updateDraftVisuals();
                  sendToRN({ type: 'tick' }); 
              }
          }

          function updateDraftVisuals() {
              const lineFeat = { type: 'Feature', geometry: { type: 'LineString', coordinates: draftPoints } };
              map.getSource('draft').setData({
                  type: 'FeatureCollection',
                  features: [lineFeat]
              });
          }

          async function finishSegment() {
              if (draftPoints.length < 2) return;

              let finalPoints = draftPoints;
              // Mapbox API limit check (100 coords max per request)
              if (draftPoints.length > 99) {
                  const step = Math.ceil(draftPoints.length / 99);
                  finalPoints = draftPoints.filter((_, i) => i % step === 0);
              }

              // --- PRO MAP MATCHING CONFIGURATION ---
              const coordsString = finalPoints.map(c => c.join(',')).join(';');
              
              // 1. Set radiuses=25 for EVERY point (Strict 25m search area)
              const radiuses = finalPoints.map(() => 25).join(';');

              // 2. Constructed URL with:
              // - profile: walking (For pedestrian paths)
              // - geometries: geojson (Full curves)
              // - radiuses: (Strict snapping)
              // - tidy: true (Clean up jitter)
              // - overview: full (High resolution)
              const url = \`https://api.mapbox.com/matching/v5/mapbox/walking/\${coordsString}?\` + 
                          \`geometries=geojson&\` +
                          \`radiuses=\${radiuses}&\` +
                          \`tidy=true&\` +
                          \`overview=full&\` +
                          \`access_token=\${mapboxgl.accessToken}\`;

              try {
                  const res = await fetch(url);
                  const data = await res.json();

                  if (data.code === 'Ok' && data.matchings && data.matchings.length > 0) {
                      const cleanCoords = data.matchings[0].geometry.coordinates;
                      const addedDist = data.matchings[0].distance;

                      // Append snaps to master route
                      if (masterRoute.length > 0) {
                          masterRoute = [...masterRoute, ...cleanCoords];
                      } else {
                          masterRoute = cleanCoords;
                      }

                      // Update Visuals
                      updateMapVisuals();

                      // Clear Draft
                      map.getSource('draft').setData({ type: 'FeatureCollection', features: [] });
                      draftPoints = [];

                      // Send Stats
                      sendToRN({ type: 'add_dist', dist: addedDist });
                  } else {
                      console.log("Match failed or low confidence");
                  }
              } catch (e) {
                  console.error(e);
              }
          }

          function updateMapVisuals() {
             if (masterRoute.length < 1) return;

             // 1. Update the Snapped Line
             map.getSource('snapped').setData({
                 type: 'Feature',
                 geometry: { type: 'LineString', coordinates: masterRoute }
             });

             // 2. Update the Territory Polygon
             try {
                // Ensure we have enough points for a polygon
                if (masterRoute.length >= 3) {
                    
                    // Force Close the Loop: Copy first point to end
                    const closedCoords = [...masterRoute];
                    const start = closedCoords[0];
                    const end = closedCoords[closedCoords.length - 1];
                    
                    if (start[0] !== end[0] || start[1] !== end[1]) {
                        closedCoords.push(start);
                    }

                    // Convert to Turf LineString then to Polygon for robustness
                    const lineString = turf.lineString(closedCoords);
                    const polygon = turf.lineToPolygon(lineString);

                    map.getSource('territory').setData(polygon);

                    // Calculate Area
                    const areaSqM = turf.area(polygon);
                    sendToRN({ type: 'update_area', area: areaSqM });
                }
             } catch (err) {
                 console.log("Polygon construction error", err);
             }
          }

          function sendToRN(msg) {
              if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
          }

          document.addEventListener("message", function(event) { handleMessage(event.data); });
          window.addEventListener("message", function(event) { handleMessage(event.data); });

          function handleMessage(payload) {
              try {
                  const msg = JSON.parse(payload);
                  if (msg.type === 'start_draw') {
                      isDrawing = true;
                      map.dragPan.disable();
                      map.touchZoomRotate.disable();
                  } else if (msg.type === 'stop_draw') {
                      isDrawing = false;
                      map.dragPan.enable();
                      map.touchZoomRotate.enable();
                      // Auto-finalize on stop draw? Optional, currently done per stroke.
                  } else if (msg.type === 'clear') {
                      masterRoute = [];
                      draftPoints = [];
                      map.getSource('snapped').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
                      map.getSource('draft').setData({ type: 'FeatureCollection', features: [] });
                      map.getSource('territory').setData({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [] } });
                      sendToRN({ type: 'clear' });
                  } else if (msg.type === 'toggle_territories') {
                       const opacity = msg.value ? 0.3 : 0;
                       map.setPaintProperty('territory-fill', 'fill-opacity', opacity);
                       map.setPaintProperty('territory-border', 'line-opacity', msg.value ? 1.0 : 0);
                  }
              } catch (e) {}
          }
        </script>
      </body>
    </html>
    `;

    const handleWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'tick') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else if (data.type === 'add_dist') {
                const addedFt = Math.floor(data.dist * 3.28084);
                setDistance(prev => prev + addedFt);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else if (data.type === 'update_area') {
                const areaSqFt = Math.floor(data.area * 10.7639);
                setArea(areaSqFt);
            } else if (data.type === 'clear') {
                setDistance(0);
                setArea(0);
            }
        } catch (e) { }
    };

    const toggleDrawing = () => {
        const nextState = !isDrawing;
        setIsDrawing(nextState);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
                type: nextState ? 'start_draw' : 'stop_draw'
            }));
        }
    };

    const toggleTerritories = (val: boolean) => {
        setShowTerritories(val);
        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
                type: 'toggle_territories', value: val
            }));
        }
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: mapboxHTML }}
                style={styles.map}
                scrollEnabled={false}
                onMessage={handleWebViewMessage}
            />

            {/* HEADER */}
            <SafeAreaView style={styles.topOverlay}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>DISTANCE</Text>
                            <Text style={styles.statValue}>{(distance / 5280).toFixed(2)}mi</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>CAPTURE</Text>
                            <Text style={styles.statValue}>{(area / 43560).toFixed(2)}ac</Text>
                        </View>
                    </View>
                    <View style={{ width: 44 }} />
                </View>

                {/* INFO */}
                <View style={styles.subHeader}>
                    <BlurView intensity={20} tint="dark" style={styles.infoPill}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 6 }} />
                        <Text style={styles.infoText}>{(distance * 0.3048).toFixed(0)}m length</Text>
                    </BlurView>
                </View>
            </SafeAreaView>

            {/* CONTROLS */}
            <View style={styles.rightActions}>
                <View style={styles.mapControls}>
                    <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            if (webViewRef.current) {
                                webViewRef.current.postMessage(JSON.stringify({ type: 'clear' }));
                            }
                        }}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* DRAW BTN */}
            <View style={styles.drawContainer}>
                <TouchableOpacity
                    style={[styles.drawBtn, isDrawing && styles.drawBtnActive]}
                    onPress={toggleDrawing}
                >
                    <MaterialCommunityIcons
                        name={isDrawing ? "check" : "pencil"}
                        size={32}
                        color="white"
                    />
                    <Text style={styles.drawBtnText}>{isDrawing ? "Done" : "Draw"}</Text>
                </TouchableOpacity>
            </View>

            {/* BOTTOM BAR */}
            <View style={styles.bottomBarWrapper}>
                <View style={styles.bottomControls}>
                    <BlurView intensity={20} tint="dark" style={styles.actionGroup}>
                        <TouchableOpacity style={styles.miniBtn}>
                            <Ionicons name="arrow-undo" size={20} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.miniBtn}>
                            <Ionicons name="arrow-redo" size={20} color="white" />
                        </TouchableOpacity>
                    </BlurView>
                    <View style={styles.centerAction}>
                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                router.back();
                            }}
                        >
                            <Text style={styles.saveBtnText}>Save Route</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.toggleContainer}>
                        <Switch
                            value={showTerritories}
                            onValueChange={toggleTerritories}
                            trackColor={{ false: '#767577', true: '#FF8577' }}
                            thumbColor={showTerritories ? '#FFFFFF' : '#f4f3f4'}
                        />
                        <Text style={styles.toggleText}>Territories</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1F2329' },
    map: { flex: 1 },
    topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: Platform.OS === 'android' ? 40 : 10
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20
    },
    statBox: { alignItems: 'center', paddingHorizontal: 10 },
    statLabel: { color: '#8E8E93', fontSize: 10, fontWeight: '800' },
    statValue: { color: 'white', fontSize: 24, fontWeight: '900' },
    statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
    subHeader: { alignItems: 'center', marginTop: 10 },
    infoPill: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)'
    },
    infoText: { color: 'white', fontSize: 13, fontWeight: '800' },
    rightActions: { position: 'absolute', right: 20, top: 120, zIndex: 10 },
    mapControls: { gap: 10 },
    controlBtn: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    drawContainer: { position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center', zIndex: 20 },
    drawBtn: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8
    },
    drawBtnActive: { backgroundColor: '#FF8577', borderColor: 'white' },
    drawBtnText: { color: 'white', fontSize: 10, fontWeight: '900', marginTop: 4, textTransform: 'uppercase' },
    bottomBarWrapper: {
        position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', paddingBottom: Platform.OS === 'ios' ? 34 : 20, paddingTop: 15, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)'
    },
    bottomControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    actionGroup: {
        flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, gap: 15
    },
    miniBtn: { padding: 4 },
    centerAction: { alignItems: 'center', flex: 1 },
    saveBtn: {
        backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    saveBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
    toggleContainer: { alignItems: 'center' },
    toggleText: { color: 'white', fontSize: 9, fontWeight: '700', marginTop: 5 }
});
