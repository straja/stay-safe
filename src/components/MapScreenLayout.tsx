import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT } from '../theme';

interface MapScreenLayoutProps {
  /** Full-screen map element */
  map: ReactNode;
  /** Map takes this fraction of the screen height (0–1). Default 0.52 */
  mapFraction?: number;
  /** Panel content below the map */
  children: ReactNode;
  /** Optional disclaimer shown at bottom of panel */
  showDisclaimer?: boolean;
}

export function MapScreenLayout({
  map,
  mapFraction = 0.52,
  children,
  showDisclaimer = false,
}: MapScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Map area */}
        <View style={[styles.mapContainer, { flex: mapFraction }]}>{map}</View>

        {/* Panel */}
        <View style={[styles.panel, { flex: 1 - mapFraction }]}>
          <ScrollView
            contentContainerStyle={styles.panelContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}

            {showDisclaimer && (
              <Text style={styles.disclaimer}>
                Data is informational and does not replace official safety guidance.
              </Text>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  mapContainer: {
    overflow: 'hidden',
  },
  panel: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  panelContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  disclaimer: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
    lineHeight: 18,
  },
});
