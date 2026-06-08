import { View, Text, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { Colors, Spacing, BorderRadius } from '@/lib/theme';

interface ActivityCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

export function ActivityCard({ icon, label, value }: ActivityCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.text.primary,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
});
