import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { TwoPointsScreen } from './TwoPointsScreen';
import { ThreePointsScreen } from './ThreePointsScreen';
import { COLORS, FONT, SPACING, RADIUS } from '../theme';

export type DistancesStackParamList = {
  DistancesMenu: undefined;
  TwoPoints: undefined;
  ThreePoints: undefined;
};

const Stack = createNativeStackNavigator<DistancesStackParamList>();

function DistancesMenuScreen({ navigation }: any) {
  return (
    <View style={styles.menu}>
      <TouchableOpacity
        style={styles.modeCard}
        onPress={() => navigation.navigate('TwoPoints')}
        activeOpacity={0.8}
      >
        <Text style={styles.modeIcon}>↔</Text>
        <View style={styles.modeInfo}>
          <Text style={styles.modeTitle}>Two Points</Text>
          <Text style={styles.modeSub}>Capital A to Capital B · straight-line distance</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.modeCard}
        onPress={() => navigation.navigate('ThreePoints')}
        activeOpacity={0.8}
      >
        <Text style={styles.modeIcon}>△</Text>
        <View style={styles.modeInfo}>
          <Text style={styles.modeTitle}>Three Points</Text>
          <Text style={styles.modeSub}>Three cities · three distances · optional radius rings</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        All distances are geodesic (great-circle) using the Haversine formula.{'\n'}
        No geopolitical claims. Geometric and logistical context only.
      </Text>
    </View>
  );
}

export function DistancesNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="DistancesMenu"
        component={DistancesMenuScreen}
        options={{ title: 'Distances' }}
      />
      <Stack.Screen
        name="TwoPoints"
        component={TwoPointsScreen}
        options={{ title: 'Two Points' }}
      />
      <Stack.Screen
        name="ThreePoints"
        component={ThreePointsScreen}
        options={{ title: 'Three Points' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  menu: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  modeIcon: {
    fontSize: 28,
    color: COLORS.accent,
    marginRight: SPACING.md,
    width: 36,
    textAlign: 'center',
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: FONT.sizeLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modeSub: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
  },
  note: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
});
