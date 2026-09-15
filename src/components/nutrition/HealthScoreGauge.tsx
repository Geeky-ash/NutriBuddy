import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii, shadows, typography } from '../../theme';
import { HealthGrade } from '../../types/nutrition';

interface HealthScoreGaugeProps {
  score: number;       // 0 to 100
  grade?: HealthGrade;
  size?: number;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({
  score,
  grade,
  size = 140,
}) => {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(Math.min(Math.max(score, 0), 100) / 100, {
      damping: 14,
      stiffness: 90,
    });
  }, [score]);

  const getTier = (val: number) => {
    if (val >= 85) return colors.score.excellent;
    if (val >= 70) return colors.score.good;
    if (val >= 50) return colors.score.moderate;
    if (val >= 30) return colors.score.poor;
    return colors.score.critical;
  };

  const currentTier = getTier(score);
  const derivedGrade = grade || (score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F');

  const animatedBarWidth = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
    };
  });

  return (
    <View style={[styles.card, { backgroundColor: currentTier.bg, borderColor: currentTier.border }]}>
      <View style={styles.topRow}>
        <View style={styles.scoreGroup}>
          <Text style={[styles.scoreNumber, { color: currentTier.text }]}>{score}</Text>
          <Text style={[styles.scoreTotal, { color: currentTier.text }]}>/100</Text>
        </View>

        <View style={[styles.gradeBadge, { backgroundColor: currentTier.badge }]}>
          <Text style={styles.gradeText}>Grade {derivedGrade}</Text>
        </View>
      </View>

      {/* Visual meter bar */}
      <View style={styles.meterTrack}>
        <Animated.View
          style={[
            styles.meterFill,
            { backgroundColor: currentTier.badge },
            animatedBarWidth,
          ]}
        />
      </View>

      <View style={styles.labelRow}>
        <Text style={[styles.tierLabel, { color: currentTier.text }]}>{currentTier.label}</Text>
        <Text style={styles.benchmarkText}>NutriBuddy Health Index</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: 18,
    borderWidth: 1.5,
    ...shadows.soft,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    ...typography.displayLarge,
    fontSize: 42,
    lineHeight: 46,
  },
  scoreTotal: {
    ...typography.headingMedium,
    fontSize: 16,
    marginLeft: 4,
    opacity: 0.7,
  },
  gradeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  gradeText: {
    ...typography.labelBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  meterTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierLabel: {
    ...typography.labelBold,
    fontSize: 13,
  },
  benchmarkText: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
