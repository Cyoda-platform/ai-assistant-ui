# Changelog: May 2026

## Cyoda Cloud rebrand — public web surface

Rebranded the public web app from Cyoda AI Assistant UI to Cyoda Cloud. Updated landing page, metadata, manifest, navigation, fonts, theme behaviour, and public copy for the hosted Cyoda runtime live beta.

**Changes:**
- Public product name changed to Cyoda Cloud
- Repository described as Cyoda Cloud UI monorepo
- Free-to-try live beta wording throughout
- Removal of forced dark mode; public landing page renders in light theme by default
- Replacement of animated GIF logo loader with static SVG
- Metadata and manifest cleanup: correct title, OG tags, Twitter card, canonical URL
- MyWebSite / MySite placeholder strings removed from manifest and HTML
- Font system updated: self-hosted Inter (UI/prose) and JetBrains Mono (code), replacing Roboto Google Fonts import
- Google Fonts network requests removed for the public page
- SEO files added: robots.txt, sitemap.xml, llms.txt
- FAQPage JSON-LD structured data added to landing page
- Landing page rebuilt with developer-first copy, 14 FAQ items, and correct security/hosting facts
- Route-level lazy loading added for Monaco/editor-heavy routes
- prefers-reduced-motion support added

**Out of scope for this change:**
- No WorkflowCanvas or PortalCanvas changes
- No new workflow editor integration
- No desktop app rebrand
- No paid plans, SLA, or production-readiness claims

---

# Changelog: February 11-18, 2026

**Branch:** [cyoda-ai-studio-fixes-4-february](https://github.com/Cyoda-platform/ai-assistant-ui/commits/cyoda-ai-studio-fixes-4-february)

## Summary
This document provides a brief overview of all commits and fixes made between February 11 and February 18, 2026 (inclusive).

**Total Commits:** 30

---

## February 18, 2026

### UI/UX Improvements

**Simplify WorkflowJsonEditor UI for better UX** (`3f424d1`)
- Compact header: removed subtitle "Edit the complete workflow configuration"
- Reduced button sizes from 40x40px to 28x28px (Upload, Send, Close icons)
- Moved action buttons to the right side in a single row for cleaner layout
- Reduced header padding from p-4 to px-4 py-3 for more vertical space
- Removed inner border and padding around Monaco editor for edge-to-edge editing experience
- Reduced default panel width from 600px to 450px for less screen occupation
- Kept minimap enabled and Live Editing indicator intact

**Update bot message border radius styling** (`e968b0f`)
- Changed border-top-left-radius to 0.375rem (less rounded) for bot messages
- Changed border-top-right-radius to 1rem (fully rounded) for bot messages
- Applied to both `.text-responsive-container` and `.text-responsive-container.bot-message` classes
- Creates visual distinction with less rounded top-left corner matching AI thinking message style

**Make FintechHomeView mobile responsive** (`717d0dd`)
- Hero title: 3 centered lines on mobile, original layout on desktop
- Subtitle: 4 lines on mobile with line breaks
- Carousel cards: compact layout with image+title in row, smaller padding and fonts on mobile
- Navigation buttons: smaller size and closer positioning on mobile
- Chat textarea: responsive padding (less space for send button on mobile)
- Send button: smaller icon and padding on mobile
- Quick Actions: smaller title font on mobile, original size on desktop
- Get Started section: responsive padding, fonts, and wrapping badges on mobile
- All changes are mobile-only using Tailwind breakpoints (sm:, md:), desktop layout preserved

---

## February 17, 2026

### Responsive Design & Layout

**Add responsive layout for WizardOptionSelection based on container width** (`ecdb6d3`)
- Implemented ResizeObserver to detect container width changes
- Dynamic grid layout: 1 column for narrow (<600px), 2 columns for medium (600-900px), 3 columns for wide (>900px)
- Ensures wizard options adapt to Canvas panel width on desktop
- Maintains mobile responsiveness with proper breakpoints

**Fix text alignment in wizard option cards - center align all options** (`43832af`)
- Centered all text content in wizard option cards for better visual consistency
- Applied to title, description, and all text elements

### Theme & Styling

**Apply EntityEditor theme to RequirementEditor with orange accents** (`81df40f`)
- Updated RequirementEditor to match EntityEditor design language
- Changed accent color from purple to orange (#f97316)
- Unified visual consistency across editors

**Update Select button styling to match Send button** (`97c861f`)
- Harmonized Select button design with Send button for consistency
- Applied matching colors, shadows, and hover effects

**Scale down workflow controls panel on mobile** (`75a1007`)
- Reduced size of workflow controls panel for better mobile experience
- Improved touch targets and spacing on smaller screens

**Add responsive layout for narrow Canvas panel on desktop** (`c464086`)
- Canvas panel adapts layout when resized to narrow width on desktop
- Ensures usability even with minimal panel width
- Maintains functionality across different panel sizes

---

## February 13, 2026

### Bug Fixes & Layout Improvements

**Fix requirement card layout: compact icons positioning** (`cb4805d`)
- Corrected icon positioning in requirement cards for compact view
- Improved visual alignment and spacing

**Add scrolling to metrics selector list in MonitoringView** (`a0c1935`)
- Added scroll functionality to metrics selector when list is long
- Prevents overflow and improves usability

**Fix empty Application row height in MonitoringView status table** (`9e0a0c7`)
- Fixed height issue when Application row is empty
- Improved table layout consistency

**Unify select elements design across Logs and Metrics pages** (`0bf0b00`)
- Standardized select dropdown styling across monitoring pages
- Consistent visual language throughout monitoring section

### Mobile Responsiveness

**Improve mobile responsive design for MonitoringView header** (`9da47ee`)
- Optimized header layout for mobile devices
- Better spacing and element arrangement on small screens

**Improve mobile responsive design for LogsView header** (`1659402`)
- Enhanced header responsiveness in LogsView
- Improved mobile user experience

**Fix dropdown positioning and mobile scrolling in LogsView** (`208d308`)
- Corrected dropdown menu positioning issues
- Fixed scrolling behavior on mobile devices

**Improve mobile menu to match desktop header** (`8bb435b`)
- Unified mobile menu design with desktop header
- Consistent navigation experience across devices

**Reduce horizontal padding on mobile devices in chat container** (`b273a4b`)
- Optimized chat container padding for mobile screens
- More efficient use of screen real estate

**Make wizard option cards responsive for mobile** (`9d923f9`)
- Added mobile-specific layout for wizard option cards
- Improved touch targets and readability on small screens

### UI Polish

**Remove background from delete icons in canvas drafts** (`52b81a2`)
- Cleaner visual appearance for delete icons
- Reduced visual clutter in canvas drafts

**Move canvas empty state content higher on the page** (`3933c6a`)
- Improved empty state positioning for better visibility
- Enhanced user experience when canvas is empty

---

## February 12, 2026

### UI Improvements

**Change GitHub link color from purple to teal** (`493617a`)
- Updated GitHub link color to match overall teal theme
- Better visual consistency with brand colors

**Remove visual indicator from resize handle** (`243f41d`)
- Cleaner resize handle appearance
- Less visual distraction while maintaining functionality

### Bug Fixes

**Fix Load More Chats button visibility condition** (`d42628d`)
- Corrected logic for showing/hiding Load More Chats button
- Prevents button from appearing when not needed

**Replace native select with Ant Design Select in MonitoringView** (`3f97d5f`)
- Upgraded to Ant Design Select component for better UX
- Consistent styling with rest of the application
- Improved accessibility and functionality

---

## February 11, 2026

### Features & Improvements

**Remove default 'cyoda' application from monitoring view** (`286db5e`)
- Cleaned up default application selection
- Users now explicitly choose applications to monitor

**Fix default edge type in workflow canvas to Bezier** (`c418f8b`)
- Changed default edge type from straight to Bezier curves
- Improved visual flow representation in workflows

**Standardize icons across UI components** (`5a9370d`)
- Unified icon usage throughout the application
- Consistent visual language and better UX

**Update LoginPopUp modal styling to match ErrorModal design** (`445f7e6`)
- Harmonized modal designs across the application
- Consistent user experience for all modal dialogs

---

## Key Themes

### 1. Mobile Responsiveness
- Extensive work on making the application mobile-friendly
- FintechHomeView, wizard cards, monitoring views, and chat interface all optimized for mobile
- Responsive layouts that adapt to different screen sizes

### 2. Visual Consistency
- Standardized colors (teal theme), icons, and component styling
- Unified modal designs and button styles
- Consistent design language across editors and UI components

### 3. User Experience
- Improved layouts, spacing, and positioning
- Better touch targets on mobile
- Enhanced empty states and loading indicators
- Cleaner visual appearance with reduced clutter

### 4. Bug Fixes
- Fixed dropdown positioning, scrolling issues, and layout problems
- Corrected button visibility logic
- Resolved edge type defaults and icon positioning

---

## Risk Assessment

- `3f424d1` - No risk (UI layout and styling changes only, no logic affected)
- `e968b0f` - No risk (CSS border-radius styles only)
- `717d0dd` - Low risk (responsive changes with breakpoints, desktop unaffected)
- `ecdb6d3` - Medium risk (ResizeObserver may not work in older browsers, layout logic changed)
- `43832af` - No risk (text-align only)
- `81df40f` - Low risk (Monaco theme, may affect code readability)
- `97c861f` - No risk (button styles only)
- `75a1007` - No risk (CSS transform for mobile only)
- `c464086` - Medium risk (complex Canvas adaptation logic, defaultPanelStates changes may affect UX)
- `cb4805d` - No risk (CSS for icons only)
- `a0c1935` - No risk (scroll added, functionality unchanged)
- `9e0a0c7` - No risk (placeholder and min-height)
- `0bf0b00` - Low risk (major layout refactoring, may affect display)
- `9da47ee` - No risk (CSS for mobile only)
- `1659402` - No risk (CSS for mobile only)
- `208d308` - Medium risk (native select replaced with Ant Design, z-index changes may affect other elements)
- `8bb435b` - Low risk (mobile menu structure changed, may affect navigation)
- `b273a4b` - No risk (padding only)
- `9d923f9` - Low risk (grid layout and alignment changed, may affect UX)
- `52b81a2` - No risk (background removal)
- `3933c6a` - No risk (margin change)
- `493617a` - No risk (colors only)
- `243f41d` - No risk (icon removed, functionality preserved)
- `d42628d` - No risk (improved button visibility condition)
- `3f97d5f` - Medium risk (native select replaced with Ant Design, major refactoring with style and logic changes)
- `286db5e` - Low risk (default value changed, users must explicitly select application)
- `c418f8b` - Low risk (default edge type change may affect existing workflows)
- `5a9370d` - No risk (icon replacement only)
- `445f7e6` - Low risk (modal styling changes, major lock file changes)

### Overall Risk Summary:
- **High risk:** 0 commits
- **Medium risk:** 4 commits (ecdb6d3, c464086, 208d308, 3f97d5f) - require testing
- **Low risk:** 8 commits - minimal impact on functionality
- **No risk:** 18 commits - visual changes only

**Recommendations:**
1. Test ResizeObserver in different browsers (ecdb6d3)
2. Verify Canvas panel responsiveness on narrow screens (c464086)
3. Check for z-index conflicts in LogsView (208d308)
4. Test Ant Design Select in MonitoringView (3f97d5f)
5. Verify default edge type in existing workflows (c418f8b)

---

**Total Files Changed:** Multiple files across web package
**Primary Focus Areas:** Mobile responsiveness, UI/UX consistency, bug fixes, and documentation

