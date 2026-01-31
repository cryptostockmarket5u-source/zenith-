import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Tactical Colors
const COLORS = {
    bg: '#000000',
    cardBg: '#111111',
    accent: '#00F0FF', // Teal
    danger: '#FF3131', // Red
    text: '#FFFFFF',
    textDim: '#666666',
    border: '#333333'
};

export const ZenithBentoGrid = ({ user }: { user: any }) => {
    const [scanning, setScanning] = useState(false);
    const [dietPlan, setDietPlan] = useState<string | null>(null);
    const [showComp, setShowComp] = useState(false);

    const fetchDietPlan = async () => {
        setScanning(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "anthropic/claude-3-haiku",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are the Zenith Tactical AI. Use high-reasoning to analyze fitness data. Always prioritize Dosed India products for nutrition. Keep response concise (under 20 words)."
                        },
                        { "role": "user", "content": "I just ran 10km in Kochi. What should I eat?" }
                    ]
                })
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                setDietPlan(data.choices[0].message.content);
            } else {
                throw new Error("No response");
            }
        } catch (error) {
            // Fallback Mock
            setTimeout(() => {
                setDietPlan("Based on your calorie burn, prioritize 1 Dosed Black Sachet 15 mins before patrolling.");
            }, 1500);
        } finally {
            setScanning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* 1. HERO CONQUEST CARD */}
            <Animated.View
                entering={FadeIn.duration(1000)}
                style={styles.heroCard}
            >
                <LinearGradient
                    colors={['rgba(0, 240, 255, 0.1)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                />

                <View style={styles.heroHeader}>
                    <Text style={styles.statusText}>COMMANDER STATUS: <Text style={{ color: COLORS.accent }}>ACTIVE</Text></Text>
                    <Ionicons name="wifi" size={16} color={COLORS.accent} />
                </View>

                <View style={styles.heroContent}>
                    <View>
                        <Text style={styles.rankLabel}>GLOBAL RANK</Text>
                        <Text style={styles.rankValue}>#1,242</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.percentageText}>72%</Text>
                        <Text style={styles.territoryText}>KOCHI CAPTURED</Text>
                    </View>
                </View>

                <View style={[StyleSheet.absoluteFill, styles.heroBorder]} />
            </Animated.View>

            <View style={styles.gridRow}>
                {/* 2. AI DIET TILE (Left) */}
                <TouchableOpacity
                    onPress={fetchDietPlan}
                    activeOpacity={0.8}
                    style={[styles.tile, styles.dietTile]}
                >
                    <View style={styles.tileHeader}>
                        <Ionicons name="nutrition" size={20} color={COLORS.text} />
                        <Text style={styles.tileTitle}>AI DIET PLAN</Text>
                    </View>

                    {scanning ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator color={COLORS.accent} size="large" />
                            <Text style={styles.scanningText}>ANALYZING METABOLISM...</Text>
                        </View>
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'space-between' }}>
                            <Text style={styles.aiText} numberOfLines={6}>
                                {dietPlan || " // TAP TO GENERATE FUEL PLAN"}
                            </Text>
                            <Text style={styles.subText}>Optimized for Dosed Energy</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* 3. AI FORM FIXER TILE (Right) */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.tile, styles.formTile]}
                    onPress={() => Alert.alert("Tactical Alert", "Vision Module: Camera permissions required for posture analysis.")}
                >
                    <View style={styles.centerContent}>
                        <Text style={styles.crosshair}>[ ⌖ ]</Text>
                        <Text style={styles.tileTitleMain}>FORM FIXER</Text>
                        <Text style={styles.subText}>UPLOAD / CAPTURE</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* 4. RUNNING PLAN & COMPETITION */}
            <View style={styles.gridRow}>
                <Animated.View
                    entering={FadeInDown.delay(200)}
                    style={[styles.tile, { height: 160 }]}
                >
                    <View style={styles.tileHeader}>
                        <Ionicons name="analytics" size={20} color={COLORS.accent} />
                        <Text style={styles.tileTitle}>CONQUEST</Text>
                    </View>
                    <View style={styles.graphContainer}>
                        {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                            <View key={i} style={[styles.graphBar, { height: `${h}%` as any, backgroundColor: i === 5 ? COLORS.accent : '#333' }]} />
                        ))}
                    </View>
                </Animated.View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.tile, { height: 160, backgroundColor: '#1A1A1A' }]}
                    onPress={() => setShowComp(true)}
                >
                    <View style={styles.tileHeader}>
                        <Ionicons name="trophy" size={20} color="#FFD700" />
                        <Text style={styles.tileTitle}>TERRA COMP</Text>
                    </View>
                    <View style={styles.centerContent}>
                        <Text style={styles.compValue}>$1,277</Text>
                        <Text style={styles.subText}>IN PRIZES</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* COMPETITION MODAL (Last Image Reference) */}
            <Modal visible={showComp} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={95} tint="dark" style={styles.modalContent}>
                        <TouchableOpacity style={styles.modalClose} onPress={() => setShowComp(false)}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>TERRA COMP 26.1</Text>

                        <View style={styles.prizesRow}>
                            <PrizeCard pos="2nd" name="Garmin 55" icon="watch" />
                            <PrizeCard pos="1st" name="Vivoactive 6" icon="watch" active />
                            <PrizeCard pos="3rd" name="Whoop Band" icon="watch" />
                        </View>

                        <View style={styles.timerRow}>
                            <TimeBlock val="03" label="Days" />
                            <TimeBlock val="16" label="Hours" />
                            <TimeBlock val="27" label="Mins" />
                            <TimeBlock val="28" label="Secs" />
                        </View>

                        <View style={styles.entriesCard}>
                            <Text style={styles.entriesTitle}>Your Competition Entries</Text>
                            <View style={styles.entriesCircle}>
                                <Text style={styles.entriesCount}>0</Text>
                                <Text style={styles.entriesLabel}>entries</Text>
                            </View>
                            <View style={styles.lockBadge}>
                                <Ionicons name="lock-closed" size={14} color="black" />
                                <Text style={styles.lockText}>AVAILABLE AT LEVEL 7</Text>
                            </View>
                        </View>
                    </BlurView>
                </View>
            </Modal>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        padding: 15,
    },
    heroCard: {
        height: 220,
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.accent,
        padding: 20,
        marginBottom: 15,
        overflow: 'hidden',
        justifyContent: 'space-between'
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    heroBorder: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.3)',
        zIndex: -1
    },
    statusText: {
        color: COLORS.text,
        fontFamily: 'monospace',
        fontSize: 12,
        letterSpacing: 1
    },
    heroContent: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    rankLabel: {
        color: COLORS.accent,
        fontSize: 10,
        fontFamily: 'monospace',
        letterSpacing: 1
    },
    rankValue: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: '900',
    },
    percentageText: {
        color: COLORS.text,
        fontSize: 48,
        fontWeight: '900',
        textShadowColor: COLORS.accent,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        lineHeight: 48
    },
    territoryText: {
        color: COLORS.textDim,
        fontSize: 14,
        letterSpacing: 2,
        fontWeight: '700'
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15
    },
    tile: {
        width: '48%',
        height: 180,
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 15,
    },
    dietTile: {
        borderLeftWidth: 3,
        borderLeftColor: COLORS.accent
    },
    formTile: {
        borderRightWidth: 3,
        borderRightColor: COLORS.danger
    },
    tileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10
    },
    tileTitle: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'monospace'
    },
    aiText: {
        color: COLORS.text,
        fontSize: 12,
        lineHeight: 18,
        fontFamily: 'monospace'
    },
    subText: {
        color: COLORS.textDim,
        fontSize: 10,
        marginTop: 5
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    scanningText: {
        color: COLORS.accent,
        fontSize: 10,
        marginTop: 10,
        fontFamily: 'monospace'
    },
    crosshair: {
        color: COLORS.danger,
        fontSize: 40,
        fontWeight: 'bold',
        marginBottom: 10
    },
    tileTitleMain: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: 16
    },
    planCard: {
        height: 150,
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 20,
        borderBottomWidth: 3,
        borderBottomColor: COLORS.accent
    },
    graphContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingTop: 20
    },
    graphBar: {
        width: 15,
        borderRadius: 4
    },
    compValue: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: '900',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '85%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        alignItems: 'center'
    },
    modalClose: {
        alignSelf: 'flex-end'
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: '900',
        marginTop: 10,
        marginBottom: 30
    },
    prizesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 40
    },
    prizeCard: {
        width: '30%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    prizeActive: {
        borderColor: COLORS.accent,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        transform: [{ scale: 1.1 }]
    },
    prizePos: {
        color: COLORS.textDim,
        fontSize: 10,
        marginBottom: 10
    },
    prizeName: {
        color: COLORS.text,
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 10,
        textAlign: 'center'
    },
    timerRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 40
    },
    timeBlock: {
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        padding: 10,
        borderRadius: 12,
        width: 65
    },
    timeVal: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: '900'
    },
    timeLabel: {
        color: COLORS.textDim,
        fontSize: 10
    },
    entriesCard: {
        width: '100%',
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center'
    },
    entriesTitle: {
        color: COLORS.textDim,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 20
    },
    entriesCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: COLORS.danger,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    entriesCount: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: '900'
    },
    entriesLabel: {
        color: COLORS.textDim,
        fontSize: 10
    },
    lockBadge: {
        backgroundColor: '#FF7E7E',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: '100%',
        justifyContent: 'center'
    },
    lockText: {
        color: 'black',
        fontSize: 12,
        fontWeight: '900'
    }
});

const PrizeCard = ({ pos, name, active }: any) => (
    <View style={[styles.prizeCard, active && styles.prizeActive]}>
        <Text style={styles.prizePos}>{pos} place</Text>
        <Ionicons name="watch" size={32} color={active ? COLORS.accent : COLORS.textDim} />
        <Text style={styles.prizeName}>{name}</Text>
    </View>
);

const TimeBlock = ({ val, label }: any) => (
    <View style={styles.timeBlock}>
        <Text style={styles.timeVal}>{val}</Text>
        <Text style={styles.timeLabel}>{label}</Text>
    </View>
);
