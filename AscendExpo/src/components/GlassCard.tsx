import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../theme';

export function GlassCard({ children, style, ...rest }: ViewProps) {
  return (
    <BlurView intensity={40} tint="light" style={[styles.wrap, style]} {...rest}>
      <View style={styles.inner}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.glassStroke,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  inner: {
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
});
