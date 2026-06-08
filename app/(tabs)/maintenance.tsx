import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import {
  Wrench,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  X,
  Filter,
  Calendar,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, getSeverityColor, Shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { MaintenanceAlert, MaintenanceAlertType, MaintenanceAlertSeverity, Printer } from '@/types/database';

const ALERT_TYPES: { value: MaintenanceAlertType; label: string; icon: string }[] = [
  { value: 'nozzle_wear', label: 'Nozzle Wear', icon: '🔧' },
  { value: 'bed_leveling', label: 'Bed Leveling', icon: '📐' },
  { value: 'belt_tension', label: 'Belt Tension', icon: '⚙' },
  { value: 'fan_maintenance', label: 'Fan Maintenance', icon: '💨' },
  { value: 'lubrication', label: 'Lubrication', icon: '🛢' },
  { value: 'firmware_update', label: 'Firmware Update', icon: '📱' },
  { value: 'filter_replacement', label: 'Filter Replacement', icon: '🔬' },
  { value: 'other', label: 'Other', icon: '📋' },
];

export default function MaintenanceScreen() {
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const [selectedAlert, setSelectedAlert] = useState<MaintenanceAlert | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchData = async () => {
    try {
      const [alertsRes, printersRes] = await Promise.all([
        supabase.from('maintenance_alerts').select('*').order('triggered_at', { ascending: false }),
        supabase.from('printers').select('*'),
      ]);

      if (alertsRes.data) setAlerts(alertsRes.data);
      if (printersRes.data) setPrinters(printersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'active') return !alert.is_resolved;
    if (filter === 'resolved') return alert.is_resolved;
    return true;
  });

  const activeAlerts = alerts.filter(a => !a.is_resolved);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = activeAlerts.filter(a => a.severity === 'warning');

  const handleResolveAlert = async (alertId: string) => {
    try {
      await supabase
        .from('maintenance_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);
      fetchData();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error resolving alert:', error);
      Alert.alert('Error', 'Failed to resolve alert');
    }
  };

  const getPrinterName = (printerId: string) => {
    const printer = printers.find(p => p.id === printerId);
    return printer?.name || 'Unknown Printer';
  };

  const getAlertTypeInfo = (type: MaintenanceAlertType) => {
    return ALERT_TYPES.find(t => t.value === type) || ALERT_TYPES[ALERT_TYPES.length - 1];
  };

  const getSeverityIcon = (severity: MaintenanceAlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={20} color={Colors.error[500]} />;
      case 'warning':
        return <AlertTriangle size={20} color={Colors.warning[500]} />;
      case 'info':
        return <Info size={20} color={Colors.primary[500]} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const AlertCard = ({ alert }: { alert: MaintenanceAlert }) => {
    const typeInfo = getAlertTypeInfo(alert.type);
    const printerName = getPrinterName(alert.printer_id);

    return (
      <TouchableOpacity
        style={[
          styles.alertCard,
          alert.is_resolved && styles.alertCardResolved,
        ]}
        onPress={() => {
          setSelectedAlert(alert);
          setShowDetailModal(true);
        }}
      >
        <View style={[styles.alertSeverityBar, { backgroundColor: getSeverityColor(alert.severity) }]} />

        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <View style={styles.alertIconContainer}>
              {getSeverityIcon(alert.severity)}
            </View>
            <View style={styles.alertTitleContainer}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertPrinter}>{printerName}</Text>
            </View>
            <ChevronRight size={18} color={Colors.text.tertiary} />
          </View>

          {alert.description && (
            <Text style={styles.alertDescription} numberOfLines={2}>
              {alert.description}
            </Text>
          )}

          <View style={styles.alertFooter}>
            <View style={styles.alertTypeTag}>
              <Text style={styles.alertTypeTagText}>{typeInfo.label}</Text>
            </View>
            <View style={styles.alertTime}>
              <Clock size={12} color={Colors.text.tertiary} />
              <Text style={styles.alertTimeText}>{formatDate(alert.triggered_at)}</Text>
            </View>

            {alert.is_resolved && (
              <View style={styles.resolvedTag}>
                <CheckCircle size={12} color={Colors.success[500]} />
                <Text style={styles.resolvedText}>Resolved</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Maintenance</Text>
            <Text style={styles.subtitle}>
              {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
        {activeAlerts.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryCardCritical]}>
              <AlertCircle size={20} color={Colors.error[500]} />
              <Text style={styles.summaryNumber}>{criticalAlerts.length}</Text>
              <Text style={styles.summaryLabel}>Critical</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardWarning]}>
              <AlertTriangle size={20} color={Colors.warning[500]} />
              <Text style={styles.summaryNumber}>{warningAlerts.length}</Text>
              <Text style={styles.summaryLabel}>Warning</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardInfo]}>
              <Info size={20} color={Colors.primary[500]} />
              <Text style={styles.summaryNumber}>{activeAlerts.length - criticalAlerts.length - warningAlerts.length}</Text>
              <Text style={styles.summaryLabel}>Info</Text>
            </View>
          </View>
        )}

        {/* Filters */}
        <View style={styles.filters}>
          {(['active', 'resolved', 'all'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alert List */}
        <View style={styles.section}>
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              {filter === 'active' ? (
                <>
                  <CheckCircle size={48} color={Colors.success[500]} />
                  <Text style={styles.emptyStateTitle}>All Clear!</Text>
                  <Text style={styles.emptyStateText}>No active maintenance alerts</Text>
                </>
              ) : (
                <>
                  <Wrench size={48} color={Colors.text.tertiary} />
                  <Text style={styles.emptyStateTitle}>No Alerts</Text>
                  <Text style={styles.emptyStateText}>No maintenance alerts found</Text>
                </>
              )}
            </View>
          ) : (
            filteredAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAlert && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderContent}>
                    {getSeverityIcon(selectedAlert.severity)}
                    <Text style={styles.modalTitle}>{selectedAlert.title}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <X size={24} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Printer</Text>
                    <Text style={styles.detailValue}>{getPrinterName(selectedAlert.printer_id)}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Alert Type</Text>
                    <Text style={styles.detailValue}>{getAlertTypeInfo(selectedAlert.type).label}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Severity</Text>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(selectedAlert.severity) + '20' }]}>
                      <Text style={[styles.severityText, { color: getSeverityColor(selectedAlert.severity) }]}>
                        {selectedAlert.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {selectedAlert.description && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Description</Text>
                      <Text style={styles.detailValue}>{selectedAlert.description}</Text>
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Triggered</Text>
                    <View style={styles.dateRow}>
                      <Calendar size={16} color={Colors.text.tertiary} />
                      <Text style={styles.detailValue}>
                        {new Date(selectedAlert.triggered_at).toLocaleDateString()} at{' '}
                        {new Date(selectedAlert.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>

                  {selectedAlert.is_resolved && selectedAlert.resolved_at && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Resolved</Text>
                      <View style={styles.dateRow}>
                        <CheckCircle size={16} color={Colors.success[500]} />
                        <Text style={styles.detailValue}>
                          {new Date(selectedAlert.resolved_at).toLocaleDateString()} at{' '}
                          {new Date(selectedAlert.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  {!selectedAlert.is_resolved && (
                    <TouchableOpacity
                      style={styles.resolveButton}
                      onPress={() => handleResolveAlert(selectedAlert.id)}
                    >
                      <CheckCircle size={18} color={Colors.text.inverse} />
                      <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['5xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.text.primary,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.secondary,
  },
  summaryCardCritical: {
    borderTopWidth: 2,
    borderTopColor: Colors.error[500],
  },
  summaryCardWarning: {
    borderTopWidth: 2,
    borderTopColor: Colors.warning[500],
  },
  summaryCardInfo: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary[500],
  },
  summaryNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  summaryLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.tertiary,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
  },
  filterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.text.primary,
  },
  section: {
    paddingHorizontal: Spacing.base,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  alertCardResolved: {
    opacity: 0.7,
  },
  alertSeverityBar: {
    width: 4,
  },
  alertContent: {
    flex: 1,
    padding: Spacing.base,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconContainer: {
    marginRight: Spacing.sm,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.text.primary,
  },
  alertPrinter: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  alertDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  alertTypeTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.tertiary,
  },
  alertTypeTagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.text.secondary,
  },
  alertTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertTimeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  resolvedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  resolvedText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.success[500],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  emptyStateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.text.primary,
    marginTop: Spacing.base,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.tertiary,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  modalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.text.primary,
    flex: 1,
  },
  modalBody: {
    padding: Spacing.base,
  },
  detailSection: {
    marginBottom: Spacing.lg,
  },
  detailLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalFooter: {
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.success[500],
  },
  resolveButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.inverse,
  },
});
