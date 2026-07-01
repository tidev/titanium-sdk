# Implementation Plan: Item 5 - UIView Corner Configuration

This document outlines the technical implementation steps for integrating UIKit 26's advanced corner configuration features into the Titanium SDK.

## 1. Overview
The goal is to provide a unified way to manage complex corner radii (uniform, per-edge, or adaptive container-concentric) via `Ti.UI.View`.

**Target JS API:**
```javascript
var view = Ti.UI.createView({
  // new properties
  cornerConfiguration: {
    type: 'corners', // 'corners' | 'capsule' | 'uniformEdges'
    radius: 26,              // for 'corners'
    topRadius: 52,           // for 'uniformEdges'
    bottomRadius: 26,        // for 'uniformEdges'
  }
});

// or container-concentric (display-adaptive)
var adaptiveView = Ti.UI.createView({
  cornerConfiguration: {
    type: 'containerConcentric'
  }
});
```

## 2. Technical Architecture

### A. New Proxy Class: `TiUIiOSCornerConfigurationProxy`
Since corner configuration is a multi-parameter object, we need a dedicated proxy to handle its lifecycle and properties.

- **Files:**
  - `iphone/Classes/TiUIiOSCornerConfigurationProxy.h` (NEW)
  - `iphone/Classes/TiUIiOSCornerConfigurationProxy.m` (NEW)
- **Properties to expose:**
  - `type` (String: `'corners'`, `'capsule'`, `'uniformEdges'`, `'containerConcentric'`)
  - `radius` (Number)
  - `topRadius` (Number)
  - `bottomRadius` (Number)

### B. Extension of `TiUIViewProxy` and `TiUIView`
The core view proxy and the native base class must be updated to support this new configuration object.

- **Files:**
  - `iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIViewProxy.h` & `.m`: Add property declaration for `cornerConfiguration`.
  - `iphone/TitaniumKit/TitaniumKit/Sources/API/TiUIView.h` & `.m`: Implement the native application of `UICornerConfiguration`.
  - `iphone/Classes/TiUIViewProxy.h` / `.m`: Handle the bridge between Titanium's view proxy and UIKit 26 corner logic.

### C. Factory Method in `TiUIiOSProxy`
To allow creation via JS: `- (id)createCornerConfiguration:(id)args;`.

## 3. Implementation Steps

### Phase 1: The Configuration Proxy
1. [ ] Create `TiUIiOSCornerConfigurationProxy.h` and `.m`.
2. [ ] Implement property mapping for all configuration parameters.

### Phase 2: Integration & Factory
1. [ ] Update `TiUIiOSProxy.h/m` to include the new factory method.
2. [ ] Extend `TiUIViewProxy` (and its TitaniumKit equivalent) to accept the `cornerConfiguration` object.

### Phase 3: Native Application Logic
1. [ ] In `TiUIView.m`, implement a method that converts the proxy data into a native `UICornerConfiguration`.
2. [ ] Handle 'containerConcentric' type by setting up appropriate layer/masking behavior or using UIKit 26 direct APIs if available for adaptive corners.

### Phase 4: Verification
1. [ ] Create integration tests with views having different corner types (Capsule, Uniform Edges).
2. [ ] Verify visually that `effectiveRadius` is correctly reported back to JS where applicable.
