export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  category: 'boxing' | 'strength' | 'cardio' | 'tai_chi';
  is_boxing: boolean;
  description?: string;
}

export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'jab', name: 'Jab', muscle_group: 'Full Body', category: 'boxing', is_boxing: true },
  { id: 'cross', name: 'Cross', muscle_group: 'Full Body', category: 'boxing', is_boxing: true },
  { id: 'hook', name: 'Hook', muscle_group: 'Full Body', category: 'boxing', is_boxing: true },
  { id: 'uppercut', name: 'Uppercut', muscle_group: 'Full Body', category: 'boxing', is_boxing: true },
  { id: 'shadowboxing', name: 'Shadowboxing', muscle_group: 'Full Body', category: 'boxing', is_boxing: true },
  { id: 'heavy_bag', name: 'Heavy Bag Work', muscle_group: 'Full Body', category: 'boxing', is_boxing: true },
  { id: 'speed_bag', name: 'Speed Bag', muscle_group: 'Shoulders', category: 'boxing', is_boxing: true },
  { id: 'double_end_bag', name: 'Double End Bag', muscle_group: 'Full Body', category: 'boxing', is_boxing: true },
  { id: 'jump_rope', name: 'Jump Rope', muscle_group: 'Full Body', category: 'cardio', is_boxing: true },
  { id: 'neck_bridge', name: 'Neck Bridge', muscle_group: 'Neck', category: 'boxing', is_boxing: true },
  { id: 'bob_weave', name: 'Bob and Weave', muscle_group: 'Full Body', category: 'boxing', is_boxing: true },
  { id: 'slip_bag', name: 'Slip Bag', muscle_group: 'Full Body', category: 'boxing', is_boxing: true },
  { id: 'bench_press', name: 'Bench Press', muscle_group: 'Chest', category: 'strength', is_boxing: false },
  { id: 'incline_bench', name: 'Incline Bench Press', muscle_group: 'Chest', category: 'strength', is_boxing: false },
  { id: 'pullups', name: 'Pull-ups', muscle_group: 'Back', category: 'strength', is_boxing: false },
  { id: 'chinups', name: 'Chin-ups', muscle_group: 'Back', category: 'strength', is_boxing: false },
  { id: 'barbell_row', name: 'Barbell Row', muscle_group: 'Back', category: 'strength', is_boxing: false },
  { id: 'deadlift', name: 'Deadlift', muscle_group: 'Full Body', category: 'strength', is_boxing: false },
  { id: 'squat', name: 'Squat', muscle_group: 'Legs', category: 'strength', is_boxing: false },
  { id: 'rdl', name: 'Romanian Deadlift', muscle_group: 'Legs', category: 'strength', is_boxing: false },
  { id: 'ohp', name: 'Overhead Press', muscle_group: 'Shoulders', category: 'strength', is_boxing: false },
  { id: 'curl', name: 'Dumbbell Curl', muscle_group: 'Arms', category: 'strength', is_boxing: false },
  { id: 'dips', name: 'Tricep Dips', muscle_group: 'Arms', category: 'strength', is_boxing: false },
  { id: 'pushups', name: 'Push-ups', muscle_group: 'Chest', category: 'strength', is_boxing: false },
  { id: 'situps', name: 'Sit-ups', muscle_group: 'Core', category: 'strength', is_boxing: false },
  { id: 'plank', name: 'Plank', muscle_group: 'Core', category: 'strength', is_boxing: false },
  { id: 'russian_twists', name: 'Russian Twists', muscle_group: 'Core', category: 'strength', is_boxing: false },
  { id: 'mountain_climbers', name: 'Mountain Climbers', muscle_group: 'Core', category: 'cardio', is_boxing: false },
  { id: 'burpees', name: 'Burpees', muscle_group: 'Full Body', category: 'cardio', is_boxing: false },
  { id: 'running', name: 'Running', muscle_group: 'Full Body', category: 'cardio', is_boxing: false },
  { id: 'tai_chi_form', name: 'Tai Chi Form', muscle_group: 'Full Body', category: 'tai_chi', is_boxing: false },
  { id: 'tai_chi_push', name: 'Tai Chi Push Hands', muscle_group: 'Full Body', category: 'tai_chi', is_boxing: false },
];

export const MUSCLE_GROUPS = [
  'All',
  'Full Body',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Neck',
];

export const CATEGORIES = ['All', 'boxing', 'strength', 'cardio', 'tai_chi'];
