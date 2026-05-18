import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { ThemedText } from './ThemedText';
import { WorkoutSet } from '../hooks/useWorkout';

interface SetRowProps {
  set: WorkoutSet;
  previousSet?: { reps: number; weight_kg: number } | null;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onToggleComplete: () => void;
  onRemove: () => void;
}

export function SetRow({ set, previousSet, onUpdate, onToggleComplete, onRemove }: SetRowProps) {
  return (
    <View style={[styles.row, set.completed && styles.completedRow]}>
      {/* Set number */}
      <TouchableOpacity onLongPress={onRemove} style={styles.setNumContainer}>
        {set.is_pr ? (
          <ThemedText style={styles.prBadge}>PR</ThemedText>
        ) : (
          <ThemedText style={styles.setNum}>{set.set_number}</ThemedText>
        )}
      </TouchableOpacity>

      {/* Previous */}
      <View style={styles.prevCell}>
        {previousSet ? (
          <ThemedText style={styles.prevText}>
            {previousSet.weight_kg}kg x {previousSet.reps}
          </ThemedText>
        ) : (
          <ThemedText style={styles.prevText}>—</ThemedText>
        )}
      </View>

      {/* Weight */}
      <View style={styles.inputCell}>
        <TextInput
          style={[styles.input, set.completed && styles.completedInput]}
          value={set.weight_kg > 0 ? set.weight_kg.toString() : ''}
          onChangeText={text => {
            const val = parseFloat(text) || 0;
            onUpdate({ weight_kg: val });
          }}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={Colors.darkGray}
          editable={!set.completed}
        />
      </View>

      {/* Reps */}
      <View style={styles.inputCell}>
        <TextInput
          style={[styles.input, set.completed && styles.completedInput]}
          value={set.reps > 0 ? set.reps.toString() : ''}
          onChangeText={text => {
            const val = parseInt(text) || 0;
            onUpdate({ reps: val });
          }}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={Colors.darkGray}
          editable={!set.completed}
        />
      </View>

      {/* Complete button */}
      <TouchableOpacity
        style={[styles.checkButton, set.completed && styles.checkedButton]}
        onPress={onToggleComplete}
      >
        <Ionicons
          name={set.completed ? 'checkmark' : 'checkmark-outline'}
          size={18}
          color={set.completed ? Colors.white : Colors.darkGray}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 4,
    gap: 6,
  },
  completedRow: {
    backgroundColor: Colors.primary + '15',
  },
  setNumContainer: {
    width: 28,
    alignItems: 'center',
  },
  setNum: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.lightGray,
  },
  prBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.gold,
    backgroundColor: Colors.gold + '22',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  prevCell: {
    flex: 1.5,
    alignItems: 'center',
  },
  prevText: {
    fontSize: 11,
    color: Colors.darkGray,
  },
  inputCell: {
    flex: 1,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completedInput: {
    borderColor: Colors.primary + '50',
    color: Colors.lightGray,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
