import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { ThemedText } from './ThemedText';

interface WorkoutCardProps {
  workout: {
    id: string;
    name: string;
    started_at: string;
    duration_seconds: number | null;
    total_volume_kg: number | null;
    xp_earned: number;
    workout_type: string;
  };
  onPress?: () => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  const typeIcon = workout.workout_type === 'boxing' ? '🥊'
    : workout.workout_type === 'tai_chi' ? '🧘'
    : '💪';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.leftBorder} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.typeIcon}>{typeIcon}</ThemedText>
            <ThemedText style={styles.name}>{workout.name}</ThemedText>
          </View>
          <View style={styles.xpBadge}>
            <ThemedText style={styles.xpText}>+{workout.xp_earned} XP</ThemedText>
          </View>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={12} color={Colors.lightGray} />
            <ThemedText style={styles.statText}>{formatDuration(workout.duration_seconds)}</ThemedText>
          </View>
          <View style={styles.stat}>
            <Ionicons name="barbell-outline" size={12} color={Colors.lightGray} />
            <ThemedText style={styles.statText}>
              {workout.total_volume_kg ? `${workout.total_volume_kg.toFixed(0)} kg` : '--'}
            </ThemedText>
          </View>
          <ThemedText style={styles.date}>{formatDate(workout.started_at)}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  leftBorder: {
    width: 4,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  typeIcon: {
    fontSize: 18,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
  },
  xpBadge: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  date: {
    fontSize: 12,
    color: Colors.darkGray,
    marginLeft: 'auto',
  },
});
