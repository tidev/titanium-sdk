# Implementation Plan: Item 4 - UINavigationItem Title/Subtitle & Large Title

This document outlines the technical implementation steps for integrating UIKit 26's advanced navigation title and subtitle features into the Titanium SDK.

## 1. Overview
The goal is to allow developers to manage more complex navigation bar layouts, specifically adding subtitles and managing search bar placement within a `Ti.UI.Window`.

**Target JS API:**
```javascript
var win = Ti.UI.createWindow({
  title: 'Main',
  // new properties
  subtitle: 'Section A',
  largeTitle: 'Main Title',
  // SearchBar Placement
  searchBarPlacement: 'integrated', // 'integrated' | 'integratedButton' | 'integratedCentered'
});
```

## 2. Technical Architecture

### A. Extension of `TiUINavigationWindowProxy`
The window proxy must handle the new navigation-related properties that affect the underlying `UINavigationItem`.

- **Files:**
  - `iphone/Classes/TiUINavigationWindowProxy.h` & `.m`
- **Properties to expose:**
  - `subtitle` (String)
  - `largeTitle` (String)
  - `searchBarPlacement` (Enum: `'integrated'`, `'integratedButton'`, `'integratedCentered'`)

### B. Extension of `TiUINavigationWindowInternal` (Native Implementation)
The native internal class is responsible for the actual coordination between the window and its navigation controller/item components.

- **Files:**
  - `iphone/Classes/TiUINavigationWindowInternal.h` & `.m`
- **Implementation Details:**
    - Mapping properties to a `UINavigationItem`.
    - Implementing logic for `subtitleView` (for advanced custom view support).
    - Managing the placement of the search bar based on the new enum values within the navigation hierarchy.

## 3. Implementation Steps

### Phase 1: The Proxy Layer
1. [ ] Update `TiUINavigationWindowProxy.h` with declarations for `subtitle`, `largeTitle`, and `searchBarPlacement`.
2. [ ] Implement property getters/setters in `TiUINavigationWindowProxy.m`.

### Phase 2: Native Property Application
1. [ ] Update `TiUINavigationWindowInternal.m`:
    - In `propertyChanged:...`, intercept changes for the new navigation properties.
    - Map strings to native UIKit constants (e.g., search bar placement enums).
    - Apply these settings to the current active `UINavigationItem`.

### Phase 3: Search Bar Placement Logic
1. [ ] Implement the logic within the internal window class to adjust how/where a subview (the search bar) is integrated into the navigation item's layout according to the new UIKit 26 placement options.

### Phase 4: Verification
1. [ ] Create an integration test that creates a Window with a specific `subtitle` and `largeTitle`.
2. [ ] Verify visually via snapshot that the subtitle appears correctly in the Navigation Bar.
3. [ ] Test different search bar placements to ensure they match UIKit's behavior.

## 4. Risks & Mitigations
- **Risk:** Conflicting property updates if multiple windows/tabs are present.
- **Mitigation:** Ensure properties are applied strictly to the active navigation context of the window being modified.
