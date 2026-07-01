# Implementation Plan: Item 20 - UITextField/TextView Range-Based Methods (Natural Selection)

This document outlines the technical implementation steps for integrating UIKit 26's advanced text range selection and management into Titanium SDK input components.

## 1. Overview
The goal is to provide more precise control over multiple selections and ranges in text inputs, supporting modern "natural selection" behaviors found in iOS 26 (e.g., selecting non-contiguous blocks of text).

**Target JS API:**
```javascript
var textField = Ti.UI.createTextField({
  // Natural Selection support is automatically enabled when range features are used
});

// Accessing multiple selected ranges via property
var ranges = textField.selectedRanges; // Returns Array: [{start, length}, ...]
```

## 2. Technical Architecture

### A. Extension of `TiUITextWidget` (Base Class)
Since both TextFields and TextAreas share text input logic in Titanium iOS, we will implement the core range-based delegate methods at their shared base class level.

- **Files:**
  - `iphone/Classes/TiUITextWidget.h` & `.m`

### B. Extension of Component Proxies
The proxies for specific components must expose these new properties and handle selection updates from JS to Native.

- **Files:**
  - `iphone/Classes/TiUITextFieldProxy.h` & `.m`
  - `iphone/Classes/TiUITextAreaProxy.h` & `.m`

## 3. Implementation Steps

### Phase 1: Base Class (Text Widget) Enhancement
1. [ ] Update the native `TiUITextWidget` to implement the advanced UIKit delegate methods for handling multiple ranges (`shouldChangeTextInRanges:`).
2. [ ] Implement logic to bridge these multi-range events back to Titanium's standard event system where appropriate, or provide specialized range change events.

### Phase 2: Proxy & Property Mapping
1. [ ] Update `TiUITextFieldProxy` and `TiUITextAreaProxy` with the new read-only property `selectedRanges`.
2. [ ] Implement logic in both proxies to sync the native selection state (potentially an array of ranges) back to JavaScript whenever a change occurs on the device.

### Phase 3: Selection Logic Implementation
1. [ ] Ensure that when JS sets/modifies selected ranges, it correctly updates the underlying `UITextInput` protocol implementation on the native side for all supported text components.

### Phase 4: Verification
1. [ ] Create integration tests involving multiple selection operations (e.g., selecting two separate words).
2. [ ] Verify that JS receives an accurate array of range objects representing the current state of the input field/area.
