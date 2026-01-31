import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type LeaderboardEntry = {
    username: string;
    total_area_sqm: number;
    is_current_user: boolean;
};

export default function LeaderboardScreen() {
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const { data: leaderboard, error } = await supabase.rpc('get_leaderboard');
            if (error) throw error;
            setData(leaderboard || []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatArea = (sqm: number) => {
        if (sqm < 10000) {
            return `${Math.round(sqm)} m²`;
        }
        return `${(sqm / 1000000).toFixed(2)} km²`;
    };

    const getRankColor = (index: number) => {
        switch (index) {
            case 0: return '#FFD700'; // Gold
            case 1: return '#C0C0C0'; // Silver
            case 2: return '#CD7F32'; // Bronze
            default: return '#fff';
        }
    };

    const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
        <View style={[styles.item, item.is_current_user && styles.currentUserItem]}>
            <Text style={[styles.rank, { color: getRankColor(index) }]}>
                {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
            </Text>
            <View style={styles.info}>
                <Text style={[styles.username, item.is_current_user && styles.currentUserText]}>
                    {item.username.split('@')[0]}
                </Text>
                <Text style={styles.area}>{formatArea(item.total_area_sqm)}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'LEADERS',
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#FFD700',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    </TouchableOpacity>
                )
            }} />

            {loading ? (
                <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
            ) : (
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    listContent: {
        padding: 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    currentUserItem: {
        backgroundColor: '#1a1a00',
        marginHorizontal: -20,
        paddingHorizontal: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
    },
    rank: {
        fontSize: 20,
        fontWeight: 'bold',
        width: 40,
        textAlign: 'center',
        marginRight: 10,
    },
    info: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    username: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    currentUserText: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    area: {
        color: '#888',
        fontSize: 14,
        fontFamily: 'monospace',
    },
});
