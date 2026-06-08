export const Colors = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  accent: {
    50: '#E0F7FA',
    100: '#B2EBF2',
    200: '#80DEEA',
    300: '#4DD0E1',
    400: '#26C6DA',
    500: '#00BCD4',
    600: '#00ACC1',
    700: '#0097A7',
    800: '#00838F',
    900: '#006064',
  },
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107',
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  background: {
    primary: '#0A0A0F',
    secondary: '#12121A',
    tertiary: '#1A1A24',
    elevated: '#222230',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0C0',
    tertiary: '#707090',
    inverse: '#0A0A0F',
  },
};

export const Typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 12,
  },
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'idle':
      return Colors.neutral[500];
    case 'printing':
      return Colors.primary[500];
    case 'paused':
      return Colors.warning[500];
    case 'error':
      return Colors.error[500];
    case 'maintenance':
      return Colors.warning[600];
    case 'offline':
      return Colors.neutral[700];
    case 'queued':
      return Colors.neutral[400];
    case 'preparing':
      return Colors.accent[500];
    case 'completed':
      return Colors.success[500];
    case 'failed':
      return Colors.error[500];
    case 'cancelled':
      return Colors.neutral[600];
    default:
      return Colors.neutral[500];
  }
};

export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'info':
      return Colors.primary[500];
    case 'warning':
      return Colors.warning[500];
    case 'critical':
      return Colors.error[500];
    default:
      return Colors.neutral[500];
  }
};

export const getMaterialTypeColor = (type: string): string => {
  switch (type) {
    case 'PLA':
      return Colors.success[500];
    case 'PETG':
      return Colors.primary[500];
    case 'ABS':
      return Colors.warning[600];
    case 'TPU':
      return Colors.accent[500];
    case 'ASA':
      return Colors.warning[500];
    case 'PC':
      return Colors.neutral[300];
    case 'NYLON':
      return Colors.neutral[400];
    case 'CARBON_FIBER':
      return Colors.neutral[800];
    case 'WOOD':
      return Colors.warning[700];
    default:
      return Colors.neutral[500];
  }
};
