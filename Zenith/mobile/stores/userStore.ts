import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';

interface UserProfile {
    id: string;
    username: string;
    avatarUrl: string;
    level: number;
    xp: number;
    clubRank: string;
    stats: {
        totalDistance: number;
        runCount: number;
    }
}

interface ClubData {
    id: string;
    name: string;
    image: string;
    members: number;
    countryFlag: string;
    countryName: string;
    territoryScore: string;
}

interface RunHistory {
    date: string;
    distance: number;
    polyline: any;
}

interface UserState {
    // Data State
    user: UserProfile | null;
    club: ClubData | null;
    mode: 'Single Player' | 'My Club' | 'Private Lobby';
    isOnline: boolean;
    weeklyHistory: RunHistory[];

    // Actions
    setMode: (mode: 'Single Player' | 'My Club' | 'Private Lobby') => void;
    setOnlineStatus: (status: boolean) => void;

    // Async Actions
    fetchProfile: () => Promise<void>;
    joinClub: (club: ClubData) => Promise<void>;
    fetchWeeklyStats: () => Promise<void>;
    fetchClubLeaderboard: (region: 'Country' | 'Worldwide', countryName?: string) => Promise<any[]>;
    fetchClubMembers: (clubId: string) => Promise<any[]>;
    fetchClubRecentRuns: (clubId: string) => Promise<any[]>;
    fetchClubHistory: (clubId: string) => Promise<any[]>;
    setSelectedRun: (run: any) => void;
    selectedRun: any | null;
    isChangingClub: boolean;
    setIsChangingClub: (status: boolean) => void;
    leaveClub: () => Promise<void>;
    previewClub: any | null;
    setPreviewClub: (club: any | null) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
    user: null,
    club: null,
    mode: 'Single Player', // Default Mode
    isOnline: false,
    weeklyHistory: [],
    loading: false,
    selectedRun: null,
    isChangingClub: false,
    previewClub: null,

    setIsChangingClub: (status) => set({ isChangingClub: status }),
    setPreviewClub: (club) => set({ previewClub: club }),

    setMode: (mode) => {
        // Haptic Feedback on Mode Switch
        Haptics.selectionAsync();
        set({ mode, selectedRun: null });
    },

    setOnlineStatus: (status) => set({ isOnline: status }),

    fetchProfile: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch User and Stats
        let { data: userRaw, error } = await supabase
            .from('users')
            .select(`*, user_stats(*)`)
            .eq('id', session.user.id)
            .maybeSingle();

        if (error) {
            console.error("Profile Fetch Error:", error);
            return;
        }

        // AUTO-CREATE PROFILE: If record is missing (PGRST116 fallback)
        if (!userRaw) {
            console.log("Profile missing. Creating auto-profile for:", session.user.email);
            const username = session.user.email?.split('@')[0] || 'Runner_' + session.user.id.slice(0, 5);

            // Insert User
            const { error: insError } = await supabase.from('users').insert({
                id: session.user.id,
                username: username
            });

            if (insError) {
                console.error("Failed to create profile:", insError);
                return;
            }

            // Insert Stats
            await supabase.from('user_stats').insert({ user_id: session.user.id });

            // Fetch again
            const { data: retryData } = await supabase
                .from('users')
                .select(`*, user_stats(*)`)
                .eq('id', session.user.id)
                .maybeSingle();
            userRaw = retryData;
        }

        if (userRaw) {
            set({
                user: {
                    id: userRaw.id,
                    username: userRaw.username,
                    avatarUrl: userRaw.avatar_url || 'https://i.pravatar.cc/150?u=' + userRaw.id,
                    level: userRaw.level || 1,
                    xp: userRaw.xp || 0,
                    clubRank: 'Member',
                    stats: {
                        totalDistance: userRaw.user_stats?.total_distance || 0,
                        runCount: userRaw.user_stats?.total_runs || 0
                    }
                }
            });
        }
    },

    joinClub: async (clubData: ClubData) => {
        // OPTIMISTIC UPDATE: Assume success immediately
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        set({
            club: clubData,
            mode: 'My Club', // Auto-switch mode on join
            isChangingClub: false
        });

        // Validation: Don't call Supabase with mock IDs
        if (clubData.id.length < 10) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Background Sync
        const { error } = await supabase.rpc('join_club', {
            p_user_id: session.user.id,
            p_club_id: clubData.id
        });

        if (error) {
            // ROLLBACK on Failure (Disabled for Demo Stability)
            console.error("Join Failed:", error);
            // set({ club: null, mode: 'Single Player' });
            // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    },

    fetchWeeklyStats: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch last 7 days of runs
        const { data: runs } = await supabase
            .from('runs')
            .select('created_at, distance, polyline')
            .eq('user_id', session.user.id)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: true });

        if (runs) {
            // Aggregate logic would go here
            const history = runs.map(r => ({
                date: new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
                distance: r.distance,
                polyline: r.polyline
            }));
            set({ weeklyHistory: history });
        }
    },
    fetchClubLeaderboard: async (region, countryName) => {
        // Call the real get_club_leaderboard RPC
        const { data, error } = await supabase.rpc('get_club_leaderboard', {
            p_country_name: region === 'Country' ? countryName : null
        });

        if (error) {
            console.error("Error fetching club leaderboard:", error);
            // Fallback to mock data if RPC doesn't exist yet
            if (region === 'Worldwide') return WORLD_LEADERBOARD_MOCK;
            return COUNTRY_LEADERBOARD_MOCK;
        }

        // Convert square meters to square miles and format
        const SQM_TO_SQMI = 0.00000038610;
        return data.map((c: any) => ({
            rank: c.rank,
            name: c.club_name,
            score: (c.total_territory_sqm * SQM_TO_SQMI).toFixed(1) + ' MI²',
            flag: c.country_flag || '🌍',
            image: c.image_url || 'https://images.unsplash.com/photo-1552674605-46d536d2f6d6?q=80&w=100&auto=format&fit=crop',
            members: c.member_count,
        }));
    },
    fetchClubMembers: async (clubId) => {
        // Validation: Don't call Supabase with mock '1' or '2' IDs
        if (clubId.length < 10) return CLUB_MEMBERS_MOCK;

        // Efficient join using users as the base
        const { data, error } = await supabase
            .from('users')
            .select(`
                id,
                username,
                avatar_url,
                club_members!inner(club_id),
                user_stats(total_distance)
            `)
            .eq('club_members.club_id', clubId);

        if (error) {
            console.error("Error fetching club members:", error);
            return CLUB_MEMBERS_MOCK;
        }

        return data.map((u: any, index: number) => ({
            rank: index + 1,
            name: u.username || 'Unknown Runner',
            image: u.avatar_url || `https://i.pravatar.cc/150?u=${u.id}`,
            score: ((u.user_stats?.[0]?.total_distance || 0) / 1609).toFixed(1) + ' MI',
            flag: '🏃',
        }));
    },
    fetchClubRecentRuns: async (clubId) => {
        // Validation: Don't call RPC with mock '1' ID
        if (clubId.length < 10) return RECENT_RUNS_MOCK;

        const { data, error } = await supabase.rpc('get_club_recent_runs', { p_club_id: clubId });

        if (error) {
            console.error("Error fetching recent runs:", error);
            return RECENT_RUNS_MOCK;
        }

        return data.map((r: any) => ({
            id: r.run_id,
            username: r.username,
            avatar: r.avatar_url || `https://i.pravatar.cc/150?u=${r.username}`,
            location: r.location,
            distance: (r.distance_m / 1609.34).toFixed(2), // m to mi
            duration: new Date(r.duration_s * 1000).toISOString().substr(14, 5),
            pace: (r.duration_s / 60 / (r.distance_m / 1609.34)).toFixed(2),
            area: (r.area_sqm * 10.7639).toLocaleString(), // sqm to sqft
            polyline: typeof r.polyline === 'string' ? JSON.parse(r.polyline) : r.polyline,
            timestamp: r.created_at
        }));
    },
    fetchClubHistory: async (clubId) => {
        // Validation: Don't call RPC with mock IDs
        if (clubId.length < 10) return CLUB_HISTORY_MOCK;

        const { data, error } = await supabase.rpc('get_club_territory_history', { p_club_id: clubId });

        if (error) {
            console.error("Error fetching club history:", error);
            return CLUB_HISTORY_MOCK;
        }

        return data.map((d: any) => ({
            date: d.captured_at,
            value: d.cumulative_area_mi2
        }));
    },
    setSelectedRun: (run) => {
        console.log("Setting Selected Run:", run?.username);
        set({ selectedRun: run });
    },
    leaveClub: async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        set({ club: null, mode: 'Single Player', isChangingClub: false });

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Backend Sync
        await supabase.rpc('leave_club', { p_user_id: session.user.id });
    }
}));

const WORLD_LEADERBOARD_MOCK = [
    { rank: 1, id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', name: 'Team Germany', score: '5560.9 MI²', flag: '🇩🇪', image: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=100&auto=format&fit=crop' },
    { rank: 2, id: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', name: 'Team France', score: '3385.7 MI²', flag: '🇫🇷', image: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?q=80&w=100&auto=format&fit=crop' },
    { rank: 3, id: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', name: 'From Russia виз лав', score: '2587.5 MI²', flag: '🇷🇺', image: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?q=80&w=100&auto=format&fit=crop' },
];

const COUNTRY_LEADERBOARD_MOCK = [
    { rank: 1, id: 'd4e5f6a7-b8c9-4d8e-0f1g-2a3b4c5d6e7g', name: 'The Jogfathers', score: '62.3 MI²', flag: '🇮🇳', image: 'https://images.unsplash.com/photo-1510931073020-4834e0916024?q=80&w=100&auto=format&fit=crop' },
    { rank: 2, id: 'e5f6a7b8-c9d0-4e9f-0g1h-2a3b4c5d6e7h', name: 'Coimbatore Runners', score: '52.8 MI²', flag: '🇮🇳', image: 'https://images.unsplash.com/photo-1514336021200-e26715f38aed?q=80&w=100&auto=format&fit=crop' },
];

const CLUB_MEMBERS_MOCK = [
    { rank: 1, id: 'f6a7b8c9-d0e1-4f0g-0h1i-2a3b4c5d6e7i', name: 'Abhishek Yadav', score: '124.5 MI²', flag: '🏃', image: 'https://i.pravatar.cc/150?u=abhishek', isUser: true },
    { rank: 2, id: 'g7b8c9d0-e1f2-4g1h-0i1j-2a3b4c5d6e7j', name: 'Rahul Sharma', score: '88.2 MI²', flag: '🏃', image: 'https://i.pravatar.cc/150?u=rahul' },
    { rank: 3, id: 'h8c9d0e1-f2a3-4h2i-0j1k-2a3b4c5d6e7k', name: 'Priya Singh', score: '76.4 MI²', flag: '🏃', image: 'https://i.pravatar.cc/150?u=priya' },
];

const RECENT_RUNS_MOCK = [
    {
        id: '2f0678d9-2ccf-4424-9b26-5d46114eb023', username: 'Abhishek Yadav', avatar: 'https://i.pravatar.cc/150?u=abhishek',
        location: 'Kangra, India', distance: '0.48', duration: '09:15', pace: '19:21', area: '49,495',
        timestamp: new Date().toISOString(),
        polyline: { type: 'Polygon', coordinates: [[[78.2, 20.1], [78.21, 20.1], [78.21, 20.11], [78.2, 20.11], [78.2, 20.1]]] }
    },
    {
        id: '9da3907e-9669-4f7f-8d9e-1f7c1817112d', username: 'Rahul Sharma', avatar: 'https://i.pravatar.cc/150?u=rahul',
        location: 'Dombivli, India', distance: '0.90', duration: '24:22', pace: '27:11', area: '26,380',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        polyline: { type: 'Polygon', coordinates: [[[73.1, 19.2], [73.11, 19.2], [73.11, 19.21], [73.1, 19.21], [73.1, 19.2]]] }
    },
];

const CLUB_HISTORY_MOCK = [
    { date: '02/10', value: 20 },
    { date: '04/10', value: 25 },
    { date: '06/10', value: 28 },
    { date: '08/10', value: 35 },
    { date: '09/07', value: 80 },
    { date: '10/17', value: 120 },
    { date: '11/20', value: 240 },
    { date: '12/22', value: 450 },
    { date: '01/23', value: 606.3 },
];
