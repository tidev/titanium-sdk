# Implementation Plan: Item 19 - UISheetPresentationController & UIPresentationController Background Effect

This document outlines the technical implementation steps for integrating UIKit 26's background effect capabilities into Titanium SDK modal presentations and sheets.

## 1. Overview
The goal is to allow developers to customize the visual "background" or "backdrop" of a presented sheet/modal, specifically through color effects that complement the new Liquid Glass design language.

**Target JS API:**
```javascript
var win = Ti.UI.createWindow();
win.open({
  modal: true,
  // new properties
  presentationStyle: 'formSheet',
  backgroundEffect: Ti.UI.iOS.createColorEffect({
    color: '#ffffffcc',
  }),
});
```

## 2. Technical Architecture

### A. Extension of `TiUIWindowProxy` (and/or Modal Controller)
Since presentation properties are often tied to how a window is opened or its current state, we will extend the Window Proxy to handle these settings during modal transitions.

- **Files:**
  - `iphone/Classes/TiUIWindowProxy.h` & `.m`

### B. Extension of Native Modal Presentation Logic
The native implementation responsible for managing presented controllers (likely in a dedicated class or within `TiUIWindow`) must be updated to apply these background effects.

- **Files:**
  - `iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIWindow.h` & `.m`
- **Implementation Details:**
    - Using the provided effect (e.g., a color or blur) and applying it to the presentation controller's background layer or using UIKit 26 direct APIs for sheet backgrounds if available.

## 3. Implementation Steps

### Phase 1: Proxy Layer Integration
1. [ ] Add support for `backgroundEffect` in the Window/Modal opening configuration within `TiUIWindowProxy`.

### Phase 2: Native Presentation Logic (TitaniumKit)
1. [ ] Update the native implementation of modal presentation logic to detect the presence of a background effect property.
2. [ ] If an effect is provided, configure the underlying `UISheetPresentationController` or `UIPresentationController`.

### Phase 3: Applying Visual Effects
1. [ ] Implement logic in the window/modal management code that takes the color/effect object from JS and applies it to the background view of the presented controller during its transition lifecycle.

### Phase 4: Verification
1. [ ] Create an integration test for a Window opening another component as a modal with specific `backgroundEffect` settings.
2. [ ] Verify visually (via snapshots) that the backdrop/sheet transparency and color match requirements.
