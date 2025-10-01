# Workflow Transition Visual Styles ✨

## Summary
Added **visual distinction** between manual and automatic transitions using dashed vs solid lines!

---

## 🎨 **Visual Styles**

### **Manual Transitions (Dashed)**
```
State A ┈┈┈┈┈┈┈┈┈▶ State B
        (dashed line)
```

**Characteristics:**
- 🎨 **Color**: Pink/Fuchsia gradient
- 📏 **Line**: Dashed (8px dash, 4px gap)
- 📊 **Width**: 2.5px
- 🎯 **Meaning**: Requires manual user action

**Use Cases:**
- User approval steps
- Manual review processes
- Explicit user decisions
- Confirmation actions

---

### **Automatic Transitions (Solid)**
```
State A ━━━━━━━━━▶ State B
        (solid line)
```

**Characteristics:**
- 🎨 **Color**: Lime/Emerald gradient
- 📏 **Line**: Solid (no dashes)
- 📊 **Width**: 3.5px (thicker)
- 🎯 **Meaning**: Executes automatically

**Use Cases:**
- Automated workflows
- System-triggered actions
- Conditional transitions
- Background processes

---

## 📋 **Visual Comparison**

### **Side-by-Side:**
```
Manual:     State A ┈┈┈┈┈┈┈┈┈▶ State B  (Pink, Dashed, 2.5px)
Automatic:  State A ━━━━━━━━━▶ State B  (Lime, Solid, 3.5px)
```

### **Color Palette:**

| Type | Light Mode | Dark Mode |
|------|------------|-----------|
| **Manual** | Pink (#ec4899) | Pink (#f472b6) |
| **Automatic** | Lime (#84cc16) | Lime (#a3e635) |
| **Selected Manual** | Pink (#ec4899) | Pink (#f472b6) |
| **Selected Automatic** | Lime (#84cc16) | Lime (#a3e635) |

---

## 🎯 **Implementation Details**

### **CSS Properties:**

#### **Manual Transitions:**
```css
stroke: pink/fuchsia gradient
stroke-width: 2.5px
stroke-dasharray: 8 4  /* 8px dash, 4px gap */
transition: stroke 300ms, stroke-width 300ms, stroke-dasharray 300ms
```

#### **Automatic Transitions:**
```css
stroke: lime/emerald gradient
stroke-width: 3.5px
stroke-dasharray: none  /* solid line */
transition: stroke 300ms, stroke-width 300ms, stroke-dasharray 300ms
```

---

## 💡 **Why This Design?**

### **1. Industry Standard**
- ✅ **UML Diagrams** - Use dashed lines for optional/manual flows
- ✅ **BPMN** - Use dashed lines for message flows
- ✅ **Flowcharts** - Use dashed lines for manual processes
- ✅ **Familiar** - Users recognize the pattern

### **2. Visual Hierarchy**
- ✅ **Automatic = Thicker** - More prominent (main flow)
- ✅ **Manual = Thinner** - Secondary (user intervention)
- ✅ **Clear distinction** - Easy to spot at a glance
- ✅ **Color coding** - Reinforces the difference

### **3. Accessibility**
- ✅ **Not color-only** - Line style provides additional cue
- ✅ **High contrast** - Works in light/dark mode
- ✅ **Clear patterns** - Dashed vs solid is obvious
- ✅ **Consistent** - Same pattern throughout

---

## 🔍 **Examples**

### **Example 1: Order Processing**
```
┌─────────────┐
│   Initial   │
└──────┬──────┘
       │ (automatic, solid, lime)
       ▼
┌─────────────┐
│   Process   │
│   Payment   │
└──────┬──────┘
       │ (automatic, solid, lime)
       ▼
┌─────────────┐
│   Approve   │
│   Order     │
└──────┬──────┘
       ┊ (manual, dashed, pink)
       ▼
┌─────────────┐
│   Fulfill   │
└─────────────┘
```

**Interpretation:**
- Initial → Process Payment: **Automatic** (system processes)
- Process Payment → Approve Order: **Automatic** (system validates)
- Approve Order → Fulfill: **Manual** (user approves)

---

### **Example 2: Payment Retry Loop**
```
┌─────────────┐
│   Process   │
│   Payment   │
└──────┬──────┘
       │ (automatic, solid, lime)
       ▼
┌─────────────┐
│   Payment   │
│   Failed    │
└──────┬──────┘
       ┊ (manual, dashed, pink)
       ▼
┌─────────────┐
│   Retry     │
│   Payment   │
└──────┬──────┘
       │ (automatic, solid, lime)
       ▼
   (back to Process Payment)
```

**Interpretation:**
- Process Payment → Payment Failed: **Automatic** (system detects failure)
- Payment Failed → Retry Payment: **Manual** (user decides to retry)
- Retry Payment → Process Payment: **Automatic** (system retries)

---

## 🎨 **Label Styling**

### **Manual Transition Labels:**
```
┌────────────────────────────────┐
│  🎀 Approve Order              │  ← Pink gradient background
│  (manual transition name)      │     Pink border
└────────────────────────────────┘     Dashed line
```

### **Automatic Transition Labels:**
```
┌────────────────────────────────┐
│  ⚡ Process Payment            │  ← Lime gradient background
│  (automatic transition name)   │     Lime border
└────────────────────────────────┘     Solid line
```

---

## 📝 **JSON Configuration**

### **Manual Transition:**
```json
{
  "name": "approve_order",
  "next": "fulfill_order",
  "manual": true  ← Renders as dashed pink line
}
```

### **Automatic Transition:**
```json
{
  "name": "process_payment",
  "next": "payment_complete",
  "manual": false  ← Renders as solid lime line
}
```

---

## 🚀 **Benefits**

| Benefit | Description |
|---------|-------------|
| **Quick identification** | Spot manual steps at a glance |
| **Visual hierarchy** | Automatic flows stand out (thicker) |
| **Industry standard** | Familiar pattern for users |
| **Accessibility** | Not relying on color alone |
| **Professional** | Polished, modern appearance |
| **Clear workflow** | Understand flow without reading labels |

---

## 🎯 **Use Cases**

### **When to Use Manual (Dashed):**
- ✅ User approval required
- ✅ Manual review step
- ✅ Explicit user decision
- ✅ Confirmation needed
- ✅ Human intervention

### **When to Use Automatic (Solid):**
- ✅ System-triggered
- ✅ Conditional logic
- ✅ Background processing
- ✅ Automated validation
- ✅ No user action needed

---

## 📊 **Visual Legend**

```
Legend:
━━━━━▶  Automatic transition (solid, lime, 3.5px)
┈┈┈┈┈▶  Manual transition (dashed, pink, 2.5px)

Colors:
🟢 Lime/Emerald = Automatic
🌸 Pink/Fuchsia = Manual
```

---

## 🌟 **Result**

**Your workflow canvas now has clear visual distinction!**

- 📏 **Dashed lines** - Manual transitions (pink)
- 📏 **Solid lines** - Automatic transitions (lime)
- 📊 **Different widths** - Automatic thicker (3.5px vs 2.5px)
- 🎨 **Color coded** - Pink vs Lime
- ✨ **Smooth transitions** - Animated changes
- 🎯 **Industry standard** - Familiar pattern
- ♿ **Accessible** - Multiple visual cues

**Understand your workflow at a glance!** 🎉✨

