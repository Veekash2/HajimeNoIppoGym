import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { ThemedText } from './ThemedText';
import { getRankForXP, getNextRank, getXPProgress } from '../constants/rankData';

interface XPBarProps {
  xp: number;
  showLabels?: boolean;
  height?: number;
}

export function XPBar({ xp, showLabels = true, height = 12 }: XPBarProps) {
  const currentRank = getRankForXP(xp);
  const nextRank = getNextRank(xp);
  const progress = getXPProgress(xp);

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.labelsRow}>
          <ThemedText style={styles.rankName}>{currentRank.name}</ThemedText>
          {nextRank && (
            <ThemedText style={styles.xpText}>{xp} / {nextRank.xpRequired} XP</ThemedText>
          )}
          {!nextRank && (
            <ThemedText style={[styles.xpText, { color: Colors.gold }]}>MAX RANK</ThemedText>
          )}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(progress * 100, 100)}%`,
              backgroundColor: currentRank.color,
              height,
            },
          ]}
        />
      </View>
      {showLabels && nextRank && (
        <ThemedText style={styles.nextRank}>Next: {nextRank.name}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rankName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  xpText: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  track: {
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 6,
  },
  nextRank: {
    fontSize: 11,
    color: Colors.lightGray,
    marginTop: 4,
    textAlign: 'right',
  },
});
