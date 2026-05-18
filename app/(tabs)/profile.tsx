import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { RANKS, getRankForXP, getNextRank, getXPProgress } from '../../constants/rankData';
import { XPBar } from '../../components/XPBar';

export default function ProfileScreen() {
  const { profile } = useAuth();
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  const xp = profile?.xp || 0;
  const currentRank = getRankForXP(xp);
  const nextRank = getNextRank(xp);
  const progress = getXPProgress(xp);

  function handleImageError(level: number) {
    setImageErrors(prev => ({ ...prev, [level]: true }));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={[currentRank.color + '44', Colors.background]}
          style={styles.heroSection}
        >
          <View style={styles.heroImageContainer}>
            {!imageErrors[currentRank.level] ? (
              <Image
                source={{ uri: currentRank.imageUrl }}
                style={styles.heroImage}
                onError={() => handleImageError(currentRank.level)}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImagePlaceholder, { backgroundColor: currentRank.color + '33' }]}>
                <Text style={styles.heroPlaceholderEmoji}>🥊</Text>
              </View>
            )}
            <LinearGradient
              colors={['transparent', Colors.background]}
              style={styles.heroGradientOverlay}
            />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.rankName} numberOfLines={1}>{currentRank.name}</Text>
            <Text style={styles.rankCharacter}>{currentRank.character}</Text>
            <Text style={styles.rankDescription}>{currentRank.description}</Text>

            <View style={styles.xpContainer}>
              <Text style={styles.xpAmount}>{xp.toLocaleString()} XP</Text>
              {nextRank && (
                <Text style={styles.xpToNext}>
                  {(nextRank.xpRequired - xp).toLocaleString()} XP to {nextRank.name}
                </Text>
              )}
            </View>

            <View style={styles.xpBarWrapper}>
              <XPBar xp={xp} showLabels={false} height={16} />
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>YOUR STATS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile?.total_workouts || 0}</Text>
              <Text style={styles.statLabel}>TOTAL{'\n'}WORKOUTS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile?.current_streak || 0}</Text>
              <Text style={styles.statLabel}>CURRENT{'\n'}STREAK 🔥</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile?.longest_streak || 0}</Text>
              <Text style={styles.statLabel}>LONGEST{'\n'}STREAK</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{currentRank.level}</Text>
              <Text style={styles.statLabel}>CURRENT{'\n'}RANK</Text>
            </View>
          </View>
        </View>

        {/* Rank Progression Tree */}
        <View style={styles.ranksSection}>
          <Text style={styles.sectionTitle}>RANK PROGRESSION</Text>
          {RANKS.map((rank, index) => {
            const isCurrentRank = rank.level === currentRank.level;
            const isUnlocked = xp >= rank.xpRequired;
            const isLocked = !isUnlocked;

            return (
              <View key={rank.level} style={styles.rankTreeItem}>
                {/* Connector line */}
                {index < RANKS.length - 1 && (
                  <View
                    style={[
                      styles.connector,
                      isUnlocked && styles.connectorUnlocked,
                    ]}
                  />
                )}

                <View
                  style={[
                    styles.rankCard,
                    isCurrentRank && styles.rankCardCurrent,
                    isLocked && styles.rankCardLocked,
                  ]}
                >
                  {/* Rank Image */}
                  <View style={[styles.rankThumb, { borderColor: isLocked ? Colors.border : rank.color }]}>
                    {!imageErrors[rank.level] && !isLocked ? (
                      <Image
                        source={{ uri: rank.imageUrl }}
                        style={styles.rankThumbImage}
                        onError={() => handleImageError(rank.level)}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.rankThumbPlaceholder, { backgroundColor: rank.color + '22' }]}>
                        {isLocked ? (
                          <Ionicons name="lock-closed" size={20} color={Colors.border} />
                        ) : (
                          <Text style={{ fontSize: 20 }}>🥊</Text>
                        )}
                      </View>
                    )}
                    {isCurrentRank && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>YOU</Text>
                      </View>
                    )}
                  </View>

                  {/* Rank Info */}
                  <View style={styles.rankInfo}>
                    <View style={styles.rankInfoTop}>
                      <Text
                        style={[
                          styles.rankItemName,
                          isLocked && styles.rankItemNameLocked,
                          isCurrentRank && { color: rank.color },
                        ]}
                      >
                        {rank.name}
                      </Text>
                      {isUnlocked && !isCurrentRank && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                      )}
                    </View>
                    <Text style={[styles.rankItemChar, isLocked && styles.rankItemCharLocked]}>
                      {rank.character}
                    </Text>
                    <Text style={styles.rankItemDesc} numberOfLines={1}>
                      {rank.description}
                    </Text>
                    <View style={styles.rankXPRow}>
                      <Text style={[styles.rankXPRequired, isCurrentRank && { color: rank.color }]}>
                        {rank.xpRequired.toLocaleString()} XP
                      </Text>
                      {isCurrentRank && (
                        <View style={styles.currentIndicator}>
                          <View style={[styles.currentDot, { backgroundColor: rank.color }]} />
                          <Text style={[styles.currentText, { color: rank.color }]}>CURRENT</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Profile Info */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.accountCard}>
            <View style={styles.accountRow}>
              <Ionicons name="person-outline" size={20} color={Colors.lightGray} />
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Display Name</Text>
                <Text style={styles.accountValue}>{profile?.display_name || '—'}</Text>
              </View>
            </View>
            <View style={[styles.accountRow, { borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={Colors.lightGray} />
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Email</Text>
                <Text style={styles.accountValue}>veekash@whakatau.com</Text>
              </View>
            </View>
          </View>

        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroSection: {
    paddingBottom: 24,
  },
  heroImageContainer: {
    height: 220,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderEmoji: {
    fontSize: 80,
  },
  heroGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  rankName: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  rankCharacter: {
    fontSize: 15,
    color: Colors.lightGray,
    marginTop: 2,
    fontWeight: '600',
  },
  rankDescription: {
    fontSize: 13,
    color: Colors.darkGray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  xpContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  xpAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.gold,
  },
  xpToNext: {
    fontSize: 12,
    color: Colors.lightGray,
    textAlign: 'right',
    lineHeight: 18,
  },
  xpBarWrapper: {
    marginTop: 8,
  },
  // Stats
  statsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.lightGray,
    letterSpacing: 3,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.lightGray,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  // Rank Tree
  ranksSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rankTreeItem: {
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 30,
    top: 74,
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
    zIndex: 0,
  },
  connectorUnlocked: {
    backgroundColor: Colors.primary,
  },
  rankCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    alignItems: 'center',
  },
  rankCardCurrent: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '11',
  },
  rankCardLocked: {
    opacity: 0.4,
  },
  rankThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  rankThumbImage: {
    width: '100%',
    height: '100%',
  },
  rankThumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 1,
  },
  rankInfo: {
    flex: 1,
    gap: 2,
  },
  rankInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankItemName: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  rankItemNameLocked: {
    color: Colors.darkGray,
  },
  rankItemChar: {
    fontSize: 11,
    color: Colors.lightGray,
    fontWeight: '600',
  },
  rankItemCharLocked: {
    color: Colors.border,
  },
  rankItemDesc: {
    fontSize: 11,
    color: Colors.darkGray,
    fontStyle: 'italic',
  },
  rankXPRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rankXPRequired: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.lightGray,
  },
  currentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  currentText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  // Account
  accountSection: {
    padding: 20,
    paddingTop: 0,
  },
  accountCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 11,
    color: Colors.darkGray,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  accountValue: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: '600',
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '44',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 1,
  },
});
