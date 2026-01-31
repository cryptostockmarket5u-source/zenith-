import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Image, Dimensions, SafeAreaView, Modal, Platform, StatusBar,
    ActivityIndicator, Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    FadeIn, FadeInDown, LinearTransition,
    useSharedValue, useAnimatedScrollHandler, useAnimatedStyle,
    interpolate, Extrapolation
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/userStore';

const { width, height } = Dimensions.get('window');

// THEME COLORS
const THEME = {
    darkBg: '#121212',
    lightBg: '#F5F5F5',
    salmon: '#666666',
    salmonLight: '#E5E5E5',
    cardWhite: '#FFFFFF',
    textBlack: '#1C1C1E',
    textGrey: '#8E8E93',
    border: '#E5E5EA'
};

export default function AccountPanel({ onClose, isOnline }: { onClose: () => void, isOnline?: boolean }) {
    const router = useRouter();
    const { user, fetchProfile } = useUserStore();
    const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    const handlePlanRoute = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/plan-route');
    };

    const handleStartMission = (route: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSelectedChallenge(null);
        router.push(route as any);
    };

    // Scroll Animation
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const [userLevel, setUserLevel] = useState(1);
    const [userXP, setUserXP] = useState(1240);
    const [showVaultModal, setShowVaultModal] = useState(false);
    const [showBattleModal, setShowBattleModal] = useState(false);

    const displayUser = user || {
        displayName: 'Commander',
        username: '@phantom',
        avatarUrl: 'https://i.pravatar.cc/150?img=33',
        level: userLevel,
        xp: userXP
    };

    const isVaultUnlocked = true;
    const isBattlesUnlocked = true;
    const isAllRunsUnlocked = true;
    const isInsightsUnlocked = true;

    const [showHistoryModal, setShowHistoryModal] = useState(false);











    return (
        <View style={styles.wrapper}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerIconBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                        <Ionicons name="notifications-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>ME</Text>
                    <TouchableOpacity onPress={onClose} style={styles.headerAvatarBtn}>
                        <Image source={{ uri: displayUser.avatarUrl }} style={styles.headerAvatar} />
                    </TouchableOpacity>
                </View>

                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                >
                    {/* 1. NEXT RUN SECTION (Dark) */}
                    <View style={styles.nextRunSection}>
                        <Text style={styles.nextRunTitle}>Next run</Text>
                        <Text style={styles.nextRunDesc}>
                            You don't have a running plan yet. Let us help you set one up!
                            Complete the onboarding questions to get started.
                        </Text>
                        <TouchableOpacity style={styles.createPlanBtn}>
                            <Text style={styles.createPlanBtnText}>Create my running plan</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 2. PROFILE & LEVEL SECTION (Light) */}
                    <View style={styles.levelSectionContainer}>
                        <View style={styles.floatingAvatarContainer}>
                            <Image source={{ uri: displayUser.avatarUrl }} style={styles.floatingAvatar} />
                            <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>L{displayUser.level}</Text></View>
                        </View>

                        <View style={styles.levelHeaderRow}>
                            <Text style={styles.xpText}>10XP to next level</Text>
                            <Text style={styles.levelText}>Level {displayUser.level}</Text>
                        </View>

                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: '90%' }]} />
                        </View>

                        <TouchableOpacity style={styles.unlockCard} onPress={() => setShowUnlockModal(true)}>
                            <View>
                                <Text style={styles.unlockTitle}>Next unlock: Level {displayUser.level + 1}</Text>
                                <Text style={styles.unlockSub}>Community Feed</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={THEME.textBlack} />
                        </TouchableOpacity>

                        {/* XP Challenges */}
                        <View style={styles.challengesSection}>
                            <View style={styles.chalHeader}>
                                <View style={styles.chalIconCircle}>
                                    <Ionicons name="medal-outline" size={20} color={THEME.textBlack} />
                                </View>
                                <View>
                                    <Text style={styles.chalTitle}>XP Challenges</Text>
                                    <Text style={styles.chalSub}>earn XP to level up</Text>
                                </View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
                                {CHALLENGES.map((challenge, index) => (
                                    <View key={challenge.id} style={{ flexDirection: 'row' }}>
                                        <ChallengeCard
                                            icon={challenge.icon}
                                            title={challenge.title}
                                            xp={challenge.xp}
                                            tone={challenge.tone}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setSelectedChallenge(challenge);
                                            }}
                                        />
                                        {index === CHALLENGES.length - 1 && (
                                            <TouchableOpacity
                                                style={[styles.challengeCard, { backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' }]}
                                                onPress={() => setUserLevel(prev => prev + 1)}
                                            >
                                                <Ionicons name="trending-up" size={32} color={THEME.textGrey} />
                                                <Text style={{ color: THEME.textGrey, fontWeight: '800', fontSize: 12, marginTop: 8 }}>DEBUG: LEVEL UP</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        {/* 3. ENTRY VAULT SECTION */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.iconCircle}>
                                    <MaterialCommunityIcons name="ticket-percent-outline" size={24} color="#333333" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Entry Vault</Text>
                                    <Text style={styles.sectionSub}>Manage entries & tickets</Text>
                                </View>
                            </View>

                            <View style={styles.vaultCard}>
                                <View style={styles.vaultStatsRow}>
                                    <View style={styles.vaultStatBox}>
                                        <Text style={styles.vaultStatValue}>0</Text>
                                        <Text style={styles.vaultStatLabel}>Entries in vault</Text>
                                    </View>
                                    <View style={styles.vaultStatBox}>
                                        <Text style={styles.vaultStatValue}>0</Text>
                                        <Text style={styles.vaultStatLabel}>Active Entries</Text>
                                    </View>
                                    <View style={styles.vaultStatBox}>
                                        <Text style={styles.vaultStatValue}>0</Text>
                                        <Text style={styles.vaultStatLabel}>Used Entries</Text>
                                    </View>
                                </View>

                                <Text style={styles.milestoneLabel}>Vault milestones</Text>
                                <View style={styles.milestoneBarContainer}>
                                    <View style={styles.milestoneBarLine} />
                                    <View style={styles.milestonesRow}>
                                        <View style={styles.milestoneItem}>
                                            <View style={styles.milestoneIconCircleActive}>
                                                <Ionicons name="person" size={16} color="#AAA" />
                                            </View>
                                            <Text style={styles.milestoneText}>Level 0</Text>
                                        </View>
                                        <View style={styles.milestoneItem}>
                                            <View style={styles.milestoneIconCircle}>
                                                <MaterialCommunityIcons name="gift-outline" size={20} color="#AAA" />
                                            </View>
                                            <Text style={styles.milestoneText}>Level 10</Text>
                                        </View>
                                        <View style={styles.milestoneItem}>
                                            <View style={styles.milestoneIconCircle}>
                                                <MaterialCommunityIcons name="gift-outline" size={20} color="#AAA" />
                                            </View>
                                            <Text style={styles.milestoneText}>Level 12</Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.openVaultBtn, isVaultUnlocked ? { backgroundColor: THEME.salmon } : { backgroundColor: '#AAA' }]}
                                    onPress={() => {
                                        if (isVaultUnlocked) {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            setShowVaultModal(true);
                                        } else {
                                            Alert.alert("Locked", "Reach Level 8 to unlock the Entry Vault.");
                                        }
                                    }}
                                >
                                    <Text style={styles.openVaultBtnText}>{isVaultUnlocked ? "Open vault" : "Unlocks at Lvl 8"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 4. LOCAL BATTLES SECTION */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.iconCircle}>
                                    <MaterialCommunityIcons name="sword-cross" size={20} color="#333333" />
                                </View>
                                <View>
                                    <Text style={styles.sectionTitle}>Local battles</Text>
                                    <Text style={styles.sectionSub}>Scan for nearby threats</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.emptyBattleBox}
                                onPress={() => {
                                    if (isBattlesUnlocked) {
                                        setShowBattleModal(true);
                                    } else {
                                        Alert.alert("Locked", "Reach Level 9 to start local battles.");
                                    }
                                }}
                            >
                                <Text style={styles.emptyBattleTitle}>{isBattlesUnlocked ? "No active threats nearby" : "No local battles yet"}</Text>
                                <Text style={styles.emptyBattleSub}>
                                    {isBattlesUnlocked
                                        ? "Take a walk or run to discover tactical skirmishes in your area."
                                        : "Once you steal someone's territory or they steal yours, it will show up here"}
                                </Text>
                            </TouchableOpacity>
                        </View>


                        {/* 5. VIEW ALL RUNS */}
                        <TouchableOpacity
                            style={styles.lockedRowContainer}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                setShowHistoryModal(true);
                            }}
                        >
                            <View style={styles.lockedRowInner}>
                                <Ionicons name="earth" size={24} color={THEME.textGrey} style={{ marginRight: 12 }} />
                                <View>
                                    <Text style={styles.lockedRowTitle}>View all runs</Text>
                                    <Text style={styles.lockedRowSub}>Complete mission history</Text>
                                </View>
                            </View>
                            <View style={[styles.lockBox, { backgroundColor: THEME.salmon }]}>
                                <Ionicons name="chevron-forward" size={20} color="white" />
                            </View>
                        </TouchableOpacity>

                        <View style={{ height: 100 }} />
                    </View>
                </Animated.ScrollView>

                {/* Tab Bar */}
                <View style={styles.tabBar}>
                    <TabItem icon="earth" type="MaterialCommunityIcons" label="Play" onPress={onClose} />
                    <TabItem icon="person" label="Me" active />
                    <TabItem icon="people-outline" label="Feed" />
                    <TabItem icon="run" type="MaterialCommunityIcons" label="Start" onPress={() => router.push('/run')} />
                </View>
            </SafeAreaView>

            {/* CHALLENGE DETAIL MODAL */}
            <Modal visible={!!selectedChallenge} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={80} tint="dark" style={styles.modalSheet}>
                        {selectedChallenge && (
                            <>
                                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedChallenge(null)}>
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalIconRing}>
                                        <Ionicons name={selectedChallenge.icon} size={40} color={getUserToneColor(selectedChallenge.tone)} />
                                    </View>
                                    <Text style={styles.modalTitle}>{selectedChallenge.title}</Text>
                                    <Text style={styles.modalDesc}>{selectedChallenge.description}</Text>
                                    <TouchableOpacity
                                        style={[styles.startButton, { backgroundColor: getUserToneColor(selectedChallenge.tone) }]}
                                        onPress={() => handleStartMission(selectedChallenge.route)}
                                    >
                                        <Text style={styles.startButtonText}>INITIATE MISSION</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </BlurView>
                </View>
            </Modal>

            {/* XP REWARDS MODAL - HIGH FIDELITY TIMELINE */}
            <Modal visible={showUnlockModal} animationType="slide" transparent={false}>
                <SafeAreaView style={styles.timelineContainer}>
                    <StatusBar barStyle="light-content" />
                    <View style={styles.timelineHeader}>
                        <TouchableOpacity onPress={() => setShowUnlockModal(false)} style={styles.backBtnAbsolute}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.timelineTitle}>XP REWARDS</Text>
                    </View>

                    <View style={styles.timelineTabs}>
                        <View style={styles.timelineTab}>
                            <Text style={styles.timelineTabText}>FREE</Text>
                        </View>
                        <View style={[styles.timelineTab, { borderLeftWidth: 1, borderLeftColor: '#CCC' }]}>
                            <Text style={styles.timelineTabText}>PRO</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.timelineScroll} contentContainerStyle={styles.timelineScrollContent}>
                        <View style={styles.centralLine} />
                        {XP_REWARDS.map((item, index) => (
                            <View key={index} style={styles.levelRow}>
                                {/* Level Point */}
                                <View style={styles.levelPoint}>
                                    <Text style={styles.levelPointText}>{item.level}</Text>
                                    <Text style={styles.levelPointLabel}>LEVEL</Text>
                                </View>

                                {/* Free Reward (Left) */}
                                <View style={styles.rewardBoxSide}>
                                    {item.freeItem && (
                                        <View style={[styles.rewardColumn, displayUser.level < item.level && styles.lockedGift]}>
                                            <View style={styles.giftBox}>
                                                <View style={styles.giftCrossV} />
                                                <View style={styles.giftCrossH} />
                                                <View style={styles.giftBow}>
                                                    <MaterialCommunityIcons name="gift" size={32} color="#666666" />
                                                </View>
                                            </View>
                                            <Text style={styles.rewardCalloutText}>{item.freeItem}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Pro Reward (Right) */}
                                <View style={styles.rewardBoxSide}>
                                    {item.proItem && (
                                        <View style={[styles.rewardColumn, displayUser.level < item.level && styles.lockedGift]}>
                                            <View style={styles.giftBox}>
                                                <View style={styles.giftCrossV} />
                                                <View style={styles.giftCrossH} />
                                                <View style={styles.giftBow}>
                                                    <MaterialCommunityIcons name="gift" size={32} color="#999999" />
                                                </View>
                                            </View>
                                            <Text style={styles.rewardCalloutText}>{item.proItem}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.bottomActions}>
                        <TouchableOpacity style={styles.closeRewardsBtn} onPress={() => setShowUnlockModal(false)} activeOpacity={0.8}>
                            <Text style={styles.closeRewardsBtnText}>CLOSE TIMELINE</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
            {/* ENTRY VAULT MODAL */}
            <Modal visible={showVaultModal} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.wrapper, { backgroundColor: '#FFF' }]}>
                    <View style={styles.rewardsHeader}>
                        <TouchableOpacity onPress={() => setShowVaultModal(false)} style={{ padding: 10 }}>
                            <Ionicons name="close" size={24} color="#333333" />
                        </TouchableOpacity>
                        <Text style={styles.rewardsTitle}>ENTRY VAULT</Text>
                        <View style={{ width: 44 }} />
                    </View>
                    <View style={{ flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="ticket-percent" size={80} color={THEME.salmon} />
                        <Text style={[styles.modalTitle, { color: 'black', marginTop: 20 }]}>Vault is Empty</Text>
                        <Text style={[styles.modalDesc, { color: '#666' }]}>Your tournament entries and prize draw tickets will appear here once you earn them during missions.</Text>
                        <TouchableOpacity style={[styles.createPlanBtn, { width: '100%', marginTop: 30 }]} onPress={() => setShowVaultModal(false)}>
                            <Text style={styles.createPlanBtnText}>Return to HQ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* BATTLE SCANNER MODAL */}
            <Modal visible={showBattleModal} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.wrapper, { backgroundColor: '#000' }]}>
                    <View style={[styles.rewardsHeader, { backgroundColor: '#000', borderBottomColor: '#333' }]}>
                        <TouchableOpacity onPress={() => setShowBattleModal(false)} style={{ padding: 10 }}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={[styles.rewardsTitle, { color: 'white' }]}>BATTLE SCANNER</Text>
                        <View style={{ width: 44 }} />
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={THEME.salmon} />
                        <Text style={[styles.modalTitle, { marginTop: 20 }]}>Scanning Area...</Text>
                        <Text style={styles.modalDesc}>Decrypting local tactical frequencies for hostile territory captures.</Text>
                    </View>
                </View>
            </Modal>

            {/* MISSION HISTORY MODAL (View All Runs) */}
            <Modal visible={showHistoryModal} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.wrapper, { backgroundColor: '#F2F2F2' }]}>
                    <View style={[styles.rewardsHeader, { backgroundColor: '#FFF' }]}>
                        <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={{ padding: 10 }}>
                            <Ionicons name="close" size={24} color="#333333" />
                        </TouchableOpacity>
                        <Text style={styles.rewardsTitle}>MISSION HISTORY</Text>
                        <View style={{ width: 44 }} />
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {MOCK_RUNS.map((run: any, i: number) => (
                            <View key={i} style={styles.historyCard}>
                                <View style={styles.historyCardLeft}>
                                    <View style={[styles.statusIndicator, { backgroundColor: run.captured > 1 ? THEME.salmon : '#AAA' }]} />
                                    <View>
                                        <Text style={styles.historyDate}>{run.date}</Text>
                                        <Text style={styles.historyLocation}>{run.location}</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.historyDist}>{run.distance}mi</Text>
                                    <Text style={styles.historyCapture}>+{run.captured}ac captured</Text>
                                </View>
                            </View>
                        ))}
                        <Text style={styles.historyEndText}>End of mission logs</Text>
                    </ScrollView>
                </View>
            </Modal>


            {/* CHATGPT STYLE DIET CHAT */}

        </View>
    );
}



const ChallengeCard = ({ icon, title, xp, tone, onPress }: any) => {
    return (
        <TouchableOpacity style={styles.challengeCard} onPress={onPress}>
            <Ionicons name={icon} size={24} color={THEME.textBlack} />
            <Text style={styles.cardTitle}>{title}</Text>
            <View style={styles.xpPill}>
                <Text style={styles.xpPillText}>+{xp} XP</Text>
            </View>
        </TouchableOpacity>
    );
};

const TabItem = ({ icon, type, label, active, onPress }: any) => {
    const IconComponent = type === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
    return (
        <TouchableOpacity style={styles.tabItem} onPress={onPress}>
            <IconComponent name={icon as any} size={24} color={active ? THEME.salmon : "#666"} />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
        </TouchableOpacity>
    );
};

const getUserToneColor = (tone?: string) => {
    if (tone === 'yellow') return '#999999';
    if (tone === 'red') return '#333333';
    if (tone === 'purple') return '#666666';
    return THEME.salmon;
};

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: THEME.darkBg },
    safeArea: { flex: 1 },
    header: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    headerIconBtn: { padding: 4 },
    headerTitle: { color: 'white', fontWeight: '900', fontSize: 16 },
    headerAvatarBtn: {},
    headerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333' },
    scrollContent: { paddingBottom: 0 },
    nextRunSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, backgroundColor: THEME.darkBg },
    nextRunTitle: { color: 'white', fontWeight: '800', fontSize: 18, marginBottom: 8 },
    nextRunDesc: { color: '#A1A1A6', fontSize: 13, lineHeight: 20, marginBottom: 24 },
    createPlanBtn: { backgroundColor: THEME.salmon, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    createPlanBtnText: { color: 'black', fontWeight: '800', fontSize: 15 },
    levelSectionContainer: { backgroundColor: THEME.lightBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 0, minHeight: 600, marginTop: -10 },
    floatingAvatarContainer: { marginTop: -30, marginBottom: 12, alignSelf: 'flex-start' },
    floatingAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 4, borderColor: THEME.lightBg },
    levelBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'black', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 2, borderColor: THEME.lightBg },
    levelBadgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
    levelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
    xpText: { color: THEME.textBlack, fontSize: 13, fontWeight: '800' },
    levelText: { color: THEME.textBlack, fontSize: 13, fontWeight: '600' },
    progressBarBg: { height: 6, backgroundColor: '#D1D1D6', borderRadius: 3, marginBottom: 24 },
    progressBarFill: { height: '100%', backgroundColor: '#444444', borderRadius: 3 },
    unlockCard: { backgroundColor: THEME.cardWhite, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    unlockTitle: { color: THEME.textBlack, fontWeight: '800', fontSize: 15, marginBottom: 4 },
    unlockSub: { color: THEME.textGrey, fontSize: 13 },
    challengesSection: { marginBottom: 32 },
    chalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    chalIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    chalTitle: { color: THEME.textBlack, fontWeight: '800', fontSize: 16 },
    chalSub: { color: THEME.textGrey, fontSize: 12 },
    cardsScroll: { paddingRight: 20, gap: 12 },
    challengeCard: { width: 140, height: 160, backgroundColor: THEME.cardWhite, borderRadius: 20, padding: 16, justifyContent: 'space-between', marginRight: 10 },
    cardTitle: { color: THEME.textBlack, fontWeight: '700', fontSize: 14, lineHeight: 20 },
    xpPill: { backgroundColor: THEME.salmonLight, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    xpPillText: { color: THEME.textBlack, fontWeight: '800', fontSize: 11 },
    sectionContainer: { marginBottom: 32 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { color: THEME.textBlack, fontWeight: '800', fontSize: 16 },
    sectionSub: { color: THEME.textGrey, fontSize: 12 },
    routeBoxCard: { backgroundColor: THEME.cardWhite, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
    routeIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    routeEmptyTitle: { color: THEME.textBlack, fontSize: 18, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
    routeEmptySub: { color: THEME.textGrey, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    planRouteBtn: { backgroundColor: THEME.salmon, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, gap: 8 },
    planRouteBtnText: { color: 'white', fontWeight: '900', fontSize: 16 },
    // Vault Styles
    vaultCard: { backgroundColor: 'white', borderRadius: 16, padding: 20 },
    vaultStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    vaultStatBox: { flex: 1, alignItems: 'center', backgroundColor: '#F5F5F7', marginHorizontal: 4, paddingVertical: 16, borderRadius: 4 },
    vaultStatValue: { fontSize: 28, fontWeight: '900', color: '#CCC', marginBottom: 4 },
    vaultStatLabel: { fontSize: 10, color: '#BBB', textAlign: 'center', width: 60, lineHeight: 14 },
    milestoneLabel: { fontSize: 12, color: '#AAA', fontWeight: '600', marginBottom: 16 },
    milestoneBarContainer: { height: 80, justifyContent: 'center', marginBottom: 20 },
    milestoneBarLine: { height: 12, backgroundColor: '#666666', position: 'absolute', left: 40, right: 40, top: 22, borderRadius: 6, opacity: 0.1 },
    milestonesRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
    milestoneItem: { alignItems: 'center' },
    milestoneIconCircleActive: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#CCC', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    milestoneIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DDD', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    milestoneText: { fontSize: 12, color: '#AAA', fontWeight: '500' },
    openVaultBtn: { backgroundColor: '#AAA', height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    openVaultBtnText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
    // Battle Styles
    emptyBattleBox: { backgroundColor: 'white', borderRadius: 16, padding: 48, alignItems: 'center' },
    emptyBattleTitle: { fontSize: 18, fontWeight: '800', color: '#BBB', marginBottom: 12 },
    emptyBattleSub: { fontSize: 14, color: '#CCC', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
    // Locked Row
    lockedRowContainer: { backgroundColor: '#F5F5F7', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    lockedRowInner: { flexDirection: 'row', alignItems: 'center' },
    lockedRowTitle: { fontSize: 15, fontWeight: '700', color: '#8E8E93' },
    lockedRowSub: { fontSize: 12, color: '#AAA' },
    lockBox: { width: 50, height: 50, backgroundColor: '#BBB', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    proBadge: { backgroundColor: '#F5F5F7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8, borderWidth: 1, borderColor: '#EEE' },
    proBadgeText: { fontSize: 10, fontWeight: '900', color: '#BBB' },
    // History Modal
    historyCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    historyCardLeft: { flexDirection: 'row', alignItems: 'center' },
    statusIndicator: { width: 4, height: 32, borderRadius: 2, marginRight: 12 },
    historyDate: { fontSize: 14, fontWeight: '800', color: THEME.textBlack },
    historyLocation: { fontSize: 12, color: THEME.textGrey, marginTop: 2 },
    historyDist: { fontSize: 18, fontWeight: '900', color: THEME.textBlack },
    historyCapture: { fontSize: 11, fontWeight: '700', color: THEME.salmon, marginTop: 2 },
    historyEndText: { textAlign: 'center', color: '#AAA', fontSize: 12, marginTop: 20, marginBottom: 40, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    rewardsHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    rewardsTitle: { fontSize: 13, fontWeight: '900', color: THEME.textBlack, letterSpacing: 1 },
    tabBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 12, backgroundColor: 'rgba(18,18,18,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
    tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabLabel: { color: '#666666', fontSize: 10, fontWeight: '900', marginTop: 4 },
    tabLabelActive: { color: 'white' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(18,18,18,0.8)', justifyContent: 'flex-end' },
    modalSheet: { height: '65%', backgroundColor: '#1C1C1E', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, overflow: 'hidden' },
    closeBtn: { alignSelf: 'flex-end', padding: 8, marginBottom: 10 },
    modalContent: { alignItems: 'center', flex: 1 },
    modalIconRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#444' },
    modalTitle: { color: 'white', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
    modalDesc: { color: '#AAA', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 30, paddingHorizontal: 20 },
    startButton: { width: '100%', height: 56, borderRadius: 16, marginTop: 'auto', justifyContent: 'center', alignItems: 'center' },
    startButtonText: { color: 'black', fontWeight: '900', fontSize: 16 },
    proBadgeSmallText: { color: THEME.salmon, fontSize: 8, fontWeight: '900' },
    claimAllBtn: { backgroundColor: 'white', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    claimAllBtnText: { color: '#333333', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    // XP Timeline Styles
    timelineContainer: { flex: 1, backgroundColor: '#F5F5F5' },
    timelineHeader: { backgroundColor: '#121212', height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    timelineTitle: { color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
    backBtnAbsolute: { position: 'absolute', left: 20, padding: 10 },
    timelineTabs: { flexDirection: 'row', backgroundColor: '#E5E5E5', height: 50, borderBottomWidth: 1, borderBottomColor: '#CCC' },
    timelineTab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    timelineTabText: { fontWeight: '900', fontSize: 14, color: '#333333', letterSpacing: 1 },
    timelineScroll: { flex: 1 },
    timelineScrollContent: { paddingVertical: 40, alignItems: 'center' },
    centralLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#333333', left: '50%', transform: [{ translateX: -1 }] },
    levelRow: { width: '100%', flexDirection: 'row', alignItems: 'center', height: 180, position: 'relative' },
    levelPoint: { position: 'absolute', left: '50%', transform: [{ translateX: -25 }], width: 50, height: 50, borderRadius: 25, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderWidth: 3, borderColor: '#F5F5F5' },
    levelPointText: { color: 'white', fontWeight: '900', fontSize: 14, lineHeight: 14 },
    levelPointLabel: { color: 'white', fontSize: 8, fontWeight: '800', lineHeight: 8 },
    rewardBoxSide: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    rewardColumn: { width: '100%', alignItems: 'center' },
    giftBox: { width: 100, height: 80, backgroundColor: '#121212', borderRadius: 8, position: 'relative', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    giftCrossV: { position: 'absolute', width: 8, height: '100%', backgroundColor: 'white', opacity: 0.9 },
    giftCrossH: { position: 'absolute', height: 8, width: '100%', backgroundColor: 'white', opacity: 0.9 },
    giftBow: { position: 'absolute', zIndex: 5 },
    rewardCalloutText: { marginTop: 12, fontSize: 10, fontWeight: '900', textAlign: 'center', color: '#333333', maxWidth: 100, paddingHorizontal: 4 },
    lockedGift: { opacity: 0.2 },
    bottomActions: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 0 : 20, backgroundColor: '#F5F5F5', borderTopWidth: 1, borderTopColor: '#E5E5E5' },
    closeRewardsBtn: { height: 56, backgroundColor: '#121212', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    closeRewardsBtnText: { color: 'white', fontWeight: '900', fontSize: 13, letterSpacing: 2 },
});

const CHALLENGES = [
    { id: '1', title: 'The Trailblazer', xp: 250, icon: 'walk-outline', description: 'Explore 5 new territories in one single session.', route: '/map' },
    { id: '2', title: 'Night Owl', xp: 300, icon: 'moon-outline', description: 'Run between 12AM and 4AM to capture moonlight territory.', route: '/map' },
    { id: '3', title: 'Urban Legend', xp: 450, icon: 'flash-outline', description: 'Maintain a 5-day territory streak by running 2 miles daily.', route: '/map' },
    { id: '4', title: 'Iron Lung', xp: 600, icon: 'fitness-outline', description: 'Run 10km total distance across your claimed sectors.', route: '/map', tone: 'purple' },
    { id: '5', title: 'Alpha Strike', xp: 800, icon: 'skull-outline', description: 'Steal 3 rival territories in a single mission.', route: '/map', tone: 'red' },
    { id: '6', title: 'Speed Demon', xp: 500, icon: 'rocket-outline', description: 'Maintain a 6:00 min/mile pace for over 2 miles.', route: '/map', tone: 'yellow' },
];

const XP_REWARDS = [
    { level: 2, freeItem: 'Digital App Sticker Pack', proItem: 'Elite Tactical Skins' },
    { level: 3, freeItem: null, proItem: 'Mission Multiplier x1.5' },
    { level: 4, freeItem: 'Zenith Comm-Link (Common)', proItem: 'Tactical Headset' },
    { level: 5, freeItem: null, proItem: 'Premium Vault Entry' },
    { level: 6, freeItem: 'Mystery Prize Draw Entry', proItem: 'Elite Gear Pack' },
    { level: 8, freeItem: 'Entry Vault Unlocked', proItem: 'Battle Pass Token' },
    { level: 10, freeItem: 'Special Edition Avatar', proItem: 'Legendary Skin' },
    { level: 12, freeItem: 'Exclusive Zenith Merch', proItem: 'Physical Badge' },
    { level: 15, freeItem: 'Nike Alphafly Discount', proItem: 'Free Zenith Shirt' },
];
const MOCK_RUNS = [
    { date: 'JAN 28, 2026', location: 'Central Secretariat', distance: '4.2', captured: 12.5 },
    { date: 'JAN 26, 2026', location: 'Raisina Hills', distance: '2.8', captured: 5.2 },
    { date: 'JAN 24, 2026', location: 'India Gate', distance: '3.5', captured: 8.9 },
    { date: 'JAN 21, 2026', location: 'Connaught Place', distance: '5.1', captured: 15.4 },
    { date: 'JAN 18, 2026', location: 'Lodhi Garden', distance: '1.2', captured: 0.8 },
];

