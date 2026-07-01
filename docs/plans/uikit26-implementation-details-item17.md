# Implementation Plan: Item 17 - UIBarButtonItemGroup & Writing Tools

This document outlines the technical implementation steps for integrating UIKit 26's `UIBarButtonItemGroup` and system-wide writing tools into Titanium SDK navigation components.

## 1. Overview
The goal is to allow developers to group related bar buttons together in a Navigation Bar and provide access to advanced "Writing Tools" functionality through standard button items.

**Target JS API:**
```javascript
var buttonGroup = Ti.UI.iOS.createBarButtonItemGroup({
  items: [button1, button2],
});

// Accessing writing tools via system item
var writingToolsButton = Ti.UI.createButton({
  systemItem: 'writingTools', // new system item support
});
```

## 2. Technical Architecture

### A. New Proxy Class: `TiUIiOSBarButtonItemGroupProxy`
A specialized proxy is needed to manage the collection of buttons within a group and their associated configurations.

- **Files:**
  - `iphone/Classes/TiUIiOSBarButtonItemGroupProxy.h` (NEW)
  - `iphone/Classes/TiUIiOSBarButtonItemGroupProxy.m` (NEW)

### B. Extension of `TiUINavBarButton` and existing Button modules
1. **Group Management:** Extend the Navigation Bar implementation to accept groups instead of just individual buttons.
2. **Writing Tools Support:** Update button creation logic to recognize `'writingTools'` as a valid system item type.

## 3. Implementation Steps

### Phase 1: The Group Proxy
1. [ ] Create `TiUIiOSBarButtonItemGroupProxy` and its corresponding files.
2. [ ] Implement properties for managing the collection of items (buttons) within the group.

### Phase 2: Factory & Button Integration
1. [ ] Update `TiUIiOSProxy` with a factory method `- (id)createBarButtonItemGroup:(id)args;`.
2. [ ] Extend `TiUINavBarButton.m` to handle mapping for `systemItem == 'writingTools'` using the new UIKit 26 constants.

### Phase 3: Native Implementation of Groups
1. [ ] In the native Navigation Bar implementation, implement logic that uses `UIBarButtonItem.fixedSpace()` or specialized group-handling APIs from UIKit 26 to correctly position and manage grouped buttons.

### Phase 4: Verification
1. [ ] Create integration tests for both functionality sets (Grouped items vs Single writing tools button).
2. [ ] Verify visually in the simulator that groups are displayed with correct spacing/alignment as specified by the new UIKit APIs.
