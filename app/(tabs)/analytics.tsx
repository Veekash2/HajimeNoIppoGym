import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { supabase } from '../../lib/supabase';
import { USER_ID } from '../../constants/userId';
import { Colors } from '../../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 32;

interface PR {
  exercise_name: string;
  weight_kg: number;
  reps: number;
  achieved_at: string;
}

interface WeeklyVolume {
  label: string;
  value: number;
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolume[]>([]);
  const [workoutFrequency, setWorkoutFrequency] = useState<number[]>([0, 0, 0, 0]);
  const [taiChiFrequency, setTaiChiFrequency] = useState<number[]>([0, 0, 0, 0]);
  const [prs, setPRs] = useState<PR[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalVolume: 0,
    avgSessionDuration: 0,
    totalSets: 0,
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      // Get last 4 weeks of workouts
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', USER_ID)
        .gte('started_at', fourWeeksAgo.toISOString())
        .order('started_at', { ascending: true });

      if (workouts) {
        // Build weekly volume data
        const weeks: { [key: string]: number } = {};
        const weekCounts: number[] = [0, 0, 0, 0];
        let totalVol = 0;
        let totalDuration = 0;
        let durationCount = 0;

        workouts.forEach(w => {
          const date = new Date(w.started_at);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.min(3, Math.floor(diffDays / 7));
          weekCounts[3 - weekIndex] = (weekCounts[3 - weekIndex] || 0) + 1;

          const weekLabel = getWeekLabel(date);
          weeks[weekLabel] = (weeks[weekLabel] || 0) + (w.total_volume_kg || 0);
          totalVol += w.total_volume_kg || 0;
          if (w.duration_seconds) {
            totalDuration += w.duration_seconds;
            durationCount++;
          }
        });

        setWorkoutFrequency(weekCounts);

        const volumeData = Object.entries(weeks).slice(-4).map(([label, value]) => ({
          label: label.slice(-5),
          value,
        }));
        setWeeklyVolume(volumeData);

        setTotalStats({
          totalVolume: totalVol,
          avgSessionDuration: durationCount > 0 ? Math.floor(totalDuration / durationCount / 60) : 0,
          totalSets: 0,
        });
      }

      // Tai chi sessions last 4 weeks
      const { data: taiChiData } = await supabase
        .from('tai_chi_sessions')
        .select('session_date')
        .eq('user_id', USER_ID)
        .gte('session_date', fourWeeksAgo.toISOString().split('T')[0]);

      if (taiChiData) {
        const taiChiCounts: number[] = [0, 0, 0, 0];
        const now = new Date();
        taiChiData.forEach(s => {
          const date = new Date(s.session_date);
          const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.min(3, Math.floor(diffDays / 7));
          taiChiCounts[3 - weekIndex]++;
        });
        setTaiChiFrequency(taiChiCounts);
      }

      // Personal Records
      const { data: prData } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', USER_ID)
        .order('achieved_at', { ascending: false })
        .limit(10);

      if (prData) setPRs(prData);

    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  function getWeekLabel(date: Date): string {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(diffDays / 7);
    if (weekNum === 0) return 'This Wk';
    if (weekNum === 1) return 'Last Wk';
    return `${weekNum + 1}w ago`;
  }

  const chartConfig = {
    backgroundGradientFrom: Colors.card,
    backgroundGradientTo: Colors.card,
    color: (opacity = 1) => `rgba(204, 0, 0, ${opacity})`,
    labelColor: () => Colors.lightGray,
    strokeWidth: 2,
    barPercentage: 0.6,
    propsForLabels: {
      fontSize: 11,
    },
    decimalPlaces: 0,
  };

  const freqLabels = ['3w ago', '2w ago', 'Last wk', 'This wk'];

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ANALYTICS</Text>
        <Text style={styles.headerSub}>Your training data</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchAnalytics(); }} tintColor={Colors.primary} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{Math.floor(totalStats.totalVolume).toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>TOTAL VOLUME{'\n'}(KG)</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{totalStats.avgSessionDuration}</Text>
            <Text style={styles.summaryLabel}>AVG SESSION{'\n'}(MIN)</Text>
          </View>
        </View>

        {/* Weekly Volume Chart */}
        {weeklyVolume.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>WEEKLY VOLUME (KG)</Text>
            <BarChart
              data={{
                labels: weeklyVolume.map(d => d.label),
                datasets: [{ data: weeklyVolume.map(d => d.value || 0) }],
              }}
              width={CHART_WIDTH}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              yAxisLabel=""
              yAxisSuffix="kg"
              fromZero
            />
          </View>
        )}

        {/* Workout Frequency */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>WORKOUT FREQUENCY (LAST 4 WEEKS)</Text>
          <BarChart
            data={{
              labels: freqLabels,
              datasets: [{ data: workoutFrequency }],
            }}
            width={CHART_WIDTH}
            height={180}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(255, 68, 68, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            yAxisLabel=""
            yAxisSuffix=""
            fromZero
          />
        </View>

        {/* Tai Chi Frequency */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>🧘 TAI CHI SESSIONS (LAST 4 WEEKS)</Text>
          <LineChart
            data={{
              labels: freqLabels,
              datasets: [{ data: taiChiFrequency.length > 0 ? taiChiFrequency : [0, 0, 0, 0] }],
            }}
            width={CHART_WIDTH}
            height={160}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            }}
            style={styles.chart}
            bezier
          />
          <View style={styles.taiChiGoal}>
            <Text style={styles.taiChiGoalText}>
              Goal: 10 sessions/week (Mon–Fri, 2x/day)
            </Text>
            <Text style={styles.taiChiGoalSub}>
              This week: {taiChiFrequency[3] || 0} sessions
            </Text>
          </View>
        </View>

        {/* Personal Records */}
        <View style={styles.prSection}>
          <Text style={styles.chartTitle}>🏆 PERSONAL RECORDS</Text>
          {prs.length === 0 ? (
            <View style={styles.emptyPR}>
              <Text style={styles.emptyPRText}>No PRs yet — keep training!</Text>
            </View>
          ) : (
            prs.map((pr, index) => (
              <View key={index} style={styles.prRow}>
                <View style={styles.prLeft}>
                  <Text style={styles.prExercise}>{pr.exercise_name}</Text>
                  <Text style={styles.prDate}>
                    {new Date(pr.achieved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.prRight}>
                  <Text style={styles.prWeight}>{pr.weight_kg}kg</Text>
                  <Text style={styles.prReps}>× {pr.reps}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
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
  header: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 3,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.lightGray,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.lightGray,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  chartSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.lightGray,
    letterSpacing: 2,
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  taiChiGoal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  taiChiGoalText: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  taiChiGoalSub: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
    marginTop: 2,
  },
  prSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyPR: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyPRText: {
    fontSize: 14,
    color: Colors.darkGray,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  prLeft: {
    flex: 1,
  },
  prExercise: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  prDate: {
    fontSize: 11,
    color: Colors.darkGray,
    marginTop: 2,
  },
  prRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prWeight: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.gold,
  },
  prReps: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.lightGray,
  },
});
