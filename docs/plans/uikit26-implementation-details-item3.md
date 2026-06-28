# Implementation Plan: Item 3 - UIScrollView Edge Effects & Scroll Edge Customization

This document outlines the technical implementation steps for integrating UIKit 26's `UIScrollEdgeEffect` and interaction capabilities into the Titanium SDK.

## 1. Overview
The goal is to allow developers to customize the visual style of scroll edge effects (like rubber-banding or new Liquid Glass styles) and support custom container interactions within a `Ti.UI.ScrollView`.

**Target JS API:**
```javascript
var scrollView = Ti.UI.createScrollView({
  // new properties
  topEdgeEffectStyle: 'soft', // 'soft' | 'hard' | 'automatic'
  bottomEdgeEffectStyle: 'soft',
});
```

## 2. Technical Architecture

### A. Extension of `TiUIScrollViewProxy`
The proxy must be updated to accept the new style properties from JavaScript and propagate them to the native layer.

- **Files:**
  - `iphone/Classes/TiUIScrollViewProxy.h` & `.m`
- **Properties to expose:**
  - `topEdgeEffectStyle` (String: `'soft'`, `'hard'`, `'automatic'`)
  - `bottomEdgeEffectStyle` (String: `'soft'`, `'hard'`, `'automatic'`)

### B. Extension of `TiUIScrollView` (Native)
The native view class must implement the logic to apply these styles to the underlying UIKit component and handle container interactions.

- **Files:**
  - `iphone/Classes/TiUIScrollView.h` & `.m`
- **Implementation Details:**
    - Map JS strings to the appropriate `UIScrollEdgeEffectStyle` (or equivalent UIKit 26 enum).
    - Apply these settings to the internal `UIScrollView`.
    - Support `UIScrollEdgeElementContainerInteraction` for advanced layout scenarios.

## 3. Implementation Steps

### Phase 1: The Proxy Layer
1. [ ] Update `TiUIScrollViewProxy.h` with property declarations for `topEdgeEffectStyle` and `bottomEdgeEffectStyle`.
2. [ ] Implement the corresponding getter/setter logic in `TiUIScrollViewProxy.m`.

### Phase 2: Native Property Application
1. [ ] Update `TiUIScrollView.m`:
    - In `propertyChanged:...`, intercept changes to `topEdgeEffectStyle` and `bottomEdgeEffectStyle`.
    - Convert the incoming string/value into the native UIKit constant.
    - Apply it directly to the underlying scroll view's edge effect configuration.

### Phase 3: Container Interaction Support (Advanced)
1. [ ] Implement support for `UIScrollEdgeElementContainerInteraction` within `TiUIScrollView`. This allows custom container views to participate in the new UIKit 26 scrolling behavior.
2. [ ] Ensure that when a view is added as a subview, it correctly respects the scroll edge constraints if specified.

### Phase 4: Verification
1. [ ] Create an integration test that instantiates a `TiUIScrollView` with different styles (`soft`, `hard`).
2. [ ] Verify (via snapshot/visual inspection) that the scrolling behavior at edges matches the requested style.

## 4. Risks & Mitigations
- **Risk:** Edge effect implementation might conflict with existing "bounce" behaviors in older iOS versions.
- **Mitigation:** Use `#available(iOS 26, *)` checks and provide a fallback (default 'automatic' behavior) for older OS versions to ensure backward compatibility.
