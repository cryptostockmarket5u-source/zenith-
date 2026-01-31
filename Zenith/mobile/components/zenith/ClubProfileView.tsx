import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/userStore';

const { width } = Dimensions.get('window');

const MOCK_TOP_TERRITORIES = [
    { id: '1', rank: 1, name: 'Kiel', area: '525.2', countryFlag: '🇩🇪' },
    { id: '2', rank: 2, name: 'Unknown Country', area: '335.2', countryFlag: '🇩🇪' },
    { id: '3', rank: 3, name: 'Rostock', area: '75.2', countryFlag: '🇩🇪' },
];

export default function ClubProfileView() {
    const { previewClub, setPreviewClub } = useUserStore();

    if (!previewClub) return null;

    // Use club data or defaults
    const clubName = previewClub.name || 'Team Germany';
    const clubImage = previewClub.image || 'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=200&auto=format&fit=crop';
    const territoryScore = previewClub.territoryScore || '5566.7 MI²';
    const totalRuns = previewClub.totalRuns || '13405';
    const countryFlag = previewClub.countryFlag || '🇩🇪';
    const countryName = previewClub.countryName || 'Germany';

    return (
        <View style={styles.container}>
            {/* Tactical Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setPreviewClub(null)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Club Profile</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Summary Card */}
                <View style={styles.profileSection}>
                    <Image source={{ uri: clubImage }} style={styles.clubLogoLarge} />
                    <View style={styles.profileInfo}>
                        <Text style={styles.clubNameLarge}>{clubName}</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItemInline}>
                                <MaterialCommunityIcons name="map-marker-radius-outline" size={18} color="#CCFF00" />
                                <Text style={styles.statValueInline}>{territoryScore}</Text>
                            </View>
                            <View style={[styles.statItemInline, { marginLeft: 16 }]}>
                                <MaterialIcons name="map" size={18} color="#8E8E93" />
                                <Text style={styles.statValueInline}><Text style={{ color: 'white', fontWeight: '900' }}>{totalRuns}</Text> runs</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Rankings Section */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="trophy-outline" size={18} color="white" />
                    <Text style={styles.sectionTitle}>Rankings</Text>
                </View>
                <View style={styles.rankingsRow}>
                    <View style={styles.rankCard}>
                        <View style={styles.rankCardHeader}>
                            <MaterialCommunityIcons name="earth" size={24} color="#8E8E93" />
                            <Text style={styles.rankLabel}>Global</Text>
                        </View>
                        <Text style={styles.rankValue}>1</Text>
                    </View>

                    <View style={styles.rankCard}>
                        <View style={styles.rankCardHeader}>
                            <Text style={styles.rankFlag}>{countryFlag}</Text>
                            <Text style={styles.rankLabel}>{countryName}</Text>
                        </View>
                        <Text style={styles.rankValue}>1</Text>
                    </View>
                </View>

                {/* Top 5 Territories Section */}
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="book-open-outline" size={18} color="white" />
                    <Text style={styles.sectionTitle}>Top 5 Territories</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.territoriesCarousel}
                >
                    {MOCK_TOP_TERRITORIES.map((t) => (
                        <View key={t.id} style={styles.territoryCard}>
                            <View style={styles.tCardHeader}>
                                <View style={styles.rankBadge}>
                                    <Text style={styles.rankBadgeText}>#{t.rank}</Text>
                                </View>
                                <Text style={styles.tAreaText}>{t.area} <Text style={{ fontSize: 10 }}>MI²</Text></Text>
                            </View>

                            <View style={styles.tCardBody}>
                                <Text style={styles.tLocationName} numberOfLines={1}>{t.name}</Text>
                                <Text style={styles.tFlagSmall}>{t.countryFlag}</Text>
                            </View>
                        </View>
                    ))}

                    {/* Placeholder for remaining if count < 5 */}
                    {[4, 5].map(i => (
                        <View key={i} style={[styles.territoryCard, { opacity: 0.3 }]}>
                            <View style={styles.tCardHeader}>
                                <View style={styles.rankBadge}>
                                    <Text style={styles.rankBadgeText}>#{i}</Text>
                                </View>
                                <Text style={styles.tAreaText}>---</Text>
                            </View>
                            <View style={styles.tCardBody}>
                                <Text style={styles.tLocationName}>Locked</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 17,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingTop: 24,
        paddingBottom: 40,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    clubLogoLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1A1A1A',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    clubNameLarge: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItemInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValueInline: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    rankingsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 32,
    },
    rankCard: {
        flex: 1,
        backgroundColor: '#161616',
        borderRadius: 12,
        padding: 16,
    },
    rankCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    rankLabel: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
    },
    rankFlag: {
        fontSize: 18,
    },
    rankValue: {
        color: 'white',
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'right',
    },
    territoriesCarousel: {
        paddingLeft: 16,
        paddingRight: 8,
        gap: 12,
    },
    territoryCard: {
        width: 160,
        backgroundColor: '#161616',
        borderRadius: 12,
        padding: 16,
        minHeight: 100,
    },
    tCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    rankBadge: {
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    rankBadgeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '900',
    },
    tAreaText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
    },
    tCardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tLocationName: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
        marginRight: 4,
    },
    tFlagSmall: {
        fontSize: 16,
    },
});
