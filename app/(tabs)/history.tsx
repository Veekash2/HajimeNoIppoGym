import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { USER_ID } from '../../constants/userId';
import { Colors } from '../../constants/colors';

interface SetData {
  id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  is_pr: boolean;
}

interface ExerciseData {
  id: string;
  exercise_name: string;
  sets: SetData[];
}

interface WorkoutData {
  id: string;
  name: string;
  started_at: string;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  xp_earned: number;
  workout_type: string;
  exercises?: ExerciseData[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async () => {
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', USER_ID)
      .order('started_at', { ascending: false });

    if (data) setWorkouts(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  async function loadWorkoutDetail(workoutId: string) {
    setLoadingDetail(workoutId);
    const { data: exercisesData } = await supabase
      .from('workout_exercises')
      .select('id, exercise_name, order_index')
      .eq('workout_id', workoutId)
      .order('order_index');

    if (!exercisesData) {
      setLoadingDetail(null);
      return;
    }

    const exercises: ExerciseData[] = [];
    for (const ex of exercisesData) {
      const { data: setsData } = await supabase
        .from('sets')
        .select('*')
        .eq('workout_exercise_id', ex.id)
        .order('set_number');

      exercises.push({
        id: ex.id,
        exercise_name: ex.exercise_name,
        sets: setsData || [],
      });
    }

    setWorkouts(prev => prev.map(w =>
      w.id === workoutId ? { ...w, exercises } : w
    ));
    setLoadingDetail(null);
  }

  async function toggleExpand(workoutId: string) {
    if (expandedId === workoutId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(workoutId);
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout?.exercises) {
      await loadWorkoutDetail(workoutId);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
  };

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
        <Text style={styles.headerTitle}>WORKOUT HISTORY</Text>
        <Text style={styles.headerSub}>{workouts.length} sessions logged</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptyText}>Your completed workouts will appear here</Text>
          </View>
        ) : (
          workouts.map(workout => {
            const isExpanded = expandedId === workout.id;
            const isLoading = loadingDetail === workout.id;
            const typeEmoji = workout.workout_type === 'boxing' ? '🥊'
              : workout.workout_type === 'tai_chi' ? '🧘'
              : '💪';

            return (
              <View key={workout.id} style={styles.workoutCard}>
                <TouchableOpacity
                  style={styles.workoutCardHeader}
                  onPress={() => toggleExpand(workout.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.leftAccent} />
                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.workoutEmoji}>{typeEmoji}</Text>
                      <View style={styles.cardTitleGroup}>
                        <Text style={styles.workoutName}>{workout.name}</Text>
                        <Text style={styles.workoutDate}>{formatDate(workout.started_at)}</Text>
                      </View>
                      <View style={styles.xpBadge}>
                        <Text style={styles.xpBadgeText}>+{workout.xp_earned}</Text>
                        <Text style={styles.xpBadgeLabel}>XP</Text>
                      </View>
                    </View>

                    <View style={styles.cardStats}>
                      <View style={styles.cardStat}>
                        <Ionicons name="time-outline" size={13} color={Colors.darkGray} />
                        <Text style={styles.cardStatText}>{formatDuration(workout.duration_seconds)}</Text>
                      </View>
                      <View style={styles.cardStat}>
                        <Ionicons name="barbell-outline" size={13} color={Colors.darkGray} />
                        <Text style={styles.cardStatText}>
                          {workout.total_volume_kg ? `${workout.total_volume_kg.toFixed(0)}kg` : '--'}
                        </Text>
                      </View>
                      <View style={styles.cardStat}>
                        <Ionicons name="alarm-outline" size={13} color={Colors.darkGray} />
                        <Text style={styles.cardStatText}>{formatTime(workout.started_at)}</Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={Colors.darkGray}
                        style={{ marginLeft: 'auto' }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded Detail */}
                {isExpanded && (
                  <View style={styles.expandedDetail}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={Colors.primary} style={{ padding: 20 }} />
                    ) : workout.exercises && workout.exercises.length > 0 ? (
                      workout.exercises.map(ex => (
                        <View key={ex.id} style={styles.exerciseDetail}>
                          <Text style={styles.exerciseDetailName}>{ex.exercise_name}</Text>
                          {/* Set Table */}
                          <View style={styles.setTableHeader}>
                            <Text style={[styles.setTableHeaderText, { width: 36 }]}>SET</Text>
                            <Text style={[styles.setTableHeaderText, { flex: 1 }]}>WEIGHT</Text>
                            <Text style={[styles.setTableHeaderText, { flex: 1 }]}>REPS</Text>
                            <Text style={[styles.setTableHeaderText, { flex: 1 }]}>VOLUME</Text>
                          </View>
                          {ex.sets.map(set => (
                            <View key={set.id} style={styles.setTableRow}>
                              <Text style={[styles.setTableCell, { width: 36 }]}>
                                {set.is_pr ? '🏆' : set.set_number}
                              </Text>
                              <Text style={[styles.setTableCell, { flex: 1 }]}>
                                {set.weight_kg}kg
                              </Text>
                              <Text style={[styles.setTableCell, { flex: 1 }]}>
                                {set.reps}
                              </Text>
                              <Text style={[styles.setTableCell, { flex: 1, color: Colors.lightGray }]}>
                                {(set.weight_kg * set.reps).toFixed(0)}kg
                              </Text>
                            </View>
                          ))}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noExercisesText}>No exercise data available</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}

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
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.lightGray,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  workoutCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workoutCardHeader: {
    flexDirection: 'row',
  },
  leftAccent: {
    width: 4,
    backgroundColor: Colors.primary,
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  workoutEmoji: {
    fontSize: 24,
  },
  cardTitleGroup: {
    flex: 1,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  workoutDate: {
    fontSize: 12,
    color: Colors.lightGray,
    marginTop: 2,
  },
  xpBadge: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  xpBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.gold,
  },
  xpBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.lightGray,
    letterSpacing: 1,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  expandedDetail: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 14,
    backgroundColor: Colors.surface,
  },
  exerciseDetail: {
    marginBottom: 16,
  },
  exerciseDetailName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  setTableHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  setTableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.darkGray,
    letterSpacing: 1,
  },
  setTableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  setTableCell: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '600',
  },
  noExercisesText: {
    fontSize: 13,
    color: Colors.darkGray,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
