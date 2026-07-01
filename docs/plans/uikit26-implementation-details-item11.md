# Implementation Plan: Item 11 - UIColor HDR Support

This document outlines the technical implementation steps for integrating UIKit 26's High Dynamic Range (HDR) color support into Titanium SDK.

## 1. Overview
The goal is to allow developers to define and use high-exposure/high-dynamic range colors in their applications, enhancing visual quality on supported HDR displays.

**Target JS API:**
```javascript
var hdrColor = Ti.UI.createColor({
  type: 'hdr', // new color type
  red: 1.0,
  green: 0.5,
  blue: 0.0,
  alpha: 1.0,
  exposure: 2.0,           // HDR exposure value
});

var adjustedColor = hdrColor.applyingContentHeadroom(1.5);
```

## 2. Technical Architecture

### A. Extension of `TiColor` (TitaniumKit)
The core color class in the TitaniumKit package must be updated to support new construction methods and properties related to HDR.

- **Files:**
  - `iphone/TitaniumKit/TitaniumKit/Sources/API/TiColor.h` & `.m`

### B. Extension of Color Proxy (iOS side)
The bridge needs to pass the extra exposure parameters from JS to the native layer.

- **Files:**
  - The existing color proxy mechanism must be checked for support of these additional properties (`exposure`, `linearExposure`).

## 3. Implementation Steps

### Phase 1: Core Color Class (TitaniumKit)
1. [ ] Update `TiColor` in the Swift/ObjC package to include a new constructor or property setter for HDR parameters.
2. [ ] Implement internal logic for handling `exposure` and `linearExposure`.
3. [ ] Add support for the method `applyingContentHeadroom:`.

### Phase 2: Proxy & Bridge Integration
1. [ ] Ensure that when a color is created in JS with `type: 'hdr'`, it correctly populates the new properties on its proxy.
2. [ ] Verify these values are passed to the native TitaniumKit object during instantiation/update.

### Phase 3: Native Color Mapping (UIKit)
1. [ ] In the iOS-specific color handling, map the `exposure` parameters to UIKit's HDR initializers (`UIColor(red:green:blue:alpha:)` with appropriate exposure settings if available in modern APIs).

### Phase 4: Verification
1. [ ] Create an integration test that applies different HDR colors to various UI components (labels, views).
2. [ ] Verify visual output on a simulator/device capable of displaying high dynamic range content.
