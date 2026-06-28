# Implementation Plan: Item 9 - UISplitViewController Inspector Column

This document outlines the technical implementation steps for integrating UIKit 26's inspector column capabilities into Titanium SDK split views.

## 1. Overview
The goal is to provide advanced multi-column layout support (Master, Detail, and an optional Inspector) within a `Ti.UI.SplitWindow`.

**Target JS API:**
```javascript
var splitWindow = Ti.UI.iOS.createSplitWindow({
  masterView: masterWin,
  detailView: detailWin,
  // new properties
  preferredInspectorColumnWidth: 300,
  inspectorView: inspectorWin, // new column
});

// Events
splitWindow.addEventListener('didShowColumn', function(e) {
  Ti.API.info('Column shown: ' + e.column); // 'master' | 'detail' | 'inspector'
});
```

## 2. Technical Architecture

### A. Extension of `TiUIiOSSplitWindowProxy`
The proxy must handle the inspector column configuration and events.

- **Files:**
  - `iphone/Classes/TiUIiOSSplitWindowProxy.h` & `.m`
- **Properties to expose:**
  - `preferredInspectorColumnWidth` (Number)
  - `inspectorView` (Object / View Reference)

### B. Extension of Native Split Window Implementation
The native implementation must manage the three columns and delegate UIKit's inspector events back to Titanium.

- **Files:**
  - `iphone/Classes/TiUIiOSSplitWindow.h` & `.m`
- **Implementation Details:**
    - Mapping properties to `UISplitViewController`.
    - Handling column visibility changes through standard delegates (`didShowColumn`, etc.).
    - Exposing the current layout environment (traits) as a read-only property.

## 3. Implementation Steps

### Phase 1: Proxy & Factory Integration
1. [ ] Update `TiUIiOSSplitWindowProxy` with new properties and event listener support.
2. [ ] Ensure `inspectorView` can be passed correctly from JS to the proxy.

### Phase 2: Native Column Management
1. [ ] In `TiUIiOSSplitWindow.m`, implement logic for adding/removing the inspector column based on property updates.
2. [ ] Integrate with UIKit's layout environment so that changes in screen size or orientation correctly trigger column transitions.

### Phase 3: Event Delegation
1. [ ] Implement delegate methods to capture `UISplitViewController` state changes and fire corresponding Titanium events (`didShowColumn`, `didHideColumn`).

### Phase 4: Verification
1. [ ] Create an integration test that creates a SplitWindow with all three columns (Master, Detail, Inspector).
2. [ ] Verify column visibility via event listeners in JS.
