# Implementation Plan: Item 6 - UISearchBar & SearchController Extensions

This document outlines the technical implementation steps for integrating standalone `UISearchController` and enhanced `UISearchBar` features into the Titanium SDK.

## 1. Overview
The goal is to provide a more powerful search experience by introducing a dedicated `Ti.UI.SearchController` module, alongside enhancements to the existing `Ti.UI.SearchBar`.

**Target JS API:**
```javascript
// SearchBar extension
var searchBar = Ti.UI.createSearchBar({
  automaticallyActivatesSearch: true, // New feature
});

// NEW: Standalone SearchController
var searchController = Ti.UI.iOS.createSearchController({
  hidesNavigationBarDuringPresentation: false,
  searchBar: searchBar,
});
```

## 2. Technical Architecture

### A. New Module: `TiUISearchController`
A new standalone module is required to manage the lifecycle and presentation of a native `UISearchController`.

- **Files:**
  - `iphone/Classes/TiUISearchController.h` (NEW)
  - `iphone/Classes/TiUISearchController.m` (NEW)
  - `iphone/Classes/TiUISearchControllerProxy.h` (NEW)
  - `iphone/Classes/TiUISearchControllerProxy.m` (NEW)

### B. Extension of Existing Modules
1. **`TiUISearchBar`**: Update to support the new activation property.
2. **`TiUINavigationWindow`**: Extend to allow external search bar integration settings.

## 3. Implementation Steps

### Phase 1: The SearchController Module
1. [ ] Create `TiUISearchController` and its corresponding Proxy class.
2. [ ] Implement the native delegate methods for `UISearchController`.
3. [ ] Add factory method `- (id)createSearchController:(id)args;` to `TiUIiOSProxy`.

### Phase 2: SearchBar & Navigation Extensions
1. [ ] Update `TiUISearchBarProxy` with property `automaticallyActivatesSearch`.
2. [ ] Implement the logic in `TiUISearchBar.m` to toggle activation based on this property.
3. [ ] Extend `TiUINavigationWindowProxy` for search bar placement integration settings.

### Phase 3: Integration & Delegate Mapping
1. [ ] Ensure seamless communication between the standalone SearchController and its assigned SearchBar via the proxy layer.
2. [ ] Map essential delegate events (e.g., text changes, cancellation) to Titanium JS events.

### Phase 4: Verification
1. [ ] Create an integration test that presents a `TiUISearchController` modally/integrated.
2. [ ] Verify search bar interaction and lifecycle management via unit tests.
