import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme, Card, Button, Spinner, EmptyState } from '@eta/ui-components';
import { fleetEndpoints } from '@eta/api-client';
import { Route as RouteIcon, Pencil, Plus, MapPin, Clock, ArrowRight } from 'lucide-react-native';

interface Route {
  id: number;
  origin_city: string;
  destination_city: string;
  distance_km: number;
  estimated_duration_hours: string;
}

type RouteFormData = {
  origin_city: string;
  destination_city: string;
  distance_km: string;
  estimated_duration_hours: string;
};

const EMPTY_FORM: RouteFormData = {
  origin_city: '',
  destination_city: '',
  distance_km: '',
  estimated_duration_hours: '',
};

export default function RoutesScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [form, setForm] = useState<RouteFormData>(EMPTY_FORM);

  const routesQuery = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await fleetEndpoints.routes({ page_size: 200 });
      return (res.data?.results ?? []) as Route[];
    },
  });

  const routes: Route[] = routesQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      fleetEndpoints.createRoute(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      closeModal();
    },
    onError: (e: any) => {
      Alert.alert(
        'Error',
        e?.response?.data?.error?.message ?? 'Failed to create route.',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      fleetEndpoints.updateRoute(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      closeModal();
    },
    onError: (e: any) => {
      Alert.alert(
        'Error',
        e?.response?.data?.error?.message ?? 'Failed to update route.',
      );
    },
  });

  const openCreate = useCallback(() => {
    setEditingRoute(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((route: Route) => {
    setEditingRoute(route);
    setForm({
      origin_city: route.origin_city,
      destination_city: route.destination_city,
      distance_km: String(route.distance_km),
      estimated_duration_hours: String(route.estimated_duration_hours),
    });
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingRoute(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleSubmit = useCallback(() => {
    const { origin_city, destination_city, distance_km, estimated_duration_hours } = form;
    if (!origin_city.trim() || !destination_city.trim() || !distance_km.trim() || !estimated_duration_hours.trim()) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }

    const payload = {
      origin_city: origin_city.trim(),
      destination_city: destination_city.trim(),
      distance_km: parseFloat(distance_km),
      estimated_duration_hours: estimated_duration_hours.trim(),
    };

    if (editingRoute) {
      updateMutation.mutate({ id: editingRoute.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [form, editingRoute, createMutation, updateMutation]);

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const renderItem = useCallback(
    ({ item }: { item: Route }) => (
      <Card tone="default" padding="md" border style={styles.routeCard}>
        <View style={styles.cardRow}>
          <View style={styles.cardInfo}>
            <View style={styles.routeHeader}>
              <Text
                style={{
                  ...t.typography.h4,
                  color: t.colors.textPrimary,
                }}
                numberOfLines={1}
              >
                {item.origin_city}
              </Text>
              <ArrowRight
                size={16}
                color={t.colors.primary}
                style={styles.arrowIcon}
              />
              <Text
                style={{
                  ...t.typography.h4,
                  color: t.colors.textPrimary,
                }}
                numberOfLines={1}
              >
                {item.destination_city}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <MapPin size={13} color={t.colors.textMuted} />
              <Text
                style={{
                  ...t.typography.bodySm,
                  color: t.colors.textMuted,
                  marginLeft: 4,
                }}
              >
                {item.distance_km} km
              </Text>
              <View
                style={[styles.metaDot, { backgroundColor: t.colors.border }]}
              />
              <Clock size={13} color={t.colors.textMuted} />
              <Text
                style={{
                  ...t.typography.bodySm,
                  color: t.colors.textMuted,
                  marginLeft: 4,
                }}
              >
                {item.estimated_duration_hours} hrs
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => openEdit(item)}
            hitSlop={8}
            style={styles.editBtn}
            accessibilityLabel={`Edit route ${item.origin_city} to ${item.destination_city}`}
          >
            <Pencil size={18} color={t.colors.textMuted} />
          </Pressable>
        </View>
      </Card>
    ),
    [t, openEdit],
  );

  if (routesQuery.isLoading) {
    return (
      <View
        style={[styles.container, styles.centered, { backgroundColor: t.colors.bg }]}
      >
        <Spinner size="lg" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      <FlatList
        data={routes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 },
          routes.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={routesQuery.isRefetching}
            onRefresh={() => routesQuery.refetch()}
            tintColor={t.colors.textMuted}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text
              style={{
                ...t.typography.label,
                color: t.colors.textMuted,
                marginBottom: 8,
              }}
            >
              FLEET MANAGEMENT
            </Text>
            <Text
              style={{
                ...t.typography.h1,
                color: t.colors.textPrimary,
                marginBottom: 4,
              }}
            >
              Routes
            </Text>
            <Text
              style={{
                ...t.typography.body,
                color: t.colors.textMuted,
                marginBottom: 24,
              }}
            >
              Manage your bus routes and stop configurations.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={
                <RouteIcon
                  size={32}
                  color={t.colors.accentPowderBlueInk}
                  strokeWidth={1.5}
                />
              }
              title="No routes yet"
              description="Create your first bus route to start assigning buses and restaurants."
              tone="powder"
              action={{
                label: 'Add Route',
                onPress: openCreate,
              }}
            />
          </View>
        }
      />

      {routes.length > 0 && (
        <View
          style={[
            styles.fab,
            { bottom: insets.bottom + 16 },
          ]}
        >
          <Button
            label="Add Route"
            variant="primary"
            size="md"
            onPress={openCreate}
          />
        </View>
      )}

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: t.colors.bg }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: t.colors.borderSubtle },
            ]}
          >
            <Text style={{ ...t.typography.h2, color: t.colors.textPrimary }}>
              {editingRoute ? 'Edit Route' : 'New Route'}
            </Text>
            <Pressable onPress={closeModal} hitSlop={12}>
              <Text style={{ ...t.typography.body, color: t.colors.primary }}>
                Cancel
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.fieldLabel, { ...t.typography.label, color: t.colors.textMuted }]}>
              ORIGIN CITY
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  ...t.typography.body,
                  color: t.colors.textPrimary,
                  backgroundColor: t.colors.surface,
                  borderColor: t.colors.borderSubtle,
                },
              ]}
              value={form.origin_city}
              onChangeText={(v) => setForm((f) => ({ ...f, origin_city: v }))}
              placeholder="e.g. Hyderabad"
              placeholderTextColor={t.colors.textMuted}
              autoCapitalize="words"
            />

            <Text style={[styles.fieldLabel, { ...t.typography.label, color: t.colors.textMuted }]}>
              DESTINATION CITY
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  ...t.typography.body,
                  color: t.colors.textPrimary,
                  backgroundColor: t.colors.surface,
                  borderColor: t.colors.borderSubtle,
                },
              ]}
              value={form.destination_city}
              onChangeText={(v) => setForm((f) => ({ ...f, destination_city: v }))}
              placeholder="e.g. Bangalore"
              placeholderTextColor={t.colors.textMuted}
              autoCapitalize="words"
            />

            <Text style={[styles.fieldLabel, { ...t.typography.label, color: t.colors.textMuted }]}>
              DISTANCE (KM)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  ...t.typography.body,
                  color: t.colors.textPrimary,
                  backgroundColor: t.colors.surface,
                  borderColor: t.colors.borderSubtle,
                },
              ]}
              value={form.distance_km}
              onChangeText={(v) => setForm((f) => ({ ...f, distance_km: v }))}
              placeholder="e.g. 570"
              placeholderTextColor={t.colors.textMuted}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.fieldLabel, { ...t.typography.label, color: t.colors.textMuted }]}>
              ESTIMATED DURATION (HOURS)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  ...t.typography.body,
                  color: t.colors.textPrimary,
                  backgroundColor: t.colors.surface,
                  borderColor: t.colors.borderSubtle,
                },
              ]}
              value={form.estimated_duration_hours}
              onChangeText={(v) => setForm((f) => ({ ...f, estimated_duration_hours: v }))}
              placeholder="e.g. 8.5"
              placeholderTextColor={t.colors.textMuted}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalActions}>
              <Button
                label={editingRoute ? 'Save Changes' : 'Create Route'}
                variant="primary"
                size="lg"
                onPress={handleSubmit}
                disabled={isMutating}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerSection: {
    marginBottom: 8,
  },
  emptyContainer: {
    marginTop: 16,
  },
  routeCard: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  arrowIcon: {
    marginHorizontal: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
  },
  editBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    left: 20,
    right: 20,
  },

  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  fieldLabel: {
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalActions: {
    marginTop: 32,
  },
});
