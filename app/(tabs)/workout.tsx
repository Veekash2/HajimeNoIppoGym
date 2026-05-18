import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useWorkout } from '../../hooks/useWorkout';
import { USER_ID } from '../../constants/userId';
import { Colors } from '../../constants/colors';
import { SetRow } from '../../components/SetRow';
import { DEFAULT_EXERCISES } from '../../constants/exercises';
import { supabase } from '../../lib/supabase';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface DbExercise {
  id: string;
  name: string;
  muscle_group: string;
  category: string;
  is_boxing: boolean;
}

export default function WorkoutScreen() {
  const { refreshProfile } = useAuth();
  const {
    activeWorkout,
    elapsedSeconds,
    restTimer,
    isResting,
    startWorkout,
    addExercise,
    addSet,
    removeSet,
    updateSet,
    toggleSetComplete,
    removeExercise,
    finishWorkout,
    cancelWorkout,
    stopRestTimer,
  } = useWorkout(USER_ID);

  const [workoutNameInput, setWorkoutNameInput] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exercises, setExercises] = useState<DbExercise[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saving, setSaving] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishResult, setFinishResult] = useState<{ xpEarned: number; rankedUp: boolean; newRank?: string } | null>(null);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    const { data } = await supabase.from('exercises').select('*').order('is_boxing', { ascending: false });
    if (data && data.length > 0) {
      setExercises(data);
    } else {
      // Use local defaults if DB not seeded
      setExercises(DEFAULT_EXERCISES as DbExercise[]);
    }
  }

  function handleStartWorkout() {
    setShowNameModal(true);
  }

  function confirmStartWorkout() {
    const name = workoutNameInput.trim() || `Session — ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`;
    startWorkout(name);
    setShowNameModal(false);
    setWorkoutNameInput('');
  }

  function handleCancelWorkout() {
    Alert.alert(
      'Cancel Workout?',
      'Your workout progress will be lost.',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Cancel Workout', style: 'destructive', onPress: cancelWorkout },
      ]
    );
  }

  async function handleFinishWorkout() {
    const completedSets = activeWorkout?.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0
    ) || 0;

    if (completedSets === 0) {
      Alert.alert('No completed sets', 'Complete at least one set before finishing.');
      return;
    }

    setSaving(true);
    try {
      const result = await finishWorkout();
      await refreshProfile();
      setFinishResult(result);
      setShowFinishModal(true);
    } finally {
      setSaving(false);
    }
  }

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'boxing', 'strength', 'cardio', 'tai_chi'];

  if (!activeWorkout) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.idleContainer}>
          <LinearGradient
            colors={['#8B0000', '#CC0000', Colors.background]}
            style={styles.idleGradient}
          >
            <Text style={styles.idleEmoji}>🥊</Text>
            <Text style={styles.idleTitle}>READY TO TRAIN?</Text>
            <Text style={styles.idleSubtitle}>Log your workout, earn XP, climb the ranks</Text>
          </LinearGradient>

          <View style={styles.idleContent}>
            <TouchableOpacity
              style={styles.bigStartButton}
              onPress={handleStartWorkout}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.bigStartGradient}
              >
                <Ionicons name="play" size={32} color={Colors.white} />
                <Text style={styles.bigStartText}>START WORKOUT</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.infoCards}>
              <View style={styles.infoCard}>
                <Ionicons name="barbell-outline" size={24} color={Colors.primary} />
                <Text style={styles.infoCardTitle}>Log Sets</Text>
                <Text style={styles.infoCardSub}>Track weight & reps for each set</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardEmoji}>⭐</Text>
                <Text style={styles.infoCardTitle}>Earn XP</Text>
                <Text style={styles.infoCardSub}>10 XP per set, 50 XP for PRs</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardEmoji}>🏆</Text>
                <Text style={styles.infoCardTitle}>Rank Up</Text>
                <Text style={styles.infoCardSub}>Climb through HnI ranks</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Name Modal */}
        <Modal visible={showNameModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.nameModal}>
              <Text style={styles.nameModalTitle}>NAME YOUR WORKOUT</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="e.g. Monday Push, Boxing Day..."
                placeholderTextColor={Colors.darkGray}
                value={workoutNameInput}
                onChangeText={setWorkoutNameInput}
                autoFocus
              />
              <View style={styles.nameModalButtons}>
                <TouchableOpacity
                  style={styles.nameModalCancel}
                  onPress={() => setShowNameModal(false)}
                >
                  <Text style={styles.nameModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nameModalConfirm}
                  onPress={confirmStartWorkout}
                >
                  <Text style={styles.nameModalConfirmText}>START</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Active Workout Header */}
      <View style={styles.activeHeader}>
        <View style={styles.activeHeaderLeft}>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
          </View>
          <Text style={styles.workoutTitle} numberOfLines={1}>
            {activeWorkout.name}
          </Text>
        </View>
        <View style={styles.activeHeaderRight}>
          <TouchableOpacity onPress={handleCancelWorkout} style={styles.headerBtn}>
            <Ionicons name="close" size={20} color={Colors.lightGray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.finishButton, saving && styles.finishButtonDisabled]}
            onPress={handleFinishWorkout}
            disabled={saving}
          >
            <Text style={styles.finishButtonText}>{saving ? 'SAVING...' : 'FINISH'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rest Timer Banner */}
      {isResting && (
        <View style={styles.restBanner}>
          <Text style={styles.restText}>REST — {formatTime(restTimer)}</Text>
          <TouchableOpacity onPress={stopRestTimer}>
            <Text style={styles.skipRest}>SKIP</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeWorkout.exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            {/* Exercise Header */}
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Remove Exercise?',
                    `Remove ${exercise.exercise_name}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeExercise(exercise.id) },
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.darkGray} />
              </TouchableOpacity>
            </View>

            {/* Column Headers */}
            <View style={styles.setHeaders}>
              <Text style={[styles.setHeaderText, { width: 34 }]}>SET</Text>
              <Text style={[styles.setHeaderText, { flex: 1.5 }]}>PREVIOUS</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>KG</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>REPS</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Sets */}
            {exercise.sets.map((set, setIndex) => (
              <SetRow
                key={set.id}
                set={set}
                previousSet={setIndex > 0 ? {
                  reps: exercise.sets[setIndex - 1].reps,
                  weight_kg: exercise.sets[setIndex - 1].weight_kg,
                } : null}
                onUpdate={(updates) => updateSet(exercise.id, set.id, updates)}
                onToggleComplete={() => toggleSetComplete(exercise.id, set.id)}
                onRemove={() => removeSet(exercise.id, set.id)}
              />
            ))}

            {/* Add Set */}
            <TouchableOpacity
              style={styles.addSetButton}
              onPress={() => addSet(exercise.id)}
            >
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addSetText}>ADD SET</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Exercise Button */}
        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setShowExerciseModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color={Colors.white} />
          <Text style={styles.addExerciseText}>ADD EXERCISE</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal visible={showExerciseModal} animationType="slide">
        <SafeAreaView style={[styles.safe, { backgroundColor: Colors.surface }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowExerciseModal(false); setExerciseSearch(''); }}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>CHOOSE EXERCISE</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={Colors.lightGray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={Colors.darkGray}
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              autoFocus
            />
          </View>

          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                  {cat === 'tai_chi' ? 'Tai Chi' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredExercises}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseListItem}
                onPress={() => {
                  addExercise({ id: item.id, name: item.name });
                  setShowExerciseModal(false);
                  setExerciseSearch('');
                }}
              >
                <View style={styles.exerciseListLeft}>
                  <Text style={styles.exerciseListName}>{item.name}</Text>
                  <Text style={styles.exerciseListMuscle}>{item.muscle_group}</Text>
                </View>
                {item.is_boxing && (
                  <Text style={styles.boxingTag}>🥊 BOXING</Text>
                )}
                <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
          />
        </SafeAreaView>
      </Modal>

      {/* Finish Modal */}
      <Modal visible={showFinishModal} transparent animationType="slide">
        <View style={styles.finishModalOverlay}>
          <LinearGradient
            colors={[Colors.primaryDark, Colors.surface]}
            style={styles.finishModalContent}
          >
            <Text style={styles.finishModalEmoji}>{finishResult?.rankedUp ? '🏆' : '💪'}</Text>
            <Text style={styles.finishModalTitle}>
              {finishResult?.rankedUp ? 'RANK UP!' : 'WORKOUT COMPLETE!'}
            </Text>
            {finishResult?.rankedUp && (
              <Text style={styles.finishModalRank}>
                You reached: {finishResult.newRank}
              </Text>
            )}
            <View style={styles.finishXPContainer}>
              <Text style={styles.finishXPLabel}>XP EARNED</Text>
              <Text style={styles.finishXPAmount}>+{finishResult?.xpEarned || 0}</Text>
            </View>
            <TouchableOpacity
              style={styles.finishModalButton}
              onPress={() => setShowFinishModal(false)}
            >
              <Text style={styles.finishModalButtonText}>AWESOME!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  // Idle state
  idleContainer: {
    flex: 1,
  },
  idleGradient: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  idleEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  idleTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 3,
    textAlign: 'center',
  },
  idleSubtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    marginTop: 8,
    textAlign: 'center',
  },
  idleContent: {
    flex: 1,
    padding: 20,
    marginTop: -20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bigStartButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  bigStartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 14,
  },
  bigStartText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 3,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoCardEmoji: {
    fontSize: 22,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  infoCardSub: {
    fontSize: 10,
    color: Colors.lightGray,
    textAlign: 'center',
  },
  // Active workout
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activeHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.white,
  },
  activeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    padding: 6,
  },
  finishButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  finishButtonDisabled: {
    opacity: 0.6,
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 1,
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  restText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 2,
  },
  skipRest: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.lightGray,
    letterSpacing: 1,
  },
  // Exercise card
  exerciseCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  setHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
    gap: 6,
  },
  setHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.darkGray,
    letterSpacing: 1,
    textAlign: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    gap: 6,
  },
  addSetText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 2,
  },
  // Name Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  nameModal: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nameModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 20,
  },
  nameInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    color: Colors.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  nameModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  nameModalCancel: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nameModalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.lightGray,
  },
  nameModalConfirm: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nameModalConfirmText: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 2,
  },
  // Exercise Modal
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: Colors.white,
    fontSize: 15,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    marginBottom: 8,
    flexGrow: 0,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.lightGray,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
  },
  exerciseListLeft: {
    flex: 1,
  },
  exerciseListName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  exerciseListMuscle: {
    fontSize: 12,
    color: Colors.lightGray,
    marginTop: 2,
  },
  boxingTag: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
    marginRight: 8,
  },
  // Finish Modal
  finishModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  finishModalContent: {
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 40,
    alignItems: 'center',
  },
  finishModalEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  finishModalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 8,
  },
  finishModalRank: {
    fontSize: 16,
    color: Colors.gold,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  finishXPContainer: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 20,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.gold + '44',
  },
  finishXPLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.lightGray,
    letterSpacing: 3,
    marginBottom: 4,
  },
  finishXPAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.gold,
  },
  finishModalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 60,
  },
  finishModalButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 2,
  },
});
