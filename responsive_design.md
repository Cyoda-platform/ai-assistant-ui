 ---
📋 Comprehensive Responsive Plan

Phase 1: Device-Specific Breakpoint Strategy

Breakpoints to Use:

- xs: < 640px     (Mobile phones)
- sm: 640-767px   (Large phones)
- md: 768-1023px  (Tablets/iPads)
- lg: 1024-1439px (Small laptops/desktops)
- xl: 1440-1919px (Standard monitors)
- 2xl: ≥ 1920px   (Large monitors)

Phase 2: Sidebar Panel Responsive Behavior

Mobile (< 768px):

- Chat History: Hide by default, overlay when opened (full width)
- Canvas: Full-screen overlay mode only
- Main Content: 100% width

Tablet (768-1023px):

- Chat History: 280px width max, collapsible
- Canvas: 50% width or overlay
- Main Content: Flex remaining space

Desktop (≥ 1024px):

- Chat History: 300-400px, resizable
- Canvas: 600-1200px, resizable
- Main Content: Flex remaining space

Phase 3: Content Container Adjustments

Max-Width Strategy:

Mobile:     100% - 2rem padding
Tablet:     min(100%, 720px)
Laptop:     min(100%, 896px)   (max-w-4xl)
Desktop:    min(100%, 1024px)  (max-w-5xl)
Large:      min(100%, 1280px)  (max-w-6xl)

Phase 4: Component-Specific Fixes

1. Header

- Add md: breakpoint styling
- Make height dynamic based on content
- Improve mobile menu layout

2. Feature Cards

Mobile:    1 column (stack)
Tablet:    2 columns
Desktop:   3 columns

3. Quick Actions

Mobile:    2 columns
Tablet:    4 columns
Desktop:   4 columns
Large:     4 columns (with more spacing)

4. Chat Input

Mobile:    minHeight: 80px, text-base
Tablet:    minHeight: 90px, text-lg
Desktop:   minHeight: 100px, text-xl
Large:     minHeight: 110px, text-2xl

Phase 5: Padding & Spacing Scales

Mobile (xs):     p-3, gap-2, mb-3
Small (sm):      p-4, gap-3, mb-4
Medium (md):     p-6, gap-4, mb-5
Large (lg):      p-8, gap-6, mb-6
XL (xl):         p-10, gap-8, mb-8

Phase 6: Typography Scale

Mobile:     text-sm → text-base
Tablet:     text-base → text-lg
Desktop:    text-lg → text-xl
Large:      text-xl → text-2xl

Phase 7: Sidebar Overlay Mode

For mobile/tablet, implement:
- Slide-in animation for sidebars
- Backdrop overlay (semi-transparent)
- Swipe-to-close gesture support
- Touch-friendly close button

Phase 8: Testing Matrix

| Device Type    | Resolution | Test Scenarios                              |
  |----------------|------------|---------------------------------------------|
| iPhone SE      | 375×667    | Vertical scroll, input focus, quick actions |
| iPhone 14 Pro  | 393×852    | Same as above                               |
| iPad Mini      | 768×1024   | Portrait & landscape, sidebar behavior      |
| iPad Pro 11"   | 834×1194   | Split view, canvas interaction              |
| iPad Pro 12.9" | 1024×1366  | Full feature set                            |
| Laptop (HD)    | 1366×768   | Sidebar + content balance                   |
| Desktop (FHD)  | 1920×1080  | All panels open simultaneously              |
| Desktop (QHD)  | 2560×1440  | Large monitor spacing                       |
| Desktop (4K)   | 3840×2160  | Ultra-wide content                          |

  ---
🎯 Implementation Priority

High Priority (Do First)

1. ✅ Add md: breakpoint throughout
2. ✅ Make sidebars responsive width
3. ✅ Implement mobile overlay mode for panels
4. ✅ Fix header height calculation
5. ✅ Adjust content max-width per breakpoint

Medium Priority

6. ✅ Refine padding/spacing scales
7. ✅ Optimize chat input height
8. ✅ Add xl: and 2xl: breakpoints for large monitors
9. ✅ Improve touch targets on mobile (min 44×44px)

Low Priority (Nice to Have)

10. Add swipe gestures for mobile
11. Implement responsive image lazy loading
12. Add viewport-aware animations
13. Progressive enhancement for large screens

  ---
📝 Code Changes Summary

Files to Modify:

1. HomeView.tsx - Main responsive logic
2. tailwind.css - Breakpoint utilities
3. Header.tsx - Already responsive ✅
4. ChatHistoryPanel.tsx - Make width responsive
5. useResizablePanel.ts - Add responsive defaults