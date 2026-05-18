import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/colors';
import { DEFAULT_EXERCISES, MUSCLE_GROUPS } from '../constants/exercises';

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  category: string;
  is_boxing: boolean;
  description?: string;
}

const CATEGORY_LABELS: { [key: string]: string } = {
  boxing: '🥊 Boxing',
  strength: '💪 Strength',
  cardio: '🏃 Cardio',
  tai_chi: '🧘 Tai Chi',
};

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('is_boxing', { ascending: false });

    if (data && data.length > 0) {
      setExercises(data);
    } else {
      setExercises(DEFAULT_EXERCISES as Exercise[]);
    }
    setLoading(false);
  }

  const filtered = exercises.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = selectedMuscle === 'All' || ex.muscle_group === selectedMuscle;
    const matchCat = selectedCategory === 'All' || ex.category === selectedCategory;
    return matchSearch && matchMuscle && matchCat;
  });

  const grouped = filtered.reduce<{ [key: string]: Exercise[] }>((acc, ex) => {
    const cat = ex.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ex);
    return acc;
  }, {});

  const categories = ['All', 'boxing', 'strength', 'cardio', 'tai_chi'];
  const muscles = MUSCLE_GROUPS;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EXERCISE LIBRARY</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.lightGray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={Colors.darkGray}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.darkGray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, selectedCategory === item && styles.chipActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[styles.chipText, selectedCategory === item && styles.chipTextActive]}>
              {CATEGORY_LABELS[item] || 'All'}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.categoryRow}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      />

      {/* Muscle Group Filter */}
      <FlatList
        horizontal
        data={muscles}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.muscleChip, selectedMuscle === item && styles.muscleChipActive]}
            onPress={() => setSelectedMuscle(item)}
          >
            <Text style={[styles.muscleChipText, selectedMuscle === item && styles.muscleChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.muscleRow}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      />

      {/* Exercise List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.exerciseItem}>
            <View style={styles.exerciseLeft}>
              <Text style={styles.exerciseCategory}>
                {CATEGORY_LABELS[item.category] || item.category}
              </Text>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseMuscle}>{item.muscle_group}</Text>
            </View>
            {item.is_boxing && (
              <View style={styles.boxingBadge}>
                <Text style={styles.boxingBadgeText}>BOXING</Text>
              </View>
            )}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No exercises found</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
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
    marginBottom: 8,
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
  categoryRow: {
    paddingLeft: 16,
    marginBottom: 8,
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.lightGray,
  },
  chipTextActive: {
    color: Colors.white,
  },
  muscleRow: {
    paddingLeft: 16,
    marginBottom: 8,
    flexGrow: 0,
  },
  muscleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  muscleChipActive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.accent,
  },
  muscleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.darkGray,
  },
  muscleChipTextActive: {
    color: Colors.accent,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
  },
  exerciseLeft: {
    flex: 1,
    gap: 2,
  },
  exerciseCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  exerciseMuscle: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  boxingBadge: {
    backgroundColor: Colors.primary + '33',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  boxingBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.darkGray,
  },
});
