# Implementation Plan: Item 12 - UINavigationBarAppearance Subtitle & Prominent

This document outlines the technical implementation steps for integrating UIKit 26's advanced navigation bar appearance settings into Titanium SDK.

## 1. Overview
The goal is to allow developers to customize text attributes and button styles within the Navigation Bar, specifically targeting subtitles and prominent buttons through a window-level configuration object.

**Target JS API:**
```javascript
var win = Ti.UI.createWindow({
  navBarAppearance: {
    subtitleTextAttributes: {
      fontSize: 12,
      fontColor: '#888888',
      fontFamily: 'Helvetica',
    },
    prominentButtonAppearance: {
      normal: {
        titleColor: '#ffffff',
        titleAttributes: { fontSize: 16 },
      }
    }
  }
});
```

## 2. Technical Architecture

### A. Extension of `TiUINavigationWindowProxy`
Since navigation appearance is managed through the window's context, we will extend the Window Proxy to hold these complex configuration objects.

- **Files:**
  - `iphone/Classes/TiUINavigationWindowProxy.h` & `.m`
- **Properties to expose:**
  - `navBarAppearance` (Object: containing nested attributes for subtitle and buttons)

### B. Extension of Native Window Implementation
The internal window class must intercept these configuration changes and apply them to the underlying `UINavigationBar`.

- **Files:**
  - `iphone/Classes/TiUINavigationWindowInternal.h` & `.m`
- **Implementation Details:**
    - Mapping nested JS attributes (like `subtitleTextAttributes`) to UIKit's `UINavigationBarAppearance` properties (`subtitleTextAttributes`).
    - Applying the new prominent button appearance settings provided by UIKit 26.

## 3. Implementation Steps

### Phase 1: Proxy Layer
1. [ ] Update `TiUINavigationWindowProxy` with a property for `navBarAppearance`.

### Phase 2: Native Integration (Internal Window)
1. [ ] In `TiUINavigationWindowInternal.m`, implement the logic to handle changes in the appearance configuration object.
2. [ ] Map attributes from the proxy nested objects into actual UIKit types (e.g., mapping font family and size strings/numbers to `UIFont`).

### Phase 3: Appearance Application
1. [ ] Ensure that when properties are updated, a new `UINavigationBarAppearance` instance is configured and assigned to the window's navigation bar via `setAppearance:for:`.

### Phase 4: Verification
1. [ ] Create an integration test with a Window containing specifically styled subtitles in its Navigation Bar.
2. [ ] Verify visual appearance using snapshots, ensuring both subtitle text and prominent button styles are correctly applied.
