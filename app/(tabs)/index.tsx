import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { USER_ID } from '../../constants/userId';
import { Colors } from '../../constants/colors';
import { getRankForXP, getNextRank, getXPProgress } from '../../constants/rankData';
import { XPBar } from '../../components/XPBar';
import { WorkoutCard } from '../../components/WorkoutCard';
import { RankBadge } from '../../components/RankBadge';

interface RecentWorkout {
  id: string;
  name: string;
  started_at: string;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  xp_earned: number;
  workout_type: string;
}

export default function DashboardScreen() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [taiChiToday, setTaiChiToday] = useState(false);
  const [taiChiThisWeek, setTaiChiThisWeek] = useState(0);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingTaiChi, setLoggingTaiChi] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Recent workouts
      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', USER_ID)
        .order('started_at', { ascending: false })
        .limit(5);

      if (workouts) setRecentWorkouts(workouts);

      // Stats for this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString();

      const { count: weekWorkouts } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', USER_ID)
        .gte('started_at', weekAgoStr);

      setWorkoutsThisWeek(weekWorkouts || 0);

      // Tai chi this week
      const { data: taiChiSessions } = await supabase
        .from('tai_chi_sessions')
        .select('session_date')
        .eq('user_id', USER_ID)
        .gte('session_date', weekAgo.toISOString().split('T')[0]);

      if (taiChiSessions) {
        setTaiChiThisWeek(taiChiSessions.length);
        const today = new Date().toISOString().split('T')[0];
        setTaiChiToday(taiChiSessions.some(s => s.session_date === today));
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleLogTaiChi() {
    if (taiChiToday) {
      Alert.alert('Already logged', 'You already logged tai chi today!');
      return;
    }

    setLoggingTaiChi(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('tai_chi_sessions').insert({
        user_id: USER_ID,
        session_date: today,
        duration_minutes: 45,
        xp_earned: 25,
      });

      if (error) {
        Alert.alert('Error', 'Failed to log tai chi session');
        return;
      }

      // Award XP
      const currentXP = profile?.xp || 0;
      const { getRankForXP: getRank } = await import('../../constants/rankData');
      const newXP = currentXP + 25;
      const oldRank = getRank(currentXP);
      const newRank = getRank(newXP);

      await supabase
        .from('profiles')
        .update({
          xp: newXP,
          rank_level: newRank.level,
        })
        .eq('id', USER_ID);

      await refreshProfile();
      await fetchData();

      if (newRank.level > oldRank.level) {
        Alert.alert(
          '🏆 RANK UP!',
          `You reached ${newRank.name}!\n+25 XP`,
        );
      } else {
        Alert.alert('🧘 Tai Chi Logged', `+25 XP earned!\nTotal this week: ${taiChiThisWeek + 1}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoggingTaiChi(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await fetchData();
  };

  const xp = profile?.xp || 0;
  const currentRank = getRankForXP(xp);
  const nextRank = getNextRank(xp);
  const streakCount = profile?.current_streak || 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[Colors.primaryDark + 'CC', Colors.background]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>KAMOGAWA GYM</Text>
              <Text style={styles.userName}>
                {profile?.display_name || 'Veekash'}
              </Text>
            </View>
            <View style={styles.streakContainer}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNumber}>{streakCount}</Text>
              <Text style={styles.streakLabel}>STREAK</Text>
            </View>
          </View>

          {/* Rank Badge */}
          <View style={styles.rankSection}>
            <RankBadge rank={currentRank} size="medium" showName={true} />
          </View>

          {/* XP Bar */}
          <View style={styles.xpSection}>
            <XPBar xp={xp} showLabels={true} height={14} />
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{workoutsThisWeek}</Text>
            <Text style={styles.statLabel}>WORKOUTS{'\n'}THIS WEEK</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{taiChiThisWeek}</Text>
            <Text style={styles.statLabel}>TAI CHI{'\n'}THIS WEEK</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile?.total_workouts || 0}</Text>
            <Text style={styles.statLabel}>TOTAL{'\n'}WORKOUTS</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.startWorkoutButton}
            onPress={() => router.push('/(tabs)/workout')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.startWorkoutGradient}
            >
              <Ionicons name="barbell-outline" size={28} color={Colors.white} />
              <Text style={styles.startWorkoutText}>START WORKOUT</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.taiChiButton, taiChiToday && styles.taiChiButtonDone]}
            onPress={handleLogTaiChi}
            disabled={loggingTaiChi}
            activeOpacity={0.85}
          >
            {loggingTaiChi ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.taiChiEmoji}>{taiChiToday ? '✅' : '🧘'}</Text>
                <View>
                  <Text style={styles.taiChiTitle}>
                    {taiChiToday ? 'TAI CHI DONE' : 'LOG TAI CHI'}
                  </Text>
                  <Text style={styles.taiChiSub}>+25 XP · 45 min session</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentWorkouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🥊</Text>
              <Text style={styles.emptyText}>No workouts yet.</Text>
              <Text style={styles.emptySubText}>Start your first session!</Text>
            </View>
          ) : (
            recentWorkouts.map(workout => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onPress={() => router.push('/(tabs)/history')}
              />
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.lightGray,
    letterSpacing: 3,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.white,
    marginTop: 2,
  },
  streakContainer: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.white,
  },
  streakLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.lightGray,
    letterSpacing: 1,
  },
  rankSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  xpSection: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.lightGray,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  actionsSection: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  startWorkoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  startWorkoutText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },
  taiChiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  taiChiButtonDone: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '15',
  },
  taiChiEmoji: {
    fontSize: 30,
  },
  taiChiTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 1,
  },
  taiChiSub: {
    fontSize: 12,
    color: Colors.lightGray,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.lightGray,
    letterSpacing: 2,
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.lightGray,
  },
  emptySubText: {
    fontSize: 13,
    color: Colors.darkGray,
    marginTop: 4,
  },
});
