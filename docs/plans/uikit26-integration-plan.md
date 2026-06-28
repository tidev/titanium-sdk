# UIKit 26 (iOS 26) Integration Plan for Titanium SDK

> Created: 2026-05-21
> Goal: Integrate relevant UIKit 26 features into Titanium SDK v13.x
> iOS 26 introduces Liquid Glass design, HDR support, new navigation features, and advanced menus

---

## Prioritization

| Priority | Criteria |
|---|---|
| **P0 – Critical** | Direct mapping to existing modules; high value; no new dependencies |
| **P1 – High** | Extensions to existing modules; moderate implementation complexity |
| **P2 – Medium** | New modules required; specialized use cases |
| **P3 – Low** | visionOS-specific; Assistive Access; niche features |

---

## P0 – Critical Integrations (Extend Existing Modules)

### 1. UIBarButtonItem Badges & Styling
**UIKit Feature:** `UIBarButtonItem.badge` (Badge struct), `sharesBackground`, `hidesSharedBackground`, `identifier`, Style `.prominent`

**Affected Files:**
```
iphone/Classes/TiUINavBarButton.h
iphone/Classes/TiUINavBarButton.m
iphone/Classes/TiUIButton.h
iphone/Classes/TiUIButton.m
iphone/Classes/TiUIButtonProxy.h
iphone/Classes/TiUIButtonProxy.m
iphone/Classes/TiUIiOSProxy.h          # factory method
iphone/Classes/TiUIiOSProxy.m          # factory method
```

**New Files:**
```
iphone/Classes/TiUIiOSBarButtonItemBadgeProxy.h  (NEW)
iphone/Classes/TiUIiOSBarButtonItemBadgeProxy.m  (NEW)
```

**Proposed JS API:**
```javascript
var button = Ti.UI.createButton({
  title: 'Close',
  // new Properties
  badge: Ti.UI.createBarButtonItemBadge({
    type: 'count', // 'count' | 'string' | 'indicator'
    value: 5,           // for type 'count'
    stringValue: 'NEW', // for type 'string'
    foregroundColor: '#fff',
    backgroundColor: '#e74c3c',
    font: { fontSize: 10 }
  }),
  sharesBackground: false,        // disable Liquid Glass background
  hidesSharedBackground: true,    // remove background completely
  style: 'prominent',             // eye-catching button (Accent Color)
});
```

**Implementation:**
- [ ] New class `TiUIiOSBarButtonItemBadgeProxy` (iOS-specific)
- [ ] Extend properties in `TiUINavBarButton`:
  - `badge` (getter/setter → native `UIBarButtonItem.badge`)
  - `sharesBackground` (Bool → `UIBarButtonItem.sharesBackground`)
  - `hidesSharedBackground` (Bool → `UIBarButtonItem.hidesSharedBackground`)
  - `style` extension with `'prominent'`
- [ ] `Ti.UI.createBarButtonItemBadge()` factory method in `TiUIiOSProxy`

**Effort:** ~3 days | **Complexity:** Low

---

### 2. UIButton Liquid Glass Configuration
**UIKit Feature:** `UIButton.Configuration` – `.glass()`, `.clearGlass()`, `.prominentGlass()`, `.prominentClearGlass()`, `symbolContentTransition`

**Affected Files:**
```
iphone/Classes/TiUIiOSButtonConfigurationProxy.h
iphone/Classes/TiUIiOSButtonConfigurationProxy.m
iphone/Classes/TiUIButton.h
iphone/Classes/TiUIButton.m
iphone/Classes/TiUIButtonProxy.h
iphone/Classes/TiUIButtonProxy.m
```

**Proposed JS API:**
```javascript
var button = Ti.UI.createButton({
  configuration: Ti.UI.iOS.createButtonConfiguration({
    style: 'glass', // 'glass' | 'clearGlass' | 'prominentGlass' | 'prominentClearGlass'
    symbolContentTransition: 'replace', // 'replace' | 'slide' | 'fade'
  })
});
```

**Implementation:**
- [ ] Extend `TiUIiOSButtonConfigurationProxy` with new style values
- [ ] Add `symbolContentTransition` property (UISymbolContentTransition mapping)
- [ ] Validate `configuration` property on TiUIButton

**Effort:** ~2 days | **Complexity:** Low

---

### 3. UIScrollView Edge Effects & Scroll Edge Customization
**UIKit Feature:** `UIScrollEdgeEffect`, `UIScrollEdgeElementContainerInteraction`, `topEdgeEffect.style`

**Affected Files:**
```
iphone/Classes/TiUIScrollView.h
iphone/Classes/TiUIScrollView.m
iphone/Classes/TiUIScrollViewProxy.h
iphone/Classes/TiUIScrollViewProxy.m
```

**Proposed JS API:**
```javascript
var scrollView = Ti.UI.createScrollView({
  // new properties
  topEdgeEffectStyle: 'soft', // 'soft' | 'hard' | 'automatic'
  bottomEdgeEffectStyle: 'soft',
});
```

**Implementation:**
- [ ] Extend `TiUIScrollViewProxy` with `topEdgeEffectStyle`, `bottomEdgeEffectStyle`
- [ ] Setter sets `scrollView.topEdgeEffect.style` on native UIScrollView
- [ ] Extend `TiUIScrollView` with `UIScrollEdgeElementContainerInteraction` support (for custom container views)

**Effort:** ~2 days | **Complexity:** Low

---

### 4. UINavigationItem Title/Subtitle & Large Title
**UIKit Feature:** `attributedTitle`, `subtitle`, `largeTitle`, `subtitleView`

**Affected Files:**
```
iphone/Classes/TiUINavigationWindowProxy.h
iphone/Classes/TiUINavigationWindowProxy.m
iphone/Classes/TiUINavigationWindowInternal.h
iphone/Classes/TiUINavigationWindowInternal.m
iphone/Classes/TiUITabProxy.h
iphone/Classes/TiUITabProxy.m
```

**Proposed JS API:**
```javascript
var win = Ti.UI.createWindow({
  title: 'Main',
  // new properties
  subtitle: 'Section A',
  largeTitle: 'Main Title',
  // SearchBar Placement
  searchBarPlacement: 'integrated', // 'integrated' | 'integratedButton' | 'integratedCentered'
});
```

**Implementation:**
- [ ] Extend `TiUINavigationWindowProxy` with properties:
  - `subtitle` (String → `UINavigationItem.subtitle`)
  - `largeTitle` (String → `UINavigationItem.largeTitle`)
- [ ] Extend `searchBarPlacement` enum with new values:
  - `integrated` (1), `integratedButton` (4), `integratedCentered` (3)
- [ ] `subtitleView` as advanced feature (custom view as subtitle)

**Effort:** ~3 days | **Complexity:** Medium

---

### 5. UIView Corner Configuration
**UIKit Feature:** `UICornerConfiguration`, `UICornerRadius`, `cornerConfiguration`, `effectiveRadius(corner:)`

**Affected Files:**
```
iphone/TitaniumKit/TitaniumKit/Sources/API/TiUIView.h
iphone/TitaniumKit/TitaniumKit/Sources/API/TiUIView.m
iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIViewProxy.h
iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIViewProxy.m
iphone/Classes/TiUIiOSProxy.h          # factory method
iphone/Classes/TiUIiOSProxy.m          # factory method
```

**New Files:**
```
iphone/Classes/TiUIiOSCornerConfigurationProxy.h  (NEW)
iphone/Classes/TiUIiOSCornerConfigurationProxy.m  (NEW)
```

**Proposed JS API:**
```javascript
var view = Ti.UI.createView({
  // new properties
  cornerConfiguration: {
    type: 'corners', // 'corners' | 'capsule' | 'uniformEdges'
    radius: 26,              // for 'corners'
    topRadius: 52,           // for 'uniformEdges'
    bottomRadius: 26,        // for 'uniformEdges'
  }
});

// or container-concentric (display-adaptive)
var adaptiveView = Ti.UI.createView({
  cornerConfiguration: {
    type: 'containerConcentric'
  }
});
```

**Implementation:**
- [ ] New class `TiUIiOSCornerConfigurationProxy`
- [ ] Extend `TiUIViewProxy` with `cornerConfiguration` property
- [ ] Add `setCornerConfiguration_:` method to `TiUIView`
- [ ] `effectiveRadius` as read-only property: `view.effectiveRadius` (optional: with corner parameter)
- [ ] `Ti.UI.iOS.createCornerConfiguration()` factory in `TiUIiOSProxy`

**Effort:** ~4 days | **Complexity:** Medium

---

### 6. UISearchBar & SearchController Extensions
**UIKit Feature:** `UISearchController` standalone, `searchBarPlacementAllowsExternalIntegration`, `automaticallyActivatesSearch`

**Affected Files:**
```
iphone/Classes/TiUISearchBar.h
iphone/Classes/TiUISearchBar.m
iphone/Classes/TiUISearchBarProxy.h
iphone/Classes/TiUISearchBarProxy.m
iphone/Classes/TiUINavigationWindowProxy.h
iphone/Classes/TiUINavigationWindowProxy.m
iphone/Classes/TiUIiOSProxy.h          # factory method
iphone/Classes/TiUIiOSProxy.m          # factory method
```

**New Files:**
```
iphone/Classes/TiUISearchController.h        (NEW)
iphone/Classes/TiUISearchController.m        (NEW)
iphone/Classes/TiUISearchControllerProxy.h   (NEW)
iphone/Classes/TiUISearchControllerProxy.m   (NEW)
```

**Proposed JS API:**
```javascript
// SearchBar extension
var searchBar = Ti.UI.createSearchBar({
  automaticallyActivatesSearch: true, // SearchTab feature
});

// NEW: Standalone SearchController
var searchController = Ti.UI.iOS.createSearchController({
  hidesNavigationBarDuringPresentation: false,
  searchBar: searchBar,
});
```

**Implementation:**
- [ ] Create `TiUISearchController` / `TiUISearchControllerProxy` as new standalone module
- [ ] Extend `TiUISearchBarProxy` with `automaticallyActivatesSearch`
- [ ] Extend `TiUINavigationWindowProxy` with `searchBarPlacementAllowsExternalIntegration`
- [ ] Delegate mapping: `shouldChangeTextInRanges` (Natural Selection support)
- [ ] Factory `Ti.UI.iOS.createSearchController()` in `TiUIiOSProxy`

**Effort:** ~5 days | **Complexity:** Medium

---

## P1 – High Priority (New Submodules/Extensions)

### 7. UIGlassEffect & UIColorEffect (Liquid Glass)
**UIKit Feature:** `UIGlassEffect`, `UIColorEffect`, `UIVisualEffectView` with glass styles

**Affected Files:**
```
iphone/Classes/TiUIiOSBlurView.h
iphone/Classes/TiUIiOSBlurView.m
iphone/Classes/TiUIiOSBlurViewProxy.h
iphone/Classes/TiUIiOSBlurViewProxy.m
iphone/Classes/TiUIiOSProxy.h          # factory methods
iphone/Classes/TiUIiOSProxy.m          # factory methods
```

**New Files:**
```
iphone/Classes/TiUIiOSGlassEffectProxy.h     (NEW)
iphone/Classes/TiUIiOSGlassEffectProxy.m     (NEW)
iphone/Classes/TiUIiOSColorEffectProxy.h     (NEW)
iphone/Classes/TiUIiOSColorEffectProxy.m     (NEW)
```

**Proposed JS API:**
```javascript
var glassView = Ti.UI.iOS.createBlurView({
  effect: Ti.UI.iOS.createGlassEffect({
    style: 'regular', // 'regular' | 'clear'
    tintColor: '#ffffff80',
    isInteractive: true,
  })
});

// or Color Effect
var colorEffectView = Ti.UI.iOS.createBlurView({
  effect: Ti.UI.iOS.createColorEffect({
    color: '#ffffff',
  })
});
```

**Implementation:**
- [ ] Create `TiUIiOSGlassEffectProxy` (wrap `UIGlassEffect`)
- [ ] Create `TiUIiOSColorEffectProxy` (wrap `UIColorEffect`)
- [ ] Extend `TiUIiOSBlurView` with Glass/Color effect types
- [ ] Factory methods in `TiUIiOSProxy`: `createGlassEffect()`, `createColorEffect()`

**Effort:** ~4 days | **Complexity:** Medium

---

### 8. UITabBarController Bottom Accessory
**UIKit Feature:** `UITabAccessory`, `bottomAccessory`, `setBottomAccessory(_:animated:)`, `tabBarMinimizeBehavior`, `contentLayoutGuide`

**Affected Files:**
```
iphone/Classes/TiUITabGroup.h
iphone/Classes/TiUITabGroup.m
iphone/Classes/TiUITabGroupProxy.h
iphone/Classes/TiUITabGroupProxy.m
iphone/Classes/TiUIiOSProxy.h          # factory method
iphone/Classes/TiUIiOSProxy.m          # factory method
```

**New Files:**
```
iphone/Classes/TiUIiOSTabAccessoryProxy.h    (NEW)
iphone/Classes/TiUIiOSTabAccessoryProxy.m    (NEW)
```

**Proposed JS API:**
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

**Implementation:**
- [ ] Create `TiUIiOSTabAccessoryProxy` (wrap `UITabAccessory`)
- [ ] Extend `TiUITabGroupProxy` with properties:
  - `tabBarMinimizeBehavior` (Enum)
  - `setBottomAccessory:animated:` method
- [ ] `Ti.UI.iOS.createTabAccessory()` factory in `TiUIiOSProxy`

**Effort:** ~4 days | **Complexity:** Medium

---

### 9. UISplitViewController Inspector Column
**UIKit Feature:** `preferredInspectorColumnWidth`, `Column.inspector`, `LayoutEnvironment`, `didShow/didHide` delegate

**Affected Files:**
```
iphone/Classes/TiUIiOSSplitWindow.h
iphone/Classes/TiUIiOSSplitWindow.m
iphone/Classes/TiUIiOSSplitWindowProxy.h
iphone/Classes/TiUIiOSSplitWindowProxy.m
```

**Proposed JS API:**
```javascript
var splitWindow = Ti.UI.iOS.createSplitWindow({
  masterView: masterWin,
  detailView: detailWin,
  // new properties
  preferredInspectorColumnWidth: 300,
  inspectorView: inspectorWin, // new column
});

// Events
splitWindow.addEventListener('didShowColumn', function(e) {
  Ti.API.info('Column shown: ' + e.column); // 'master' | 'detail' | 'inspector'
});
splitWindow.addEventListener('didHideColumn', function(e) {
  Ti.API.info('Column hidden: ' + e.column);
});
```

**Implementation:**
- [ ] Extend `TiUIiOSSplitWindowProxy` with inspector support
- [ ] `preferredInspectorColumnWidth` property
- [ ] `inspectorView` property (optional third view)
- [ ] Delegate events: `didShowColumn`, `didHideColumn`
- [ ] `LayoutEnvironment` trait as read-only property

**Effort:** ~5 days | **Complexity:** Medium-High

---

### 10. UISlider Track Configuration & Styles
**UIKit Feature:** `sliderStyle`, `SliderStyle.thumbless`, `TrackConfiguration`, `TrackConfiguration.Tick`

**Affected Files:**
```
iphone/Classes/TiUISlider.h
iphone/Classes/TiUISlider.m
iphone/Classes/TiUISliderProxy.h
iphone/Classes/TiUISliderProxy.m
iphone/Classes/TiUIiOSProxy.h          # factory method
iphone/Classes/TiUIiOSProxy.m          # factory method
```

**New Files:**
```
iphone/Classes/TiUIiOSSliderTrackConfigurationProxy.h  (NEW)
iphone/Classes/TiUIiOSSliderTrackConfigurationProxy.m  (NEW)
iphone/Classes/TiUIiOSSliderTickProxy.h                (NEW)
iphone/Classes/TiUIiOSSliderTickProxy.m                (NEW)
```

**Proposed JS API:**
```javascript
var slider = Ti.UI.createSlider({
  min: 0,
  max: 100,
  value: 50,
  // new properties
  sliderStyle: 'thumbless', // 'default' | 'thumbless'
  trackConfiguration: {
    numberOfTicks: 5,
    ticks: [
      { position: 0, title: 'Low', image: '/images/low.png' },
      { position: 25, title: 'Quarter' },
      { position: 50, title: 'Half' },
      { position: 75, title: 'Three Quarter' },
      { position: 100, title: 'High', image: '/images/high.png' },
    ],
    neutralValue: 50,
    enabledRangeStart: 25,
    enabledRangeEnd: 75,
    snapToTicks: true,
  }
});
```

**Implementation:**
- [ ] Extend `TiUISliderProxy` with `sliderStyle` property
- [ ] Create `TiUIiOSSliderTrackConfigurationProxy`
- [ ] Create `TiUIiOSSliderTickProxy`
- [ ] Factory: `Ti.UI.iOS.createSliderTrackConfiguration()` in `TiUIiOSProxy`

**Effort:** ~4 days | **Complexity:** Medium

---

### 11. UIColor HDR Support
**UIKit Feature:** HDR initializer (`exposure`, `linearExposure`), `applyingContentHeadroom`, `standardDynamicRange`

**Affected Files:**
```
iphone/TitaniumKit/TitaniumKit/Sources/API/TiColor.h
iphone/TitaniumKit/TitaniumKit/Sources/API/TiColor.m
```

**Proposed JS API:**
```javascript
var hdrColor = Ti.UI.createColor({
  type: 'hdr', // new color type
  red: 1.0,
  green: 0.5,
  blue: 0.0,
  alpha: 1.0,
  exposure: 2.0,           // HDR exposure value
  // or linearExposure: 10.0,
});

// Apply content headroom
var adjustedColor = hdrColor.applyingContentHeadroom(1.5);
```

**Implementation:**
- [ ] Extend `TiColor` with HDR constructor
- [ ] New properties `exposure` / `linearExposure`
- [ ] Method `applyingContentHeadroom:` on color proxy
- [ ] `standardDynamicRange` as read-only property
- [ ] `UIColorPickerViewController` and `UIColorWell` properties: `maximumLinearExposure`, `supportsEyedropper`

**Effort:** ~3 days | **Complexity:** Medium

---

### 12. UINavigationBarAppearance Subtitle & Prominent
**UIKit Feature:** `subtitleTextAttributes`, `prominentButtonAppearance`

**Affected Files:**
```
iphone/Classes/TiUINavigationWindowProxy.h
iphone/Classes/TiUINavigationWindowProxy.m
iphone/Classes/TiUINavigationWindowInternal.h
iphone/Classes/TiUINavigationWindowInternal.m
```

**Proposed JS API:**
```javascript
var win = Ti.UI.createWindow({
  navBarAppearance: {
    subtitleTextAttributes: {
      fontSize: 12,
      fontColor: '#888888',
      fontFamily: 'Helvetica',
    },
    prominentButtonAppearance: {
      normal: {
        titleColor: '#ffffff',
        titleAttributes: { fontSize: 16 },
      }
    }
  }
});
```

**Implementation:**
- [ ] Extend `TiUINavigationWindowProxy` with `subtitleTextAttributes` support
- [ ] Add `prominentButtonAppearance` property
- [ ] Note: No standalone `TiUINavigationBarAppearance` class exists – appearance is managed through the window proxy

**Effort:** ~2 days | **Complexity:** Low

---

## P2 – Medium Priority (New Modules)

### 13. UIContextMenuSystem (Context Menus)
**UIKit Feature:** `UIContextMenuSystem` (singleton), `UIContextMenuInteraction`

**Affected Files:**
```
iphone/Classes/TiUIiOSMenuPopup.h
iphone/Classes/TiUIiOSMenuPopup.m
iphone/Classes/TiUIiOSMenuPopupProxy.h
iphone/Classes/TiUIiOSMenuPopupProxy.m
iphone/Classes/TiUIiOSProxy.h          # factory method
iphone/Classes/TiUIiOSProxy.m          # factory method
```

**New Files:**
```
iphone/Classes/TiUIiOSContextMenu.h          (NEW)
iphone/Classes/TiUIiOSContextMenu.m          (NEW)
iphone/Classes/TiUIiOSContextMenuProxy.h     (NEW)
iphone/Classes/TiUIiOSContextMenuProxy.m     (NEW)
```

**Proposed JS API:**
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

**Implementation:**
- [ ] `TiUIiOSContextMenuProxy` as modern alternative to `TiUIiOSMenuPopup`
- [ ] Wrap `UIContextMenuInteraction` delegate
- [ ] `UIContextMenuSystem.shared` for global configuration
- [ ] Factory `Ti.UI.iOS.createContextMenu()` in `TiUIiOSProxy`

**Effort:** ~6 days | **Complexity:** High

---

### 14. UIMainMenuSystem (iPadOS Menu Bar)
**UIKit Feature:** `UIMainMenuSystem`, `Configuration`, `FindingConfiguration`

**Affected Files:**
```
iphone/Classes/TiUIiOSProxy.h          # singleton accessor
iphone/Classes/TiUIiOSProxy.m          # singleton accessor
```

**New Files:**
```
iphone/Classes/TiUIiOSMainMenuSystemProxy.h    (NEW)
iphone/Classes/TiUIiOSMainMenuSystemProxy.m    (NEW)
```

**Proposed JS API:**
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

**Implementation:**
- [ ] Create `TiUIiOSMainMenuSystemProxy` singleton
- [ ] `UIMainMenuSystem.Configuration` mapping
- [ ] `UIMenuBuilder` wrapper for menuBuilder callback
- [ ] `UIDeferredMenuElement` support for async menu elements
- [ ] Expose via `Ti.UI.iOS.getMainMenuSystem()` in `TiUIiOSProxy`

**Effort:** ~7 days | **Complexity:** High

---

### 15. UIView Observation Support & updateProperties()
**UIKit Feature:** `updateProperties()`, `setNeedsUpdateProperties()`, Observable tracking

**Affected Files:**
```
iphone/TitaniumKit/TitaniumKit/Sources/API/TiUIView.h
iphone/TitaniumKit/TitaniumKit/Sources/API/TiUIView.m
iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIViewProxy.h
iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIViewProxy.m
```

**Proposed JS API:**
```javascript
var view = Ti.UI.createView({
  // Reactive properties are automatically tracked
  // when Observable objects are used
});

// Manual update trigger (for advanced use cases)
view.setNeedsUpdateProperties();
```

**Implementation:**
- [ ] Extend `TiUIView` with `updateProperties` lifecycle method
- [ ] `setNeedsUpdateProperties` as public method
- [ ] Integrate observation system for Titanium properties
- [ ] This is a fundamental change – test carefully

**Effort:** ~5 days | **Complexity:** High (fundamental change)

---

### 16. UIBackgroundExtensionView
**UIKit Feature:** `UIBackgroundExtensionView` for rich content in unsafe areas

**Affected Files:**
```
iphone/Classes/TiUIiOSProxy.h          # factory method
iphone/Classes/TiUIiOSProxy.m          # factory method
```

**New Files:**
```
iphone/Classes/TiUIiOSBackgroundExtensionView.h     (NEW)
iphone/Classes/TiUIiOSBackgroundExtensionView.m     (NEW)
iphone/Classes/TiUIiOSBackgroundExtensionViewProxy.h (NEW)
iphone/Classes/TiUIiOSBackgroundExtensionViewProxy.m (NEW)
```

**Proposed JS API:**
```javascript
var bgExtension = Ti.UI.iOS.createBackgroundExtensionView({
  contentView: headerView,
  automaticallyPlacesContentView: true,
});
view.add(bgExtension);
```

**Implementation:**
- [ ] Create `TiUIiOSBackgroundExtensionView` view/proxy pair
- [ ] Factory: `Ti.UI.iOS.createBackgroundExtensionView()` in `TiUIiOSProxy`

**Effort:** ~3 days | **Complexity:** Low-Medium

---

### 17. UIBarButtonItemGroup & Writing Tools
**UIKit Feature:** `UIBarButtonItemGroup`, `fixedSpace()`, SystemItem `writingTools`

**Affected Files:**
```
iphone/Classes/TiUINavBarButton.h
iphone/Classes/TiUINavBarButton.m
iphone/Classes/TiUIButtonBar.h
iphone/Classes/TiUIButtonBar.m
iphone/Classes/TiUIButtonBarProxy.h
iphone/Classes/TiUIButtonBarProxy.m
iphone/Classes/TiUIiOSProxy.h          # factory methods
iphone/Classes/TiUIiOSProxy.m          # factory methods
```

**New Files:**
```
iphone/Classes/TiUIiOSBarButtonItemGroupProxy.h  (NEW)
iphone/Classes/TiUIiOSBarButtonItemGroupProxy.m  (NEW)
```

**Proposed JS API:**
```javascript
var buttonGroup = Ti.UI.iOS.createBarButtonItemGroup({
  items: [button1, button2],
});

var fixedSpace = Ti.UI.iOS.createBarButtonItemFixedSpace();
var writingToolsButton = Ti.UI.createButton({
  systemItem: 'writingTools', // new system item
});
```

**Implementation:**
- [ ] Create `TiUIiOSBarButtonItemGroupProxy`
- [ ] `UIBarButtonItem.SystemItem.writingTools` mapping in `TiUINavBarButton`
- [ ] `UIBarButtonItem.fixedSpace()` factory in `TiUIiOSProxy`

**Effort:** ~3 days | **Complexity:** Low

---

### 18. UINavigationController interactiveContentPopGestureRecognizer
**UIKit Feature:** `interactiveContentPopGestureRecognizer` (back gesture even with hidden back button)

**Affected Files:**
```
iphone/Classes/TiUINavigationWindowProxy.h
iphone/Classes/TiUINavigationWindowProxy.m
iphone/Classes/TiUINavigationWindowInternal.h
iphone/Classes/TiUINavigationWindowInternal.m
```

**Proposed JS API:**
```javascript
var win = Ti.UI.createWindow({
  // new property
  enableInteractivePopGesture: true,
});
```

**Implementation:**
- [ ] Extend `TiUINavigationWindowProxy` with `enableInteractivePopGesture`
- [ ] Set `interactiveContentPopGestureRecognizer` on UINavigationController in `TiUINavigationWindowInternal`

**Effort:** ~1 day | **Complexity:** Low

---

### 19. UISheetPresentationController & UIPresentationController Background Effect
**UIKit Feature:** `backgroundEffect` on sheet/presentation controller

**Affected Files:**
```
iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIWindow.h
iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIWindow.m
iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIWindowProxy.h
iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIWindowProxy.m
```

**Proposed JS API:**
```javascript
var win = Ti.UI.createWindow();
win.open({
  modal: true,
  // new properties
  presentationStyle: 'formSheet',
  backgroundEffect: Ti.UI.iOS.createColorEffect({
    color: '#ffffffcc',
  }),
});
```

**Implementation:**
- [ ] Extend `TiUIWindowProxy` with `backgroundEffect` property for modal presentations
- [ ] `UISheetPresentationController` delegate adjustment in `TiUIWindow`

**Effort:** ~2 days | **Complexity:** Medium

---

### 20. UITextField/TextView Range-Based Methods (Natural Selection)
**UIKit Feature:** `shouldChangeTextInRanges` (multiple ranges), `selectedRanges`

**Affected Files:**
```
iphone/Classes/TiUITextField.h
iphone/Classes/TiUITextField.m
iphone/Classes/TiUITextFieldProxy.h
iphone/Classes/TiUITextFieldProxy.m
iphone/Classes/TiUITextArea.h
iphone/Classes/TiUITextArea.m
iphone/Classes/TiUITextAreaProxy.h
iphone/Classes/TiUITextAreaProxy.m
iphone/Classes/TiUITextWidget.h
iphone/Classes/TiUITextWidget.m
iphone/Classes/TiUITextWidgetProxy.h
iphone/Classes/TiUITextWidgetProxy.m
```

**Proposed JS API:**
```javascript
var textField = Ti.UI.createTextField({
  // Natural Selection support is automatically enabled
  // when multiple selections are supported
});

// selectedRanges property
var ranges = textField.selectedRanges; // Array of {start, length}
```

**Implementation:**
- [ ] Extend `TiUITextWidget` (base class) with range-based delegate methods
- [ ] `selectedRanges` property on `TiUITextFieldProxy` / `TiUITextAreaProxy`

**Effort:** ~3 days | **Complexity:** Medium

---

## P3 – Low Priority / Platform-Specific

### 21. AccessibilitySettings showBordersEnabled
- **Status:** Read-only system setting
- **Integration:** Event-based (`showBordersEnabledStatusDidChange`)
- **Effort:** ~1 day | **Complexity:** Low

### 22. UIScene Destruction Conditions (visionOS)
- **Status:** visionOS-specific
- **Recommendation:** Only relevant if Titanium supports visionOS
- **Effort:** ~2 days | **Complexity:** Low

### 23. UISceneSession.Assistive Access Role
- **Status:** Assistive Access mode – niche feature
- **Recommendation:** Evaluate later

### 24. Look to Scroll (visionOS)
- **Status:** visionOS-specific (`lookToScrollAxes`)
- **Recommendation:** Relevant when visionOS support is added

### 25. UIView LayoutRegion API & AdaptivityAxis
- **Status:** Advanced layout feature
- **Affected Files:**
  ```
  iphone/TitaniumKit/TitaniumKit/Sources/API/TiUIView.h
  iphone/TitaniumKit/TitaniumKit/Sources/API/TiUIView.m
  iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIViewProxy.h
  iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIViewProxy.m
  ```
- **Proposed API:** `view.layoutGuide(for: 'margins', cornerAdaptation: 'vertical')`
- **Effort:** ~3 days | **Complexity:** Medium

### 26. UIViewController Orientation Lock & Transition
- **Status:** `prefersInterfaceOrientationLocked`, zoom transition with BarButtonItem
- **Affected Files:**
  ```
  iphone/Classes/TiUINavigationWindowProxy.h
  iphone/Classes/TiUINavigationWindowProxy.m
  ```
- **Effort:** ~2 days | **Complexity:** Medium

### 27. UIImage.SymbolConfiguration (SF Symbols 7)
- **Status:** Gradient rendering, draw effect animation
- **Affected Files:**
  ```
  iphone/Classes/TiUIImageView.h
  iphone/Classes/TiUIImageView.m
  iphone/Classes/TiUIImageViewProxy.h
  iphone/Classes/TiUIImageViewProxy.m
  ```
- **Effort:** ~2 days | **Complexity:** Low

### 28. UITextInputTraits allowsNumberPadPopover
- **Status:** iPadOS number pad popover
- **Affected Files:**
  ```
  iphone/Classes/TiUITextField.h
  iphone/Classes/TiUITextField.m
  iphone/Classes/TiUITextFieldProxy.h
  iphone/Classes/TiUITextFieldProxy.m
  iphone/Classes/TiUITextArea.h
  iphone/Classes/TiUITextArea.m
  iphone/Classes/TiUITextAreaProxy.h
  iphone/Classes/TiUITextAreaProxy.m
  iphone/Classes/TiUITextWidget.h
  iphone/Classes/TiUITextWidget.m
  ```
- **Effort:** ~1 day | **Complexity:** Low

### 29. UISearchTab automaticallyActivatesSearch
- **Status:** Complementary search feature
- **See:** Item 6 (SearchController)

### 30. UIResponderStandardEditActions (Align, Close, Inspector)
- **Status:** Menu integration, standard edit actions
- **Effort:** ~2 days | **Complexity:** Medium

---

## Summary & Recommendation

### Immediately Implementable (P0) – ~14 days total effort

| # | Feature | Effort | Impact | New Files |
|---|---|---|---|---|
| 1 | UIBarButtonItem Badges & Styling | 3 days | High – Liquid Glass UI | 2 |
| 2 | UIButton Glass Configuration | 2 days | High – Liquid Glass UI | 0 |
| 3 | UIScrollView Edge Effects | 2 days | Medium – Scroll UX | 0 |
| 4 | NavigationItem Title/Subtitle | 3 days | Medium – Navigation UX | 0 |
| 5 | UIView Corner Configuration | 4 days | High – View Styling | 2 |

### Short-Term (P1) – ~26 days total effort

| # | Feature | Effort | Impact | New Files |
|---|---|---|---|---|
| 6 | SearchController standalone | 5 days | Medium | 4 |
| 7 | Glass/Color Effect | 4 days | High – Liquid Glass | 4 |
| 8 | TabBar Bottom Accessory | 4 days | Medium | 2 |
| 9 | SplitView Inspector | 5 days | Medium | 0 |
| 10 | Slider Track Config | 4 days | Medium | 4 |
| 11 | UIColor HDR | 3 days | Medium | 0 |
| 12 | NavBarAppearance Subtitle | 2 days | Low | 0 |

### Mid-Term (P2) – ~29 days total effort

| # | Feature | Effort | Impact | New Files |
|---|---|---|---|---|
| 13 | ContextMenu System | 6 days | High | 4 |
| 14 | Main Menu System | 7 days | Medium (iPadOS) | 2 |
| 15 | UIView Observation | 5 days | High (fundamental) | 0 |
| 16 | BackgroundExtensionView | 3 days | Low | 4 |
| 17 | BarButtonItemGroup | 3 days | Low | 2 |
| 18 | Interactive Pop Gesture | 1 day | Low | 0 |
| 19 | Sheet Background Effect | 2 days | Medium | 0 |
| 20 | Natural Selection Ranges | 3 days | Medium | 0 |

### Long-Term (P3) – ~16 days total effort

Various visionOS/niche features with 1-3 days effort each.

---

## Total Effort

| Priority | Days | Features | New Files |
|---|---|---|---|
| P0 – Critical | ~14 | 5 | 4 |
| P1 – High | ~26 | 7 | 10 |
| P2 – Medium | ~29 | 8 | 12 |
| P3 – Low | ~16 | 10 | 0 |
| **Total** | **~85** | **30** | **26** |

---

## Implementation Strategy

### Phase 1: Liquid Glass Foundation (Week 1-2)
1. UIBarButtonItem Badges & Styling
2. UIButton Glass Configuration
3. UIGlassEffect & UIColorEffect

### Phase 2: Navigation & Layout (Week 3-4)
4. NavigationItem Title/Subtitle
5. UIView Corner Configuration
6. NavBarAppearance Subtitle
7. Interactive Pop Gesture

### Phase 3: Scroll & Input (Week 5-6)
8. UIScrollView Edge Effects
9. SearchController standalone
10. Slider Track Configuration
11. Natural Selection Ranges

### Phase 4: Advanced Features (Week 7-8)
12. TabBar Bottom Accessory
13. SplitView Inspector Column
14. UIColor HDR Support
15. Context Menu System

### Phase 5: Polish & Edge Cases (Week 9-10)
16. Sheet Background Effect
17. BarButtonItemGroup
18. BackgroundExtensionView
19. Main Menu System (iPadOS)
20. UIView Observation Support

---

## Key Files Reference

### Central iOS Module (Factory Methods)
All `Ti.UI.iOS.*` factory methods are defined here:
```
iphone/Classes/TiUIiOSProxy.h
iphone/Classes/TiUIiOSProxy.m
```

### Base Classes (TitaniumKit)
```
iphone/TitaniumKit/TitaniumKit/Sources/API/TiUIView.h/.m
iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIViewProxy.h/.m
iphone/TitaniumKit/TitaniumKit/Sources/API/TiColor.h/.m
iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIWindow.h/.m
iphone/TitaniumKit/TitaniumKit/Sources/Modules/TiUIWindowProxy.h/.m
```

### Existing UI Modules (iphone/Classes/)
```
TiUINavBarButton.h/.m
TiUIButton.h/.m / TiUIButtonProxy.h/.m
TiUIiOSButtonConfigurationProxy.h/.m
TiUIScrollView.h/.m / TiUIScrollViewProxy.h/.m
TiUINavigationWindowProxy.h/.m / TiUINavigationWindowInternal.h/.m
TiUITabProxy.h/.m
TiUISearchBar.h/.m / TiUISearchBarProxy.h/.m
TiUIiOSBlurView.h/.m / TiUIiOSBlurViewProxy.h/.m
TiUITabGroup.h/.m / TiUITabGroupProxy.h/.m
TiUIiOSSplitWindow.h/.m / TiUIiOSSplitWindowProxy.h/.m
TiUISlider.h/.m / TiUISliderProxy.h/.m
TiUIiOSMenuPopup.h/.m / TiUIiOSMenuPopupProxy.h/.m
TiUIButtonBar.h/.m / TiUIButtonBarProxy.h/.m
TiUITextField.h/.m / TiUITextFieldProxy.h/.m
TiUITextArea.h/.m / TiUITextAreaProxy.h/.m
TiUITextWidget.h/.m / TiUITextWidgetProxy.h/.m
TiUIImageView.h/.m / TiUIImageViewProxy.h/.m
TiUIiPadPopoverProxy.h/.m
TiUIAlertDialogProxy.h/.m
TiUIOptionDialogProxy.h/.m
```

---

## Dependencies & Risks

| Risk | Description | Mitigation |
|---|---|---|
| **iOS 26 Deployment Target** | Features require iOS 26+ | Runtime checks (`#available(iOS 26, *)`) |
| **Titanium SDK Version** | Avoid breaking changes | New properties as optional |
| **Test Coverage** | No physical iOS 26 devices | Simulator + CI configuration |
| **Backward Compatibility** | Older iOS versions | Graceful degradation |
| **API Consistency** | Titanium style vs UIKit naming | Maintain Titanium conventions |
| **TitaniumKit SPM Module** | Base classes in Swift Package | Update package exports for new files |

---

## References

- [UIKit 26 Blog – Seb Vidal](https://sebvidal.com/blog/whats-new-in-uikit-26)
- Titanium iOS Codebase: `iphone/Classes/` and `iphone/TitaniumKit/TitaniumKit/Sources/`
- Apple Developer Docs: iOS 26 Release Notes
