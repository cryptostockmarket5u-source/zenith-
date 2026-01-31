import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Svg, Path, Defs, LinearGradient as SvgGradient, Stop, G, Line, Circle } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import { useUserStore } from '../../stores/userStore';

const { width } = Dimensions.get('window');

const WORLD_LEADERBOARD = [
    { rank: 1, name: 'Team Germany', score: '5560.9 MI²', flag: '🇩🇪', image: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=100&auto=format&fit=crop' },
    { rank: 2, name: 'Team France', score: '3385.7 MI²', flag: '🇫🇷', image: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?q=80&w=100&auto=format&fit=crop' },
    { rank: 3, name: 'From Russia виз лав', score: '2587.5 MI²', flag: '🇷🇺', image: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?q=80&w=100&auto=format&fit=crop' },
    { rank: 4, name: 'Track & XC', score: '2509.5 MI²', flag: '🇺🇸', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=100&auto=format&fit=crop' },
    { rank: 5, name: 'MVC MUSTANGS', score: '2075.0 MI²', flag: '🇺🇸', image: 'https://images.unsplash.com/photo-1551806235-a05bc133df01?q=80&w=100&auto=format&fit=crop' },
    { rank: 6, name: 'Belarus', score: '1856.0 MI²', flag: '🇧🇾', image: 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?q=80&w=100&auto=format&fit=crop' },
    { rank: 7, name: 'Team Czechia', score: '1549.1 MI²', flag: '🇨🇿', image: 'https://images.unsplash.com/photo-1564393025513-097063f96611?q=80&w=100&auto=format&fit=crop' },
    { rank: 8, name: 'Brasil', score: '1444.4 MI²', flag: '🇧🇷', image: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?q=80&w=100&auto=format&fit=crop' },
    { rank: 9, name: 'We are Belgium', score: '1398.0 MI²', flag: '🇧🇪', image: 'https://images.unsplash.com/photo-1543730335-010ed50ef77c?q=80&w=100&auto=format&fit=crop' },
    { rank: 10, name: 'Idaho Falls Trail Ru', score: '1375.0 MI²', flag: '🇺🇸', image: 'https://images.unsplash.com/photo-1502481851512-e9e2529bbbf9?q=80&w=100&auto=format&fit=crop' },
];

const COUNTRY_LEADERBOARD = [
    { rank: 2, name: 'The Jogfathers', score: '62.3 MI²', flag: '🇮🇳', image: 'https://images.unsplash.com/photo-1510931073020-4834e0916024?q=80&w=100&auto=format&fit=crop' },
    { rank: 3, name: 'Coimbatore Runners', score: '52.8 MI²', flag: '🇮🇳', image: 'https://images.unsplash.com/photo-1514336021200-e26715f38aed?q=80&w=100&auto=format&fit=crop' },
    { rank: 4, name: 'Hyderabad Harriers', score: '28.4 MI²', flag: '🇮🇳', image: 'https://images.unsplash.com/photo-1551806235-a05bc133df01?q=80&w=100&auto=format&fit=crop' },
    { rank: 5, name: 'Chennai Trail Club', score: '21.1 MI²', flag: '🇮🇳', image: 'https://images.unsplash.com/photo-1493723843671-1d655e8d717f?q=80&w=100&auto=format&fit=crop' },
    { rank: 6, name: 'India Club', score: '19.1 MI²', flag: '🇮🇳', image: 'https://images.unsplash.com/photo-1533470192478-fa2b87f94966?q=80&w=100&auto=format&fit=crop' },
    { rank: 7, name: 'Jamshedpur striders', score: '19.0 MI²', flag: '🇮🇳', image: 'https://images.unsplash.com/photo-1552674605-46d536d2f6d6?q=80&w=100&auto=format&fit=crop' },
    { rank: 8, name: 'Para Sf', score: '17.1 MI²', flag: '🇮🇳', image: 'https://images.unsplash.com/photo-1550133730-695473e511b2?q=80&w=100&auto=format&fit=crop' },
    { rank: 9, name: 'Team India', score: '15.2 MI²', flag: '🇮🇳', image: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?q=80&w=100&auto=format&fit=crop' },
    { rank: 10, name: 'Culture Town Run Clu', score: '14.3 MI²', flag: '🇮🇳', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=100&auto=format&fit=crop' },
];

export default function ClubDashboard({ club }: { club: any }) {
    const { fetchClubLeaderboard, fetchClubMembers, fetchClubRecentRuns, setSelectedRun, selectedRun } = useUserStore();
    const [activeTab, setActiveTab] = useState('Leaderboard');
    const [activeView, setActiveView] = useState('Club');
    const [regionMode, setRegionMode] = useState<'Country' | 'Worldwide'>('Worldwide');
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [territoryData, setTerritoryData] = useState<any[]>([]);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState(1);
    const [sortBy, setSortBy] = useState<'Date' | 'Area'>('Date');

    const loadData = async () => {
        setLoading(true);
        if (activeTab === 'Leaderboard') {
            if (activeView === 'World') {
                const data = await fetchClubLeaderboard(regionMode, club.countryName);
                const rivals = data.filter(item => item.name !== club.name);
                setLeaderboardData(rivals);
            } else {
                const members = await fetchClubMembers(club.id);
                setLeaderboardData(members);
            }
        } else if (activeTab === 'Territories') {
            const runs = await fetchClubRecentRuns(club.id);
            // Sorting logic
            const sorted = [...runs].sort((a, b) => {
                if (sortBy === 'Date') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                return parseFloat(b.area.replace(/,/g, '')) - parseFloat(a.area.replace(/,/g, ''));
            });
            setTerritoryData(sorted);
        } else if (activeTab === 'History') {
            const data = await useUserStore.getState().fetchClubHistory(club.id);
            setHistoryData(data);
        }
        setLoading(false);
    };

    const handleNextRun = () => {
        if (!selectedRun || territoryData.length === 0) return;
        const index = territoryData.findIndex(r => (r.id || r.name) === (selectedRun.id || selectedRun.name));
        const nextIndex = (index + 1) % territoryData.length;
        setSelectedRun(territoryData[nextIndex]);
    };

    const handlePrevRun = () => {
        if (!selectedRun || territoryData.length === 0) return;
        const index = territoryData.findIndex(r => (r.id || r.name) === (selectedRun.id || selectedRun.name));
        const prevIndex = (index - 1 + territoryData.length) % territoryData.length;
        setSelectedRun(territoryData[prevIndex]);
    };

    useEffect(() => {
        loadData();
    }, [regionMode, activeView, activeTab, sortBy, club.id]);

    const renderLeaderboardItem = ({ item, index }: { item: any, index: number }) => (
        <TouchableOpacity
            onPress={() => {
                useUserStore.getState().setPreviewClub(item);
            }}
        >
            <Animated.View
                entering={FadeInUp.delay(index * 50).springify()}
                style={styles.rankItem}
            >
                <View style={styles.flagStrip}>
                    <Text style={styles.flagStripText}>{item.flag}</Text>
                    <View style={styles.rankOverlay}>
                        <Text style={styles.rankTextLarge}>{item.rank}</Text>
                    </View>
                </View>
                <Image source={{ uri: item.image }} style={styles.rowLogo} />
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowScore}>{item.score}</Text>
            </Animated.View>
        </TouchableOpacity>
    );

    const renderTerritoryItem = ({ item, index }: { item: any, index: number }) => (
        <TouchableOpacity
            onPress={() => setSelectedRun(item)}
            style={styles.runCard}
        >
            <View style={styles.runHeader}>
                <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
                <View style={styles.runMeta}>
                    <Text style={styles.runTimeText}>{item.username} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    <Text style={styles.runLocText}>{item.location}</Text>
                </View>
            </View>

            <View style={styles.runStatsGrid}>
                <View style={styles.runStatBox}>
                    <Text style={styles.runStatVal}>{item.distance}mi</Text>
                    <Text style={styles.runStatLab}>Distance</Text>
                </View>
                <View style={styles.runStatBox}>
                    <Text style={styles.runStatVal}>{item.duration}</Text>
                    <Text style={styles.runStatLab}>Duration</Text>
                </View>
                <View style={styles.runStatBox}>
                    <Text style={styles.runStatVal}>{item.pace}:21</Text>
                    <Text style={styles.runStatLab}>Avg Pace</Text>
                </View>
                <View style={styles.runStatBox}>
                    <Text style={styles.runStatVal}>{item.area}FT²</Text>
                    <Text style={styles.runStatLab}>Terra area</Text>
                </View>
            </View>
            <View style={styles.cardSeparator} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header Title */}
            <Text style={styles.myClubTitle}>My Club</Text>

            {/* Club Summary Header - Three Column Layout */}
            <View style={styles.header}>
                <View style={styles.headerCol}>
                    <View style={styles.clubIdentity}>
                        <Image source={{ uri: club.image }} style={styles.clubLogoSmall} />
                        <View style={styles.clubNamePanel}>
                            <Text style={styles.clubNameSmall}>{club.name}</Text>
                            <TouchableOpacity onPress={() => useUserStore.getState().setIsChangingClub(true)}>
                                <Text style={styles.changeLink}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.headerColCenter}>
                    <Text style={styles.statLabelSmall}>Current territory</Text>
                    <Text style={styles.statValueSmall}>{club.territoryScore || '0 MI²'}</Text>
                </View>

                <View style={styles.headerColRight}>
                    <Text style={styles.statLabelSmall}>Total members</Text>
                    <Text style={styles.statValueSmall}>{club.members || '0'}</Text>
                </View>
            </View>

            {/* Horizontal Tabs */}
            <View style={styles.tabsContainer}>
                {['Leaderboard', 'Territories', 'History'].map(t => (
                    <TouchableOpacity
                        key={t}
                        onPress={() => {
                            setActiveTab(t);
                            setSelectedRun(null); // Reset selection when moving between tabs
                        }}
                        style={[styles.tab, activeTab === t && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>{t}</Text>
                        {activeTab === t && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Conditional Content based on selection and tab */}
            {activeTab === 'Territories' && selectedRun ? (
                /* DETAIL VIEW (Runner Detail Focus) */
                <View style={styles.detailContainer}>
                    <TouchableOpacity
                        onPress={() => setSelectedRun(null)}
                        style={styles.backToAll}
                    >
                        <Ionicons name="arrow-back" size={20} color="white" />
                        <Text style={styles.backText}>View all territories</Text>
                    </TouchableOpacity>

                    <View style={styles.detailCard}>
                        {renderTerritoryItem({ item: selectedRun, index: 0 })}
                    </View>

                    <View style={styles.navArrows}>
                        <TouchableOpacity onPress={handlePrevRun} style={styles.arrowBtn}>
                            <Ionicons name="caret-back" size={28} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleNextRun} style={styles.arrowBtn}>
                            <Ionicons name="caret-forward" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : activeTab === 'History' ? (
                /* HISTORY VIEW (Pure Chart, no cards) */
                <View style={styles.historyContainer}>
                    <Text style={styles.chartTitle}>Club territory over time</Text>

                    {loading ? (
                        <ActivityIndicator color="white" style={{ marginTop: 50 }} />
                    ) : (
                        <ClubHistoryChart data={historyData} />
                    )}
                </View>
            ) : (
                /* LIST VIEW (Leaderboard or Territories List) */
                <>
                    {/* Conditional Sub-Tabs / View Selectors */}
                    {activeTab === 'Leaderboard' && (
                        <>
                            <View style={styles.selectorContainer}>
                                <TouchableOpacity
                                    style={[styles.selectorBtn, activeView === 'World' && styles.selectorBtnActive]}
                                    onPress={() => setActiveView('World')}
                                >
                                    <Text style={[styles.selectorText, activeView === 'World' && styles.selectorTextActive]}>Leaderboard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.selectorBtn, activeView === 'Club' && styles.selectorBtnActive]}
                                    onPress={() => setActiveView('Club')}
                                >
                                    <Text style={[styles.selectorText, activeView === 'Club' && styles.selectorTextActive]}>Club Leaderboard</Text>
                                </TouchableOpacity>
                            </View>

                            {activeView === 'World' && (
                                <View style={styles.selectorContainer}>
                                    <TouchableOpacity
                                        style={[styles.selectorBtn, regionMode === 'Country' && styles.selectorBtnActive]}
                                        onPress={() => setRegionMode('Country')}
                                    >
                                        <View style={styles.regionBtnInner}>
                                            <Text style={[styles.selectorText, regionMode === 'Country' && styles.selectorTextActive]}>{club.countryName}</Text>
                                            <Text style={styles.miniFlag}>{club.countryFlag}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.selectorBtn, regionMode === 'Worldwide' && styles.selectorBtnActive]}
                                        onPress={() => setRegionMode('Worldwide')}
                                    >
                                        <Text style={[styles.selectorText, regionMode === 'Worldwide' && styles.selectorTextActive]}>Worldwide</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}

                    {activeTab === 'Territories' && (
                        <View style={styles.sortContainer}>
                            <TouchableOpacity
                                onPress={() => setSortBy('Date')}
                                style={[styles.sortBtn, sortBy === 'Date' && styles.sortBtnActive]}
                            >
                                <Text style={[styles.sortText, sortBy === 'Date' && styles.sortTextActive]}>Sort by Date</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setSortBy('Area')}
                                style={[styles.sortBtn, sortBy === 'Area' && styles.sortBtnActive]}
                            >
                                <Text style={[styles.sortText, sortBy === 'Area' && styles.sortTextActive]}>Sort by Area</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* List View */}
                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator color="#8E8E93" size="large" />
                        </View>
                    ) : (
                        <FlatList
                            data={activeTab === 'Leaderboard' ? leaderboardData : territoryData}
                            keyExtractor={item => item.id || item.name}
                            renderItem={activeTab === 'Leaderboard' ? renderLeaderboardItem : renderTerritoryItem}
                            ListHeaderComponent={() => (
                                activeTab === 'Leaderboard' && activeView === 'World' ? (
                                    <View style={[styles.rankItem, styles.myClubHighlight]}>
                                        <View style={styles.flagStrip}>
                                            <Text style={styles.flagStripText}>{club.countryFlag}</Text>
                                            <View style={styles.rankOverlay}>
                                                <Text style={styles.rankTextLarge}>{regionMode === 'Worldwide' ? '27' : '1'}</Text>
                                            </View>
                                        </View>
                                        <Image source={{ uri: club.image }} style={styles.rowLogo} />
                                        <Text style={styles.rowName} numberOfLines={1}>{club.name}</Text>
                                        <Text style={styles.rowScore}>{club.territoryScore}</Text>
                                    </View>
                                ) : null
                            )}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}

                    {/* Pagination Footer - Only show in list mode (Leaderboard/Territories) */}
                    {activeTab !== 'History' && (
                        <View style={styles.pagination}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                <TouchableOpacity
                                    key={p}
                                    onPress={() => setActivePage(p)}
                                    style={[styles.pageDot, activePage === p && styles.pageDotActive]}
                                >
                                    <Text style={[styles.pageText, activePage === p && styles.pageTextActive]}>{p}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

function ClubHistoryChart({ data }: { data: any[] }) {
    if (!data || data.length < 2) return null;

    const chartWidth = width - 40;
    const chartHeight = 280;
    const padding = 30;

    const values = data.map(d => d.value);
    const maxVal = Math.max(...values, 1);
    const minVal = 0;

    const points = data.map((d, i) => ({
        x: padding + (i * (chartWidth - padding * 2) / (data.length - 1)),
        y: chartHeight - padding - (d.value * (chartHeight - padding * 2) / (maxVal - minVal))
    }));

    // Area path (closed)
    const areaPath = points.reduce((acc, p, i) =>
        acc + (i === 0 ? `M${p.x} ${p.y}` : ` L${p.x} ${p.y}`), "") +
        ` L${points[points.length - 1].x} ${chartHeight - padding} L${points[0].x} ${chartHeight - padding} Z`;

    // Line path
    const linePath = points.reduce((acc, p, i) =>
        acc + (i === 0 ? `M${p.x} ${p.y}` : ` L${p.x} ${p.y}`), "");

    return (
        <View style={styles.chartWrapper}>
            <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                    <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="white" stopOpacity="0.3" />
                        <Stop offset="1" stopColor="white" stopOpacity="0" />
                    </SvgGradient>
                </Defs>

                {/* Y-Axis Grid Lines & Labels */}
                {[0, 0.33, 0.66, 1].map((p, i) => (
                    <G key={i}>
                        <Line
                            x1={padding} y1={padding + (1 - p) * (chartHeight - padding * 2)}
                            x2={chartWidth - padding} y2={padding + (1 - p) * (chartHeight - padding * 2)}
                            stroke="rgba(255,255,255,0.05)"
                        />
                        <Text style={[styles.axisLabel, { position: 'absolute', left: 0, top: padding + (1 - p) * (chartHeight - padding * 2) - 10 }]}>
                            {((maxVal * p) || 0).toFixed(1) + (maxVal > 1000 ? 'ft²' : 'mi²')}
                        </Text>
                    </G>
                ))}

                {/* Area Fill */}
                <Path d={areaPath} fill="url(#grad)" />

                {/* Main Line */}
                <Path d={linePath} fill="none" stroke="white" strokeWidth="2.5" />

                {/* Value Dots */}
                {points.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r="2" fill="white" />
                ))}

                {/* X-Axis Date Labels */}
                {data.map((d, i) => (
                    i % 2 === 0 || i === data.length - 1 ? (
                        <G key={i}>
                            <Text style={[styles.axisLabelX, { position: 'absolute', left: points[i].x - 15, bottom: 5 }]}>
                                {d.date}
                            </Text>
                        </G>
                    ) : null
                ))}
            </Svg>
            <Text style={styles.xAxisLabel}>Date</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C1C1E',
    },
    myClubTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 24,
        alignItems: 'center',
    },
    headerCol: {
        flex: 1.2,
    },
    headerColCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerColRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    clubIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clubLogoSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#333',
    },
    clubNamePanel: {
        marginLeft: 8,
        flex: 1,
    },
    clubNameSmall: {
        color: 'white',
        fontSize: 14,
        fontWeight: '900',
        lineHeight: 16,
    },
    changeLink: {
        color: '#8E8E93',
        fontSize: 12,
        textDecorationLine: 'underline',
        marginTop: 1,
    },
    statLabelSmall: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    statValueSmall: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: 16,
        marginBottom: 16,
        justifyContent: 'space-between',
    },
    tab: {
        paddingVertical: 12,
        flex: 1,
        alignItems: 'center',
        position: 'relative',
    },
    activeTab: {
    },
    tabText: {
        color: '#8E8E93',
        fontSize: 15,
        fontWeight: '900',
    },
    activeTabText: {
        color: 'white',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
    },
    selectorContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 2,
    },
    selectorBtn: {
        flex: 1,
        height: 34,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
    },
    selectorBtnActive: {
        backgroundColor: '#2C2C2E',
    },
    selectorText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
    },
    selectorTextActive: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    regionBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    miniFlag: {
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 12,
        paddingBottom: 20,
    },
    rankItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        marginBottom: 8,
        borderRadius: 12,
        paddingRight: 16,
        overflow: 'hidden',
    },
    myClubHighlight: {
        backgroundColor: '#3A3A3C',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        marginBottom: 16,
    },
    flagStrip: {
        width: 80,
        height: 60,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    flagStripText: {
        fontSize: 50,
        opacity: 0.2,
        position: 'absolute',
    },
    rankOverlay: {
        zIndex: 2,
    },
    rankTextLarge: {
        color: 'white',
        fontSize: 22,
        fontWeight: '900',
    },
    rowLogo: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#333',
        marginLeft: 12,
    },
    rowName: {
        flex: 1,
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 12,
    },
    rowScore: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
        backgroundColor: '#1C1C1E',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.03)',
    },
    pageDot: {
        width: 28,
        height: 28,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#8E8E93',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageDotActive: {
        backgroundColor: '#2C2C2E',
        borderColor: 'white',
    },
    pageText: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '900',
    },
    pageTextActive: {
        color: 'white',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sortContainer: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        marginHorizontal: 16,
    },
    sortBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    sortBtnActive: {
        backgroundColor: '#2C2C2E',
    },
    sortText: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '600',
    },
    sortTextActive: {
        color: 'white',
    },
    runCard: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    runHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    memberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#333',
    },
    runMeta: {
        marginLeft: 12,
    },
    runTimeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    runLocText: {
        color: '#8E8E93',
        fontSize: 12,
    },
    runStatsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    runStatBox: {
        flex: 1,
    },
    runStatVal: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
    },
    runStatLab: {
        color: '#8E8E93',
        fontSize: 11,
        marginTop: 2,
    },
    cardSeparator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginTop: 12,
    },
    detailContainer: {
        flex: 1,
        paddingTop: 10,
    },
    backToAll: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    backText: {
        color: 'white',
        fontSize: 14,
        marginLeft: 8,
    },
    detailCard: {
        marginBottom: 30,
    },
    navArrows: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 'auto',
        marginBottom: 20,
    },
    arrowBtn: {
        padding: 5,
    },
    historyContainer: {
        flex: 1,
        paddingHorizontal: 0,
        paddingTop: 10,
        alignItems: 'center',
    },
    chartTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 24,
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    chartWrapper: {
        width: width,
        height: 320,
        position: 'relative',
        alignItems: 'center',
    },
    axisLabel: {
        color: '#666',
        fontSize: 10,
        fontWeight: '600',
    },
    axisLabelX: {
        color: '#666',
        fontSize: 10,
        fontWeight: '600',
    },
    xAxisLabel: {
        color: '#444',
        fontSize: 10,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
    }
});
