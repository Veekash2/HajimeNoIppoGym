import React, { useState } from 'react';
import { View, Image, StyleSheet, ImageErrorEventData, NativeSyntheticEvent } from 'react-native';
import { Colors } from '../constants/colors';
import { ThemedText } from './ThemedText';
import { Rank } from '../constants/rankData';

interface RankBadgeProps {
  rank: Rank;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}

export function RankBadge({ rank, size = 'medium', showName = true }: RankBadgeProps) {
  const [imageError, setImageError] = useState(false);

  const dimensions = {
    small: { width: 60, height: 60, fontSize: 10 },
    medium: { width: 120, height: 120, fontSize: 14 },
    large: { width: 200, height: 200, fontSize: 18 },
  }[size];

  function handleImageError(_e: NativeSyntheticEvent<ImageErrorEventData>) {
    setImageError(true);
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.imageContainer,
          {
            width: dimensions.width,
            height: dimensions.height,
            borderColor: rank.color,
          },
        ]}
      >
        {!imageError ? (
          <Image
            source={{ uri: rank.imageUrl }}
            style={[styles.image, { width: dimensions.width, height: dimensions.height }]}
            onError={handleImageError}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                width: dimensions.width,
                height: dimensions.height,
                backgroundColor: rank.color + '33',
              },
            ]}
          >
            <ThemedText style={{ fontSize: dimensions.fontSize * 2 }}>🥊</ThemedText>
          </View>
        )}
      </View>
      {showName && (
        <View style={styles.nameContainer}>
          <ThemedText
            style={[styles.rankName, { color: rank.color, fontSize: dimensions.fontSize }]}
          >
            {rank.name}
          </ThemedText>
          <ThemedText style={[styles.character, { fontSize: dimensions.fontSize - 2 }]}>
            {rank.character}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  imageContainer: {
    borderRadius: 12,
    borderWidth: 3,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 10,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  nameContainer: {
    alignItems: 'center',
    gap: 2,
  },
  rankName: {
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  character: {
    color: Colors.lightGray,
    fontWeight: '600',
  },
});
