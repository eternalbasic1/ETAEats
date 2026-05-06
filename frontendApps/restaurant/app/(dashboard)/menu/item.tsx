import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useTheme,
  Card,
  Button,
  Input,
  Spinner,
  IconButton,
} from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';
import { restaurantEndpoints } from '@eta/api-client';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';

const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(500).optional().default(''),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid price'),
  prep_time_minutes: z
    .string()
    .min(1, 'Prep time is required')
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 180,
      'Enter 1–180 minutes',
    ),
  category: z.number({ required_error: 'Category is required' }).positive(),
  is_available: z.boolean().default(true),
  quantity_available: z
    .string()
    .optional()
    .refine(
      (v) => v === '' || v === undefined || (!isNaN(Number(v)) && Number(v) >= 0 && Number.isInteger(Number(v))),
      'Enter 0 or a whole number',
    ),
});

type MenuItemForm = z.infer<typeof menuItemSchema>;

interface MenuCategory {
  id: number;
  name: string;
  sort_order: number;
}

interface MenuItemData {
  id: number;
  name: string;
  description: string;
  price: string;
  prep_time_minutes: number;
  is_available: boolean;
  category: number;
  quantity_available?: number | null;
}

export default function MenuItemScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const restaurantId = useAuthStore((s) => s.user?.restaurantId);
  const itemId = params.id ? Number(params.id) : null;
  const isEditing = itemId !== null;

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
      return (res.data?.results ?? res.data ?? []) as MenuItemData[];
    },
    enabled: !!restaurantId && isEditing,
  });

  const categories: MenuCategory[] = categoriesQuery.data ?? [];
  const existingItem = isEditing
    ? itemsQuery.data?.find((i) => i.id === itemId)
    : null;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MenuItemForm>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      prep_time_minutes: '',
      category: undefined as unknown as number,
      is_available: true,
      quantity_available: '',
    },
  });

  useEffect(() => {
    if (existingItem) {
      reset({
        name: existingItem.name,
        description: existingItem.description ?? '',
        price: String(existingItem.price),
        prep_time_minutes: String(existingItem.prep_time_minutes),
        category: existingItem.category,
        is_available: existingItem.is_available,
        quantity_available: existingItem.quantity_available != null ? String(existingItem.quantity_available) : '',
      });
    }
  }, [existingItem, reset]);

  const createMutation = useMutation({
    mutationFn: (data: MenuItemForm) =>
      restaurantEndpoints.createMenuItem({
        name: data.name,
        description: data.description,
        price: data.price,
        prep_time_minutes: Number(data.prep_time_minutes),
        category: data.category,
        restaurant: restaurantId!,
        is_available: data.is_available,
        quantity_available: data.quantity_available === '' || data.quantity_available === undefined ? null : Number(data.quantity_available),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      router.back();
    },
    onError: () => Alert.alert('Error', 'Could not create item. Try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: MenuItemForm) =>
      restaurantEndpoints.updateMenuItem(itemId!, {
        name: data.name,
        description: data.description,
        price: data.price,
        prep_time_minutes: Number(data.prep_time_minutes),
        category: data.category,
        is_available: data.is_available,
        quantity_available: data.quantity_available === '' || data.quantity_available === undefined ? null : Number(data.quantity_available),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      router.back();
    },
    onError: () => Alert.alert('Error', 'Could not update item. Try again.'),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: MenuItemForm) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCategoryPick = () => {
    if (categories.length === 0) {
      Alert.alert('No Categories', 'Create a category from the menu screen first.');
      return;
    }
    const options = categories.map((c) => c.name);
    options.push('Cancel');
    Alert.alert('Select Category', undefined, [
      ...categories.map((cat) => ({
        text: cat.name,
        onPress: () => setValue('category', cat.id, { shouldValidate: true }),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const selectedCategoryId = watch('category');
  const selectedCategoryName = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId)?.name ?? '',
    [categories, selectedCategoryId],
  );

  const isDataLoading =
    categoriesQuery.isLoading || (isEditing && itemsQuery.isLoading);

  if (isDataLoading) {
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <IconButton
            tone="surface"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={t.colors.textPrimary} />
          </IconButton>
        </View>

        {/* Title */}
        <Text
          style={{
            ...t.typography.label,
            fontFamily: t.fontFamily.sans,
            color: t.colors.textMuted,
            marginBottom: 4,
          }}
        >
          {isEditing ? 'EDIT' : 'NEW'}
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
          {isEditing ? 'Edit Item' : 'Add Item'}
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              ...t.typography.body,
              fontFamily: t.fontFamily.sans,
              color: t.colors.textTertiary,
            },
          ]}
        >
          {isEditing
            ? 'Update the details for this menu item.'
            : 'Fill in the details to add a new dish to your menu.'}
        </Text>

        {/* Form card */}
        <Card tone="default" padding="lg" border style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="ITEM NAME"
                  placeholder="e.g. Paneer Butter Masala"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  autoCapitalize="words"
                />
              )}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="DESCRIPTION"
                  placeholder="Optional — describe the dish"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.description?.message}
                  multiline
                  numberOfLines={3}
                  inputStyle={styles.multilineInput}
                />
              )}
            />
          </View>

          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="price"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="PRICE"
                    placeholder="0.00"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.price?.message}
                    keyboardType="decimal-pad"
                    leading={
                      <Text
                        style={{
                          ...t.typography.body,
                          fontFamily: t.fontFamily.sans,
                          color: t.colors.textTertiary,
                        }}
                      >
                        ₹
                      </Text>
                    }
                  />
                )}
              />
            </View>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="prep_time_minutes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="PREP TIME"
                    placeholder="15"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.prep_time_minutes?.message}
                    keyboardType="number-pad"
                    hint="minutes"
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Controller
              control={control}
              name="quantity_available"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="STOCK QTY"
                  placeholder="Leave blank for unlimited"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.quantity_available?.message}
                  keyboardType="number-pad"
                  hint="units available (blank = unlimited)"
                />
              )}
            />
          </View>

          {/* Category picker */}
          <View style={styles.fieldGroup}>
            <Text
              style={{
                ...t.typography.label,
                fontFamily: t.fontFamily.sans,
                color: t.colors.textSecondary,
                marginBottom: 4,
              }}
            >
              CATEGORY
            </Text>
            <View
              style={[
                styles.pickerBtn,
                {
                  borderColor: errors.category
                    ? t.colors.errorBorder
                    : t.colors.border,
                  backgroundColor: t.colors.surface,
                  borderRadius: t.radius.sm,
                },
              ]}
            >
              <Text
                onPress={handleCategoryPick}
                style={{
                  ...t.typography.body,
                  fontFamily: t.fontFamily.sans,
                  color: selectedCategoryName
                    ? t.colors.textPrimary
                    : t.colors.textMuted,
                  flex: 1,
                }}
              >
                {selectedCategoryName || 'Select a category'}
              </Text>
              <ChevronDown size={18} color={t.colors.textMuted} />
            </View>
            {errors.category && (
              <Text
                style={{
                  ...t.typography.caption,
                  fontFamily: t.fontFamily.sans,
                  color: t.colors.errorFg,
                  marginTop: 4,
                }}
              >
                {errors.category.message}
              </Text>
            )}
          </View>

          {/* Availability */}
          <View
            style={[
              styles.availRow,
              {
                borderTopColor: t.colors.borderSubtle,
              },
            ]}
          >
            <View>
              <Text
                style={{
                  ...t.typography.h4,
                  fontFamily: t.fontFamily.sans,
                  color: t.colors.textPrimary,
                }}
              >
                Available
              </Text>
              <Text
                style={{
                  ...t.typography.bodySm,
                  fontFamily: t.fontFamily.sans,
                  color: t.colors.textTertiary,
                  marginTop: 2,
                }}
              >
                Show this item on the passenger menu
              </Text>
            </View>
            <Controller
              control={control}
              name="is_available"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{
                    false: t.colors.gray400,
                    true: t.colors.successBg,
                  }}
                  thumbColor={value ? t.colors.successFg : t.colors.gray500}
                />
              )}
            />
          </View>
        </Card>

        {/* Save button */}
        <Button
          label={isEditing ? 'Save Changes' : 'Create Item'}
          variant="primary"
          size="xl"
          fullWidth
          loading={isSaving}
          onPress={handleSubmit(onSubmit)}
          style={styles.saveBtn}
        />

        {isEditing && (
          <Button
            label="Cancel"
            variant="ghost"
            size="lg"
            fullWidth
            onPress={() => router.back()}
            style={styles.cancelBtn}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  scroll: {
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    marginBottom: 8,
  },
  subtitle: {
    maxWidth: 300,
    marginBottom: 28,
  },
  formCard: {
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfField: {
    flex: 1,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 20,
    marginTop: 4,
  },
  saveBtn: {
    marginBottom: 12,
  },
  cancelBtn: {
    marginBottom: 8,
  },
});
