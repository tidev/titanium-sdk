# Implementation Plan: Item 26 - UIViewController Orientation Lock & Transition

This document outlines the technical implementation steps for integrating advanced orientation lock and transition management into Titanium SDK navigation.

## 1. Overview
The goal is to allow developers more precise control over how view controllers handle device orientation locks and transitions, especially when interacting with bar button items or specific layout triggers.

**Target JS API:**
```javascript
var win = Ti.UI.createWindow({
  // new property
  enableInteractivePopGesture: true, // (already covered in item 18?) - check for overlap
});

// Or a direct method on the controller/window context
controller.lockOrientation('landscape');
```

## 2. Technical Architecture

### A. Extension of `TiUINavigationWindowProxy` and Internal Implementation
Since orientation management is typically handled at the window or root navigation level, we will extend these layers to control the underlying `UIViewController`.

- **Files:**
  - `iphone/Classes/TiUINavigationWindowProxy.h` & `.m`
  - `iphone/Classes/TiUINavigationWindowInternal.h` & `.m`

## 3. Implementation Steps

### Phase 1: Orientation Control API
1. [ ] Update the navigation proxy to include orientation lock properties and methods (e.g., `orientationLock`).

### Phase 2: Native Controller Management
1. [ ] In `TiUINavigationWindowInternal`, implement logic that applies requested orientations to the active root view controller's `preferredInterfaceOrientationForPresentation` or similar UIKit APIs.
2. [ ] Handle transition coordination, ensuring orientation changes are smooth and don't break current UI state.

### Phase 3: Verification
1. [ ] Create an integration test with a Window that attempts to lock its orientation via JS code.
2. [ ] Verify (via simulator/device) that the app responds correctly to requested locks/unlocks.
