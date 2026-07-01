# Implementation Plan: Item 1 - UIBarButtonItem Badges & Styling

This document outlines the technical implementation steps for integrating UIKit 26's `UIBarButtonItem` badge and styling features into the Titanium SDK.

## 1. Overview
The goal is to allow developers to easily add badges (count, string, or indicator) and apply new Liquid Glass styling to `Ti.UI.Button` when used within a Navigation Bar.

**Target JS API:**
```javascript
var button = Ti.UI.createButton({
  title: 'Close',
  badge: Ti.UI.createBarButtonItemBadge({
    type: 'count', // 'count' | 'string' | 'indicator'
    value: 5,           // for type 'count'
    stringValue: 'NEW', // for type 'string'
    foregroundColor: '#fff',
    backgroundColor: '#e74c3c',
    font: { fontSize: 10 }
  }),
  sharesBackground: false,
  hidesSharedBackground: true,
  style: 'prominent',
});
```

## 2. Technical Architecture

### A. New Proxy Class: `TiUIiOSBarButtonItemBadgeProxy`
A new proxy class is required to represent the complex `badge` configuration object.

- **Files:**
  - `iphone/Classes/TiUIiOSBarButtonItemBadgeProxy.h`
  - `iphone/Classes/TiUIiOSBarButtonItemBadgeProxy.m`
- **Properties to expose:**
  - `type` (String: `'count'`, `'string'`, `'indicator'`)
  - `value` (Number/Integer)
  - `stringValue` (String)
  - `foregroundColor` (Color)
  - `backgroundColor` (Color)
  - `font` (Font object)

### B. Extension of `TiUINavBarButton`
The `TiUINavBarButton` (which inherits from `UIBarButtonItem`) must be updated to react to changes in the new properties.

- **Files:**
  - `iphone/Classes/TiUINavBarButton.h`
  - `iphone/Classes/TiUINavBarButton.m`
- **New Properties to handle in `propertyChanged:oldValue:newValue:proxy:`:**
  - `badge`: Receives `TiUIiOSBarButtonItemBadgeProxy`. Converts it to a native `UIBarButtonItemBadge` struct/object.
  - `sharesBackground`: Boolean.
  - `hidesSharedBackground`: Boolean.
  - `style`: String/Enum. Maps `'prominent'` to the new UIKit 26 style.

### C. Factory Method in `TiUIiOSProxy`
To allow creating the badge object via JS.

- **Files:**
  - `iphone/Classes/TiUIiOSProxy.h`
  - `iphone/Classes/TiUIiOSProxy.m`
- **New Method:** `- (id)createBarButtonItemBadge:(id)args;`

## 3. Implementation Steps

### Phase 1: The Proxy
1. [ ] Create `TiUIiOSBarButtonItemBadgeProxy.h` and `.m`.
2. [ ] Implement property mapping for `type`, `value`, `stringValue`, `foregroundColor`, `backgroundColor`, and `font`.
3. [ ] Add to `TiUIiOSProxy.h` as a supported factory-generated type (if needed, otherwise just ensure it can be instantiated).

### Phase 2: The Factory
1. [ ] Update `TiUIiOSProxy.h` to include `- (id)createBarButtonItemBadge:(id)args;`.
2. [ ] Update `TiUIiOSProxy.m` to implement `createBarButtonItemBadge:`. It should instantiate `TiUIiOSBarButtonItemBadgeProxy`.

### Phase 3: The Native Implementation
1. [ ] Update `TiUINavBarButton.h` to include declarations for `badge`, `sharesBackground`, `hidesSharedBackground`, and `style`.
2. [ ] Update `TiUINavBarButton.m`:
    - Implement `propertyChanged:oldValue:newValue:proxy:` for each new key.
    - **`badge` logic:**
        - Extract `type`, `value`, `stringValue`, `foregroundColor`, `backgroundColor`, `font` from the `TiUIiOSBarButtonItemBadgeProxy`.
        - Construct the native `UIBarButtonItemBadge`.
        - Apply it to `self.badge`.
    - **`sharesBackground` logic:** `self.sharesBackground = [TiUtils boolValue:newValue];`
    - **`hidesSharedBackground` logic:** `self.hidesSharedBackground = [TiUtils boolValue:newValue];`
    - **`style` logic:** If `newValue` is `'prominent'`, set `self.style = UIBarButtonItemStyleProminent;` (or equivalent UIKit 26 constant).

### Phase 4: Verification
1. [ ] Add a new integration test in `tests/Resources/` (or equivalent iOS test suite) that:
    - Creates a `Ti.UI.Button` with the new properties.
    - Adds it to a `Ti.UI.NavBar`.
    - Verifies (via snapshot or inspection) that the badge is visible and styled correctly.

## 4. Risks & Mitigations
- **Risk:** `UIBarButtonItem` API changes in iOS 26 might differ from assumed struct/object behavior.
- **Mitigation:** Verify exact UIKit 26 header definitions during implementation.
- **Risk:** `TiUINavBarButton` might be using a `customView`.
- **Mitigation:** Ensure `sharesBackground` and `hidesSharedBackground` are applied to the `UIBarButtonItem` itself, which UIKit uses to style the container/background.
