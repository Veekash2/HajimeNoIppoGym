import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { USER_ID } from '../constants/userId';

export interface Profile {
  id: string;
  display_name: string | null;
  xp: number;
  rank_level: number;
  total_workouts: number;
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
}

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', USER_ID)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error('Profile fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    userId: USER_ID,
    refreshProfile: fetchProfile,
  };
}
