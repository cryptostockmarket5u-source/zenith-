import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// --- MOCK DATA FOR THE BEHAVIORAL ENGINE ---
const LEADERBOARD_DATA = [
    { id: '1', name: 'James Carter', distance: '124.5', rank: 1, avatar: 'https://i.pravatar.cc/150?u=1', status: 'online' },
    { id: '2', name: 'Sarah Miller', distance: '122.8', rank: 2, avatar: 'https://i.pravatar.cc/150?u=2', status: 'online' },
    { id: 'u', name: 'You', distance: '118.2', rank: 3, avatar: 'https://i.pravatar.cc/150?u=albert', status: 'online', isUser: true },
    { id: '3', name: 'Mike Ross', distance: '98.4', rank: 4, avatar: 'https://i.pravatar.cc/150?u=3', status: 'offline' },
    { id: '4', name: 'Lena Chen', distance: '85.2', rank: 5, avatar: 'https://i.pravatar.cc/150?u=4', status: 'online' },
];

export default function LeaderboardList() {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* MODULE 2: ZEIGARNIK OPEN-LOOP (The "Unfinished Task") */}
            <View style={styles.openLoopContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>DAILY CONQUEST</Text>
                    <Text style={styles.timerText}>Ends in 04:22:15</Text>
                </View>
                <View style={styles.progressCard}>
                    <View style={styles.progressTop}>
                        <Text style={styles.progressLabel}>Tier III Progression</Text>
                        <Text style={styles.progressPercent}>64%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '64%' }]} />
                    </View>
                    <Text style={styles.progressGoal}>3.2km to lock Milestone</Text>
                </View>
            </View>

            {/* MODULE 3: UPWARD COMPARISON (Peer Surpassing) */}
            <View style={styles.alertCard}>
                <View style={styles.alertIcon}>
                    <Ionicons name="trending-down" size={20} color="#FF453A" />
                </View>
                <View style={styles.alertTextContent}>
                    <Text style={styles.alertTitle}>Status At Risk</Text>
                    <Text style={styles.alertDesc}>Sarah Miller just passed you. Reclaim Rank #2 now.</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
                    <Text style={styles.actionBtnText}>CHALLENGE</Text>
                </TouchableOpacity>
            </View>

            {/* MODULE 1: PVP MATCHMAKING (PvP over AI) */}
            <View style={styles.leaderboardHeader}>
                <Text style={styles.headerTitle}>GLOBAL RANKINGS</Text>
                <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>182 ACTIVE NOW</Text>
                </View>
            </View>

            {LEADERBOARD_DATA.map((item, index) => (
                <LeaderboardItem key={item.id} item={item} index={index} />
            ))}

            {/* MODULE 4: SUNK COST / LOSS AVERSION */}
            <View style={styles.lossAversionSection}>
                <View style={styles.streakCard}>
                    <MaterialCommunityIcons name="fire" size={24} color="#FF9500" />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.streakTitle}>12-DAY STREAK</Text>
                        <Text style={styles.streakDesc}>Don't lose your 2x XP multiplier.</Text>
                    </View>
                </View>

                <View style={styles.decayWarning}>
                    <Ionicons name="time-outline" size={16} color="#8E8E93" />
                    <Text style={styles.decayText}>Rank Decay active: -5 points/hour</Text>
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const LeaderboardItem = ({ item, index }: any) => {
    const isUser = item.isUser;

    return (
        <Animated.View entering={FadeInUp.delay(index * 100)} style={[styles.itemRow, isUser && styles.userRow]}>
            <View style={styles.rankContainer}>
                <Text style={[styles.rankText, isUser && styles.userRankText]}>#{item.rank}</Text>
            </View>
            <View style={styles.avatarWrapper}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                {item.status === 'online' && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.nameContainer}>
                <Text style={[styles.nameText, isUser && styles.userNameText]}>{item.name}</Text>
                {isUser ? (
                    <Text style={styles.nearMissText}>1.2km behind Sarah</Text>
                ) : (
                    <Text style={styles.statusText}>{item.status === 'online' ? 'Currently Running' : 'Idle'}</Text>
                )}
            </View>
            <View style={styles.valueContainer}>
                <Text style={styles.valueText}>{item.distance}</Text>
                <Text style={styles.unitText}>KM</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },

    // Module 2
    openLoopContainer: { marginTop: 20, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { color: '#8E8E93', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
    timerText: { color: '#FF9500', fontSize: 11, fontWeight: '700' },
    progressCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    progressPercent: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 8 },
    progressBarFill: { height: 6, backgroundColor: '#FFF', borderRadius: 3 },
    progressGoal: { color: '#8E8E93', fontSize: 11, fontWeight: '600' },

    // Module 3
    alertCard: { backgroundColor: 'rgba(255,69,58,0.1)', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,69,58,0.15)' },
    alertIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,69,58,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    alertTextContent: { flex: 1 },
    alertTitle: { color: '#FF453A', fontSize: 13, fontWeight: '800' },
    alertDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
    actionBtn: { backgroundColor: '#FF453A', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
    actionBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

    // Module 1 (PvP / AI)
    leaderboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76,175,80,0.1)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 20 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 6 },
    liveText: { color: '#4CAF50', fontSize: 9, fontWeight: '900' },

    // Item Rows
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
    userRow: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginHorizontal: -10, paddingHorizontal: 10, borderBottomWidth: 0, marginVertical: 4 },
    rankContainer: { width: 35 },
    rankText: { color: '#444', fontSize: 14, fontWeight: '900' },
    userRankText: { color: '#FFF' },
    avatarWrapper: { marginRight: 12, position: 'relative' },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222' },
    onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#1C1C1E' },
    nameContainer: { flex: 1 },
    nameText: { color: '#8E8E93', fontSize: 15, fontWeight: '700' },
    userNameText: { color: '#FFF' },
    statusText: { color: '#444', fontSize: 11, marginTop: 2 },
    nearMissText: { color: '#FF9500', fontSize: 11, marginTop: 2, fontWeight: '600' },
    valueContainer: { alignItems: 'flex-end' },
    valueText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    unitText: { color: '#444', fontSize: 10, fontWeight: '700' },

    // Module 4
    lossAversionSection: { marginTop: 30, padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20 },
    streakCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    streakTitle: { color: '#FF9500', fontSize: 14, fontWeight: '900' },
    streakDesc: { color: '#8E8E93', fontSize: 12 },
    decayWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.6 },
    decayText: { color: '#8E8E93', fontSize: 11, fontWeight: '600' },
});
