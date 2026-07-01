# Implementation Plan: Item 14 - UIMainMenuSystem (iPadOS Menu Bar)

This document outlines the technical implementation steps for integrating UIKit 26's `UIMainMenuSystem` into Titanium SDK, primarily targeting iPadOS users.

## 1. Overview
The goal is to allow developers to configure and build the system-wide menu bar on iPadOS through a singleton accessor in JavaScript.

**Target JS API:**
```javascript
var mainMenu = Ti.UI.iOS.getMainMenuSystem();
mainMenu.setBuildConfiguration({
  newScenePreference: 'removed', // 'automatic' | 'removed' | 'included'
  findingConfiguration: {
    style: 'search', // 'automatic' | 'find' | 'findAndReplace' | 'search'
  },
  menuBuilder: function(builder) {
    builder.remove('file');
  }
});
```

## 2. Technical Architecture

### A. New Proxy Class: `TiUIiOSMainMenuSystemProxy`
A singleton proxy is needed to manage the global state and configuration of the menu system.

- **Files:**
  - `iphone/Classes/TiUIiOSMainMenuSystemProxy.h` (NEW)
  - `iphone/Classes/TiUIiOSMainMenuSystemProxy.m` (NEW)

### B. Singleton Accessor in `TiUIiOSProxy`
The main menu system will be exposed as a singleton via the central iOS proxy.

- **Files:**
  - `iphone/Classes/TiUIiOSProxy.h` & `.m`: Add `- (id)getMainMenuSystem;`.

## 3. Implementation Steps

### Phase 1: The Main Menu Proxy
1. [ ] Create `TiUIiOSMainMenuSystemProxy.h/m`.
2. [ ] Implement properties for `newScenePreference`, `findingConfiguration` (nested), and the ability to hold a reference to the JS-side `menuBuilder` function.

### Phase 2: Singleton & Factory Integration
1. [ ] Update `TiUIiOSProxy` with the singleton accessor method.

### Phase 3: Native Implementation (`UIMenuBuilder`)
1. [ ] In the native implementation, use `UIMainMenuSystem.shared.setBuildConfiguration:` when requested by JS.
2. [ ] Implement a wrapper for the `menuBuilder` callback that allows executing JavaScript functions within the UIKit menu building context (using deferred elements if needed).

### Phase 4: Verification
1. [ ] Create an integration test on iPad simulator that modifies the system menu bar using Titanium code.
2. [ ] Verify via visual inspection/automated tool that menus are added or removed as specified.
