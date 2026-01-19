# 🎨 CYODA AI Studio - Color & Style Guide

## 📋 Содержание
1. [Общая информация](#общая-информация)
2. [Основная цветовая палитра](#основная-цветовая-палитра)
3. [Компоненты UI](#компоненты-ui)
4. [Workflow Canvas](#workflow-canvas)
5. [Проблемы и несоответствия](#проблемы-и-несоответствия)

---

## 🌍 Общая информация

### Тема
- **Поддерживаемая тема:** Dark Mode Only (светлая тема не поддерживается)
- **Основной фон:** `#110F1B` (очень тёмный фиолетово-серый)
- **Шрифт:** Roboto, Arial, sans-serif

### Конфигурация
- **Tailwind CSS:** Используется для utility-классов
- **SCSS Variables:** Используются для темизации компонентов
- **Ant Design:** Настроен с darkAlgorithm

---

## 🎨 Основная цветовая палитра

### Брендовые цвета

#### Primary (Teal/Бирюзовый)
```scss
--color-primary: #0D8484          // Основной бирюзовый
--color-primary-ligter: #109f9f   // Светлый бирюзовый
--color-primary-darken: #0A6A6A   // Тёмный бирюзовый
```
**Использование:** Основные кнопки, акценты, ссылки, активные элементы

#### Secondary (Green/Зелёный)
```scss
--green-primary-dark: #2e8861     // Тёмно-зелёный
```
**Использование:** Вторичные акценты, успешные действия

#### Accent Colors (Акцентные цвета для разных секций)
- **Teal (Entities):** `#14b8a6` (teal-500)
- **Purple (Workflows):** `#a855f7` (purple-500)
- **Orange (Requirements):** `#fb923c` (orange-400)
- **Pink (Initial States):** `#EC4899` (pink-500)

---

## 🏗️ Компоненты UI

### 1. Background (Фоны)

#### Основные фоны
```scss
--bg: #110F1B                     // Основной фон приложения
--bg-sidebar: #110F1B             // Фон сайдбара
--bg-sidebar-canvas: #110F1B      // Фон канваса в сайдбаре
--bg-new-chat: #11101C            // Фон нового чата
```

#### Фоны элементов
```scss
--bg-popup: #1D1C2C               // Фон попапов
--bg-dialog-color: #110F1B        // Фон диалогов
--bg-button: #27273C              // Фон кнопок
--bg-button-hover: rgba(39, 39, 60, 0.5)  // Фон кнопок при наведении
--input: #222337                  // Фон инпутов
```

#### Градиенты
```css
/* Main Layout */
bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800

/* Cards (Entities, Workflows, Requirements) */
bg-gradient-to-br from-slate-800 to-slate-800/50

/* Header */
bg-slate-800/80 backdrop-blur-md
```

---

### 2. Borders (Границы)

```scss
--accent-border: #1E1E2E          // Акцентная граница
--sidebar-border: #1E1E2E         // Граница сайдбара
--border-color-darken: #27273C    // Тёмная граница
--input-border-color: #27273C     // Граница инпутов
--input-border: #2F2F44           // Граница инпутов (альтернатива)
```

**Tailwind классы:**
```css
border-slate-700/50               // Основные границы
border-slate-700                  // Границы header
```

---

### 3. Text (Текст)

```scss
--text-color-regular: #9F9F9F     // Обычный текст
--text-color-primary: #303133     // Основной текст
--text-color-secondary: #909399   // Вторичный текст
--text-header: #C0C0C0            // Текст заголовков
--text-header-lighter: #C0C0C0    // Светлый текст заголовков
--color-title: #0D8484            // Цвет заголовков (teal)
--color-sub-title: #C0C0C0        // Цвет подзаголовков
```

**Tailwind классы:**
```css
text-white                        // Белый текст (заголовки)
text-gray-400                     // Серый текст (описания)
text-gray-500                     // Тёмно-серый текст (метаданные)
text-slate-200                    // Светло-серый текст
text-slate-300                    // Серый текст
```

---

### 4. Buttons (Кнопки)

#### Primary Button (Основная кнопка)
```scss
background: var(--color-primary)  // #0D8484
border: 1px solid var(--color-primary)
color: #fff
```

**Hover:**
```scss
background: linear-gradient(0deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), #0D8484
border: 1px solid var(--color-primary-ligter)
```

#### Default Button (Обычная кнопка)
```scss
background: var(--bg-btn-default)  // #27273C
border: var(--border-color-default-button)
color: var(--text-color-regular)
```

#### Icon Buttons (Кнопки с иконками)
```css
/* Create buttons (разные цвета для разных секций) */
bg-teal-500 hover:bg-teal-600      // Entities
bg-purple-500 hover:bg-purple-600  // Workflows
bg-orange-500 hover:bg-orange-600  // Requirements
```

#### Silver Accept Button (Серебряная кнопка подтверждения)
```css
background: linear-gradient(to right, rgb(203, 213, 225), rgb(148, 163, 184))
color: rgb(0, 0, 0)
```

---

### 5. Cards (Карточки)

#### Entity Cards
```css
/* Background */
bg-gradient-to-br from-slate-800 to-slate-800/50

/* Border */
border border-slate-700/50
hover:border-teal-500/50

/* Icon background */
bg-teal-500/10
hover:bg-teal-500/20

/* Icon color */
text-teal-400
hover:text-teal-300

/* Title hover */
hover:text-teal-300

/* Status indicator */
bg-teal-400
```

#### Workflow Cards
```css
/* Background */
bg-gradient-to-br from-slate-800 to-slate-800/50

/* Border */
border border-slate-700/50
hover:border-purple-500/50

/* Icon background */
bg-purple-500/10
hover:bg-purple-500/20

/* Icon color */
text-purple-400
hover:text-purple-300

/* Title hover */
hover:text-purple-300

/* Status indicator */
bg-purple-400
```

#### Requirement Cards
```css
/* Background */
bg-gradient-to-br from-slate-800 to-slate-800/50

/* Border */
border border-slate-700/50
hover:border-orange-500/50

/* Icon background */
bg-orange-500/10
hover:bg-orange-500/20

/* Icon color */
text-orange-400
hover:text-orange-300

/* Title hover */
hover:text-orange-300

/* Priority indicators */
bg-red-500      // Critical
bg-orange-400   // High/Medium
bg-green-500    // Low
```

---

### 6. Action Buttons (Кнопки действий)

#### Delete Button
```css
bg-blue-500/20
hover:bg-blue-500/30
text-blue-400
hover:text-blue-300
```

#### GitHub Link Button
```css
bg-green-500/20
hover:bg-green-500/30
text-green-400
hover:text-green-300
```

---

### 7. Header

```css
/* Background */
bg-slate-800/80 backdrop-blur-md

/* Border */
border-b border-slate-700

/* Logo badge */
bg-slate-700 text-slate-300
```

---

### 8. Modals & Dialogs

```scss
/* Background */
--bg-dialog-color: #110F1B

/* Border */
--accent-border: #1E1E2E

/* Title */
--color-dialog-title: #B1B1B2

/* Close button */
--bg-dialog-close-color: #9F9F9F
```

**Canvas Modal (специальная стилизация):**
```css
/* Primary button */
background: linear-gradient(135deg, rgb(20, 184, 166) 0%, rgb(13, 132, 132) 100%)
box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3)

/* Hover */
background: linear-gradient(135deg, rgb(13, 132, 132) 0%, rgb(17, 94, 89) 100%)
box-shadow: 0 6px 16px rgba(20, 184, 166, 0.4)

/* Default button */
background: rgba(51, 65, 85, 0.6)
border: 1px solid rgba(71, 85, 105, 0.8)
color: rgb(148, 163, 184)
```

---

### 9. Inputs & Forms

```scss
/* Input background */
--input: #222337

/* Input border */
--input-border-color: #27273C

/* Input text */
--color-input-text: #9F9F9F

/* Disabled input */
--input-disabled: #27273C

/* Focus/Hover */
border-color: var(--color-primary)  // #0D8484
```

---

### 10. Chat Messages

#### Question Bubble
```scss
--bubble-question-bg-color: #151925
--bubble-question-text-color: #B1B1B2
--bubble-question-title-color: #B1B1B2
```

**Canvas QA (специальная стилизация):**
```css
/* Question */
background: linear-gradient(135deg, rgb(126 34 206 / 0.15), rgb(168 85 247 / 0.1))
border-color: rgb(168 85 247 / 0.3)

/* Answer */
background: linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(192 132 252 / 0.15))
border-color: rgb(192 132 252 / 0.4)
```

#### Notification Bubble
```scss
--bubble-notification-bg-color: #1D1C2C
--bubble-text-color: #B1B1B2
--bubble-box-shadow-color: rgba(19, 19, 33, 0.6)
--bubble-border-color: transparent
```

---

### 11. Scrollbars

```scss
/* Track */
background: #2D2D40

/* Thumb */
background: #161422

/* Tailwind alternative */
scrollbar-color: rgb(71 85 105) rgb(30 41 59)  // slate-600 slate-800
```

**Webkit:**
```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgb(30 41 59);  // slate-800
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgb(71 85 105);  // slate-600
  border-radius: 4px;
}
```

---

## 🎨 Workflow Canvas

### Цветовые палитры (3 темы)

#### 1. Blue-Orange (Default)
```typescript
stateInitial: '#6366f1'      // Indigo-500 (Created)
stateFinal: '#64748b'        // Steel Gray (Archived)
stateNormal: '#3b82f6'       // Blue-500 (Active)
transitionManual: '#a855f7'  // Purple-500
transitionAutomated: '#7c3aed' // Violet-600

// UI
panelBorder: '#6366f1'
panelGradient: from-indigo-900 via-indigo-800 to-indigo-600
accentColor: '#6366f1'
```

#### 2. Greeny-Pink
```typescript
stateInitial: '#ec4899'      // Pink-500
stateFinal: '#64748b'        // Steel Gray
stateNormal: '#10b981'       // Emerald-500
transitionManual: '#f59e0b'  // Amber-500
transitionAutomated: '#14b8a6' // Teal-500

// UI
panelBorder: '#ec4899'
panelGradient: from-pink-900 via-pink-800 to-pink-600
accentColor: '#ec4899'
```

#### 3. Cyberpunk
```typescript
stateInitial: '#ff00ff'      // Neon Magenta
stateFinal: '#00ffff'        // Neon Cyan
stateNormal: '#00ff88'       // Neon Emerald
transitionManual: '#ff0088'  // Neon Pink
transitionAutomated: '#00ddff' // Neon Blue

// UI
panelBorder: '#00ff88'
panelGradient: from-dark-green via-medium-green to-neon-emerald
accentColor: '#00ff88'
```

---

### Workflow Editor Theme

#### Node Types
```typescript
// Initial State (Pink)
gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)'
border: '#EC4899'
glow: 'rgba(236, 72, 153, 0.4)'

// Terminal State (Teal)
gradient: 'linear-gradient(135deg, #0D8484 0%, #14b8a6 100%)'
border: '#0D8484'
glow: 'rgba(13, 132, 132, 0.4)'

// Normal State (Green)
gradient: 'linear-gradient(135deg, #2e8861 0%, #10B981 100%)'
border: '#2e8861'
glow: 'rgba(46, 136, 97, 0.4)'
```

#### Transition Types
```typescript
// Manual Transition (Purple)
stroke: '#a855f7'
strokeWidth: 2
animated: false

// Automated Transition (Violet)
stroke: '#7c3aed'
strokeWidth: 2
animated: true
strokeDasharray: '5,5'
```

#### Canvas Background
```typescript
backgroundColor: '#0f172a'  // Slate-900
gridColor: '#1e293b'        // Slate-800
```

#### Panels & Controls
```css
/* Control Panel */
background: linear-gradient(135deg, rgb(99, 102, 241) 0%, rgb(79, 70, 229) 100%)
box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3)

/* Hover */
background: linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(67, 56, 202) 100%)
box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4)

/* Node Panel */
background: rgba(30, 41, 59, 0.95)  // slate-800
border: 1px solid rgba(71, 85, 105, 0.5)  // slate-600
backdrop-filter: blur(8px)
```

---

## ⚠️ Проблемы и несоответствия

### 1. Дублирование цветов
**Проблема:** Одни и те же цвета определены в разных местах с разными значениями.

**Примеры:**
- `--bg` в `variables.scss` = `#110F1B`
- `--bg-new-chat` в `variables.scss` = `#11101C` (почти идентичен)
- Tailwind `slate-900` = `#0f172a` (используется как основной фон в некоторых компонентах)

**Рекомендация:** Унифицировать основной фон приложения.

---

### 2. Несогласованность Primary Color
**Проблема:** Primary color используется по-разному в разных компонентах.

**Примеры:**
- SCSS: `--color-primary: #0D8484` (teal)
- Tailwind: `teal-500: #14b8a6` (используется в Entity cards)
- Canvas: `#6366f1` (indigo) используется как accent в Blue-Orange теме

**Рекомендация:** Определить единый primary color для всего приложения.

---

### 3. Разные подходы к стилизации
**Проблема:** Смешивание SCSS variables, Tailwind classes и inline styles.

**Примеры:**
- `EntityList.tsx`: Tailwind classes
- `WorkflowCanvas.tsx`: Inline styles с TypeScript константами
- `ChatBubble.tsx`: SCSS variables

**Рекомендация:** Выбрать единый подход или создать чёткие правила использования.

---

### 4. Отсутствие светлой темы
**Проблема:** Приложение жёстко привязано к тёмной теме.

**Текущее состояние:**
- Все цвета определены только для dark mode
- Нет переключателя темы
- Нет CSS variables для light mode

**Рекомендация:** Если планируется поддержка светлой темы, необходимо:
1. Создать CSS variables для обеих тем
2. Добавить переключатель темы
3. Обновить все компоненты для поддержки обеих тем

---

### 5. Hardcoded colors в компонентах
**Проблема:** Многие цвета прописаны напрямую в компонентах вместо использования переменных.

**Примеры:**
```typescript
// WorkflowCanvas.tsx
const COLORS = {
  stateInitial: '#6366f1',
  stateFinal: '#64748b',
  // ...
};

// EntityList.tsx
className="bg-teal-500/10 hover:bg-teal-500/20"
```

**Рекомендация:** Вынести все цвета в централизованную конфигурацию.

---

### 6. Несогласованность градиентов
**Проблема:** Градиенты используются по-разному в разных компонентах.

**Примеры:**
- Cards: `bg-gradient-to-br from-slate-800 to-slate-800/50`
- Canvas buttons: `linear-gradient(135deg, rgb(20, 184, 166) 0%, rgb(13, 132, 132) 100%)`
- Control panel: `linear-gradient(135deg, rgb(99, 102, 241) 0%, rgb(79, 70, 229) 100%)`

**Рекомендация:** Создать набор переиспользуемых градиентов.

---

## 🔧 Рекомендации по улучшению

### 1. Создать централизованную систему дизайна
```typescript
// theme.config.ts
export const theme = {
  colors: {
    primary: '#0D8484',
    secondary: '#2e8861',
    background: {
      main: '#110F1B',
      elevated: '#1D1C2C',
      input: '#222337',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#C0C0C0',
      tertiary: '#9F9F9F',
    },
    // ...
  },
  gradients: {
    card: 'linear-gradient(to bottom right, #1e293b, rgba(30, 41, 59, 0.5))',
    button: 'linear-gradient(135deg, #14b8a6, #0D8484)',
    // ...
  },
};
```

### 2. Унифицировать подход к стилизации
- **Tailwind:** Для utility-классов и layout
- **CSS Variables:** Для темизации
- **Styled Components / CSS Modules:** Для компонентной стилизации

### 3. Создать компонентную библиотеку
- Переиспользуемые кнопки с предустановленными стилями
- Карточки с единообразным дизайном
- Модальные окна с консистентной стилизацией

### 4. Документировать использование цветов
- Когда использовать teal vs purple vs orange
- Правила для hover states
- Правила для disabled states

---

## 📚 Справочная информация

### Файлы со стилями
- `src/styles/variables.scss` - SCSS переменные
- `src/styles/global.scss` - Глобальные стили
- `tailwind.config.js` - Конфигурация Tailwind
- `src/components/**/*.tsx` - Inline styles в компонентах

### Основные компоненты
- `EntityList.tsx` - Список сущностей (teal theme)
- `WorkflowList.tsx` - Список workflow (purple theme)
- `RequirementList.tsx` - Список требований (orange theme)
- `WorkflowCanvas.tsx` - Canvas для workflow (multi-theme)
- `ChatBubble.tsx` - Чат-пузыри (dark theme)

---

## 🎯 Быстрый справочник

### Основные цвета
| Название | Hex | Использование |
|----------|-----|---------------|
| Primary Teal | `#0D8484` | Основные кнопки, акценты |
| Secondary Green | `#2e8861` | Вторичные акценты |
| Background | `#110F1B` | Основной фон |
| Elevated BG | `#1D1C2C` | Попапы, модалы |
| Text Primary | `#FFFFFF` | Заголовки |
| Text Secondary | `#C0C0C0` | Обычный текст |
| Text Tertiary | `#9F9F9F` | Вторичный текст |

### Акцентные цвета по секциям
| Секция | Цвет | Hex |
|--------|------|-----|
| Entities | Teal | `#14b8a6` |
| Workflows | Purple | `#a855f7` |
| Requirements | Orange | `#fb923c` |
| Initial States | Pink | `#EC4899` |

### Tailwind классы
| Элемент | Классы |
|---------|--------|
| Main BG | `bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800` |
| Card BG | `bg-gradient-to-br from-slate-800 to-slate-800/50` |
| Border | `border-slate-700/50` |
| Text | `text-white`, `text-gray-400`, `text-gray-500` |

---

**Версия документа:** 1.0
**Дата создания:** 2026-01-19
**Автор:** AI Assistant (Augment Agent)


