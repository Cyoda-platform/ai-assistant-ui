# Workflow Canvas Color Themes

This directory contains the color theme system for the workflow canvas.

## Available Themes

### 1. **Bluey Orange** (Default)
Professional blue and orange palette with modern, clean colors.

**Colors:**
- Initial State: `#6366f1` (Indigo-500)
- Final State: `#8b5cf6` (Violet-500)
- Normal State: `#0ea5e9` (Sky-500)
- Manual Transitions: `#f59e0b` (Amber-500)
- Automated Transitions: `#8b5cf6` (Violet-500)

**UI Elements:**
- Panel borders and accents use purple/violet tones
- Gradient backgrounds from indigo-950 through violet-900 to purple-900
- Title gradients from violet-400 to indigo-400

### 2. **Greeny Pink**
Fresh green and vibrant pink palette for an energetic look.

**Colors:**
- Initial State: `#ec4899` (Pink-500)
- Final State: `#a855f7` (Purple-500)
- Normal State: `#10b981` (Emerald-500)
- Manual Transitions: `#ec4899` (Pink-500)
- Automated Transitions: `#10b981` (Emerald-500)

**UI Elements:**
- Panel borders and accents use pink tones
- Gradient backgrounds from pink-950 through pink-900 to pink-800
- Title gradients from pink-300 to pink-400

### 3. **Cyberpunk Neon**
Vibrant neon lime/emerald colors for a futuristic, high-tech look.

**Colors:**
- Initial State: `#84cc16` (Lime-500)
- Final State: `#10b981` (Emerald-500)
- Normal State: `#22c55e` (Green-500)
- Manual Transitions: `#a3e635` (Lime-400)
- Automated Transitions: `#34d399` (Emerald-400)

**UI Elements:**
- Panel borders and accents use lime/emerald tones
- Gradient backgrounds from gray-900 through lime-950 to emerald-950
- Title gradients from lime-400 to emerald-400

## Usage

### Changing Theme

Users can change the theme from the Canvas Settings panel:
1. Click the Settings button (⚙️) in the canvas controls
2. Select a theme from the "Color Theme" dropdown
3. The theme is automatically saved to localStorage
4. All UI elements (panels, buttons, nodes, edges) update immediately

### For Developers

The theme system is implemented using:

1. **`colorPalettes.ts`** - Defines all available color palettes with both node/edge colors and UI colors
2. **`useTheme.ts`** - Custom hook for theme management with localStorage persistence
3. All canvas components accept a `palette` prop and use it for styling

Example usage:
```typescript
import { useTheme } from '../hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, palette } = useTheme();
  
  // Use palette colors for nodes/edges
  const nodeColor = palette.colors.stateInitial;
  
  // Use palette UI colors for panels
  const panelBorder = palette.ui.panelBorder;
  
  // Change theme
  setTheme('cyberpunk');
}
```

## Design Principles

- **No Glow Effects**: All themes use solid colors without excessive gradients or glow
- **Professional**: Clean, modern appearance suitable for business applications
- **Consistent**: All components (nodes, edges, panels, buttons) use the same color system
- **Accessible**: High contrast between text and backgrounds
- **Persistent**: Theme selection is saved to localStorage
- **Dynamic**: All UI elements update immediately when theme changes

## Theme Structure

Each theme includes:

### Node/Edge Colors
- `stateInitial` - Color for initial state nodes
- `stateFinal` - Color for final state nodes
- `stateNormal` - Color for normal state nodes
- `transitionManual` - Color for manual transitions
- `transitionAutomated` - Color for automated transitions

### UI Colors
- `panelBorder` - Border color for panels and controls
- `panelGradientFrom` - Start color for panel backgrounds
- `panelGradientVia` - Middle color for panel backgrounds
- `panelGradientTo` - End color for panel backgrounds
- `panelTitleFrom` - Start color for panel title gradients
- `panelTitleTo` - End color for panel title gradients
- `accentColor` - Primary accent color for highlights
- `accentHover` - Hover state for accent elements

## Adding New Themes

To add a new theme:

1. Add the theme to `colorPalettes.ts`:
```typescript
export const COLOR_PALETTES: Record<ThemeName, ColorPalette> = {
  // ... existing themes
  'my-theme': {
    name: 'My Theme',
    description: 'Description of my theme',
    colors: {
      stateInitial: '#hexcolor',
      stateFinal: '#hexcolor',
      stateNormal: '#hexcolor',
      transitionManual: '#hexcolor',
      transitionAutomated: '#hexcolor',
    },
    ui: {
      panelBorder: '#hexcolor',
      panelGradientFrom: '#hexcolor',
      panelGradientVia: '#hexcolor',
      panelGradientTo: '#hexcolor',
      panelTitleFrom: '#hexcolor',
      panelTitleTo: '#hexcolor',
      accentColor: '#hexcolor',
      accentHover: '#hexcolor',
    }
  }
};
```

2. Update the `ThemeName` type:
```typescript
export type ThemeName = 'bluey-orange' | 'greeny-pink' | 'cyberpunk' | 'my-theme';
```

3. The new theme will automatically appear in the settings dropdown and all UI elements will use the new colors!

