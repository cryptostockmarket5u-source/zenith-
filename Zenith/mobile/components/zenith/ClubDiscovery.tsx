import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../../stores/userStore';
import CreateClubModal from './CreateClubModal';

export type SortOption = 'members_desc' | 'members_asc' | 'name_asc' | 'name_desc' | 'country_asc' | 'country_desc';

const CLUBS_DATA = [
    { id: '1', name: 'Indian Runners', members: 7432, countryFlag: '🇮🇳', countryName: 'India', territoryScore: '567.3 MI²', image: 'https://images.unsplash.com/photo-1552674605-46d536d2f6d6?q=80&w=200&auto=format&fit=crop' },
    { id: '2', name: 'INTVL Run Club', members: 2330, countryFlag: '🇦🇺', countryName: 'Australia', territoryScore: '450.1 MI²', isOfficial: true, image: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?q=80&w=200&auto=format&fit=crop' },
    { id: '3', name: 'Team Germany', members: 2087, countryFlag: '🇩🇪', countryName: 'Germany', territoryScore: '5687.4 MI²', image: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=200&auto=format&fit=crop' },
    { id: '4', name: 'Track & XC', members: 1654, countryFlag: '🇺🇸', countryName: 'USA', territoryScore: '2510.5 MI²', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=200&auto=format&fit=crop' },
    { id: '5', name: 'Team UK', members: 1404, countryFlag: '🇬🇧', countryName: 'UK', territoryScore: '120.8 MI²', image: 'https://images.unsplash.com/photo-1449358070958-884aac95fc87?q=80&w=200&auto=format&fit=crop' },
];

export default function ClubDiscovery() {
    const { joinClub, club, isChangingClub, leaveClub } = useUserStore();
    // Ensure useRef is imported (already added)
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [menuType, setMenuType] = useState<'filter' | 'sort' | null>(null);
    const [activeSort, setActiveSort] = useState<SortOption>('members_desc');
    const [activeCountry, setActiveCountry] = useState('All');
    const [pendingClub, setPendingClub] = useState<any>(null); // Club currently being confirmed
    const [isHolding, setIsHolding] = useState(false);
    const holdProgress = useSharedValue(0);
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

    const sortOptions = [
        { label: 'Members (High to Low)', value: 'members_desc' },
        { label: 'Members (Low to High)', value: 'members_asc' },
        { label: 'Name (A to Z)', value: 'name_asc' },
        { label: 'Name (Z to A)', value: 'name_desc' },
        { label: 'Country (A to Z)', value: 'country_asc' },
        { label: 'Country (Z to A)', value: 'country_desc' },
    ];

    const handleJoinClick = (club: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setPendingClub(club);
    };

    const confirmJoin = async () => {
        if (!pendingClub) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPendingClub(null);
        holdProgress.value = 0;
        await joinClub(pendingClub);
    };

    const handlePressIn = () => {
        setIsHolding(true);
        holdProgress.value = withTiming(1, {
            duration: 5000,
            easing: Easing.linear,
        }, (finished) => {
            if (finished) {
                runOnJS(confirmJoin)();
            }
        });

        // Vibration to indicate hold started
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        setIsHolding(false);
        holdProgress.value = withTiming(0, { duration: 300 }); // Fast reset
    };

    const progressBarStyle = useAnimatedStyle(() => ({
        width: `${holdProgress.value * 100}%`,
    }));

    const buttonScaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 - (holdProgress.value * 0.05) }],
    }));

    const handleCreateClub = (clubData: any) => {
        console.log('Creating club:', clubData);
        // In production, this would call the backend API
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowCreateModal(false);
    };

    // Derived list of unique countries
    const countries = Array.from(new Set(CLUBS_DATA.map(c => c.countryName))).sort();

    // Filter and Sort clubs
    const filteredClubs = CLUBS_DATA
        .filter(club => {
            const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                club.countryName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCountry = activeCountry === 'All' || club.countryName === activeCountry;
            return matchesSearch && matchesCountry;
        })
        .sort((a, b) => {
            switch (activeSort) {
                case 'members_desc': return b.members - a.members;
                case 'members_asc': return a.members - b.members;
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                case 'country_asc': return a.countryName.localeCompare(b.countryName);
                case 'country_desc': return b.countryName.localeCompare(a.countryName);
                default: return 0;
            }
        });

    return (
        <>
            <View style={styles.container}>
                {/* Header at very top */}
                <Text style={styles.headerTitle}>{isChangingClub ? 'Change Club' : 'Join a Club'}</Text>

                {isChangingClub && club && (
                    <View style={styles.currentClubSection}>
                        <Text style={styles.currentClubLabel}>My current club</Text>
                        <TouchableOpacity
                            style={styles.currentClubCard}
                            onPress={() => useUserStore.getState().setIsChangingClub(false)}
                        >
                            <Image source={{ uri: club.image }} style={styles.currentClubImage} />
                            <View style={styles.currentClubInfo}>
                                <Text style={styles.currentClubName}>{club.name}</Text>
                                <View style={styles.currentClubStats}>
                                    <View>
                                        <Text style={styles.currentClubValue}>{club.members}</Text>
                                        <Text style={styles.currentClubStatLab}>members</Text>
                                    </View>
                                    <View style={styles.currentClubCountry}>
                                        <Text style={styles.currentClubFlag}>{club.countryFlag}</Text>
                                        <Text style={styles.currentClubStatLab}>{club.countryName}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.leaveClubBtn}
                            onPress={leaveClub}
                        >
                            <Text style={styles.leaveClubText}>Leave club</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Search Bar - Larger and Functional */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for a club..."
                        placeholderTextColor="#666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Actions Row */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.createBtn}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setShowCreateModal(true);
                        }}
                    >
                        <Ionicons name="add" size={18} color="#8E8E93" />
                        <Text style={styles.createBtnText}>Create a club</Text>
                    </TouchableOpacity>

                    <View style={styles.filtersWrapper}>
                        <TouchableOpacity
                            style={styles.filterBtn}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setMenuType(menuType === 'filter' ? null : 'filter');
                            }}
                        >
                            <Ionicons name="filter" size={16} color="#8E8E93" />
                            <Text style={styles.filterText}>Filter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.filterBtn}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setMenuType(menuType === 'sort' ? null : 'sort');
                            }}
                        >
                            <MaterialIcons name="sort" size={16} color="#8E8E93" />
                            <Text style={styles.filterText}>Sort by</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ flex: 1 }}>
                    {/* Club List - Shows filtered results */}
                    <FlatList
                        data={filteredClubs}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={48} color="#666" />
                                <Text style={styles.emptyText}>No clubs found</Text>
                                <Text style={styles.emptySubtext}>Try a different search term</Text>
                            </View>
                        }
                        renderItem={({ item, index }) => (
                            <Animated.View
                                entering={FadeInUp.delay(index * 50)}
                                style={styles.clubCard}
                            >
                                <TouchableOpacity style={styles.cardInner} onPress={() => handleJoinClick(item)}>
                                    <Image source={{ uri: item.image }} style={styles.clubImage} />

                                    <View style={styles.clubInfo}>
                                        <Text style={styles.clubName} numberOfLines={1}>{item.name}</Text>
                                        {item.isOfficial && (
                                            <View style={styles.officialBadge}>
                                                <Ionicons name="checkmark-circle" size={10} color="#8E8E93" />
                                                <Text style={styles.officialText}>Official</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.statsCol}>
                                        <Text style={styles.memberCount}>{item.members}</Text>
                                        <Text style={styles.memberLabel}>members</Text>
                                    </View>

                                    <View style={styles.countryCol}>
                                        <Text style={styles.flag}>{item.countryFlag}</Text>
                                        <Text style={styles.countryName}>{item.countryName}</Text>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    />

                    {/* Inline Sort/Filter Menu Overlay */}
                    {menuType && (
                        <View style={styles.menuOverlay}>
                            {menuType === 'sort' ? (
                                sortOptions.map((opt) => {
                                    const isActive = activeSort === opt.value;
                                    return (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[styles.menuItem, isActive && styles.menuItemActive]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setActiveSort(opt.value as SortOption);
                                                setMenuType(null);
                                            }}
                                        >
                                            <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>{opt.label}</Text>
                                            {isActive && <Ionicons name="checkmark" size={18} color="white" />}
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                ['All', ...countries].map((c) => {
                                    const isActive = activeCountry === c;
                                    return (
                                        <TouchableOpacity
                                            key={c}
                                            style={[styles.menuItem, isActive && styles.menuItemActive]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setActiveCountry(c);
                                                setMenuType(null);
                                            }}
                                        >
                                            <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>{c}</Text>
                                            {isActive && <Ionicons name="checkmark" size={18} color="white" />}
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>
                    )}
                </View>

                {/* Pagination - Pinned to Bottom */}
                <View style={styles.paginationFooter}>
                    <View style={styles.pagination}>
                        {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[styles.pageBtn, page === p && styles.pageBtnActive]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setPage(p);
                                }}
                            >
                                <Text style={[styles.pageText, page === p && styles.pageTextActive]}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* Join Confirmation Overlay */}
            {pendingClub && (
                <View style={styles.confirmOverlay}>
                    <Animated.View
                        entering={FadeInUp.duration(300)}
                        style={styles.confirmContent}
                    >
                        <Text style={styles.headerTitle}>Change Club</Text>
                        <Text style={styles.confirmSubTitle}>Confirm change of clubs</Text>

                        {club ? (
                            <View style={styles.transferContainer}>
                                <View style={styles.transferItem}>
                                    <View style={styles.transferAvatarWrapper}>
                                        <Image source={{ uri: club.image }} style={styles.transferAvatar} />
                                    </View>
                                    <Text style={styles.transferClubName}>{club.name}</Text>
                                </View>

                                <View style={styles.transferArrow}>
                                    <Ionicons name="arrow-forward" size={24} color="white" />
                                </View>

                                <View style={styles.transferItem}>
                                    <View style={styles.transferAvatarWrapper}>
                                        <Image source={{ uri: pendingClub.image }} style={styles.transferAvatar} />
                                    </View>
                                    <Text style={styles.transferClubName}>{pendingClub.name}</Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View style={styles.confirmAvatarContainer}>
                                    <Image source={{ uri: pendingClub.image }} style={styles.confirmAvatar} />
                                </View>
                                <Text style={styles.confirmClubName}>{pendingClub.name}</Text>
                            </>
                        )}

                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setPendingClub(null)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmBtn}
                                activeOpacity={1}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                            >
                                <Animated.View style={[styles.progressFill, progressBarStyle]} />
                                <Animated.View style={[styles.confirmBtnInner, buttonScaleStyle]}>
                                    <Text style={styles.confirmBtnText}>
                                        {isHolding ? 'Hold to confirm...' : 'Confirm change'}
                                    </Text>
                                </Animated.View>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            )}

            {/* Create Club Modal */}
            <CreateClubModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateClub}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },

    headerTitle: { color: 'white', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 12 },

    currentClubSection: { marginBottom: 20 },
    currentClubLabel: { color: '#8E8E93', fontSize: 12, marginBottom: 8 },
    currentClubCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12
    },
    currentClubImage: { width: 64, height: 64, borderRadius: 8 },
    currentClubInfo: { flex: 1, marginLeft: 16 },
    currentClubName: { color: 'white', fontSize: 18, fontWeight: '900', marginBottom: 4 },
    currentClubStats: { flexDirection: 'row', gap: 24, alignItems: 'center' },
    currentClubValue: { color: 'white', fontSize: 16, fontWeight: '900' },
    currentClubStatLab: { color: '#8E8E93', fontSize: 11 },
    currentClubCountry: { alignItems: 'flex-end' },
    currentClubFlag: { fontSize: 20 },

    leaveClubBtn: {
        height: 52,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)'
    },
    leaveClubText: { color: 'white', fontSize: 16, fontWeight: '900' },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 52,
        marginBottom: 12
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, color: 'white', fontSize: 16 },

    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    createBtnText: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
    filtersWrapper: { flexDirection: 'row', gap: 14 },
    filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    filterText: { color: '#8E8E93', fontSize: 14 },

    menuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        zIndex: 10,
    },
    menuList: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginHorizontal: 8,
        marginBottom: 4,
    },
    menuItemActive: {
        backgroundColor: '#1C1C1E',
    },
    menuItemText: {
        color: '#EBEBF5',
        fontSize: 16,
        fontWeight: '500',
    },
    menuItemTextActive: {
        color: 'white',
        fontWeight: '700',
    },

    // Confirmation Overlay Styles
    confirmOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        zIndex: 100,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    confirmContent: {
        alignItems: 'center',
        width: '100%',
    },
    confirmSubTitle: {
        color: '#8E8E93',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 40,
        textAlign: 'center',
    },
    transferContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: 20,
        marginBottom: 60,
    },
    transferItem: {
        alignItems: 'center',
        width: 120,
    },
    transferAvatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        marginBottom: 12,
    },
    transferAvatar: {
        width: '100%',
        height: '100%',
    },
    transferClubName: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
    },
    transferArrow: {
        opacity: 0.8,
    },
    confirmAvatarContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 70,
    },
    confirmClubName: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 60,
        textAlign: 'center',
    },
    confirmActions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 56,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    confirmBtn: {
        flex: 1,
        height: 56,
        backgroundColor: '#333',
        borderRadius: 8,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 2,
    },
    progressFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 1,
    },
    confirmBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },

    clubCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden'
    },
    cardInner: { flexDirection: 'row', alignItems: 'center', padding: 10 },
    clubImage: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#333' },
    clubInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    clubName: { color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 2 },
    officialBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    officialText: { color: '#8E8E93', fontSize: 11 },

    statsCol: { alignItems: 'flex-end', marginRight: 12, minWidth: 55 },
    memberCount: { color: 'white', fontSize: 15, fontWeight: '700' },
    memberLabel: { color: '#8E8E93', fontSize: 10 },

    countryCol: { alignItems: 'flex-end', minWidth: 38 },
    flag: { fontSize: 20, marginBottom: 0 },
    countryName: { color: '#8E8E93', fontSize: 10 },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyText: { color: '#8E8E93', fontSize: 16, fontWeight: '600', marginTop: 16 },
    emptySubtext: { color: '#666', fontSize: 14, marginTop: 8 },

    paginationFooter: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginTop: 'auto' },
    pagination: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    pageBtn: { width: 32, height: 32, borderRadius: 6, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
    pageBtnActive: { backgroundColor: '#8E8E93' },
    pageText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
    pageTextActive: { color: '#1C1C1E' }
});
