import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface ThemedTextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'label';
  color?: string;
  uppercase?: boolean;
}

export function ThemedText({ children, style, variant = 'body', color, uppercase }: ThemedTextProps) {
  const variantStyle = styles[variant];
  const textColor = color ? { color } : {};
  const upperStyle = uppercase ? { textTransform: 'uppercase' as const } : {};

  return (
    <Text style={[variantStyle, textColor, upperStyle, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.white,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.lightGray,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.lightGray,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
