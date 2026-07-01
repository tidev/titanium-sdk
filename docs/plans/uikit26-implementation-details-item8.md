# Implementation Plan: Item 8 - UITabBarController Bottom Accessory

This document outlines the technical implementation steps for integrating UIKit 26's `UITabAccessory` functionality into Titanium SDK via a new accessory system for tab groups.

## 1. Overview
The goal is to allow developers to attach custom floating toolbars or accessories above/on top of the TabBar, and manage how the TabBar behaves (minimizing on scroll).

**Target JS API:**
```javascript
var tabGroup = Ti.UI.createTabGroup({
  // new properties
  tabBarMinimizeBehavior: 'onScrollDown', // 'never' | 'onScrollDown' | 'onScrollUp'
});

// Floating Toolbar above TabBar
var accessory = Ti.UI.iOS.createTabAccessory({
  contentView: someView,
});
tabGroup.setBottomAccessory(accessory, true); // animated
```

## 2. Technical Architecture

### A. New Proxy Class: `TiUIiOSTabAccessoryProxy`
A dedicated proxy is needed to wrap the native accessory view/controller.

- **Files:**
  - `iphone/Classes/TiUIiOSTabAccessoryProxy.h` (NEW)
  - `iphone/Classes/TiUIiOSTabAccessoryProxy.m` (NEW)

### B. Extension of `TiUITabGroup` and its Proxy
The tab group module must be extended to handle the accessory attachment and minimization behavior.

- **Files:**
  - `iphone/Classes/TiUITabGroup.h` & `.m`: Implement logic for adding accessories and managing visibility.
  - `iphone/Classes/TiUITabGroupProxy.h` & `.m`: Expose properties like `tabBarMinimizeBehavior`.

### C. Factory Method in `TiUIiOSProxy`
To allow creation: `- (id)createTabAccessory:(id)args;`.

## 3. Implementation Steps

### Phase 1: The Accessory Proxy
1. [ ] Create `TiUIiOSTabAccessoryProxy.h/m` to wrap the accessory content view or controller.

### Phase 2: Tab Group Integration
1. [ ] Update `TiUITabGroupProxy` with property `tabBarMinimizeBehavior`.
2. [ ] Add method `- (void)setBottomAccessory:(id)accessory animated:(BOOL)animated;` to both the Proxy and the native class.

### Phase 3: Native Implementation (Tab Controller logic)
1. [ ] In `TiUITabGroup.m`, implement the attachment of the accessory using UIKit's `bottomAccessory` API or by adjusting layout guides/subviews if necessary for compatibility with current Titanium architecture.
2. [ ] Implement minimization behavior based on scroll events from the main content view.

### Phase 4: Verification
1. [ ] Create integration tests that attach a simple colored View as an accessory to a TabGroup.
2. [ ] Verify scrolling triggers minimize/maximize behaviors if configured.
