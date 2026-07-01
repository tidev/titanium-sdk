# Implementation Plan: Item 2 - UIButton Liquid Glass Configuration

This document outlines the technical implementation steps for integrating UIKit 26's `UIButton.Configuration` (Liquid Glass styles) into the Titanium SDK.

## 1. Overview
The goal is to allow developers to apply advanced button configurations, specifically the new "Liquid Glass" visual styles and symbol transition effects, via JavaScript.

**Target JS API:**
```javascript
var button = Ti.UI.createButton({
  configuration: Ti.UI.iOS.createButtonConfiguration({
    style: 'glass', // 'glass' | 'clearGlass' | 'prominentGlass' | 'prominentClearGlass'
    symbolContentTransition: 'replace', // 'replace' | 'slide' | 'fade'
  })
});
```

## 2. Technical Architecture

### A. New Proxy Class: `TiUIiOSButtonConfigurationProxy`
Since the configuration is a complex object, we need a dedicated proxy to handle its properties and pass them to the native layer.

- **Files:**
  - `iphone/Classes/TiUIiOSButtonConfigurationProxy.h` (NEW)
  - `iphone/Classes/TiUIiOSButtonConfigurationProxy.m` (NEW)
- **Properties to expose:**
  - `style` (String: `'glass'`, `'clearGlass'`, `'prominentGlass'`, `'prominentClearGlass'`)
  - `symbolContentTransition` (String: `'replace'`, `'slide'`, `'fade'`)

### B. Extension of `TiUIButton` and its Proxy
The existing button module must be updated to accept this configuration object.

- **Files:**
  - `iphone/Classes/TiUIButtonProxy.h` & `.m`: Add the `configuration` property.
  - `iphone/Classes/TiUIButton.h` & `.m`: Implement logic to apply the native `UIButton.Configuration`.

### C. Factory Method in `TiUIiOSProxy`
To allow creation of the configuration object via JS.

- **Files:**
  - `iphone/Classes/TiUIiOSProxy.h` & `.m`
- **New Method:** `- (id)createButtonConfiguration:(id)args;`

## 3. Implementation Steps

### Phase 1: The Configuration Proxy
1. [ ] Create `TiUIiOSButtonConfigurationProxy.h` and `.m`.
2. [ ] Implement property mapping for `style` and `symbolContentTransition`.
3. [ ] Ensure the proxy correctly handles string-to-enum conversion (e.g., `'glass'` $\rightarrow$ `UIButtonConfigurationStyleGlass`).

### Phase 2: The Factory & Integration
1. [ ] Update `TiUIiOSProxy.h` to include `- (id)createButtonConfiguration:(id)args;`.
2. [ ] Implement the method in `TiUIiOSProxy.m` to return a new instance of `TiUIiOSButtonConfigurationProxy`.
3. [ ] Add the `configuration` property to `TiUIButtonProxy`.

### Phase 3: The Native Implementation (The "Heavy Lifting")
1. [ ] Update `TiUIButton.m`:
    - In `propertyChanged:...`, when `configuration` is set, extract values from the proxy.
    - Create/Update a native `UIButtonConfiguration` object based on these values.
    - Apply it to the button: `button.configuration = myConfig;`.
2. [ ] Ensure that updating the configuration via JS triggers an immediate visual update in UIKit.

### Phase 4: Verification
1. [ ] Add an integration test for a Button with different Glass styles.
2. [ ] Verify that symbol transitions work as expected when interacting with button icons.
