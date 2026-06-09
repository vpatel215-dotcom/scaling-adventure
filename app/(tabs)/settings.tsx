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
  Switch,
} from 'react-native';
import {
  Settings,
  Printer,
  Thermometer,
  Gauge,
  Move,
  Fan,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Edit3,
  Trash2,
  Save,
  Bluetooth,
  Info,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Printer as PrinterType, PrinterProfile } from '@/types/database';

export default function SettingsScreen() {
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [profiles, setProfiles] = useState<PrinterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);
  const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PrinterProfile | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    printers: true,
    profiles: true,
    about: false,
  });

  const [newPrinter, setNewPrinter] = useState({
    name: '',
    model: '',
    bluetooth_address: '',
    build_volume_x: '220',
    build_volume_y: '220',
    build_volume_z: '250',
    nozzle_diameter: '0.4',
  });

  const [newProfile, setNewProfile] = useState({
    name: '',
    nozzle_temp: '200',
    bed_temp: '60',
    chamber_temp: '',
    print_speed: '60',
    travel_speed: '150',
    retraction_distance: '6',
    retraction_speed: '25',
    cooling_fan_speed: '100',
    z_offset: '0',
  });

  const fetchData = async () => {
    try {
      const [printersRes, profilesRes] = await Promise.all([
        supabase.from('printers').select('*').order('name'),
        supabase.from('printer_profiles').select('*').order('created_at', { ascending: false }),
      ]);

      if (printersRes.data) {
        setPrinters(printersRes.data);
        if (!selectedPrinterId && printersRes.data.length > 0) {
          setSelectedPrinterId(printersRes.data[0].id);
        }
      }
      if (profilesRes.data) setProfiles(profilesRes.data);
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const selectedPrinter = printers.find(p => p.id === selectedPrinterId);
  const printerProfiles = profiles.filter(p => p.printer_id === selectedPrinterId);

  const handleAddPrinter = async () => {
    if (!newPrinter.name || !newPrinter.model) {
      Alert.alert('Error', 'Please fill in name and model');
      return;
    }

    try {
      await supabase.from('printers').insert({
        name: newPrinter.name,
        model: newPrinter.model,
        bluetooth_address: newPrinter.bluetooth_address || null,
        build_volume_x: parseInt(newPrinter.build_volume_x) || 220,
        build_volume_y: parseInt(newPrinter.build_volume_y) || 220,
        build_volume_z: parseInt(newPrinter.build_volume_z) || 250,
        nozzle_diameter: parseFloat(newPrinter.nozzle_diameter) || 0.4,
        status: 'idle',
      });

      setShowAddPrinterModal(false);
      setNewPrinter({
        name: '',
        model: '',
        bluetooth_address: '',
        build_volume_x: '220',
        build_volume_y: '220',
        build_volume_z: '250',
        nozzle_diameter: '0.4',
      });
      fetchData();
    } catch (error) {
      console.error('Error adding printer:', error);
      Alert.alert('Error', 'Failed to add printer');
    }
  };

  const handleDeletePrinter = async (printerId: string) => {
    try {
      await supabase.from('printers').delete().eq('id', printerId);
      if (selectedPrinterId === printerId) {
        setSelectedPrinterId(printers[0]?.id || null);
      }
      fetchData();
    } catch (error) {
      console.error('Error deleting printer:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!newProfile.name || !selectedPrinterId) {
      Alert.alert('Error', 'Please fill in profile name');
      return;
    }

    try {
      const profileData = {
        name: newProfile.name,
        printer_id: selectedPrinterId,
        nozzle_temp: parseInt(newProfile.nozzle_temp) || 200,
        bed_temp: parseInt(newProfile.bed_temp) || 60,
        chamber_temp: newProfile.chamber_temp ? parseInt(newProfile.chamber_temp) : null,
        print_speed: parseInt(newProfile.print_speed) || 60,
        travel_speed: parseInt(newProfile.travel_speed) || 150,
        retraction_distance: parseFloat(newProfile.retraction_distance) || 6.0,
        retraction_speed: parseInt(newProfile.retraction_speed) || 25,
        cooling_fan_speed: parseInt(newProfile.cooling_fan_speed) || 100,
        z_offset: parseFloat(newProfile.z_offset) || 0,
        is_default: editingProfile?.is_default || false,
      };

      if (editingProfile) {
        await supabase.from('printer_profiles').update(profileData).eq('id', editingProfile.id);
      } else {
        await supabase.from('printer_profiles').insert(profileData);
      }

      setShowAddProfileModal(false);
      setEditingProfile(null);
      resetProfileForm();
      fetchData();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await supabase.from('printer_profiles').delete().eq('id', profileId);
      fetchData();
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleSetDefaultProfile = async (profileId: string) => {
    try {
      // Remove default from all profiles for this printer
      await supabase
        .from('printer_profiles')
        .update({ is_default: false })
        .eq('printer_id', selectedPrinterId);

      // Set selected profile as default
      await supabase
        .from('printer_profiles')
        .update({ is_default: true })
        .eq('id', profileId);

      fetchData();
    } catch (error) {
      console.error('Error setting default profile:', error);
    }
  };

  const resetProfileForm = () => {
    setNewProfile({
      name: '',
      nozzle_temp: '200',
      bed_temp: '60',
      chamber_temp: '',
      print_speed: '60',
      travel_speed: '150',
      retraction_distance: '6',
      retraction_speed: '25',
      cooling_fan_speed: '100',
      z_offset: '0',
    });
  };

  const openEditProfile = (profile: PrinterProfile) => {
    setEditingProfile(profile);
    setNewProfile({
      name: profile.name,
      nozzle_temp: profile.nozzle_temp.toString(),
      bed_temp: profile.bed_temp.toString(),
      chamber_temp: profile.chamber_temp?.toString() || '',
      print_speed: profile.print_speed.toString(),
      travel_speed: profile.travel_speed.toString(),
      retraction_distance: profile.retraction_distance.toString(),
      retraction_speed: profile.retraction_speed.toString(),
      cooling_fan_speed: profile.cooling_fan_speed.toString(),
      z_offset: profile.z_offset.toString(),
    });
    setShowAddProfileModal(true);
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
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Printers Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('printers')}
          >
            <View style={styles.sectionHeaderLeft}>
              <Printer size={20} color={Colors.primary[500]} />
              <Text style={styles.sectionTitle}>Printers</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{printers.length}</Text>
              </View>
            </View>
            {expandedSections.printers ? (
              <ChevronUp size={20} color={Colors.text.tertiary} />
            ) : (
              <ChevronDown size={20} color={Colors.text.tertiary} />
            )}
          </TouchableOpacity>

          {expandedSections.printers && (
            <View style={styles.sectionContent}>
              {printers.map(printer => (
                <TouchableOpacity
                  key={printer.id}
                  style={[
                    styles.printerItem,
                    selectedPrinterId === printer.id && styles.printerItemSelected,
                  ]}
                  onPress={() => setSelectedPrinterId(printer.id)}
                >
                  <View style={styles.printerItemContent}>
                    <View style={[styles.printerStatusDot, { backgroundColor: printer.status === 'offline' ? Colors.neutral[600] : Colors.success[500] }]} />
                    <View style={styles.printerItemInfo}>
                      <Text style={styles.printerItemName}>{printer.name}</Text>
                      <Text style={styles.printerItemModel}>{printer.model}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePrinter(printer.id)}
                    >
                      <Trash2 size={16} color={Colors.error[500]} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddPrinterModal(true)}
              >
                <Plus size={18} color={Colors.primary[500]} />
                <Text style={styles.addButtonText}>Add Printer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Selected Printer Details */}
        {selectedPrinter && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Settings size={20} color={Colors.accent[500]} />
                <Text style={styles.sectionTitle}>{selectedPrinter.name}</Text>
              </View>
            </View>

            <View style={styles.printerDetailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Model</Text>
                <Text style={styles.detailValue}>{selectedPrinter.model}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bluetooth Address</Text>
                <Text style={styles.detailValue}>{selectedPrinter.bluetooth_address || 'Not paired'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Build Volume</Text>
                <Text style={styles.detailValue}>
                  {selectedPrinter.build_volume_x} × {selectedPrinter.build_volume_y} × {selectedPrinter.build_volume_z} mm
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nozzle Diameter</Text>
                <Text style={styles.detailValue}>{selectedPrinter.nozzle_diameter} mm</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Heated Bed</Text>
                <Text style={styles.detailValue}>{selectedPrinter.heated_bed ? 'Yes' : 'No'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Prints</Text>
                <Text style={styles.detailValue}>{selectedPrinter.total_prints}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Print Hours</Text>
                <Text style={styles.detailValue}>{selectedPrinter.total_print_hours.toFixed(1)}h</Text>
              </View>
            </View>

            {/* Printer Profiles */}
            <View style={styles.profilesSection}>
              <View style={styles.profilesHeader}>
                <Text style={styles.profilesTitle}>Print Profiles</Text>
                <TouchableOpacity
                  style={styles.addProfileButton}
                  onPress={() => setShowAddProfileModal(true)}
                >
                  <Plus size={16} color={Colors.primary[500]} />
                  <Text style={styles.addProfileText}>Add</Text>
                </TouchableOpacity>
              </View>

              {printerProfiles.length === 0 ? (
                <View style={styles.emptyProfiles}>
                  <Text style={styles.emptyProfilesText}>No profiles configured</Text>
                </View>
              ) : (
                printerProfiles.map(profile => (
                  <TouchableOpacity
                    key={profile.id}
                    style={styles.profileItem}
                    onPress={() => openEditProfile(profile)}
                  >
                    <View style={styles.profileInfo}>
                      <View style={styles.profileNameRow}>
                        <Text style={styles.profileName}>{profile.name}</Text>
                        {profile.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.profileSettings}>
                        <View style={styles.profileSetting}>
                          <Thermometer size={12} color={Colors.error[400]} />
                          <Text style={styles.profileSettingText}>{profile.nozzle_temp}°C</Text>
                        </View>
                        <View style={styles.profileSetting}>
                          <Thermometer size={12} color={Colors.warning[400]} />
                          <Text style={styles.profileSettingText}>{profile.bed_temp}°C</Text>
                        </View>
                        <View style={styles.profileSetting}>
                          <Gauge size={12} color={Colors.accent[400]} />
                          <Text style={styles.profileSettingText}>{profile.print_speed}mm/s</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.profileActions}>
                      {!profile.is_default && (
                        <TouchableOpacity
                          style={styles.profileAction}
                          onPress={() => handleSetDefaultProfile(profile.id)}
                        >
                          <Text style={styles.profileActionText}>Set Default</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => handleDeleteProfile(profile.id)}>
                        <Trash2 size={16} color={Colors.error[500]} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {/* About Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('about')}
          >
            <View style={styles.sectionHeaderLeft}>
              <Info size={20} color={Colors.neutral[400]} />
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            {expandedSections.about ? (
              <ChevronUp size={20} color={Colors.text.tertiary} />
            ) : (
              <ChevronDown size={20} color={Colors.text.tertiary} />
            )}
          </TouchableOpacity>

          {expandedSections.about && (
            <View style={styles.sectionContent}>
              <View style={styles.aboutCard}>
                <Text style={styles.aboutTitle}>TheAQ3DC</Text>
                <Text style={styles.aboutVersion}>Version 1.0.0</Text>
                <Text style={styles.aboutDescription}>
                  Comprehensive 3D printing management solution with wireless connectivity, voice control, auto-pause functionality, and more.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Printer Modal */}
      <Modal visible={showAddPrinterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Printer</Text>
              <TouchableOpacity onPress={() => setShowAddPrinterModal(false)}>
                <X size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Main Printer"
                  placeholderTextColor={Colors.text.tertiary}
                  value={newPrinter.name}
                  onChangeText={text => setNewPrinter(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Model *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Creality Ender 3 V2"
                  placeholderTextColor={Colors.text.tertiary}
                  value={newPrinter.model}
                  onChangeText={text => setNewPrinter(prev => ({ ...prev, model: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bluetooth Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 00:11:22:33:44:55"
                  placeholderTextColor={Colors.text.tertiary}
                  value={newPrinter.bluetooth_address}
                  onChangeText={text => setNewPrinter(prev => ({ ...prev, bluetooth_address: text }))}
                />
              </View>

              <Text style={styles.inputGroupLabel}>Build Volume (mm)</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>X</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="220"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newPrinter.build_volume_x}
                    onChangeText={text => setNewPrinter(prev => ({ ...prev, build_volume_x: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Y</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="220"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newPrinter.build_volume_y}
                    onChangeText={text => setNewPrinter(prev => ({ ...prev, build_volume_y: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Z</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="250"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newPrinter.build_volume_z}
                    onChangeText={text => setNewPrinter(prev => ({ ...prev, build_volume_z: text }))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nozzle Diameter (mm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.4"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="decimal-pad"
                  value={newPrinter.nozzle_diameter}
                  onChangeText={text => setNewPrinter(prev => ({ ...prev, nozzle_diameter: text }))}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddPrinterModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddPrinter}>
                <Text style={styles.submitButtonText}>Add Printer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Profile Modal */}
      <Modal visible={showAddProfileModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProfile ? 'Edit Profile' : 'Add Profile'}</Text>
              <TouchableOpacity onPress={() => {
                setShowAddProfileModal(false);
                setEditingProfile(null);
                resetProfileForm();
              }}>
                <X size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Profile Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Standard PLA"
                  placeholderTextColor={Colors.text.tertiary}
                  value={newProfile.name}
                  onChangeText={text => setNewProfile(prev => ({ ...prev, name: text }))}
                />
              </View>

              <Text style={styles.inputGroupLabel}>Temperatures (°C)</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Nozzle</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="200"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newProfile.nozzle_temp}
                    onChangeText={text => setNewProfile(prev => ({ ...prev, nozzle_temp: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Bed</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="60"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newProfile.bed_temp}
                    onChangeText={text => setNewProfile(prev => ({ ...prev, bed_temp: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Chamber</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="--"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newProfile.chamber_temp}
                    onChangeText={text => setNewProfile(prev => ({ ...prev, chamber_temp: text }))}
                  />
                </View>
              </View>

              <Text style={styles.inputGroupLabel}>Speeds (mm/s)</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Print</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="60"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newProfile.print_speed}
                    onChangeText={text => setNewProfile(prev => ({ ...prev, print_speed: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Travel</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="150"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newProfile.travel_speed}
                    onChangeText={text => setNewProfile(prev => ({ ...prev, travel_speed: text }))}
                  />
                </View>
              </View>

              <Text style={styles.inputGroupLabel}>Retraction</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Distance (mm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="6"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="decimal-pad"
                    value={newProfile.retraction_distance}
                    onChangeText={text => setNewProfile(prev => ({ ...prev, retraction_distance: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Speed (mm/s)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="25"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newProfile.retraction_speed}
                    onChangeText={text => setNewProfile(prev => ({ ...prev, retraction_speed: text }))}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Fan Speed (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newProfile.cooling_fan_speed}
                    onChangeText={text => setNewProfile(prev => ({ ...prev, cooling_fan_speed: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Z Offset (mm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="decimal-pad"
                    value={newProfile.z_offset}
                    onChangeText={text => setNewProfile(prev => ({ ...prev, z_offset: text }))}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowAddProfileModal(false);
                setEditingProfile(null);
                resetProfileForm();
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSaveProfile}>
                <Text style={styles.submitButtonText}>{editingProfile ? 'Save Changes' : 'Add Profile'}</Text>
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
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.text.primary,
  },
  section: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.text.primary,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500] + '20',
  },
  countText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.primary[500],
  },
  sectionContent: {
    marginTop: Spacing.xs,
  },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    marginBottom: Spacing.xs,
  },
  printerItemSelected: {
    backgroundColor: Colors.primary[500] + '15',
    borderWidth: 1,
    borderColor: Colors.primary[500] + '40',
  },
  printerItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  printerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  printerItemInfo: {
    flex: 1,
  },
  printerItemName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text.primary,
  },
  printerItemModel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.primary[500] + '40',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.primary[500],
  },
  printerDetailsCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginTop: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  detailValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text.primary,
  },
  profilesSection: {
    marginTop: Spacing.lg,
  },
  profilesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  profilesTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text.secondary,
  },
  addProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addProfileText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.primary[500],
  },
  emptyProfiles: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyProfilesText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    marginBottom: Spacing.xs,
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  profileName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text.primary,
  },
  defaultBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.success[500] + '20',
  },
  defaultBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.success[500],
  },
  profileSettings: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  profileSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileSettingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  profileAction: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.tertiary,
  },
  profileActionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.text.secondary,
  },
  aboutCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  aboutTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.text.primary,
  },
  aboutVersion: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  aboutDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.base,
    lineHeight: 20,
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
    marginBottom: Spacing.base,
  },
  inputLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  inputGroupLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.text.primary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
  },
  submitButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.primary,
  },
});
