import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Thermometer,
  Gauge,
  Clock,
  Layers,
  Zap,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, getStatusColor } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Printer, PrintJob } from '@/types/database';
import { ActivityCard } from '@/components/ActivityCard';
import { PrinterControlCard } from '@/components/PrinterControlCard';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [activeJob, setActiveJob] = useState<PrintJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [printersRes, activeJobRes, recentJobsRes] = await Promise.all([
        supabase.from('printers').select('*').order('created_at', { ascending: false }),
        supabase.from('print_jobs').select('*').eq('status', 'printing').single(),
        supabase.from('print_jobs').select('*').in('status', ['completed', 'failed']).order('updated_at', { ascending: false }).limit(5),
      ]);

      if (printersRes.data) {
        setPrinters(printersRes.data);
        if (!selectedPrinterId && printersRes.data.length > 0) {
          setSelectedPrinterId(printersRes.data[0].id);
        }
      }
      if (activeJobRes.data) setActiveJob(activeJobRes.data);
      if (recentJobsRes.data) setRecentJobs(recentJobsRes.data);
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

  const selectedPrinter = printers.find(p => p.id === selectedPrinterId);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={[Colors.background.tertiary, Colors.background.primary]} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>TheAQ3DC</Text>
            <Text style={styles.subtitle}>{printers.length} Printer{printers.length !== 1 ? 's' : ''} Connected</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Printer Selector */}
        {printers.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.printerSelector} contentContainerStyle={styles.printerSelectorContent}>
            {printers.map(printer => (
              <TouchableOpacity
                key={printer.id}
                style={[styles.printerChip, printer.id === selectedPrinterId && styles.printerChipActive]}
                onPress={() => setSelectedPrinterId(printer.id)}
              >
                <View style={[styles.printerStatusDot, { backgroundColor: getStatusColor(printer.status) }]} />
                <Text style={[styles.printerChipText, printer.id === selectedPrinterId && styles.printerChipTextActive]}>
                  {printer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {selectedPrinter && (
          <>
            {/* Printer Control Card */}
            <PrinterControlCard printer={selectedPrinter} onRefresh={fetchData} />

            {/* Active Print Job */}
            {activeJob && activeJob.printer_id === selectedPrinterId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Print</Text>
                <View style={styles.activeJobCard}>
                  <View style={styles.activeJobHeader}>
                    <View style={styles.activeJobInfo}>
                      <Text style={styles.activeJobName}>{activeJob.name}</Text>
                      <Text style={styles.activeJobFile}>{activeJob.file_name}</Text>
                    </View>
                    <View style={styles.activeJobControls}>
                      <TouchableOpacity style={styles.controlButton}>
                        <Pause size={20} color={Colors.warning[500]} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.controlButton}>
                        <Square size={20} color={Colors.error[500]} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <LinearGradient
                        colors={[Colors.primary[500], Colors.accent[500]]}
                        style={[styles.progressFill, { width: `${activeJob.progress_percentage}%` }]}
                      />
                    </View>
                    <Text style={styles.progressText}>{activeJob.progress_percentage}%</Text>
                  </View>

                  {/* Job Stats */}
                  <View style={styles.jobStats}>
                    <View style={styles.jobStat}>
                      <Clock size={14} color={Colors.text.secondary} />
                      <Text style={styles.jobStatText}>
                        {activeJob.estimated_duration_minutes ? `${Math.round(activeJob.estimated_duration_minutes - (activeJob.estimated_duration_minutes * activeJob.progress_percentage / 100))}m left` : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.jobStat}>
                      <Layers size={14} color={Colors.text.secondary} />
                      <Text style={styles.jobStatText}>{activeJob.layer_height}mm</Text>
                    </View>
                    <View style={styles.jobStat}>
                      <Thermometer size={14} color={Colors.text.secondary} />
                      <Text style={styles.jobStatText}>{activeJob.nozzle_temp}°C</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <ActivityCard
                icon={<Clock size={20} color={Colors.primary[500]} />}
                label="Print Time"
                value={`${selectedPrinter.total_print_hours.toFixed(1)}h`}
              />
              <ActivityCard
                icon={<Zap size={20} color={Colors.success[500]} />}
                label="Total Prints"
                value={selectedPrinter.total_prints.toString()}
              />
              <ActivityCard
                icon={<Gauge size={20} color={Colors.accent[500]} />}
                label="Build Volume"
                value={`${selectedPrinter.build_volume_x}×${selectedPrinter.build_volume_y}`}
              />
              <ActivityCard
                icon={<Layers size={20} color={Colors.warning[500]} />}
                label="Nozzle"
                value={`${selectedPrinter.nozzle_diameter}mm`}
              />
            </View>
          </>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color={Colors.primary[500]} />
            </TouchableOpacity>
          </View>

          {recentJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent prints</Text>
            </View>
          ) : (
            recentJobs.map(job => (
              <TouchableOpacity key={job.id} style={styles.activityItem}>
                <View style={[styles.activityStatusDot, { backgroundColor: getStatusColor(job.status) }]} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityName}>{job.name}</Text>
                  <Text style={styles.activityDetail}>
                    {job.status === 'completed' ? 'Completed' : 'Failed'} • {job.actual_duration_minutes}m
                  </Text>
                </View>
                <Text style={styles.activityMaterial}>{job.material_type}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
    paddingBottom: Spacing.xl,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerSelector: {
    maxHeight: 50,
  },
  printerSelectorContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  printerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.tertiary,
    gap: Spacing.sm,
  },
  printerChipActive: {
    backgroundColor: Colors.primary[500] + '20',
    borderWidth: 1,
    borderColor: Colors.primary[500],
  },
  printerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  printerChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.text.secondary,
  },
  printerChipTextActive: {
    color: Colors.primary[500],
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.text.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.primary[500],
  },
  activeJobCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  activeJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  activeJobInfo: {
    flex: 1,
  },
  activeJobName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.text.primary,
  },
  activeJobFile: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  activeJobControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: Spacing.base,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.background.tertiary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.primary[500],
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  jobStats: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  jobStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  jobStatText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  emptyState: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  activityStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.sm,
  },
  activityContent: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  activityName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text.primary,
  },
  activityDetail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  activityMaterial: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.text.secondary,
  },
});
