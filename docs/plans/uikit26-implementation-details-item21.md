# Implementation Plan: Item 21 - AccessibilitySettings showBordersEnabled

This document outlines the technical implementation steps for integrating iOS's accessibility setting regarding border visibility within Titanium SDK.

## 1. Overview
The goal is to allow developers to react to changes in the system-wide "Show Borders" accessibility setting, which helps users with low vision see component boundaries more clearly.

**Target JS API:**
```javascript
// Listening for changes (event based)
view.addEventListener('showBordersEnabledStatusDidChange', function(e) {
  Ti.API.info('Accessibility borders enabled: ' + e.enabled);
});
```

## 2. Technical Architecture

### A. Integration via System Notification
This is a read-only system setting that notifies the application when it changes. We will hook into the appropriate UIKit/iOS notification center event.

- **Files:**
  - `iphone/Classes/TiUIView.h` & `.m`: To allow all views to receive this global event or handle its propagation if needed.
  - Relevant module responsible for accessibility settings (if any).

## 3. Implementation Steps

### Phase 1: Notification Hooking
1. [ ] Identify the exact UIKit notification/callback triggered by `showBordersEnabled` changes on iOS 26.
2. [ ] Implement a listener within Titanium's core view or window management layer that observes this system-wide change.

### Phase 2: Event Propagation
1. [ ] When the notification is received, propagate it as a custom event (`showBordersEnabledStatusDidChange`) through the Titanium event hierarchy so JS listeners can respond.

### Phase 3: Verification
1. [ ] Create an integration test that simulates (or manually toggles in simulator) the accessibility setting and verifies the presence of the corresponding JavaScript event trigger.
