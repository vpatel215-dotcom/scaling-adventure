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
  Package,
  Thermometer,
  Ruler,
  MapPin,
  DollarSign,
  X,
  ChevronRight,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, getMaterialTypeColor, Shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Material, MaterialType } from '@/types/database';

const MATERIAL_TYPES: MaterialType[] = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'PC', 'NYLON', 'CARBON_FIBER', 'WOOD', 'OTHER'];

const COLOR_PRESETS = [
  '#FFFFFF', '#C0C0C0', '#FF0000', '#FF6B00', '#FFD700', '#00FF00',
  '#00CED1', '#1E90FF', '#8A2BE2', '#FF69B4', '#000000', '#8B4513',
];

export default function MaterialsScreen() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedType, setSelectedType] = useState<MaterialType>('PLA');
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    brand: '',
    color: '',
    color_hex: '#FFFFFF',
    weight_grams: '1000',
    diameter: '1.75',
    print_temp_min: '',
    print_temp_max: '',
    bed_temp_min: '',
    bed_temp_max: '',
    location: '',
    purchase_price: '',
  });

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from('materials').select('*').order('name');
      if (data) setMaterials(data);
      if (error) throw error;
    } catch (error) {
      console.error('Error fetching materials:', error);
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

  const handleSaveMaterial = async () => {
    if (!newMaterial.name || !newMaterial.color) {
      Alert.alert('Error', 'Please fill in name and color');
      return;
    }

    try {
      const materialData = {
        name: newMaterial.name,
        type: selectedType,
        color: newMaterial.color,
        color_hex: newMaterial.color_hex,
        brand: newMaterial.brand || null,
        weight_grams: parseInt(newMaterial.weight_grams) || 1000,
        remaining_grams: editingMaterial?.remaining_grams || parseInt(newMaterial.weight_grams) || 1000,
        diameter: parseFloat(newMaterial.diameter) || 1.75,
        print_temp_min: newMaterial.print_temp_min ? parseInt(newMaterial.print_temp_min) : null,
        print_temp_max: newMaterial.print_temp_max ? parseInt(newMaterial.print_temp_max) : null,
        bed_temp_min: newMaterial.bed_temp_min ? parseInt(newMaterial.bed_temp_min) : null,
        bed_temp_max: newMaterial.bed_temp_max ? parseInt(newMaterial.bed_temp_max) : null,
        location: newMaterial.location || null,
        purchase_price: newMaterial.purchase_price ? parseFloat(newMaterial.purchase_price) : null,
      };

      if (editingMaterial) {
        await supabase.from('materials').update(materialData).eq('id', editingMaterial.id);
      } else {
        await supabase.from('materials').insert(materialData);
      }

      setShowAddModal(false);
      setEditingMaterial(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving material:', error);
      Alert.alert('Error', 'Failed to save material');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await supabase.from('materials').update({ is_active: false }).eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const resetForm = () => {
    setNewMaterial({
      name: '',
      brand: '',
      color: '',
      color_hex: '#FFFFFF',
      weight_grams: '1000',
      diameter: '1.75',
      print_temp_min: '',
      print_temp_max: '',
      bed_temp_min: '',
      bed_temp_max: '',
      location: '',
      purchase_price: '',
    });
    setSelectedType('PLA');
  };

  const openEditModal = (material: Material) => {
    setEditingMaterial(material);
    setSelectedType(material.type);
    setNewMaterial({
      name: material.name,
      brand: material.brand || '',
      color: material.color,
      color_hex: material.color_hex,
      weight_grams: material.weight_grams.toString(),
      diameter: material.diameter.toString(),
      print_temp_min: material.print_temp_min?.toString() || '',
      print_temp_max: material.print_temp_max?.toString() || '',
      bed_temp_min: material.bed_temp_min?.toString() || '',
      bed_temp_max: material.bed_temp_max?.toString() || '',
      location: material.location || '',
      purchase_price: material.purchase_price?.toString() || '',
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingMaterial(null);
    resetForm();
  };

  const activeMaterials = materials.filter(m => m.is_active);
  const lowStockMaterials = activeMaterials.filter(m => m.remaining_grams < m.weight_grams * 0.2);

  const MaterialCard = ({ material }: { material: Material }) => {
    const remainingPercent = (material.remaining_grams / material.weight_grams) * 100;
    const isLowStock = remainingPercent < 20;

    return (
      <TouchableOpacity style={styles.materialCard} onPress={() => openEditModal(material)}>
        <View style={styles.materialHeader}>
          <View style={[styles.colorSwatch, { backgroundColor: material.color_hex }]}>
            <Text style={styles.typeInitial}>{material.type.charAt(0)}</Text>
          </View>
          <View style={styles.materialInfo}>
            <Text style={styles.materialName}>{material.name}</Text>
            <View style={styles.materialMeta}>
              <View style={[styles.typeTag, { backgroundColor: getMaterialTypeColor(material.type) + '20' }]}>
                <Text style={[styles.typeTagText, { color: getMaterialTypeColor(material.type) }]}>
                  {material.type}
                </Text>
              </View>
              <Text style={styles.materialBrand}>{material.brand}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.text.tertiary} />
        </View>

        <View style={styles.materialDetails}>
          <View style={styles.detailRow}>
            <Package size={14} color={Colors.text.tertiary} />
            <Text style={styles.detailText}>
              {material.remaining_grams}g / {material.weight_grams}g remaining
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${remainingPercent}%`,
                    backgroundColor: isLowStock ? Colors.error[500] : Colors.success[500],
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, isLowStock && styles.lowStockText]}>
              {remainingPercent.toFixed(0)}%
            </Text>
          </View>

          {material.print_temp_min && material.print_temp_max && (
            <View style={styles.tempRow}>
              <Thermometer size={14} color={Colors.error[400]} />
              <Text style={styles.tempText}>
                {material.print_temp_min}-{material.print_temp_max}°C
              </Text>
              {material.bed_temp_min && material.bed_temp_max && (
                <>
                  <Thermometer size={14} color={Colors.warning[400]} />
                  <Text style={styles.tempText}>
                    Bed: {material.bed_temp_min}-{material.bed_temp_max}°C
                  </Text>
                </>
              )}
            </View>
          )}
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
            <Text style={styles.title}>Materials</Text>
            <Text style={styles.subtitle}>{activeMaterials.length} spools in inventory</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Plus size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Low Stock Alert */}
        {lowStockMaterials.length > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertContent}>
              <Package size={18} color={Colors.warning[500]} />
              <Text style={styles.alertText}>
                {lowStockMaterials.length} material{lowStockMaterials.length > 1 ? 's' : ''} running low
              </Text>
            </View>
          </View>
        )}

        {/* Material List */}
        <View style={styles.section}>
          {activeMaterials.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No Materials</Text>
              <Text style={styles.emptyStateText}>
                Add your filament inventory to track usage
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setShowAddModal(true)}>
                <Plus size={18} color={Colors.text.primary} />
                <Text style={styles.emptyButtonText}>Add Material</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeMaterials.map(material => (
              <MaterialCard key={material.id} material={material} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingMaterial ? 'Edit Material' : 'Add Material'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Material Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type</Text>
                <View style={styles.typeGrid}>
                  {MATERIAL_TYPES.map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        selectedType === type && styles.typeButtonActive,
                      ]}
                      onPress={() => setSelectedType(type)}
                    >
                      <View style={[styles.typeDot, { backgroundColor: getMaterialTypeColor(type) }]} />
                      <Text style={[styles.typeButtonText, selectedType === type && styles.typeButtonTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Blue PLA Basic"
                    placeholderTextColor={Colors.text.tertiary}
                    value={newMaterial.name}
                    onChangeText={text => setNewMaterial(prev => ({ ...prev, name: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Brand</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., eSun"
                    placeholderTextColor={Colors.text.tertiary}
                    value={newMaterial.brand}
                    onChangeText={text => setNewMaterial(prev => ({ ...prev, brand: text }))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Color Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Sky Blue"
                  placeholderTextColor={Colors.text.tertiary}
                  value={newMaterial.color}
                  onChangeText={text => setNewMaterial(prev => ({ ...prev, color: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Color</Text>
                <View style={styles.colorPicker}>
                  {COLOR_PRESETS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color },
                        newMaterial.color_hex === color && styles.colorButtonActive,
                      ]}
                      onPress={() => setNewMaterial(prev => ({ ...prev, color_hex: color }))}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Total Weight (g)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1000"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newMaterial.weight_grams}
                    onChangeText={text => setNewMaterial(prev => ({ ...prev, weight_grams: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Diameter (mm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1.75"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="decimal-pad"
                    value={newMaterial.diameter}
                    onChangeText={text => setNewMaterial(prev => ({ ...prev, diameter: text }))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Print Temperature Range (°C)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Min: 190"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newMaterial.print_temp_min}
                    onChangeText={text => setNewMaterial(prev => ({ ...prev, print_temp_min: text }))}
                  />
                  <Text style={styles.rangeSeparator}>-</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Max: 220"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newMaterial.print_temp_max}
                    onChangeText={text => setNewMaterial(prev => ({ ...prev, print_temp_max: text }))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bed Temperature Range (°C)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Min: 50"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newMaterial.bed_temp_min}
                    onChangeText={text => setNewMaterial(prev => ({ ...prev, bed_temp_min: text }))}
                  />
                  <Text style={styles.rangeSeparator}>-</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Max: 60"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    value={newMaterial.bed_temp_max}
                    onChangeText={text => setNewMaterial(prev => ({ ...prev, bed_temp_max: text }))}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Storage Location</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Shelf A1"
                    placeholderTextColor={Colors.text.tertiary}
                    value={newMaterial.location}
                    onChangeText={text => setNewMaterial(prev => ({ ...prev, location: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Purchase Price</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 24.99"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="decimal-pad"
                    value={newMaterial.purchase_price}
                    onChangeText={text => setNewMaterial(prev => ({ ...prev, purchase_price: text }))}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              {editingMaterial && (
                <TouchableOpacity style={styles.deleteButton} onPress={() => {
                  handleDeleteMaterial(editingMaterial.id);
                  closeModal();
                }}>
                  <Trash2 size={18} color={Colors.error[500]} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSaveMaterial}>
                <Text style={styles.submitButtonText}>{editingMaterial ? 'Save Changes' : 'Add Material'}</Text>
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
  alertBanner: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.warning[500] + '15',
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning[500],
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  alertText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.warning[500],
  },
  section: {
    paddingHorizontal: Spacing.base,
  },
  materialCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInitial: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.text.inverse,
  },
  materialInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  materialName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.text.primary,
  },
  materialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  typeTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeTagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  materialBrand: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  materialDetails: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    flex: 1,
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.success[500],
    minWidth: 36,
    textAlign: 'right',
  },
  lowStockText: {
    color: Colors.error[500],
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  tempText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.tertiary,
    marginRight: Spacing.sm,
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
    maxHeight: '90%',
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
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rangeSeparator: {
    alignSelf: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.text.tertiary,
    paddingHorizontal: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary[500] + '20',
    borderWidth: 1,
    borderColor: Colors.primary[500],
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.text.secondary,
  },
  typeButtonTextActive: {
    color: Colors.primary[500],
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: Colors.primary[500],
    transform: [{ scale: 1.1 }],
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  deleteButton: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.error[500] + '15',
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
