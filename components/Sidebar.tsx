import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  LayoutDashboard,
  ListOrdered,
  Package,
  Settings,
  Wrench,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/lib/theme';

interface NavItem {
  name: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={24} color={Colors.text.secondary} />,
    href: '/(tabs)',
  },
  {
    name: 'queue',
    label: 'Queue',
    icon: <ListOrdered size={24} color={Colors.text.secondary} />,
    href: '/(tabs)/queue',
  },
  {
    name: 'materials',
    label: 'Materials',
    icon: <Package size={24} color={Colors.text.secondary} />,
    href: '/(tabs)/materials',
  },
  {
    name: 'maintenance',
    label: 'Maintenance',
    icon: <Wrench size={24} color={Colors.text.secondary} />,
    href: '/(tabs)/maintenance',
  },
  {
    name: 'settings',
    label: 'Settings',
    icon: <Settings size={24} color={Colors.text.secondary} />,
    href: '/(tabs)/settings',
  },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/(tabs)') {
      return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
    }
    return pathname.includes(href.replace('/(tabs)', ''));
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <Text style={styles.logoText}>AQ3DC</Text>
        <Text style={styles.logoSubtext}>3D Printing Hub</Text>
      </View>

      {/* Navigation Items */}
      <View style={styles.navSection}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.push(item.href)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
                {active ? (
                  <View style={{ opacity: 1 }}>
                    {/* Re-render icon with active color */}
                    {item.name === 'dashboard' && <LayoutDashboard size={24} color={Colors.primary[500]} />}
                    {item.name === 'queue' && <ListOrdered size={24} color={Colors.primary[500]} />}
                    {item.name === 'materials' && <Package size={24} color={Colors.primary[500]} />}
                    {item.name === 'maintenance' && <Wrench size={24} color={Colors.primary[500]} />}
                    {item.name === 'settings' && <Settings size={24} color={Colors.primary[500]} />}
                  </View>
                ) : (
                  item.icon
                )}
              </View>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    height: '100%',
    backgroundColor: Colors.background.secondary,
    borderRightWidth: 1,
    borderRightColor: Colors.background.tertiary,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  logoSection: {
    marginBottom: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.tertiary,
  },
  logoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  logoSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  navSection: {
    flex: 1,
    gap: Spacing.xs,
    overflow: 'auto',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  navItemActive: {
    backgroundColor: Colors.primary[500] + '15',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  iconContainerActive: {
    backgroundColor: Colors.primary[500] + '20',
  },
  navLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text.secondary,
  },
  navLabelActive: {
    color: Colors.primary[500],
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.text.tertiary,
  },
});
