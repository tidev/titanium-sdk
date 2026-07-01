# Implementation Plan: Item 18 - UINavigationController interactiveContentPopGestureRecognizer

This document outlines the technical implementation steps for integrating UIKit 26's enhanced back gesture capability into Titanium SDK navigation windows.

## 1. Overview
The goal is to allow developers to enable an interactive "pop" (back) gesture even in scenarios where the standard Navigation Bar back button might be hidden or customized, ensuring a more fluid user experience consistent with modern iOS apps.

**Target JS API:**
```javascript
var win = Ti.UI.createWindow({
  // new property
  enableInteractivePopGesture: true,
});
```

## 2. Technical Architecture

### A. Extension of `TiUINavigationWindowProxy`
The window proxy must be updated to expose this control parameter from JavaScript.

- **Files:**
  - `iphone/Classes/TiUINavigationWindowProxy.h` & `.m`
- **Properties to expose:**
  - `enableInteractivePopGesture` (Boolean)

### B. Extension of Native Internal Window Implementation
The logic for controlling the gesture resides within the native orchestration layer that manages navigation controllers.

- **Files:**
  - `iphone/Classes/TiUINavigationWindowInternal.h` & `.m`
- **Implementation Details:**
    - Mapping the JS property to the underlying `UINavigationController.interactivePopGestureRecognizer`.
    - Managing interaction conflicts if multiple gesture recognizers are present in a complex layout.

## 3. Implementation Steps

### Phase 1: Proxy Layer Integration
1. [ ] Add the declaration for `enableInteractivePopGesture` (Boolean) to `TiUINavigationWindowProxy.h/m`.

### Phase 2: Native Application Logic
1. [ ] In `TiUINavigationWindowInternal.m`, implement logic within `propertyChanged:...` that intercepts changes to this property.
2. [ ] Access the active navigation controller and set its `interactivePopGestureRecognizer.enabled` state according to the new value.

### Phase 3: Handling Edge Cases (e.g., Hidden Back Button)
1. [ ] Ensure that when `enableInteractivePopGesture` is true, it does not conflict with custom interactive elements or other gesture recognizers attached via Titanium modules.

### Phase 4: Verification
1. [ ] Create an integration test for a Window where the navigation back button is hidden (e.g., through styling) but `enableInteractivePopGesture` is set to true.
2. [ ] Verify that the interactive "swipe-from-edge" gesture successfully pops the view controller in the simulator.
