# 🎨 Celeb Selfie - Design Reference Guide

## Visual Design Patterns & Examples

This document provides specific design patterns, code examples, and visual guidelines for implementing the design enhancements.

---

## 🎨 Color Usage Guidelines

### Primary Actions (CTA)
```css
/* Main CTA Button */
.btn-primary {
  background: linear-gradient(135deg, #f79533 0%, #f37055 50%, #ef4e7b 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(239, 78, 123, 0.25);
}

.btn-primary:hover {
  box-shadow: 0 6px 24px rgba(239, 78, 123, 0.35);
  transform: translateY(-2px);
}
```

### Success States
```css
.success-badge {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
```

### Error States
```css
.error-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
```

### Warning States
```css
.warning-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
```

---

## 🔘 Button Variants

### Primary Button (Main CTA)
```tsx
<button className="btn-primary">
  <span className="text-2xl mr-2">✨</span>
  Generate Selfie
</button>
```

**Visual Specs**:
- Padding: `1rem 2.5rem`
- Border Radius: `1rem`
- Font Weight: `600`
- Gradient Background: Orange → Coral → Pink
- Shadow: `0 4px 16px rgba(239, 78, 123, 0.25)`
- Hover: Lift `-2px`, increase shadow

### Secondary Button
```tsx
<button className="btn-secondary">
  Cancel
</button>
```

**Visual Specs**:
- Background: `rgba(255, 255, 255, 0.08)`
- Border: `1px solid rgba(255, 255, 255, 0.15)`
- Backdrop Filter: `blur(40px)`
- Hover: Increase opacity to `0.12`

### Ghost Button
```tsx
<button className="btn-ghost">
  Skip
</button>
```

**Visual Specs**:
- Background: `transparent`
- Border: `1.5px solid rgba(255, 255, 255, 0.25)`
- Hover: Border opacity `0.4`, subtle background

### Icon Button
```tsx
<button className="btn-icon" aria-label="Close">
  <svg className="w-6 h-6">...</svg>
</button>
```

**Visual Specs**:
- Size: `44x44px` minimum (touch target)
- Padding: `0.75rem`
- Border Radius: `0.5rem`
- Hover: Background `rgba(255, 255, 255, 0.1)`

---

## 📦 Card Components

### Standard Card
```tsx
<div className="card p-6">
  {/* Content */}
</div>
```

**Visual Specs**:
- Background: `rgba(255, 255, 255, 0.05)`
- Backdrop Filter: `blur(60px)`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Border Radius: `1.5rem`
- Shadow: `0 20px 60px rgba(0, 0, 0, 0.3)`
- Hover: Lift `-4px`, border opacity `0.2`

### Elevated Card (Modals)
```tsx
<div className="card card-elevated p-8">
  {/* Content */}
</div>
```

**Visual Specs**:
- Same as standard card
- Shadow: `0 30px 80px rgba(0, 0, 0, 0.4)`
- Border: `1px solid rgba(255, 255, 255, 0.15)`

### Interactive Card (Clickable)
```tsx
<button className="card card-interactive p-4">
  {/* Content */}
</button>
```

**Visual Specs**:
- Same as standard card
- Cursor: `pointer`
- Active: Scale `0.98`
- Focus: Ring `0 0 0 3px rgba(239, 78, 123, 0.5)`

---

## 🔍 Search Bar Component

### Design Pattern
```tsx
<div className="relative">
  <div className="absolute left-4 top-1/2 -translate-y-1/2">
    <svg className="w-5 h-5 text-white/40">...</svg>
  </div>
  <input
    type="text"
    placeholder="Search celebrities..."
    className="input pl-12 pr-12"
  />
  {searchQuery && (
    <button
      className="absolute right-4 top-1/2 -translate-y-1/2"
      onClick={clearSearch}
      aria-label="Clear search"
    >
      <svg className="w-5 h-5 text-white/40">...</svg>
    </button>
  )}
</div>
```

**Visual Specs**:
- Height: `3rem` (48px)
- Padding: `1rem 1.5rem` (with icon padding)
- Border Radius: `1rem`
- Background: `rgba(255, 255, 255, 0.05)`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Focus: Border color `rgba(255, 255, 255, 0.3)`, ring `rgba(239, 78, 123, 0.5)`

---

## 🏷️ Category Filter Tabs

### Design Pattern
```tsx
<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
  {categories.map((category) => (
    <button
      key={category}
      className={`
        px-4 py-2 rounded-full text-sm font-semibold
        transition-all whitespace-nowrap
        ${activeCategory === category
          ? 'bg-gradient-to-r from-brand-orange to-brand-pink text-white'
          : 'bg-white/5 text-white/60 hover:bg-white/10'
        }
      `}
    >
      {category}
    </button>
  ))}
</div>
```

**Visual Specs**:
- Padding: `0.5rem 1rem`
- Border Radius: `9999px` (pill shape)
- Active: Gradient background, white text
- Inactive: `rgba(255, 255, 255, 0.05)`, `rgba(255, 255, 255, 0.6)` text
- Hover: Background `rgba(255, 255, 255, 0.1)`

---

## 📊 Progress Indicator

### Multi-Stage Progress
```tsx
<div className="space-y-6">
  {/* Stage Indicators */}
  <div className="flex items-center justify-between">
    {stages.map((stage, index) => (
      <div key={stage.id} className="flex items-center flex-1">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${stage.completed
            ? 'bg-gradient-to-r from-brand-orange to-brand-pink'
            : stage.active
            ? 'border-2 border-brand-pink animate-pulse'
            : 'border-2 border-white/20'
          }
        `}>
          {stage.completed ? (
            <svg className="w-5 h-5 text-white">✓</svg>
          ) : (
            <span className="text-white/60">{index + 1}</span>
          )}
        </div>
        {index < stages.length - 1 && (
          <div className={`
            flex-1 h-0.5 mx-2
            ${stage.completed ? 'bg-gradient-to-r from-brand-orange to-brand-pink' : 'bg-white/20'}
          `} />
        )}
      </div>
    ))}
  </div>

  {/* Progress Bar */}
  <div className="progress-bar">
    <div
      className="progress-fill"
      style={{ width: `${progress}%` }}
    />
  </div>
</div>
```

**Visual Specs**:
- Stage Circle: `2.5rem` (40px)
- Progress Bar Height: `0.5rem` (8px)
- Gradient: Orange → Pink → Blue
- Animation: Smooth transition, pulse on active

---

## 🎉 Result Display

### Success Header
```tsx
<div className="text-center mb-8">
  <div className="text-6xl mb-4 animate-bounce">🎉</div>
  <h1 className="text-4xl sm:text-5xl font-black text-gradient mb-3">
    Your Celeb Selfie!
  </h1>
  <p className="text-lg text-white/70">
    Created with <span className="font-bold text-gradient">{celebrityName}</span>
  </p>
</div>
```

### Action Buttons Row
```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <button className="btn-primary flex-1 flex items-center justify-center gap-2">
    <svg className="w-5 h-5">...</svg>
    Download Image
  </button>
  <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
    <svg className="w-5 h-5">...</svg>
    Share
  </button>
  <button className="btn-ghost flex items-center justify-center gap-2">
    <svg className="w-5 h-5">...</svg>
    Try Another
  </button>
</div>
```

---

## 🔔 Toast Notifications

### Design Pattern
```tsx
<div className={`
  fixed bottom-4 right-4 z-50
  card p-4 min-w-[300px] max-w-[400px]
  slide-up
  ${type === 'success' ? 'border-l-4 border-green-500' : ''}
  ${type === 'error' ? 'border-l-4 border-red-500' : ''}
`}>
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0">
      {type === 'success' && <CheckIcon />}
      {type === 'error' && <ErrorIcon />}
    </div>
    <div className="flex-1">
      <p className="font-semibold text-white">{title}</p>
      {message && <p className="text-sm text-white/60 mt-1">{message}</p>}
    </div>
    <button
      onClick={onClose}
      className="flex-shrink-0 text-white/40 hover:text-white"
      aria-label="Close"
    >
      <CloseIcon />
    </button>
  </div>
</div>
```

**Visual Specs**:
- Position: Fixed bottom-right
- Width: `300-400px`
- Padding: `1rem`
- Border Radius: `1rem`
- Animation: Slide up from bottom
- Auto-dismiss: 5 seconds

---

## 🎭 Loading States

### Skeleton Loader
```tsx
<div className="skeleton w-full h-48 rounded-2xl">
  <div className="shimmer" />
</div>
```

**CSS**:
```css
.skeleton {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: shimmer 2s infinite;
  transform: translateX(-100%);
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Spinner
```tsx
<div className="spinner w-8 h-8"></div>
```

**CSS**:
```css
.spinner {
  border-radius: 9999px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ef4e7b;
  animation: spin 1s linear infinite;
}
```

---

## 📱 Mobile-Specific Patterns

### Bottom Sheet Modal
```tsx
<div className={`
  fixed inset-x-0 bottom-0 z-50
  card rounded-t-3xl p-6
  ${isOpen ? 'translate-y-0' : 'translate-y-full'}
  transition-transform duration-300
`}>
  {/* Content */}
</div>
```

**Visual Specs**:
- Border Radius Top: `1.5rem`
- Padding: `1.5rem`
- Max Height: `90vh`
- Backdrop: `rgba(0, 0, 0, 0.5)` with blur

### Swipeable Cards
```tsx
<div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
  <div className="flex gap-4">
    {items.map((item) => (
      <div
        key={item.id}
        className="flex-shrink-0 w-[85vw] snap-center"
      >
        {/* Card content */}
      </div>
    ))}
  </div>
</div>
```

---

## 🎨 Gradient Patterns

### Text Gradient
```css
.text-gradient {
  background: linear-gradient(
    135deg,
    #f79533 0%,
    #ef4e7b 25%,
    #a166ab 50%,
    #5073b8 75%,
    #07b39b 100%
  );
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 8s ease infinite;
}
```

### Border Gradient
```css
.gradient-border {
  position: relative;
  padding: 2px;
  border-radius: 1rem;
  background: linear-gradient(135deg, #f79533, #ef4e7b, #5073b8, #07b39b);
}

.gradient-border::before {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: calc(1rem - 2px);
  background: rgba(255, 255, 255, 0.05);
  z-index: -1;
}
```

### Background Gradient (Animated)
```css
.animated-gradient-bg {
  background: linear-gradient(
    135deg,
    #f79533 0%,
    #f37055 12.5%,
    #ef4e7b 25%,
    #a166ab 37.5%,
    #5073b8 50%,
    #1098ad 62.5%,
    #07b39b 75%,
    #6fba82 100%
  );
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
}
```

---

## ♿ Accessibility Patterns

### Focus Indicators
```css
.focus-ring {
  outline: none;
  box-shadow: 0 0 0 3px rgba(239, 78, 123, 0.5);
}

/* For reduced motion */
@media (prefers-reduced-motion: reduce) {
  .focus-ring {
    box-shadow: 0 0 0 2px rgba(239, 78, 123, 0.8);
  }
}
```

### Screen Reader Only
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Live Regions
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>
```

---

## 📐 Spacing Guidelines

### Component Spacing
- **Card Padding**: `1.5rem` (mobile), `2rem` (desktop)
- **Section Gap**: `2rem` (mobile), `3rem` (desktop)
- **Grid Gap**: `0.75rem` (mobile), `1rem` (desktop)
- **Button Padding**: `1rem 2.5rem` (primary), `0.75rem 1.5rem` (secondary)

### Typography Spacing
- **Heading Margin Bottom**: `1rem` (h1), `0.75rem` (h2), `0.5rem` (h3)
- **Paragraph Margin Bottom**: `1rem`
- **List Item Spacing**: `0.5rem`

---

## 🎬 Animation Timing

### Standard Timings
- **Micro-interactions**: `150ms` (hover, focus)
- **Transitions**: `300ms` (state changes)
- **Page Transitions**: `500ms` (route changes)
- **Loading Animations**: `1-2s` (looping)

### Easing Functions
- **Ease Out**: `cubic-bezier(0.4, 0, 0.2, 1)` (default)
- **Ease In Out**: `cubic-bezier(0.4, 0, 0.2, 1)` (smooth)
- **Bounce**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (playful)

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
/* Base: Mobile (< 640px) */
.component {
  padding: 1rem;
  font-size: 1rem;
}

/* Tablet (≥ 640px) */
@media (min-width: 640px) {
  .component {
    padding: 1.5rem;
    font-size: 1.125rem;
  }
}

/* Desktop (≥ 1024px) */
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
    font-size: 1.25rem;
  }
}
```

---

## 🎯 Component Composition Examples

### Search + Filter Combination
```tsx
<div className="space-y-4">
  <SearchBar
    value={searchQuery}
    onChange={setSearchQuery}
    placeholder="Search celebrities..."
  />
  <CategoryFilter
    categories={categories}
    activeCategory={activeCategory}
    onSelect={setActiveCategory}
  />
</div>
```

### Card with Actions
```tsx
<div className="card p-4">
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-sm text-white/60">{description}</p>
    </div>
    <button className="btn-icon" aria-label="More options">
      <MoreIcon />
    </button>
  </div>
  <div className="flex gap-2">
    <button className="btn-primary flex-1">Primary Action</button>
    <button className="btn-secondary">Secondary</button>
  </div>
</div>
```

---

## 🎨 Visual Hierarchy

### Importance Levels
1. **Primary**: Large, bold, gradient text, prominent buttons
2. **Secondary**: Medium size, regular weight, white text
3. **Tertiary**: Small size, muted color (`text-white/60`)

### Example Hierarchy
```tsx
<h1 className="text-4xl font-black text-gradient mb-2">
  Primary Heading
</h1>
<p className="text-lg text-white mb-4">
  Secondary description text
</p>
<p className="text-sm text-white/60">
  Tertiary helper text
</p>
```

---

**Last Updated**: 2024  
**Version**: 1.0
