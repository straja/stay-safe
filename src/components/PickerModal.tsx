import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { COLORS, SPACING, FONT } from '../theme';

export interface PickerItem {
  key: string;
  label: string;
  sublabel?: string;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: PickerItem[];
  selectedKey?: string;
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
  searchPlaceholder?: string;
}

export function PickerModal({
  visible,
  title,
  items,
  selectedKey,
  onSelect,
  onClose,
  searchPlaceholder = 'Search…',
}: PickerModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.sublabel?.toLowerCase().includes(q) ?? false)
    );
  }, [items, query]);

  function handleSelect(item: PickerItem) {
    setQuery('');
    onSelect(item);
  }

  function handleClose() {
    setQuery('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={COLORS.textMuted}
            autoFocus
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const selected = item.key === selectedKey;
            return (
              <TouchableOpacity
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.rowInner}>
                  <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
                    {item.label}
                  </Text>
                  {item.sublabel ? (
                    <Text style={styles.rowSublabel}>{item.sublabel}</Text>
                  ) : null}
                </View>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results for "{query}"</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT.sizeLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  closeBtnText: {
    fontSize: FONT.sizeMd,
    color: COLORS.accent,
  },
  searchRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
    fontSize: FONT.sizeMd,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowSelected: {
    backgroundColor: COLORS.accentSubtle,
  },
  rowInner: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FONT.sizeMd,
    color: COLORS.textPrimary,
  },
  rowLabelSelected: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  rowSublabel: {
    fontSize: FONT.sizeSm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  checkmark: {
    fontSize: FONT.sizeMd,
    color: COLORS.accent,
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT.sizeMd,
  },
});
