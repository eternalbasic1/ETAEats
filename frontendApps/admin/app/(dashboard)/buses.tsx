import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import {
  useTheme,
  Card,
  Button,
  Spinner,
  EmptyState,
  Badge,
  Input,
} from '@eta/ui-components';
import { fleetEndpoints, restaurantEndpoints } from '@eta/api-client';
import {
  Bus as BusIcon,
  Pencil,
  Link2,
  Copy,
  X,
  Plus,
  ChevronDown,
  Check,
} from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Bus {
  id: number;
  operator: number;
  operator_name: string;
  route: number | null;
  route_label: string | null;
  bus_name: string;
  number_plate: string;
  qr_token: string;
  total_seats: number;
  is_active: boolean;
}

interface Operator {
  id: number;
  company_name: string;
}

interface Route {
  id: number;
  origin_city: string;
  destination_city: string;
}

interface Restaurant {
  id: number;
  name: string;
}

interface FormState {
  operator: string;
  route: string;
  bus_name: string;
  number_plate: string;
  total_seats: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  operator: '',
  route: '',
  bus_name: '',
  number_plate: '',
  total_seats: '40',
  is_active: true,
};

// ---------------------------------------------------------------------------
// Inline Picker Modal
// ---------------------------------------------------------------------------

function PickerModal<T extends { id: number }>({
  visible,
  title,
  items,
  selected,
  labelFn,
  onSelect,
  onClose,
  allowNone,
}: {
  visible: boolean;
  title: string;
  items: T[];
  selected: string;
  labelFn: (item: T) => string;
  onSelect: (value: string) => void;
  onClose: () => void;
  allowNone?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={pickerStyles.overlay}>
        <View
          style={[
            pickerStyles.sheet,
            {
              backgroundColor: t.colors.surface,
              paddingBottom: insets.bottom + 16,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            },
          ]}
        >
          <View style={pickerStyles.header}>
            <Text style={{ ...t.typography.h3, color: t.colors.textPrimary }}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={20} color={t.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView style={pickerStyles.list} bounces={false}>
            {allowNone && (
              <Pressable
                style={[
                  pickerStyles.option,
                  { borderBottomColor: t.colors.borderSubtle },
                ]}
                onPress={() => {
                  onSelect('');
                  onClose();
                }}
              >
                <Text
                  style={{
                    ...t.typography.body,
                    color: t.colors.textTertiary,
                    fontStyle: 'italic',
                  }}
                >
                  None
                </Text>
                {selected === '' && (
                  <Check size={18} color={t.colors.primary} />
                )}
              </Pressable>
            )}
            {items.map((item) => {
              const val = String(item.id);
              const active = val === selected;
              return (
                <Pressable
                  key={item.id}
                  style={[
                    pickerStyles.option,
                    { borderBottomColor: t.colors.borderSubtle },
                    active && { backgroundColor: t.colors.accentPowderBlue },
                  ]}
                  onPress={() => {
                    onSelect(val);
                    onClose();
                  }}
                >
                  <Text
                    style={{
                      ...t.typography.body,
                      color: active
                        ? t.colors.accentPowderBlueInk
                        : t.colors.textPrimary,
                    }}
                  >
                    {labelFn(item)}
                  </Text>
                  {active && (
                    <Check
                      size={18}
                      color={
                        active
                          ? t.colors.accentPowderBlueInk
                          : t.colors.primary
                      }
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: { maxHeight: '60%', paddingTop: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: { paddingHorizontal: 20 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
});

// ---------------------------------------------------------------------------
// Select Field (trigger for PickerModal)
// ---------------------------------------------------------------------------

function SelectField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          ...t.typography.label,
          color: t.colors.textSecondary,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 48,
          borderWidth: 1,
          borderColor: t.colors.border,
          borderRadius: 8,
          backgroundColor: t.colors.surface,
          paddingHorizontal: 14,
        }}
      >
        <Text
          style={{
            ...t.typography.body,
            color: value ? t.colors.textPrimary : t.colors.textMuted,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color={t.colors.textMuted} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function BusesScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Modal state
  const [busModalVisible, setBusModalVisible] = useState(false);
  const [editing, setEditing] = useState<Bus | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignBus, setAssignBus] = useState<Bus | null>(null);
  const [assignRestaurantId, setAssignRestaurantId] = useState('');

  // Picker visibility
  const [operatorPickerOpen, setOperatorPickerOpen] = useState(false);
  const [routePickerOpen, setRoutePickerOpen] = useState(false);
  const [restaurantPickerOpen, setRestaurantPickerOpen] = useState(false);

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  const busesQ = useQuery({
    queryKey: ['admin', 'buses'],
    queryFn: async () => {
      const res = await fleetEndpoints.buses({ page_size: 500 });
      return (res.data?.results ?? []) as Bus[];
    },
  });

  const operatorsQ = useQuery({
    queryKey: ['admin', 'operators'],
    queryFn: async () => {
      const res = await fleetEndpoints.operators({ page_size: 200 });
      return (res.data?.results ?? []) as Operator[];
    },
  });

  const routesQ = useQuery({
    queryKey: ['admin', 'routes'],
    queryFn: async () => {
      const res = await fleetEndpoints.routes({ page_size: 200 });
      return (res.data?.results ?? []) as Route[];
    },
  });

  const restaurantsQ = useQuery({
    queryKey: ['admin', 'restaurants'],
    queryFn: async () => {
      const res = await restaurantEndpoints.list({ page_size: 200 });
      return (res.data?.results ?? []) as Restaurant[];
    },
  });

  const buses = busesQ.data ?? [];
  const operators = operatorsQ.data ?? [];
  const routes = routesQ.data ?? [];
  const restaurants = restaurantsQ.data ?? [];

  // -----------------------------------------------------------------------
  // Mutations
  // -----------------------------------------------------------------------

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        operator: parseInt(form.operator, 10),
        route: form.route ? parseInt(form.route, 10) : null,
        bus_name: form.bus_name,
        number_plate: form.number_plate,
        total_seats: parseInt(form.total_seats, 10) || 0,
        is_active: form.is_active,
      };
      if (editing) return fleetEndpoints.updateBus(editing.id, payload);
      return fleetEndpoints.createBus(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'buses'] });
      setBusModalVisible(false);
      Alert.alert('Success', editing ? 'Bus updated.' : 'Bus created.');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err?.response?.data?.error?.message ?? 'Could not save bus.',
      );
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () =>
      fleetEndpoints.assignRestaurant(assignBus!.id, {
        restaurant: parseInt(assignRestaurantId, 10),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'buses'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'assignments'] });
      setAssignModalVisible(false);
      setAssignBus(null);
      setAssignRestaurantId('');
      Alert.alert('Success', 'Restaurant assigned.');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err?.response?.data?.error?.message ?? 'Could not assign restaurant.',
      );
    },
  });

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setBusModalVisible(true);
  }

  function openEdit(bus: Bus) {
    setEditing(bus);
    setForm({
      operator: String(bus.operator),
      route: bus.route ? String(bus.route) : '',
      bus_name: bus.bus_name,
      number_plate: bus.number_plate,
      total_seats: String(bus.total_seats),
      is_active: bus.is_active,
    });
    setBusModalVisible(true);
  }

  function openAssign(bus: Bus) {
    setAssignBus(bus);
    setAssignRestaurantId('');
    setAssignModalVisible(true);
  }

  async function copyQR(token: string) {
    await Clipboard.setStringAsync(token);
    Alert.alert('Copied', 'QR token copied to clipboard.');
  }

  const operatorLabel = (id: string) =>
    operators.find((o) => String(o.id) === id)?.company_name ?? '';

  const routeLabel = (id: string) => {
    const r = routes.find((r) => String(r.id) === id);
    return r ? `${r.origin_city} → ${r.destination_city}` : '';
  };

  const restaurantLabel = (id: string) =>
    restaurants.find((r) => String(r.id) === id)?.name ?? '';

  const canSave =
    form.bus_name.trim() !== '' &&
    form.number_plate.trim() !== '' &&
    form.operator !== '';

  const onRefresh = useCallback(() => {
    busesQ.refetch();
  }, [busesQ]);

  // -----------------------------------------------------------------------
  // Bus Card
  // -----------------------------------------------------------------------

  function renderBusCard({ item: bus }: { item: Bus }) {
    return (
      <Card
        tone="default"
        padding="md"
        radius="card"
        border
        style={{ marginBottom: 12 }}
      >
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={{ ...t.typography.h3, color: t.colors.textPrimary }}
              numberOfLines={1}
            >
              {bus.bus_name}
            </Text>
            <Text
              style={{
                ...t.typography.caption,
                color: t.colors.textMuted,
                fontFamily: 'monospace',
                marginTop: 2,
              }}
            >
              {bus.number_plate}
            </Text>
          </View>
          <Badge
            label={bus.is_active ? 'Active' : 'Inactive'}
            variant={bus.is_active ? 'success' : 'neutral'}
          />
        </View>

        {/* Details */}
        <View style={styles.cardDetails}>
          <DetailRow label="Operator" value={bus.operator_name} t={t} />
          <DetailRow
            label="Route"
            value={bus.route_label ?? '—'}
            t={t}
          />
          <DetailRow
            label="Seats"
            value={String(bus.total_seats)}
            t={t}
          />
        </View>

        {/* QR + Actions */}
        <View
          style={[
            styles.cardFooter,
            { borderTopColor: t.colors.borderSubtle },
          ]}
        >
          <Pressable
            onPress={() => copyQR(bus.qr_token)}
            style={styles.qrButton}
            hitSlop={8}
          >
            <Text
              style={{
                ...t.typography.caption,
                fontFamily: 'monospace',
                color: t.colors.textMuted,
              }}
              numberOfLines={1}
            >
              {bus.qr_token.slice(0, 12)}…
            </Text>
            <Copy size={13} color={t.colors.textMuted} style={{ marginLeft: 4 }} />
          </Pressable>

          <View style={styles.cardActions}>
            <Pressable
              onPress={() => openAssign(bus)}
              style={[
                styles.actionBtn,
                { backgroundColor: t.colors.accentPowderBlue },
              ]}
              hitSlop={8}
            >
              <Link2 size={16} color={t.colors.accentPowderBlueInk} />
            </Pressable>
            <Pressable
              onPress={() => openEdit(bus)}
              style={[
                styles.actionBtn,
                { backgroundColor: t.colors.surfaceSunk },
              ]}
              hitSlop={8}
            >
              <Pencil size={16} color={t.colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </Card>
    );
  }

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  if (busesQ.isLoading) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: t.colors.bg, paddingTop: insets.top },
        ]}
      >
        <Spinner size="large" />
      </View>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {/* Header */}
      <View style={[styles.headerWrap, { paddingTop: insets.top + 16 }]}>
        <Text
          style={{
            ...t.typography.label,
            color: t.colors.textMuted,
            marginBottom: 6,
          }}
        >
          FLEET MANAGEMENT
        </Text>
        <View style={styles.titleRow}>
          <Text style={{ ...t.typography.h1, color: t.colors.textPrimary }}>
            Buses
          </Text>
          {buses.length > 0 && (
            <Badge label={String(buses.length)} variant="powder" />
          )}
        </View>
      </View>

      {/* List / Empty */}
      {buses.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <EmptyState
            icon={
              <BusIcon
                size={32}
                color={t.colors.accentMutedMintInk}
                strokeWidth={1.5}
              />
            }
            title="No buses registered"
            description="Add your first bus to start assigning it to routes and restaurants."
            tone="mint"
            action={{ label: 'Add Bus', onPress: openCreate }}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={buses}
          keyExtractor={(b) => String(b.id)}
          renderItem={renderBusCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={busesQ.isFetching}
          onRefresh={onRefresh}
        />
      )}

      {/* FAB */}
      {buses.length > 0 && (
        <Pressable
          onPress={openCreate}
          style={[
            styles.fab,
            {
              backgroundColor: t.colors.primary,
              bottom: insets.bottom + 20,
            },
          ]}
        >
          <Plus size={24} color={t.colors.textOnDark} />
        </Pressable>
      )}

      {/* ================================================================= */}
      {/* Create / Edit Bus Modal                                           */}
      {/* ================================================================= */}
      <Modal
        visible={busModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBusModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View
            style={[
              modalStyles.sheet,
              {
                backgroundColor: t.colors.bg,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            {/* Modal header */}
            <View style={modalStyles.header}>
              <Text style={{ ...t.typography.h2, color: t.colors.textPrimary }}>
                {editing ? 'Edit Bus' : 'New Bus'}
              </Text>
              <Pressable
                onPress={() => setBusModalVisible(false)}
                hitSlop={12}
              >
                <X size={22} color={t.colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              style={modalStyles.body}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <SelectField
                label="Operator *"
                value={operatorLabel(form.operator)}
                placeholder="Select operator…"
                onPress={() => setOperatorPickerOpen(true)}
              />

              <SelectField
                label="Route"
                value={routeLabel(form.route)}
                placeholder="(None)"
                onPress={() => setRoutePickerOpen(true)}
              />

              <View style={{ marginBottom: 14 }}>
                <Input
                  label="Bus Name *"
                  value={form.bus_name}
                  onChangeText={(v) => setForm({ ...form, bus_name: v })}
                  placeholder="SRS Express 101"
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Input
                  label="Number Plate *"
                  value={form.number_plate}
                  onChangeText={(v) => setForm({ ...form, number_plate: v })}
                  placeholder="DL-01-AA-0001"
                  autoCapitalize="characters"
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Input
                  label="Total Seats *"
                  value={form.total_seats}
                  onChangeText={(v) => setForm({ ...form, total_seats: v })}
                  keyboardType="number-pad"
                  placeholder="40"
                />
              </View>

              <View style={styles.switchRow}>
                <Switch
                  value={form.is_active}
                  onValueChange={(v) => setForm({ ...form, is_active: v })}
                  trackColor={{
                    false: t.colors.borderSubtle,
                    true: t.colors.successBg,
                  }}
                  thumbColor={
                    form.is_active ? t.colors.successFg : t.colors.textMuted
                  }
                />
                <Text
                  style={{
                    ...t.typography.body,
                    color: t.colors.textPrimary,
                    marginLeft: 12,
                  }}
                >
                  Active
                </Text>
              </View>
            </ScrollView>

            {/* Modal actions */}
            <View style={modalStyles.actions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setBusModalVisible(false)}
                disabled={saveMutation.isPending}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                label={editing ? 'Save' : 'Create'}
                variant="primary"
                onPress={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
                disabled={!canSave}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>

        {/* Nested pickers inside bus modal */}
        <PickerModal
          visible={operatorPickerOpen}
          title="Select Operator"
          items={operators}
          selected={form.operator}
          labelFn={(o) => o.company_name}
          onSelect={(v) => setForm({ ...form, operator: v })}
          onClose={() => setOperatorPickerOpen(false)}
        />
        <PickerModal
          visible={routePickerOpen}
          title="Select Route"
          items={routes}
          selected={form.route}
          labelFn={(r) => `${r.origin_city} → ${r.destination_city}`}
          onSelect={(v) => setForm({ ...form, route: v })}
          onClose={() => setRoutePickerOpen(false)}
          allowNone
        />
      </Modal>

      {/* ================================================================= */}
      {/* Assign Restaurant Modal                                           */}
      {/* ================================================================= */}
      <Modal
        visible={assignModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View
            style={[
              modalStyles.sheet,
              {
                backgroundColor: t.colors.bg,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <View style={modalStyles.header}>
              <Text style={{ ...t.typography.h2, color: t.colors.textPrimary }}>
                Assign Restaurant
              </Text>
              <Pressable
                onPress={() => setAssignModalVisible(false)}
                hitSlop={12}
              >
                <X size={22} color={t.colors.textMuted} />
              </Pressable>
            </View>

            <View style={modalStyles.body}>
              <Text
                style={{
                  ...t.typography.bodySm,
                  color: t.colors.textTertiary,
                  marginBottom: 16,
                }}
              >
                Assigning a restaurant to{' '}
                <Text style={{ fontWeight: '600', color: t.colors.textPrimary }}>
                  {assignBus?.bus_name}
                </Text>{' '}
                will deactivate any existing assignment for this bus.
              </Text>

              <SelectField
                label="Restaurant *"
                value={restaurantLabel(assignRestaurantId)}
                placeholder="Select restaurant…"
                onPress={() => setRestaurantPickerOpen(true)}
              />
            </View>

            <View style={modalStyles.actions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setAssignModalVisible(false)}
                disabled={assignMutation.isPending}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                label="Assign"
                variant="primary"
                onPress={() => assignMutation.mutate()}
                loading={assignMutation.isPending}
                disabled={!assignRestaurantId}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>

        <PickerModal
          visible={restaurantPickerOpen}
          title="Select Restaurant"
          items={restaurants}
          selected={assignRestaurantId}
          labelFn={(r) => r.name}
          onSelect={setAssignRestaurantId}
          onClose={() => setRestaurantPickerOpen(false)}
        />
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Detail Row
// ---------------------------------------------------------------------------

function DetailRow({
  label,
  value,
  t,
}: {
  label: string;
  value: string;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={{ ...t.typography.caption, color: t.colors.textMuted, width: 68 }}>
        {label}
      </Text>
      <Text
        style={{ ...t.typography.bodySm, color: t.colors.textPrimary, flex: 1 }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardDetails: { gap: 6, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  qrButton: { flexDirection: 'row', alignItems: 'center' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  body: { paddingHorizontal: 20 },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
