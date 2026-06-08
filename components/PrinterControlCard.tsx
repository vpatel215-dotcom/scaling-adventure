import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Thermometer,
  Gauge,
  Wifi,
  WifiOff,
  Settings,
  MoreVertical,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, getStatusColor, Shadows } from '@/lib/theme';
import { Printer } from '@/types/database';

interface PrinterControlCardProps {
  printer: Printer;
  onRefresh?: () => void;
}

export function PrinterControlCard({ printer, onRefresh }: PrinterControlCardProps) {
  const isOnline = printer.status !== 'offline';
  const isPrinting = printer.status === 'printing';
  const isPaused = printer.status === 'paused';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background.tertiary, Colors.background.secondary]}
        style={styles.card}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(printer.status) }]} />
            <View>
              <Text style={styles.printerName}>{printer.name}</Text>
              <Text style={styles.printerModel}>{printer.model}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.connectionStatus}>
              {isOnline ? (
                <Wifi size={16} color={Colors.success[500]} />
              ) : (
                <WifiOff size={16} color={Colors.text.tertiary} />
              )}
            </View>
            <TouchableOpacity style={styles.menuButton}>
              <MoreVertical size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonPrimary]}
            disabled={printer.status === 'offline'}
          >
            {isPrinting ? (
              <Pause size={24} color={Colors.text.primary} />
            ) : (
              <Play size={24} color={Colors.text.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonSecondary]}
            disabled={!isPrinting && !isPaused}
          >
            <Square size={20} color={Colors.error[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonSecondary]}
            disabled={printer.status === 'offline'}
          >
            <RotateCcw size={20} color={Colors.warning[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonSecondary]}
            disabled={printer.status === 'offline'}
          >
            <Settings size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Thermometer size={16} color={Colors.error[400]} />
            <Text style={styles.statLabel}>Nozzle</Text>
            <Text style={styles.statValue}>--°C</Text>
          </View>
          <View style={styles.stat}>
            <Thermometer size={16} color={Colors.warning[400]} />
            <Text style={styles.statLabel}>Bed</Text>
            <Text style={styles.statValue}>--°C</Text>
          </View>
          <View style={styles.stat}>
            <Gauge size={16} color={Colors.accent[400]} />
            <Text style={styles.statLabel}>Fan</Text>
            <Text style={styles.statValue}>--%</Text>
          </View>
        </View>

        {/* Build Volume */}
        <View style={styles.buildVolume}>
          <Text style={styles.buildVolumeLabel}>Build Volume</Text>
          <Text style={styles.buildVolumeValue}>
            {printer.build_volume_x} × {printer.build_volume_y} × {printer.build_volume_z} mm
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  printerName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.text.primary,
  },
  printerModel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  connectionStatus: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.elevated,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  controlButtonPrimary: {
    width: 56,
    height: 56,
    backgroundColor: Colors.primary[500],
  },
  controlButtonSecondary: {
    width: 44,
    height: 44,
    backgroundColor: Colors.background.elevated,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.sm,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.tertiary,
    flex: 1,
  },
  statValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.primary,
  },
  buildVolume: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.background.elevated,
  },
  buildVolumeLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  buildVolumeValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.text.secondary,
  },
});
