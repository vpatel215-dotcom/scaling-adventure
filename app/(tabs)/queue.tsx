import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  ChevronRight,
  Clock,
  Layers,
  Gauge,
  FileText,
  Trash2,
  Play,
  Pause,
  MoveUp,
  MoveDown,
  X,
  Calendar,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, getStatusColor, getMaterialTypeColor } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { PrintJob, Printer, Material } from '@/types/database';

type FilterStatus = 'all' | 'queued' | 'printing' | 'completed' | 'failed';

export default function QueueScreen() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJob, setNewJob] = useState({
    name: '',
    file_name: '',
    printer_id: '',
    material_id: '',
    estimated_duration_minutes: '',
  });

  const fetchData = async () => {
    try {
      const [jobsRes, printersRes, materialsRes] = await Promise.all([
        supabase.from('print_jobs').select('*').order('priority', { ascending: false }).order('created_at', { ascending: true }),
        supabase.from('printers').select('*').order('name'),
        supabase.from('materials').select('*').eq('is_active', true).order('name'),
      ]);

      if (jobsRes.data) setJobs(jobsRes.data);
      if (printersRes.data) setPrinters(printersRes.data);
      if (materialsRes.data) setMaterials(materialsRes.data);
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

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  const queuedJobs = filteredJobs.filter(j => j.status === 'queued');
  const activeJobs = filteredJobs.filter(j => j.status === 'printing' || j.status === 'preparing' || j.status === 'paused');
  const doneJobs = filteredJobs.filter(j => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled');

  const handleAddJob = async () => {
    if (!newJob.name || !newJob.file_name || !newJob.printer_id) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const selectedMaterial = materials.find(m => m.id === newJob.material_id);

      await supabase.from('print_jobs').insert({
        name: newJob.name,
        file_name: newJob.file_name,
        printer_id: newJob.printer_id,
        material_type: selectedMaterial?.type || null,
        material_color: selectedMaterial?.color || null,
        estimated_duration_minutes: newJob.estimated_duration_minutes ? parseInt(newJob.estimated_duration_minutes) : null,
        status: 'queued',
        priority: 5,
      });

      setShowAddModal(false);
      setNewJob({ name: '', file_name: '', printer_id: '', material_id: '', estimated_duration_minutes: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding job:', error);
      Alert.alert('Error', 'Failed to add print job');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await supabase.from('print_jobs').delete().eq('id', jobId);
      fetchData();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const JobItem = ({ job, showControls = false }: { job: PrintJob; showControls?: boolean }) => (
    <View style={styles.jobItem}>
      <View style={[styles.statusStripe, { backgroundColor: getStatusColor(job.status) }]} />
      <View style={styles.jobContent}>
        <View style={styles.jobMainInfo}>
          <Text style={styles.jobName}>{job.name}</Text>
          <Text style={styles.jobFile}>{job.file_name}</Text>
        </View>

        <View style={styles.jobMeta}>
          <View style={styles.jobMetaItem}>
            <Clock size={12} color={Colors.text.tertiary} />
            <Text style={styles.jobMetaText}>
              {job.estimated_duration_minutes ? `${job.estimated_duration_minutes}m` : '--'}
            </Text>
          </View>
          <View style={styles.jobMetaItem}>
            <Layers size={12} color={Colors.text.tertiary} />
            <Text style={styles.jobMetaText}>{job.layer_height}mm</Text>
          </View>
          <View style={styles.jobMetaItem}>
            <Gauge size={12} color={Colors.text.tertiary} />
            <Text style={styles.jobMetaText}>{job.infill_percentage}%</Text>
          </View>
        </View>

        {job.material_type && (
          <View style={styles.materialTag}>
            <View style={[styles.materialDot, { backgroundColor: getMaterialTypeColor(job.material_type) }]} />
            <Text style={styles.materialText}>{job.material_type}</Text>
            {job.material_color && <Text style={styles.materialColorText}> • {job.material_color}</Text>}
          </View>
        )}

        {job.status === 'printing' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[Colors.primary[500], Colors.accent[500]]}
                style={[styles.progressFill, { width: `${job.progress_percentage}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{job.progress_percentage}%</Text>
          </View>
        )}

        {showControls && job.status === 'queued' && (
          <View style={styles.jobControls}>
            <TouchableOpacity style={styles.jobControlButton}>
              <Play size={14} color={Colors.success[500]} />
              <Text style={[styles.jobControlText, { color: Colors.success[500] }]}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.jobControlButton}>
              <MoveUp size={14} color={Colors.text.secondary} />
              <Text style={styles.jobControlText}>Priority</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.jobControlButton} onPress={() => handleDeleteJob(job.id)}>
              <Trash2 size={14} color={Colors.error[500]} />
              <Text style={[styles.jobControlText, { color: Colors.error[500] }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

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
            <Text style={styles.title}>Print Queue</Text>
            <Text style={styles.subtitle}>{jobs.filter(j => j.status === 'queued').length} jobs pending</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Plus size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {(['all', 'queued', 'printing', 'completed', 'failed'] as FilterStatus[]).map(f => (
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

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active</Text>
            {activeJobs.map(job => (
              <JobItem key={job.id} job={job} />
            ))}
          </View>
        )}

        {/* Queued Jobs */}
        {queuedJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Queued</Text>
            {queuedJobs.map(job => (
              <JobItem key={job.id} job={job} showControls />
            ))}
          </View>
        )}

        {/* Done Jobs */}
        {doneJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed</Text>
            {doneJobs.map(job => (
              <JobItem key={job.id} job={job} />
            ))}
          </View>
        )}

        {filteredJobs.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No Print Jobs</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all'
                ? 'Add your first print job to get started'
                : `No ${filter} jobs`}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setShowAddModal(true)}>
              <Plus size={18} color={Colors.text.primary} />
              <Text style={styles.emptyButtonText}>Add Print Job</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Job Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Print Job</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Job Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Phone Case"
                  placeholderTextColor={Colors.text.tertiary}
                  value={newJob.name}
                  onChangeText={text => setNewJob(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>File Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., phone_case.gcode"
                  placeholderTextColor={Colors.text.tertiary}
                  value={newJob.file_name}
                  onChangeText={text => setNewJob(prev => ({ ...prev, file_name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Printer *</Text>
                <View style={styles.pickerContainer}>
                  {printers.map(printer => (
                    <TouchableOpacity
                      key={printer.id}
                      style={[
                        styles.pickerOption,
                        newJob.printer_id === printer.id && styles.pickerOptionActive,
                      ]}
                      onPress={() => setNewJob(prev => ({ ...prev, printer_id: printer.id }))}
                    >
                      <View style={[styles.printerStatusDot, { backgroundColor: getStatusColor(printer.status) }]} />
                      <Text
                        style={[
                          styles.pickerText,
                          newJob.printer_id === printer.id && styles.pickerTextActive,
                        ]}
                      >
                        {printer.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Material</Text>
                <View style={styles.pickerContainer}>
                  {materials.map(material => (
                    <TouchableOpacity
                      key={material.id}
                      style={[
                        styles.materiaPickerOption,
                        newJob.material_id === material.id && styles.pickerOptionActive,
                      ]}
                      onPress={() => setNewJob(prev => ({ ...prev, material_id: material.id }))}
                    >
                      <View style={[styles.materialDot, { backgroundColor: material.color_hex }]} />
                      <Text
                        style={[
                          styles.pickerText,
                          newJob.material_id === material.id && styles.pickerTextActive,
                        ]}
                      >
                        {material.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Estimated Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 120"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="numeric"
                  value={newJob.estimated_duration_minutes}
                  onChangeText={text => setNewJob(prev => ({ ...prev, estimated_duration_minutes: text }))}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddJob}>
                <Plus size={18} color={Colors.text.inverse} />
                <Text style={styles.submitButtonText}>Add Job</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: Spacing.xl,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
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
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  jobItem: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  statusStripe: {
    width: 4,
  },
  jobContent: {
    flex: 1,
    padding: Spacing.base,
  },
  jobMainInfo: {
    marginBottom: Spacing.sm,
  },
  jobName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.text.primary,
  },
  jobFile: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  materialTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  materialText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.text.secondary,
  },
  materialColorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.background.tertiary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.primary[500],
    marginTop: 4,
  },
  jobControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  jobControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.tertiary,
  },
  jobControlText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.text.secondary,
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
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[500],
  },
  emptyButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.primary,
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.tertiary,
  },
  modalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: Colors.text.primary,
  },
  modalBody: {
    padding: Spacing.base,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.text.primary,
  },
  pickerContainer: {
    gap: Spacing.xs,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerOptionActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[500] + '10',
  },
  materiaPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  printerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pickerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text.secondary,
  },
  pickerTextActive: {
    color: Colors.primary[500],
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
  },
  cancelButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.secondary,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[500],
  },
  submitButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.inverse,
  },
});
