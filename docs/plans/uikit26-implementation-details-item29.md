# Implementation Plan: Item 29 - UISearchTab automaticallyActivatesSearch

This document outlines the technical implementation steps for integrating automatic search activation into Titanium SDK's SearchBar/SearchBar integration features.

## 1. Overview
The goal is to allow developers to specify if a `Ti.UI.SearchBar` (when used in certain contexts like Tab bars or specific layouts) should automatically trigger its active state and show the keyboard upon appearing, improving UX for search-centric apps.

**Target JS API:**
```javascript
var searchBar = Ti.UI.createSearchBar({
  automaticallyActivatesSearch: true, // New feature support
});
```

## 2. Technical Architecture

### A. Extension of `TiUISearchBar` and its Proxy
The existing SearchBar module needs to be updated with this new property.

- **Files:**
  - `iphone/Classes/TiUISearchBarProxy.h` & `.m`: Add the boolean property.
  - `iphone/Classes/TiUISearchBar.h` & `.m`: Implement logic for auto-activation during view lifecycle events (e.g., `didMoveToWindow`).

## 3. Implementation Steps

### Phase 1: Proxy Layer Integration
1. [ ] Update `TiUISearchBarProxy` with the property declaration and getter/setter implementation.

### Phase 2: Native Activation Logic
1. [ ] In `TiUISearchBar.m`, monitor when the view becomes active or is added to a hierarchy that requires immediate search presence.
2. [ ] If `automaticallyActivatesSearch` is true, call native methods (like `becomeFirstResponder()`) on the internal `UISearchController/SearchBar`.

### Phase 3: Verification
1. [ ] Create an integration test where a SearchBar with auto-activation is added to a view hierarchy and verify that it gains focus automatically without user interaction.
