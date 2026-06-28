# Implementation Plan: Item 7 - UIGlassEffect & UIColorEffect (Liquid Glass)

This document outlines the technical implementation steps for integrating UIKit 26's Liquid Glass effects into Titanium SDK.

## 1. Overview
The goal is to provide high-fidelity glass and color-based visual effects through a new `Ti.UI.iOS` factory system, enhancing existing blur views with advanced materials.

**Target JS API:**
```javascript
var glassView = Ti.UI.iOS.createBlurView({
  effect: Ti.UI.iOS.createGlassEffect({
    style: 'regular', // 'regular' | 'clear'
    tintColor: '#ffffff80',
    isInteractive: true,
  })
});

var colorEffectView = Ti.UI.iOS.createBlurView({
  effect: Ti.UI.iOS.createColorEffect({
    color: '#ffffff',
  })
});
```

## 2. Technical Architecture

### A. New Proxy Classes for Effects
Since effects are configuration objects, we need specialized proxies to pass their parameters across the bridge.

- **Files:**
  - `iphone/Classes/TiUIiOSGlassEffectProxy.h` (NEW)
  - `iphone/Classes/TiUIiOSGlassEffectProxy.m` (NEW)
  - `iphone/Classes/TiUIiOSColorEffectProxy.h` (NEW)
  - `iphone/Classes/TiUIiOSColorEffectProxy.m` (NEW)

### B. Extension of `TiUIiOSBlurView`
The existing blur view must be updated to accept these new effect objects instead of just simple styles or colors.

- **Files:**
  - `iphone/Classes/TiUIiOSBlurView.h` & `.m`: Update the property handling for 'effect'.

### C. Factory Methods in `TiUIiOSProxy`
New methods are required to instantiate these proxies from JavaScript.

- **Files:**
  - `iphone/Classes/TiUIiOSProxy.h` & `.m`
- **New Methods:**
  - `- (id)createGlassEffect:(id)args;`
  - `- (id)createColorEffect:(id)args;`

## 3. Implementation Steps

### Phase 1: Effect Proxies
1. [ ] Create `TiUIiOSGlassEffectProxy`. Implement properties for `style`, `tintColor`, and `isInteractive`.
2. [ ] Create `TiUIiOSColorEffectProxy`. Implement property for `color`.

### Phase 2: Factory Integration
1. [ ] Update `TiUIiOSProxy` to include the new factory methods in both header and implementation.

### Phase 3: Native Implementation (Blur View)
1. [ ] In `TiUIiOSBlurView.m`, implement logic within `propertyChanged:...` for 'effect'.
2. [ ] Extract native effects from the proxy objects (`UIGlassEffect` or `UIColorEffect`).
3. [ ] Apply these to a `UIVisualEffectView`.

### Phase 4: Verification
1. [ ] Create integration tests using snapshots of glass-styled views under different light/color conditions.
2. [ ] Verify that transparency and interaction (for interactive glass) work correctly in the simulator.
