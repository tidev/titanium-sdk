# Implementation Plan: Item 13 - UIContextMenuSystem (Context Menus)

This document outlines the technical implementation steps for integrating UIKit 26's modern `UIContextMenuInteraction` into Titanium SDK as a dedicated module.

## 1. Overview
The goal is to provide an elegant way to present context menus on any view, replacing or augmenting older popup/menu patterns with native iOS interaction.

**Target JS API:**
```javascript
var contextMenu = Ti.UI.iOS.createContextMenu({
  items: [
    { title: 'Copy', action: function() { /* ... */ } },
    { title: 'Share', action: function() { /* ... */ } },
  ],
  previewProvider: function() { return previewView; }
});
view.addInteraction(contextMenu);
```

## 2. Technical Architecture

### A. New Module: `TiUISearchController` (Wait, correction in plan - it should be Context Menu)
A new module is required to handle the interaction and presentation logic of context menus.

- **Files:**
  - `iphone/Classes/TiUIiOSContextMenu.h` (NEW)
  - `iphone/Classes/TiUIiOSContextMenu.m` (NEW)
  - `iphone/Classes/TiUIiOSContextMenuProxy.h` (NEW)
  - `iphone/Classes/TiUIiOSContextMenuProxy.m` (NEW)

### B. Interaction Integration
The module must implement the native `UIContextMenuInteractionDelegate` to coordinate with UIKit's system for presenting menus and previews.

## 3. Implementation Steps

### Phase 1: The Context Menu Module
1. [ ] Create `TiUIiOSContextMenu` and its corresponding Proxy class.
2. [ ] Implement logic in the proxy to handle menu items (title, action) and preview provider data.

### Phase 2: Interaction Attachment
1. [ ] Add a mechanism for views (`TiUIView`) or their proxies to accept an "interaction" object (like `addInteraction` in native UIKit).
2. [ ] Implement the attachment logic so that when a context menu is added, it creates/attaches a native `UIContextMenuInteraction`.

### Phase 3: Delegate Implementation
1. [ ] In `TiUIiOSContextMenu`, implement the delegate methods for providing the `UIContextMenuConfiguration` (including titles and actions).
2. [ ] Handle the preview provider callback by bridging from JS to create the requested view as a menu preview.

### Phase 4: Verification
1. [ ] Create an integration test that adds a context menu to a button/view.
2. [ ] Verify via manual or automated interaction (simulated long-press) that the correct items and previews are displayed.
