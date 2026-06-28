# Implementation Plan: Item 28 - UITextInputTraits allowsNumberPadPopover

This document outlines the technical implementation steps for integrating enhanced number pad popover behaviors into Titanium SDK text input components.

## 1. Overview
The goal is to provide support for iPadOS-specific behavior where a customized or improved number pad/keyboard popover can be presented, enhancing data entry workflows in specialized forms.

**Target JS API:**
```javascript
var textField = Ti.UI.createTextField({
  // new property in keyboard traits
  numberPadPopoverStyle: 'enhanced' // (or similar mapping)
});
```

## 2. Technical Architecture

### A. Extension of `UITextInputTraits` via Proxies
The text input components (`TiUITextField`, `TiUITextArea`) must be updated to handle this new trait through their existing proxy mechanisms.

- **Files:**
  - `iphone/Classes/TiUITextFieldProxy.h` & `.m`: Add property for the popover style within keyboard traits.
  - `iphone/Classes/TiUITextAreaProxy.h` & `.m`: Add same as above.

### B. Native Implementation (TitaniumKit)
The underlying native components must correctly propagate these new trait values to the UIKit text input controls (`UITextField`/`UITextView`).

## 3. Implementation Steps

### Phase 1: Proxy Layer Enhancement
1. [ ] Update `TiUITextFieldProxy` and `TiUITextAreaProxy` with properties that represent the enhanced popover traits from iOS 26.

### Phase 2: Native Trait Mapping
1. [ ] In `TiUITextField.m`/`.m`, implement logic to apply these new trait values during input configuration (e.g., via `UITextInputTraits` protocols).

### Phase 3: Verification
1. [ ] Create an integration test on iPad simulator that sets the enhanced popover style and verifies interaction with the number pad keyboard.
