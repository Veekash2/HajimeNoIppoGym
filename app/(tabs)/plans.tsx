import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { USER_ID } from '../../constants/userId';
import { useWorkout } from '../../hooks/useWorkout';
import { useRouter } from 'expo-router';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TEMPLATE_COLORS = [
  '#CC0000', '#8B0000', '#FF8800', '#FFD700',
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
];

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  category: string;
  is_boxing: boolean;
}

interface TemplateExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  default_sets: number;
  default_reps: number;
  default_weight_kg: number;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  color: string;
  exercises?: TemplateExercise[];
}

interface ScheduleDay {
  id: string;
  day_of_week: number;
  template_id: string | null;
  is_tai_chi: boolean;
  is_rest: boolean;
  template?: WorkoutTemplate | null;
}

export default function PlansScreen() {
  const router = useRouter();
  const { startWorkout, addExercise } = useWorkout(USER_ID);

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Template create/edit modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateColor, setTemplateColor] = useState(TEMPLATE_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Exercise picker inside template editor
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);

  // Day assignment modal
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<ScheduleDay | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [{ data: tmpl }, { data: sched }, { data: exs }] = await Promise.all([
        supabase
          .from('workout_templates')
          .select('*, template_exercises(*)')
          .eq('user_id', USER_ID)
          .order('created_at', { ascending: true }),
        supabase
          .from('weekly_schedule')
          .select('*, template:workout_templates(*)')
          .eq('user_id', USER_ID)
          .order('day_of_week', { ascending: true }),
        supabase.from('exercises').select('*').order('is_boxing', { ascending: false }),
      ]);

      if (tmpl) setTemplates(tmpl);
      if (sched) setSchedule(sched);
      if (exs) setAllExercises(exs);
    } catch (e) {
      console.error('Plans fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Template CRUD ─────────────────────────────────────────

  function openNewTemplate() {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateDesc('');
    setTemplateColor(TEMPLATE_COLORS[0]);
    setTemplateExercises([]);
    setShowTemplateModal(true);
  }

  function openEditTemplate(t: WorkoutTemplate) {
    setEditingTemplate(t);
    setTemplateName(t.name);
    setTemplateDesc(t.description || '');
    setTemplateColor(t.color);
    setTemplateExercises(t.exercises || []);
    setShowTemplateModal(true);
  }

  async function saveTemplate() {
    if (!templateName.trim()) {
      Alert.alert('Name required', 'Give your workout a name.');
      return;
    }
    setSaving(true);
    try {
      let templateId = editingTemplate?.id;

      if (editingTemplate) {
        await supabase
          .from('workout_templates')
          .update({ name: templateName.trim(), description: templateDesc.trim(), color: templateColor, updated_at: new Date().toISOString() })
          .eq('id', editingTemplate.id);
      } else {
        const { data } = await supabase
          .from('workout_templates')
          .insert({ user_id: USER_ID, name: templateName.trim(), description: templateDesc.trim(), color: templateColor })
          .select()
          .single();
        templateId = data?.id;
      }

      if (templateId) {
        // Replace exercises
        await supabase.from('template_exercises').delete().eq('template_id', templateId);
        if (templateExercises.length > 0) {
          await supabase.from('template_exercises').insert(
            templateExercises.map((ex, i) => ({
              template_id: templateId,
              exercise_id: ex.exercise_id,
              exercise_name: ex.exercise_name,
              order_index: i,
              default_sets: ex.default_sets,
              default_reps: ex.default_reps,
              default_weight_kg: ex.default_weight_kg,
            }))
          );
        }
      }

      setShowTemplateModal(false);
      await fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(t: WorkoutTemplate) {
    Alert.alert('Delete Template', `Delete "${t.name}"? This will also remove it from the schedule.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('workout_templates').delete().eq('id', t.id);
          await fetchData();
        },
      },
    ]);
  }

  function addExerciseToTemplate(ex: Exercise) {
    const already = templateExercises.find(e => e.exercise_id === ex.id);
    if (already) { setShowExercisePicker(false); return; }
    setTemplateExercises(prev => [...prev, {
      id: Date.now().toString(),
      exercise_id: ex.id,
      exercise_name: ex.name,
      order_index: prev.length,
      default_sets: 3,
      default_reps: 10,
      default_weight_kg: 0,
    }]);
    setShowExercisePicker(false);
  }

  function removeExerciseFromTemplate(id: string) {
    setTemplateExercises(prev => prev.filter(e => e.id !== id));
  }

  function updateTemplateExercise(id: string, field: keyof TemplateExercise, value: number) {
    setTemplateExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  // ── Schedule assignment ───────────────────────────────────

  function openDayModal(day: ScheduleDay) {
    setSelectedDay(day);
    setShowDayModal(true);
  }

  async function assignDayTemplate(templateId: string | null, isTaiChi = false, isRest = false) {
    if (!selectedDay) return;
    await supabase
      .from('weekly_schedule')
      .update({ template_id: templateId, is_tai_chi: isTaiChi, is_rest: isRest })
      .eq('id', selectedDay.id);
    setShowDayModal(false);
    await fetchData();
  }

  // ── Start workout from template ───────────────────────────

  async function startFromTemplate(t: WorkoutTemplate) {
    // Load exercises
    const { data: exs } = await supabase
      .from('template_exercises')
      .select('*')
      .eq('template_id', t.id)
      .order('order_index', { ascending: true });

    startWorkout(t.name);
    if (exs) {
      for (const ex of exs) {
        addExercise({ id: ex.exercise_id, name: ex.exercise_name });
      }
    }
    router.push('/(tabs)/workout');
  }

  // ── Today's scheduled workout ─────────────────────────────

  const todayIndex = (() => {
    const d = new Date().getDay(); // 0=Sun
    return d === 0 ? 6 : d - 1;   // convert to 0=Mon
  })();
  const todaySchedule = schedule.find(s => s.day_of_week === todayIndex);

  // ── Render ────────────────────────────────────────────────

  const filteredExercises = allExercises.filter(e =>
    e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <LinearGradient colors={[Colors.primaryDark + 'CC', Colors.background]} style={styles.header}>
          <Text style={styles.headerTitle}>TRAINING PLAN</Text>
          <Text style={styles.headerSub}>Kamogawa Gym Schedule</Text>
        </LinearGradient>

        {/* Today's Workout Banner */}
        {todaySchedule && (
          <View style={styles.todaySection}>
            <Text style={styles.sectionLabel}>TODAY — {DAY_FULL[todayIndex].toUpperCase()}</Text>
            {todaySchedule.is_rest && !todaySchedule.template_id && !todaySchedule.is_tai_chi ? (
              <View style={[styles.todayCard, { borderColor: Colors.border }]}>
                <Ionicons name="moon" size={28} color={Colors.lightGray} />
                <Text style={styles.todayRestText}>REST DAY</Text>
                <Text style={styles.todayRestSub}>Recovery is part of training</Text>
              </View>
            ) : todaySchedule.is_tai_chi ? (
              <View style={[styles.todayCard, { borderColor: Colors.gold }]}>
                <Text style={styles.todayTaiChiEmoji}>🧘</Text>
                <Text style={[styles.todayRestText, { color: Colors.gold }]}>TAI CHI DAY</Text>
                <Text style={styles.todayRestSub}>Log your session on the Dashboard</Text>
              </View>
            ) : todaySchedule.template ? (
              <TouchableOpacity
                style={[styles.todayCard, { borderColor: todaySchedule.template.color }]}
                onPress={() => startFromTemplate(todaySchedule.template!)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[todaySchedule.template.color + '22', 'transparent']}
                  style={styles.todayCardGradient}
                >
                  <Text style={[styles.todayWorkoutName, { color: todaySchedule.template.color }]}>
                    {todaySchedule.template.name}
                  </Text>
                  {todaySchedule.template.description ? (
                    <Text style={styles.todayWorkoutDesc}>{todaySchedule.template.description}</Text>
                  ) : null}
                  <View style={styles.startTodayRow}>
                    <Ionicons name="play-circle" size={20} color={todaySchedule.template.color} />
                    <Text style={[styles.startTodayText, { color: todaySchedule.template.color }]}>TAP TO START</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Weekly Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WEEKLY SCHEDULE</Text>
          <View style={styles.weekGrid}>
            {DAYS.map((day, i) => {
              const s = schedule.find(sc => sc.day_of_week === i);
              const isToday = i === todayIndex;
              const hasTemplate = s?.template;
              const isTaiChi = s?.is_tai_chi;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isToday && styles.dayCellToday,
                    hasTemplate && { borderColor: hasTemplate.color + '88' },
                    isTaiChi && { borderColor: Colors.gold + '88' },
                  ]}
                  onPress={() => s && openDayModal(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day}</Text>
                  {isTaiChi ? (
                    <Text style={styles.dayCellEmoji}>🧘</Text>
                  ) : hasTemplate ? (
                    <>
                      <View style={[styles.dayCellDot, { backgroundColor: hasTemplate.color }]} />
                      <Text style={[styles.dayCellWorkoutName, { color: hasTemplate.color }]} numberOfLines={2}>
                        {hasTemplate.name}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.dayCellRest}>REST</Text>
                  )}
                  <Ionicons name="create-outline" size={12} color={Colors.darkGray} style={{ marginTop: 4 }} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Saved Templates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>MY WORKOUTS</Text>
            <TouchableOpacity style={styles.addButton} onPress={openNewTemplate} activeOpacity={0.8}>
              <Ionicons name="add" size={18} color={Colors.white} />
              <Text style={styles.addButtonText}>NEW</Text>
            </TouchableOpacity>
          </View>

          {templates.length === 0 ? (
            <View style={styles.emptyTemplates}>
              <Ionicons name="barbell-outline" size={40} color={Colors.darkGray} />
              <Text style={styles.emptyText}>No workouts saved yet</Text>
              <Text style={styles.emptySubText}>Create your first workout plan above</Text>
            </View>
          ) : (
            templates.map(t => (
              <View key={t.id} style={[styles.templateCard, { borderLeftColor: t.color, borderLeftWidth: 4 }]}>
                <View style={styles.templateCardTop}>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{t.name}</Text>
                    {t.description ? <Text style={styles.templateDesc}>{t.description}</Text> : null}
                    <Text style={styles.templateExCount}>
                      {(t.exercises || []).length} exercises
                    </Text>
                  </View>
                  <View style={styles.templateActions}>
                    <TouchableOpacity style={styles.templateActionBtn} onPress={() => openEditTemplate(t)} activeOpacity={0.8}>
                      <Ionicons name="create-outline" size={18} color={Colors.lightGray} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.templateActionBtn} onPress={() => deleteTemplate(t)} activeOpacity={0.8}>
                      <Ionicons name="trash-outline" size={18} color={Colors.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
                {(t.exercises || []).length > 0 && (
                  <View style={styles.exercisePreview}>
                    {(t.exercises || []).slice(0, 4).map(ex => (
                      <Text key={ex.id} style={styles.exercisePreviewItem}>
                        · {ex.exercise_name} — {ex.default_sets}×{ex.default_reps}
                        {ex.default_weight_kg > 0 ? ` @ ${ex.default_weight_kg}kg` : ''}
                      </Text>
                    ))}
                    {(t.exercises || []).length > 4 && (
                      <Text style={styles.exercisePreviewMore}>+{(t.exercises || []).length - 4} more</Text>
                    )}
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.startTemplateBtn, { backgroundColor: t.color + '22', borderColor: t.color + '66' }]}
                  onPress={() => startFromTemplate(t)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="play" size={14} color={t.color} />
                  <Text style={[styles.startTemplateBtnText, { color: t.color }]}>START THIS WORKOUT</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Day Assignment Modal ── */}
      <Modal visible={showDayModal} transparent animationType="slide" onRequestClose={() => setShowDayModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {selectedDay !== null ? DAY_FULL[selectedDay.day_of_week].toUpperCase() : ''}
            </Text>
            <Text style={styles.modalSubtitle}>What's the plan for this day?</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Rest */}
              <TouchableOpacity style={styles.dayOptionRow} onPress={() => assignDayTemplate(null, false, true)} activeOpacity={0.8}>
                <Ionicons name="moon-outline" size={22} color={Colors.lightGray} />
                <Text style={styles.dayOptionText}>Rest Day</Text>
              </TouchableOpacity>

              {/* Tai Chi */}
              <TouchableOpacity style={styles.dayOptionRow} onPress={() => assignDayTemplate(null, true, false)} activeOpacity={0.8}>
                <Text style={{ fontSize: 20 }}>🧘</Text>
                <Text style={styles.dayOptionText}>Tai Chi</Text>
              </TouchableOpacity>

              <View style={styles.dayOptionDivider} />
              <Text style={styles.dayOptionSectionLabel}>SAVED WORKOUTS</Text>

              {templates.length === 0 ? (
                <Text style={styles.dayOptionEmpty}>No workouts saved yet — create one first</Text>
              ) : (
                templates.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.dayOptionRow, selectedDay?.template_id === t.id && styles.dayOptionRowSelected]}
                    onPress={() => assignDayTemplate(t.id, false, false)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.dayOptionDot, { backgroundColor: t.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dayOptionText}>{t.name}</Text>
                      {t.description ? <Text style={styles.dayOptionDesc}>{t.description}</Text> : null}
                    </View>
                    {selectedDay?.template_id === t.id && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDayModal(false)} activeOpacity={0.8}>
              <Text style={styles.modalCancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Template Create/Edit Modal ── */}
      <Modal visible={showTemplateModal} transparent animationType="slide" onRequestClose={() => setShowTemplateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '92%' }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingTemplate ? 'EDIT WORKOUT' : 'NEW WORKOUT'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                placeholder="Workout name (e.g. Push Day, Boxing)"
                placeholderTextColor={Colors.darkGray}
                value={templateName}
                onChangeText={setTemplateName}
                maxLength={40}
              />
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Description (optional)"
                placeholderTextColor={Colors.darkGray}
                value={templateDesc}
                onChangeText={setTemplateDesc}
                multiline
              />

              {/* Color picker */}
              <Text style={styles.colorLabel}>COLOUR</Text>
              <View style={styles.colorRow}>
                {TEMPLATE_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, templateColor === c && styles.colorSwatchSelected]}
                    onPress={() => setTemplateColor(c)}
                  />
                ))}
              </View>

              {/* Exercises in template */}
              <Text style={styles.colorLabel}>EXERCISES</Text>
              {templateExercises.map(ex => (
                <View key={ex.id} style={styles.templateExRow}>
                  <Text style={styles.templateExName} numberOfLines={1}>{ex.exercise_name}</Text>
                  <View style={styles.templateExControls}>
                    <TextInput
                      style={styles.templateExInput}
                      value={String(ex.default_sets)}
                      onChangeText={v => updateTemplateExercise(ex.id, 'default_sets', parseInt(v) || 0)}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                    <Text style={styles.templateExX}>×</Text>
                    <TextInput
                      style={styles.templateExInput}
                      value={String(ex.default_reps)}
                      onChangeText={v => updateTemplateExercise(ex.id, 'default_reps', parseInt(v) || 0)}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Text style={styles.templateExKg}>kg</Text>
                    <TextInput
                      style={styles.templateExInput}
                      value={String(ex.default_weight_kg)}
                      onChangeText={v => updateTemplateExercise(ex.id, 'default_weight_kg', parseFloat(v) || 0)}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                    <TouchableOpacity onPress={() => removeExerciseFromTemplate(ex.id)} style={{ padding: 4 }}>
                      <Ionicons name="close-circle" size={18} color={Colors.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setShowExercisePicker(true)} activeOpacity={0.8}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.addExerciseBtnText}>ADD EXERCISE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={saveTemplate}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.saveBtnGradient}>
                  {saving
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Text style={styles.saveBtnText}>SAVE WORKOUT</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowTemplateModal(false)} activeOpacity={0.8}>
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Exercise Picker Modal ── */}
      <Modal visible={showExercisePicker} transparent animationType="slide" onRequestClose={() => setShowExercisePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '85%' }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>ADD EXERCISE</Text>
            <TextInput
              style={[styles.input, { marginBottom: 8 }]}
              placeholder="Search exercises..."
              placeholderTextColor={Colors.darkGray}
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
            />
            <FlatList
              data={filteredExercises}
              keyExtractor={e => e.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.exercisePickerRow} onPress={() => addExerciseToTemplate(item)} activeOpacity={0.8}>
                  <View style={styles.exercisePickerLeft}>
                    <Text style={styles.exercisePickerName}>{item.name}</Text>
                    <Text style={styles.exercisePickerMeta}>{item.muscle_group} · {item.category}</Text>
                  </View>
                  {item.is_boxing && <Ionicons name="star" size={14} color={Colors.gold} />}
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowExercisePicker(false)} activeOpacity={0.8}>
              <Text style={styles.modalCancelText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.white, letterSpacing: 2 },
  headerSub: { fontSize: 12, color: Colors.lightGray, letterSpacing: 1, marginTop: 2 },

  todaySection: { paddingHorizontal: 16, marginBottom: 8 },
  todayCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.surface,
  },
  todayCardGradient: { width: '100%', alignItems: 'center', padding: 16 },
  todayRestText: { fontSize: 20, fontWeight: '900', color: Colors.lightGray, letterSpacing: 2, marginTop: 8 },
  todayRestSub: { fontSize: 12, color: Colors.darkGray, marginTop: 4 },
  todayTaiChiEmoji: { fontSize: 32 },
  todayWorkoutName: { fontSize: 22, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  todayWorkoutDesc: { fontSize: 13, color: Colors.lightGray, marginTop: 4, textAlign: 'center' },
  startTodayRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  startTodayText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },

  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.lightGray, letterSpacing: 2, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  addButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  addButtonText: { color: Colors.white, fontWeight: '800', fontSize: 12, letterSpacing: 1 },

  weekGrid: { flexDirection: 'row', gap: 6 },
  dayCell: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    alignItems: 'center',
    minHeight: 90,
  },
  dayCellToday: { borderColor: Colors.primary + '88', backgroundColor: Colors.primaryDark + '22' },
  dayLabel: { fontSize: 10, fontWeight: '800', color: Colors.lightGray, letterSpacing: 0.5 },
  dayLabelToday: { color: Colors.primary },
  dayCellDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, marginBottom: 3 },
  dayCellWorkoutName: { fontSize: 9, fontWeight: '700', textAlign: 'center', lineHeight: 12 },
  dayCellRest: { fontSize: 9, color: Colors.darkGray, marginTop: 6 },
  dayCellEmoji: { fontSize: 18, marginTop: 4 },

  // Templates
  templateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 17, fontWeight: '900', color: Colors.white, letterSpacing: 0.5 },
  templateDesc: { fontSize: 12, color: Colors.lightGray, marginTop: 2 },
  templateExCount: { fontSize: 11, color: Colors.darkGray, marginTop: 4 },
  templateActions: { flexDirection: 'row', gap: 4 },
  templateActionBtn: { padding: 6 },

  exercisePreview: { marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  exercisePreviewItem: { fontSize: 12, color: Colors.lightGray, marginBottom: 2 },
  exercisePreviewMore: { fontSize: 11, color: Colors.darkGray, marginTop: 2, fontStyle: 'italic' },

  startTemplateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1,
  },
  startTemplateBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  emptyTemplates: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: Colors.lightGray, fontSize: 15, fontWeight: '700', marginTop: 12 },
  emptySubText: { color: Colors.darkGray, fontSize: 12, marginTop: 4 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.white, letterSpacing: 1, marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: Colors.lightGray, marginBottom: 16 },

  dayOptionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dayOptionRowSelected: { backgroundColor: Colors.primary + '11' },
  dayOptionDot: { width: 12, height: 12, borderRadius: 6 },
  dayOptionText: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.white },
  dayOptionDesc: { fontSize: 11, color: Colors.lightGray, marginTop: 1 },
  dayOptionDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  dayOptionSectionLabel: { fontSize: 10, fontWeight: '800', color: Colors.lightGray, letterSpacing: 2, marginBottom: 8 },
  dayOptionEmpty: { color: Colors.darkGray, fontSize: 13, paddingVertical: 12 },

  modalCancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  modalCancelText: { color: Colors.lightGray, fontWeight: '700', letterSpacing: 1 },

  input: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  colorLabel: { fontSize: 10, fontWeight: '800', color: Colors.lightGray, letterSpacing: 2, marginBottom: 10 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorSwatch: { width: 30, height: 30, borderRadius: 15 },
  colorSwatchSelected: { borderWidth: 3, borderColor: Colors.white },

  templateExRow: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateExName: { fontSize: 13, fontWeight: '700', color: Colors.white, marginBottom: 6 },
  templateExControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  templateExInput: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    width: 44,
    textAlign: 'center',
  },
  templateExX: { color: Colors.lightGray, fontSize: 13, fontWeight: '700' },
  templateExKg: { color: Colors.lightGray, fontSize: 11 },

  addExerciseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary + '66', borderRadius: 10,
    paddingVertical: 12, marginBottom: 20,
  },
  addExerciseBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 13, letterSpacing: 1 },

  saveBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 4 },
  saveBtnGradient: { paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontWeight: '900', fontSize: 15, letterSpacing: 1 },

  exercisePickerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  exercisePickerLeft: { flex: 1 },
  exercisePickerName: { fontSize: 14, fontWeight: '700', color: Colors.white },
  exercisePickerMeta: { fontSize: 11, color: Colors.lightGray, marginTop: 1 },
});
