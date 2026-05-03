import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Switch,
  Alert,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  useTheme,
  Card,
  Button,
  Badge,
  Chip,
  Spinner,
  EmptyState,
  SectionHeader,
} from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';
import { restaurantEndpoints } from '@eta/api-client';
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Clock,
  UtensilsCrossed,
} from 'lucide-react-native';

interface MenuCategory {
  id: number;
  name: string;
  sort_order: number;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  prep_time_minutes: number;
  is_available: boolean;
  category: number;
  category_name?: string;
}

export default function MenuScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const restaurantId = useAuthStore((s) => s.user?.restaurantId);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['menuCategories', restaurantId],
    queryFn: async () => {
      const res = await restaurantEndpoints.menuCategories(restaurantId);
      return (res.data?.results ?? res.data ?? []) as MenuCategory[];
    },
    enabled: !!restaurantId,
  });

  const itemsQuery = useQuery({
    queryKey: ['menuItems', restaurantId],
    queryFn: async () => {
      const res = await restaurantEndpoints.menuItems({ restaurant: restaurantId, page_size: 200 });
      return (res.data?.results ?? res.data ?? []) as MenuItem[];
    },
    enabled: !!restaurantId,
  });

  const categories: MenuCategory[] = categoriesQuery.data ?? [];
  const allItems: MenuItem[] = itemsQuery.data ?? [];
  const filteredItems = selectedCategory
    ? allItems.filter((i) => i.category === selectedCategory)
    : allItems;

  const isLoading = categoriesQuery.isLoading || itemsQuery.isLoading;

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) =>
      restaurantEndpoints.createMenuCategory({
        name,
        restaurant: restaurantId!,
        sort_order: categories.length,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => restaurantEndpoints.deleteMenuCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      if (selectedCategory) setSelectedCategory(null);
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, is_available }: { id: number; is_available: boolean }) =>
      restaurantEndpoints.updateMenuItem(id, { is_available }),
    onMutate: async ({ id, is_available }) => {
      await queryClient.cancelQueries({ queryKey: ['menuItems'] });
      queryClient.setQueryData(
        ['menuItems', restaurantId],
        (old: MenuItem[] | undefined) => {
          if (!old) return old;
          return old.map((item) =>
            item.id === id ? { ...item, is_available } : item,
          );
        },
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['menuItems'] }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => restaurantEndpoints.deleteMenuItem(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['menuItems'] }),
  });

  const handleAddCategory = useCallback(() => {
    Alert.prompt('New Category', 'Enter category name', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Create',
        onPress: (name) => {
          if (name?.trim()) createCategoryMutation.mutate(name.trim());
        },
      },
    ]);
  }, [createCategoryMutation]);

  const handleCategoryLongPress = useCallback(
    (cat: MenuCategory) => {
      Alert.alert(cat.name, 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Category',
              `Delete "${cat.name}" and all its items?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteCategoryMutation.mutate(cat.id),
                },
              ],
            );
          },
        },
      ]);
    },
    [deleteCategoryMutation],
  );

  const handleDeleteItem = useCallback(
    (item: MenuItem) => {
      Alert.alert('Delete Item', `Remove "${item.name}" from the menu?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItemMutation.mutate(item.id),
        },
      ]);
    },
    [deleteItemMutation],
  );

  const handleRefresh = useCallback(() => {
    categoriesQuery.refetch();
    itemsQuery.refetch();
  }, [categoriesQuery, itemsQuery]);

  const getCategoryItemCount = useCallback(
    (catId: number) => allItems.filter((i) => i.category === catId).length,
    [allItems],
  );

  const renderItem = useCallback(
    ({ item }: { item: MenuItem }) => (
      <Card tone="default" padding="md" border style={styles.itemCard}>
        <View style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text
              style={{
                ...t.typography.h4,
                fontFamily: t.fontFamily.sans,
                color: t.colors.textPrimary,
              }}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <View style={styles.itemMeta}>
              <Text
                style={{
                  ...t.typography.body,
                  fontFamily: t.fontFamily.sans,
                  color: t.colors.textSecondary,
                  fontWeight: '600',
                }}
              >
                ₹{item.price}
              </Text>
              <View style={styles.metaDot} />
              <Clock size={13} color={t.colors.textTertiary} />
              <Text
                style={{
                  ...t.typography.bodySm,
                  fontFamily: t.fontFamily.sans,
                  color: t.colors.textTertiary,
                  marginLeft: 3,
                }}
              >
                {item.prep_time_minutes} min
              </Text>
            </View>
          </View>

          <View style={styles.itemActions}>
            <Switch
              value={item.is_available}
              onValueChange={(val) =>
                toggleAvailabilityMutation.mutate({
                  id: item.id,
                  is_available: val,
                })
              }
              trackColor={{
                false: t.colors.gray400,
                true: t.colors.successBg,
              }}
              thumbColor={
                item.is_available ? t.colors.successFg : t.colors.gray500
              }
            />
          </View>
        </View>

        <View
          style={[styles.itemFooter, { borderTopColor: t.colors.borderSubtle }]}
        >
          <Badge
            label={item.is_available ? 'AVAILABLE' : 'UNAVAILABLE'}
            variant={item.is_available ? 'mint' : 'neutral'}
          />
          <View style={styles.itemFooterActions}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(dashboard)/menu/item',
                  params: { id: item.id },
                })
              }
              hitSlop={8}
              style={styles.actionBtn}
              accessibilityLabel={`Edit ${item.name}`}
            >
              <Pencil size={16} color={t.colors.textTertiary} />
            </Pressable>
            <Pressable
              onPress={() => handleDeleteItem(item)}
              hitSlop={8}
              style={styles.actionBtn}
              accessibilityLabel={`Delete ${item.name}`}
            >
              <Trash2 size={16} color={t.colors.errorFg} />
            </Pressable>
          </View>
        </View>
      </Card>
    ),
    [t, toggleAvailabilityMutation, handleDeleteItem],
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: t.colors.bg },
        ]}
      >
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
          filteredItems.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={categoriesQuery.isRefetching || itemsQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor={t.colors.textMuted}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text
                  style={{
                    ...t.typography.label,
                    fontFamily: t.fontFamily.sans,
                    color: t.colors.textMuted,
                  }}
                >
                  MANAGE
                </Text>
                <Text
                  style={[
                    styles.pageTitle,
                    {
                      ...t.typography.h1,
                      fontFamily: t.fontFamily.display,
                      color: t.colors.textPrimary,
                    },
                  ]}
                >
                  Menu
                </Text>
              </View>
              <Button
                label="Add item"
                variant="primary"
                size="sm"
                onPress={() =>
                  router.push({ pathname: '/(dashboard)/menu/item' })
                }
              />
            </View>

            <Text
              style={[
                styles.description,
                {
                  ...t.typography.body,
                  fontFamily: t.fontFamily.sans,
                  color: t.colors.textTertiary,
                },
              ]}
            >
              Manage categories and menu items for your restaurant.
            </Text>

            {/* Categories */}
            <SectionHeader
              label="CATEGORIES"
              actionLabel="+ Add"
              onAction={handleAddCategory}
            />
            {categories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                <Chip
                  label={`All (${allItems.length})`}
                  active={selectedCategory === null}
                  onPress={() => setSelectedCategory(null)}
                />
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onLongPress={() => handleCategoryLongPress(cat)}
                  >
                    <Chip
                      label={`${cat.name} (${getCategoryItemCount(cat.id)})`}
                      active={selectedCategory === cat.id}
                      onPress={() =>
                        setSelectedCategory(
                          selectedCategory === cat.id ? null : cat.id,
                        )
                      }
                    />
                  </Pressable>
                ))}
                <Chip label="+" onPress={handleAddCategory} />
              </ScrollView>
            ) : (
              <Card
                tone="sunk"
                padding="md"
                border
                style={styles.noCategoriesCard}
              >
                <Text
                  style={{
                    ...t.typography.bodySm,
                    fontFamily: t.fontFamily.sans,
                    color: t.colors.textTertiary,
                    textAlign: 'center',
                  }}
                >
                  No categories yet. Add one to organize your menu.
                </Text>
              </Card>
            )}

            {/* Items section header */}
            <SectionHeader
              label={
                selectedCategory
                  ? `${categories.find((c) => c.id === selectedCategory)?.name ?? 'ITEMS'}`.toUpperCase()
                  : 'ALL ITEMS'
              }
            />
          </>
        }
        ListEmptyComponent={
          <Card tone="default" padding="lg" border>
            <EmptyState
              icon={
                <BookOpen size={28} color={t.colors.accentPowderBlueInk} />
              }
              title={
                categories.length === 0
                  ? 'Your menu is empty'
                  : 'No items in this category'
              }
              description={
                categories.length === 0
                  ? 'Start by adding categories, then create menu items.'
                  : 'Add items to this category to see them here.'
              }
              tone="powder"
              action={{
                label: categories.length === 0 ? 'Add Category' : 'Add Item',
                onPress:
                  categories.length === 0
                    ? handleAddCategory
                    : () =>
                        router.push({
                          pathname: '/(dashboard)/menu/item',
                        }),
                variant: 'primary',
              }}
            />
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  pageTitle: {
    marginTop: 4,
  },
  description: {
    marginBottom: 24,
    maxWidth: 320,
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 16,
  },
  noCategoriesCard: {
    marginBottom: 16,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D9D9D1',
    marginHorizontal: 8,
  },
  itemActions: {
    alignItems: 'center',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  itemFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
