# Implementation Plan: Item 27 - UIImage.SymbolConfiguration (SF Symbols 7)

This document outlines the technical implementation steps for integrating advanced SF Symbol configuration and rendering capabilities into Titanium SDK's image handling modules.

## 1. Overview
The goal is to support enhanced symbol configurations, including gradient rendering and draw-effect animations, through `Ti.UI.ImageView`. This leverages the latest SF Symbols features in iOS 26.

**Target JS API:**
```javascript
var imageView = Ti.UI.createImageView({
  image: '/images/my_symbol.svg', // or system icon identifier
  symbolConfiguration: {
    scale: 'medium',
    weight: 'bold',
    palette: ['#ff0000', '#00ff00'], // support for multi-color palettes
    renderingMode: 'gradient'        // new gradient rendering mode
  }
});
```

## 2. Technical Architecture

### A. Extension of `TiUIImage` / `TiImageViewProxy`
The image/image view modules must be updated to recognize symbol configuration objects and pass them through the bridge.

- **Files:**
  - `iphone/Classes/TiUIImageView.h` & `.m`: Implement handling for symbols with configurations.
  - `iphone/Classes/TiUIImageViewProxy.h` & `.m`: Add property declaration for `symbolConfiguration`.

### B. Native Implementation (TitaniumKit or Classes)
The native implementation must translate the configuration object into a UIKit `UIImage.SymbolConfiguration`.

## 3. Implementation Steps

### Phase 1: Proxy and API Integration
1. [ ] Update `TiUIImageViewProxy` to support the new nested symbol configuration property.
2. [ ] Ensure that system icon identifiers are correctly identified as symbols in the bridge layer.

### Phase 2: Native Symbol Configuration Mapping
1. [ ] In `TiUIImageView.m`, implement logic to create a native `UIImage.SymbolConfiguration` from the proxy's values (scale, weight, palette).
2. [ ] Handle advanced rendering modes like 'gradient' by applying corresponding UIKit/CoreGraphics effects if direct support is not provided in simple configuration APIs.

### Phase 3: Verification
1. [ ] Create an integration test using various SF Symbols with different weights and palettes.
2. [ ] Verify visual correctness via snapshots, specifically checking for correct color application in multi-color symbols.
