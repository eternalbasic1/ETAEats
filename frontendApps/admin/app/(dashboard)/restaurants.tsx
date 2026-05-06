import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  RefreshControl,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Card, Badge, Button, Spinner, EmptyState, Input } from '@eta/ui-components';
import { restaurantEndpoints } from '@eta/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UtensilsCrossed, Pencil, Plus, X, Star, MapPin, Phone, ShieldCheck } from 'lucide-react-native';

interface Restaurant {
  id: number;
  name: string;
  owner_name: string;
  phone_number: string;
  email: string;
  address: string;
  fssai_license_number: string;
  hygiene_rating: string | null;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
}

const EMPTY_FORM = {
  name: '',
  owner_name: '',
  phone_number: '+91',
  email: '',
  address: '',
  fssai_license_number: '',
  hygiene_rating: '',
  latitude: '',
  longitude: '',
  is_active: true,
};

type FormState = typeof EMPTY_FORM;

function restaurantToForm(r: Restaurant): FormState {
  return {
    name: r.name,
    owner_name: r.owner_name,
    phone_number: r.phone_number || '+91',
    email: r.email || '',
    address: r.address,
    fssai_license_number: r.fssai_license_number,
    hygiene_rating: r.hygiene_rating ?? '',
    latitude: r.latitude != null ? String(r.latitude) : '',
    longitude: r.longitude != null ? String(r.longitude) : '',
    is_active: r.is_active,
  };
}

function buildPayload(form: FormState) {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    owner_name: form.owner_name.trim(),
    phone_number: form.phone_number.trim(),
    email: form.email.trim() || undefined,
    address: form.address.trim(),
    fssai_license_number: form.fssai_license_number.trim(),
    hygiene_rating: form.hygiene_rating.trim() || null,
    is_active: form.is_active,
  };

  const lat = parseFloat(form.latitude);
  const lng = parseFloat(form.longitude);
  if (!isNaN(lat) && !isNaN(lng)) {
    payload.location = { type: 'Point', coordinates: [lng, lat] };
  }

  return payload;
}

function extractErrorMessage(e: unknown): string {
  const err = e as { response?: { data?: { error?: { message?: string } } }; message?: string };
  return err?.response?.data?.error?.message ?? err?.message ?? 'Something went wrong';
}

export default function RestaurantsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: restaurants = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin', 'restaurants'],
    queryFn: async () => {
      const res = await restaurantEndpoints.list({ page_size: 200 });
      return (res.data?.results ?? []) as Restaurant[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => restaurantEndpoints.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurants'] });
      closeModal();
    },
    onError: (e) => Alert.alert('Error', extractErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      restaurantEndpoints.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurants'] });
      closeModal();
    },
    onError: (e) => Alert.alert('Error', extractErrorMessage(e)),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((r: Restaurant) => {
    setEditingId(r.id);
    setForm(restaurantToForm(r));
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) return Alert.alert('Validation', 'Name is required');
    if (!form.phone_number.trim() || form.phone_number.trim() === '+91')
      return Alert.alert('Validation', 'Phone number is required');
    if (!form.address.trim()) return Alert.alert('Validation', 'Address is required');
    if (!form.fssai_license_number.trim()) return Alert.alert('Validation', 'FSSAI License is required');

    const rating = form.hygiene_rating.trim();
    if (rating && (isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)) {
      return Alert.alert('Validation', 'Hygiene rating must be between 1 and 5');
    }

    const payload = buildPayload(form);

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [form, editingId, createMutation, updateMutation]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const styles = useMemo(() => createStyles(t, insets), [t, insets]);

  const renderItem = useCallback(
    ({ item }: { item: Restaurant }) => (
      <RestaurantCard restaurant={item} onEdit={() => openEdit(item)} />
    ),
    [openEdit],
  );

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={t.colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { ...t.typography.label, color: t.colors.textMuted }]}>
              PLATFORM
            </Text>
            <Text style={{ ...t.typography.h1, color: t.colors.textPrimary, marginBottom: 4 }}>
              Restaurants
            </Text>
            <Text style={{ ...t.typography.body, color: t.colors.textTertiary }}>
              View and manage onboarded highway restaurants.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<UtensilsCrossed size={32} color={t.colors.accentSoftCreamInk} strokeWidth={1.5} />}
              title="No restaurants yet"
              description="Onboard your first restaurant to start connecting it with bus routes."
              tone="cream"
              action={{ label: 'Add Restaurant', onPress: openCreate }}
            />
          </View>
        }
      />

      {restaurants.length > 0 && (
        <View style={styles.fabContainer}>
          <Button
            label="Add Restaurant"
            variant="primary"
            size="lg"
            onPress={openCreate}
            style={styles.fab}
          />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={[styles.modalRoot, { backgroundColor: t.colors.bg }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={{ ...t.typography.h2, color: t.colors.textPrimary }}>
              {editingId ? 'Edit Restaurant' : 'New Restaurant'}
            </Text>
            <Pressable onPress={closeModal} hitSlop={12} accessibilityLabel="Close">
              <X size={24} color={t.colors.textMuted} strokeWidth={1.8} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Input
              label="Name *"
              placeholder="Restaurant name"
              value={form.name}
              onChangeText={(v) => setField('name', v)}
              autoCapitalize="words"
            />
            <Input
              label="Owner Name"
              placeholder="Owner full name"
              value={form.owner_name}
              onChangeText={(v) => setField('owner_name', v)}
              autoCapitalize="words"
              containerStyle={styles.fieldGap}
            />
            <Input
              label="Phone *"
              placeholder="+91XXXXXXXXXX"
              value={form.phone_number}
              onChangeText={(v) => setField('phone_number', v)}
              keyboardType="phone-pad"
              containerStyle={styles.fieldGap}
            />
            <Input
              label="Email"
              placeholder="email@example.com"
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={styles.fieldGap}
            />
            <Input
              label="Address *"
              placeholder="Full address"
              value={form.address}
              onChangeText={(v) => setField('address', v)}
              multiline
              containerStyle={styles.fieldGap}
            />
            <Input
              label="FSSAI License *"
              placeholder="14-digit license number"
              value={form.fssai_license_number}
              onChangeText={(v) => setField('fssai_license_number', v)}
              keyboardType="numeric"
              containerStyle={styles.fieldGap}
            />
            <Input
              label="Hygiene Rating (1–5)"
              placeholder="e.g. 4"
              value={form.hygiene_rating}
              onChangeText={(v) => setField('hygiene_rating', v)}
              keyboardType="numeric"
              containerStyle={styles.fieldGap}
            />

            <View style={[styles.coordRow, styles.fieldGap]}>
              <Input
                label="Latitude"
                placeholder="e.g. 17.385"
                value={form.latitude}
                onChangeText={(v) => setField('latitude', v)}
                keyboardType="decimal-pad"
                containerStyle={styles.coordField}
              />
              <Input
                label="Longitude"
                placeholder="e.g. 78.486"
                value={form.longitude}
                onChangeText={(v) => setField('longitude', v)}
                keyboardType="decimal-pad"
                containerStyle={styles.coordField}
              />
            </View>

            <View style={[styles.switchRow, styles.fieldGap]}>
              <Text style={{ ...t.typography.body, color: t.colors.textPrimary }}>Active</Text>
              <Switch
                value={form.is_active}
                onValueChange={(v) => setField('is_active', v)}
                trackColor={{ false: t.colors.border, true: t.colors.primary }}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                label={editingId ? 'Save Changes' : 'Create Restaurant'}
                variant="primary"
                size="lg"
                fullWidth
                loading={isSaving}
                onPress={handleSubmit}
              />
              <Button
                label="Cancel"
                variant="ghost"
                size="md"
                fullWidth
                onPress={closeModal}
                disabled={isSaving}
                style={styles.cancelBtn}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function RestaurantCard({ restaurant, onEdit }: { restaurant: Restaurant; onEdit: () => void }) {
  const t = useTheme();

  return (
    <Card tone="default" padding="md" radius="card" border style={{ marginBottom: 12 }}>
      <View style={cardStyles.topRow}>
        <View style={cardStyles.nameCol}>
          <Text style={{ ...t.typography.h3, color: t.colors.textPrimary }} numberOfLines={1}>
            {restaurant.name}
          </Text>
        </View>
        <Badge
          label={restaurant.is_active ? 'Active' : 'Inactive'}
          variant={restaurant.is_active ? 'success' : 'neutral'}
        />
      </View>

      {!!restaurant.owner_name && (
        <Text style={[cardStyles.detailRow, { ...t.typography.bodySm, color: t.colors.textSecondary }]}>
          {restaurant.owner_name}
        </Text>
      )}

      {!!restaurant.phone_number && (
        <View style={cardStyles.iconRow}>
          <Phone size={14} color={t.colors.textMuted} strokeWidth={1.6} />
          <Text style={{ ...t.typography.bodySm, color: t.colors.textSecondary, marginLeft: 6 }}>
            {restaurant.phone_number}
          </Text>
        </View>
      )}

      {!!restaurant.address && (
        <View style={cardStyles.iconRow}>
          <MapPin size={14} color={t.colors.textMuted} strokeWidth={1.6} />
          <Text
            style={{ ...t.typography.bodySm, color: t.colors.textSecondary, marginLeft: 6, flex: 1 }}
            numberOfLines={1}
          >
            {restaurant.address}
          </Text>
        </View>
      )}

      <View style={cardStyles.metaRow}>
        {!!restaurant.fssai_license_number && (
          <View style={cardStyles.iconRow}>
            <ShieldCheck size={14} color={t.colors.textMuted} strokeWidth={1.6} />
            <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginLeft: 4 }}>
              {restaurant.fssai_license_number}
            </Text>
          </View>
        )}
        {restaurant.hygiene_rating != null && (
          <View style={cardStyles.iconRow}>
            <Star size={14} color={t.colors.warningFg} strokeWidth={1.6} />
            <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginLeft: 4 }}>
              {restaurant.hygiene_rating}/5
            </Text>
          </View>
        )}
      </View>

      <View style={cardStyles.footer}>
        <Button label="Edit" variant="outline" size="sm" onPress={onEdit} />
      </View>
    </Card>
  );
}

const cardStyles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nameCol: { flex: 1, marginRight: 8 },
  detailRow: { marginBottom: 4 },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4, marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
});

function createStyles(t: ReturnType<typeof useTheme>, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.colors.bg },
    centered: { alignItems: 'center', justifyContent: 'center' },
    listContent: { paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 },
    header: { marginBottom: 20 },
    eyebrow: { marginBottom: 8 },
    emptyContainer: { marginTop: 16 },
    fabContainer: {
      position: 'absolute',
      bottom: insets.bottom + 16,
      left: 20,
      right: 20,
    },
    fab: { borderRadius: t.radius.lg },
    modalRoot: { flex: 1 },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    modalBody: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
    fieldGap: { marginTop: 16 },
    coordRow: { flexDirection: 'row', gap: 12 },
    coordField: { flex: 1 },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    modalActions: { marginTop: 28 },
    cancelBtn: { marginTop: 8 },
  });
}
