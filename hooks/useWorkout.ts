import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface WorkoutSet {
  id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  completed: boolean;
  is_pr: boolean;
}

export interface WorkoutExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: WorkoutSet[];
}

export interface ActiveWorkout {
  id: string | null;
  name: string;
  started_at: Date;
  exercises: WorkoutExercise[];
}

export function useWorkout(userId: string | null) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeWorkout) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeWorkout]);

  function startRestTimer(seconds: number = 90) {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setRestTimer(seconds);
    setIsResting(true);
    restTimerRef.current = setInterval(() => {
      setRestTimer(t => {
        if (t <= 1) {
          clearInterval(restTimerRef.current!);
          setIsResting(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function stopRestTimer() {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setIsResting(false);
    setRestTimer(0);
  }

  function startWorkout(name: string = 'Morning Session') {
    setActiveWorkout({
      id: null,
      name,
      started_at: new Date(),
      exercises: [],
    });
  }

  function addExercise(exercise: { id: string; name: string }) {
    if (!activeWorkout) return;
    const newExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: [
        {
          id: Date.now().toString() + '_1',
          set_number: 1,
          reps: 0,
          weight_kg: 0,
          completed: false,
          is_pr: false,
        },
      ],
    };
    setActiveWorkout(prev => prev ? {
      ...prev,
      exercises: [...prev.exercises, newExercise],
    } : null);
  }

  function addSet(exerciseId: string) {
    if (!activeWorkout) return;
    setActiveWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          const newSetNumber = ex.sets.length + 1;
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [...ex.sets, {
              id: Date.now().toString(),
              set_number: newSetNumber,
              reps: lastSet?.reps ?? 0,
              weight_kg: lastSet?.weight_kg ?? 0,
              completed: false,
              is_pr: false,
            }],
          };
        }),
      };
    });
  }

  function removeSet(exerciseId: string, setId: string) {
    if (!activeWorkout) return;
    setActiveWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          const filtered = ex.sets.filter(s => s.id !== setId);
          return {
            ...ex,
            sets: filtered.map((s, i) => ({ ...s, set_number: i + 1 })),
          };
        }),
      };
    });
  }

  function updateSet(exerciseId: string, setId: string, updates: Partial<WorkoutSet>) {
    if (!activeWorkout) return;
    setActiveWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map(s => s.id === setId ? { ...s, ...updates } : s),
          };
        }),
      };
    });
  }

  function toggleSetComplete(exerciseId: string, setId: string) {
    if (!activeWorkout) return;
    setActiveWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map(s => {
              if (s.id !== setId) return s;
              const nowComplete = !s.completed;
              return { ...s, completed: nowComplete };
            }),
          };
        }),
      };
    });
    startRestTimer(90);
  }

  function removeExercise(exerciseId: string) {
    if (!activeWorkout) return;
    setActiveWorkout(prev => prev ? {
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId),
    } : null);
  }

  async function finishWorkout(): Promise<{ xpEarned: number; rankedUp: boolean; newRank?: string }> {
    if (!activeWorkout || !userId) {
      return { xpEarned: 0, rankedUp: false };
    }

    const finishedAt = new Date();
    const durationSeconds = Math.floor((finishedAt.getTime() - activeWorkout.started_at.getTime()) / 1000);

    // Calculate volume
    let totalVolume = 0;
    let completedSets = 0;
    let xpEarned = 0;

    for (const ex of activeWorkout.exercises) {
      for (const set of ex.sets) {
        if (set.completed) {
          totalVolume += set.weight_kg * set.reps;
          completedSets++;
          xpEarned += 10;
          if (set.is_pr) xpEarned += 50;
        }
      }
    }

    try {
      // Create workout record
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          name: activeWorkout.name,
          started_at: activeWorkout.started_at.toISOString(),
          finished_at: finishedAt.toISOString(),
          duration_seconds: durationSeconds,
          total_volume_kg: totalVolume,
          xp_earned: xpEarned,
          workout_type: 'strength',
        })
        .select()
        .single();

      if (workoutError || !workout) {
        console.error('Error saving workout:', workoutError);
        return { xpEarned: 0, rankedUp: false };
      }

      // Save exercises and sets
      for (const ex of activeWorkout.exercises) {
        const { data: workoutExercise } = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workout.id,
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            order_index: activeWorkout.exercises.indexOf(ex),
          })
          .select()
          .single();

        if (workoutExercise) {
          const setsToInsert = ex.sets
            .filter(s => s.completed)
            .map(s => ({
              workout_exercise_id: workoutExercise.id,
              set_number: s.set_number,
              reps: s.reps,
              weight_kg: s.weight_kg,
              is_pr: s.is_pr,
              completed: true,
            }));

          if (setsToInsert.length > 0) {
            await supabase.from('sets').insert(setsToInsert);
          }
        }
      }

      // Update profile XP
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('xp, rank_level, total_workouts, current_streak, last_workout_date')
        .eq('id', userId)
        .single();

      if (currentProfile) {
        const { getRankForXP } = await import('../constants/rankData');
        const oldXP = currentProfile.xp || 0;
        const newXP = oldXP + xpEarned;
        const oldRank = getRankForXP(oldXP);
        const newRank = getRankForXP(newXP);
        const rankedUp = newRank.level > oldRank.level;

        // Check streak
        const today = new Date().toISOString().split('T')[0];
        const lastDate = currentProfile.last_workout_date;
        let newStreak = currentProfile.current_streak || 0;

        if (lastDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (lastDate === yesterdayStr) {
            newStreak += 1;
            xpEarned += 15;
          } else if (lastDate !== today) {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }

        await supabase
          .from('profiles')
          .update({
            xp: newXP + (newStreak > 1 ? 15 : 0),
            rank_level: newRank.level,
            total_workouts: (currentProfile.total_workouts || 0) + 1,
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, currentProfile.current_streak || 0),
            last_workout_date: today,
          })
          .eq('id', userId);

        setActiveWorkout(null);
        if (timerRef.current) clearInterval(timerRef.current);
        setElapsedSeconds(0);

        return { xpEarned, rankedUp, newRank: rankedUp ? newRank.name : undefined };
      }
    } catch (e) {
      console.error('Error finishing workout:', e);
    }

    setActiveWorkout(null);
    return { xpEarned, rankedUp: false };
  }

  function cancelWorkout() {
    setActiveWorkout(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedSeconds(0);
  }

  return {
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
    startRestTimer,
    stopRestTimer,
  };
}
