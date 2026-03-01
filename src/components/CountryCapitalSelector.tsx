import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PickerModal, PickerItem } from './PickerModal';
import { getCountries } from '../data/loader';
import type { Country, Capital, SelectedPoint } from '../types/country';
import { COLORS, SPACING, FONT, RADIUS } from '../theme';

interface CountryCapitalSelectorProps {
  label: string;
  value: SelectedPoint | null;
  onChange: (point: SelectedPoint) => void;
}

export function CountryCapitalSelector({
  label,
  value,
  onChange,
}: CountryCapitalSelectorProps) {
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [capitalModalOpen, setCapitalModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(
    value?.country ?? null
  );
  const [selectedCapital, setSelectedCapital] = useState<Capital | null>(
    value?.capital ?? null
  );

  const countries = useMemo(() => getCountries(), []);

  const countryItems: PickerItem[] = useMemo(
    () =>
      countries.map((c) => ({
        key: c.iso,
        label: c.name,
        sublabel: c.iso,
      })),
    [countries]
  );

  const capitalItems: PickerItem[] = useMemo(() => {
    if (!selectedCountry) return [];
    return selectedCountry.capitals.map((cap) => ({
      key: cap.name,
      label: cap.name,
      sublabel: cap.note ?? undefined,
    }));
  }, [selectedCountry]);

  // Auto-select capital when country has exactly one.
  useEffect(() => {
    if (!selectedCountry) return;
    if (selectedCountry.capitals.length === 1) {
      const cap = selectedCountry.capitals[0];
      setSelectedCapital(cap);
      onChange({ country: selectedCountry, capital: cap });
    } else {
      setSelectedCapital(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  function handleCountrySelect(item: PickerItem) {
    const country = countries.find((c) => c.iso === item.key) ?? null;
    setSelectedCountry(country);
    setCountryModalOpen(false);
    if (country && country.capitals.length > 1) {
      setCapitalModalOpen(true);
    }
  }

  function handleCapitalSelect(item: PickerItem) {
    if (!selectedCountry) return;
    const cap = selectedCountry.capitals.find((c) => c.name === item.key) ?? null;
    setSelectedCapital(cap);
    setCapitalModalOpen(false);
    if (cap) {
      onChange({ country: selectedCountry, capital: cap });
    }
  }

  const showCapitalPicker =
    selectedCountry !== null && selectedCountry.capitals.length > 1;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setCountryModalOpen(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedCountry && styles.selectorPlaceholder,
          ]}
        >
          {selectedCountry ? selectedCountry.name : 'Select country…'}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {showCapitalPicker && (
        <TouchableOpacity
          style={[styles.selector, styles.capitalSelector]}
          onPress={() => setCapitalModalOpen(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.selectorText,
              !selectedCapital && styles.selectorPlaceholder,
            ]}
          >
            {selectedCapital ? selectedCapital.name : 'Select capital / city…'}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}

      {selectedCapital && (
        <Text style={styles.coordHint}>
          {selectedCapital.lat.toFixed(4)}°, {selectedCapital.lon.toFixed(4)}°
          {selectedCapital.note ? `  ·  ${selectedCapital.note}` : ''}
        </Text>
      )}

      <PickerModal
        visible={countryModalOpen}
        title="Select Country"
        items={countryItems}
        selectedKey={selectedCountry?.iso}
        onSelect={handleCountrySelect}
        onClose={() => setCountryModalOpen(false)}
        searchPlaceholder="Search countries…"
      />

      <PickerModal
        visible={capitalModalOpen}
        title={`Capital — ${selectedCountry?.name ?? ''}`}
        items={capitalItems}
        selectedKey={selectedCapital?.name}
        onSelect={handleCapitalSelect}
        onClose={() => setCapitalModalOpen(false)}
        searchPlaceholder="Search cities…"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT.sizeSm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.xs,
  },
  capitalSelector: {
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
  },
  selectorText: {
    flex: 1,
    fontSize: FONT.sizeMd,
    color: COLORS.textPrimary,
  },
  selectorPlaceholder: {
    color: COLORS.textMuted,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
  },
  coordHint: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.xs,
  },
});
