import type { RechartsTheme } from 'recharts';

/**
 * The colors of the Recharts 3.11 light and dark themes, copied rather than imported so that these tests
 * keep their reference when the built-in themes change.
 */
const lightPalette = [
    '#2775e8', '#b65900', '#007c59', '#ae3b73', '#6f56b3', '#0582a1',
    '#b2392b', '#568b28', '#723984', '#00928e', '#ae7500', '#b862a7',
]; // prettier-ignore
const darkPalette = [
    '#5396ff', '#e97e2b', '#46d09f', '#e683ad', '#b8a4fe', '#0bb1da',
    '#ff9180', '#79b14e', '#ac71c0', '#01a19c', '#ffc470', '#ffaaec',
]; // prettier-ignore

export const lightTheme: RechartsTheme = {
  graphicalItems: lightPalette.map((color) => ({ fill: color, stroke: color, fillOpacity: 0.85 })),
  typography: { color: '#18181b' },
  pageBackground: '#fff',
};

export const darkTheme: RechartsTheme = {
  graphicalItems: darkPalette.map((color) => ({ fill: color, stroke: color, fillOpacity: 0.85 })),
  typography: { color: '#f4f4f5' },
  pageBackground: '#18181b',
};
