# Android Ti.UI.ScrollView – padding / contentInset Implementierung

## Status
- **Erstellt:** 2026-06-24
- **Plattform:** Android
- **Widget:** `Ti.UI.ScrollView` (`TiUIScrollView.java`)

---

## 1. Analyse

### 1.1 Aktuelle Situation

**Android Native API (ScrollView):**
```java
// Verfügbare Methoden auf android.widget.ScrollView / androidx.core.widget.NestedScrollView:
setPadding(int left, int top, int right, int bottom)  // ✓ Vorhanden
getPaddingLeft()/Top/Right/Bottom()                     // ✓ Vorhanden
```

**Titanium TiUIScrollView.java:**
- `TiScrollViewLayout` erweitert `TiCompositeLayout` (welches von `View` erbt)
- **Keine explizite Behandlung** von `padding`, `paddingLeft`, `paddingTop`, etc. in der Java-Implementierung
- Die Parent-Dimensionen (`parentContentWidth`/`parentContentHeight`) werden bereits korrekt vom Padding abgeleitet:

```java
// TiUIScrollView.java Zeile ~570/720:
layout.setParentContentWidth(
    MeasureSpec.getSize(widthMeasureSpec) - (getPaddingLeft() + getPaddingRight())
);
layout.setParentContentHeight(
    MeasureSpec.getSize(heightMeasureSpec) - (getPaddingTop() + getPaddingBottom())
);
```

Das bedeutet: **Die Padding-Logik ist bereits teilweise vorhanden**, aber die Property wird nicht vom JavaScript-Proxy gesetzt.

**TiUIView.java:**
```java
// Zeile 793:
} else if (key.startsWith(TiC.PROPERTY_BACKGROUND_PADDING)) {
    Log.i(TAG, key + " not yet implemented.");
}
```
`PROPERTY_BACKGROUND_PADDING` ist als "not yet implemented" markiert.

### 1.2 iOS Vergleich

**iOS UIScrollView:**
- Verwendet `contentInset` (UIEdgeInsets) – native iOS API
- `contentInset` definiert den Abstand zwischen dem Scroll-Bereich und dem Inhalt
- Dies ist **nicht identisch** mit Android's `setPadding()`:
  - iOS `contentInset`: Nur visuell, berührungserweiterte Fläche, kein Einfluss auf Touch-Targets
  - Android `setPadding()`: Verschiebt den gesamten Content-Bereich inkl. Scrollbar

### 1.3 TiC.java – Vorhandene Konstanten

```java
public static final String PROPERTY_PADDING = "padding";
public static final String PROPERTY_PADDING_BOTTOM = "paddingBottom";
public static final String PROPERTY_PADDING_LEFT = "paddingLeft";
public static final String PROPERTY_PADDING_RIGHT = "paddingRight";
public static final String PROPERTY_PADDING_TOP = "paddingTop";
```

Diese sind bereits definiert, aber nicht in TiUIScrollView implementiert.

---

## 2. Implementierungsplan

### Phase 1: `contentInset` Property in TiUIScrollView hinzufügen

#### 2.1 Property-Konstante definieren

Falls noch nicht vorhanden, Konstante in `TiC.java` prüfen/erstellen:
```java
public static final String PROPERTY_CONTENT_INSET = "contentInset";
```

#### 2.2 Caching-Felder hinzufügen

In `TiUIScrollView.java` private Felder für die gecachten Padding-Werte:

```java
// Caching der contentInset Werte für effiziente Updates
private int cachedInsetTop = 0;
private int cachedInsetBottom = 0;
private int cachedInsetLeft = 0;
private int cachedInsetRight = 0;
```

#### 2.3 Helper-Methoden implementieren

```java
/**
 * Setzt das Padding des ScrollView basierend auf den gecachten contentInset Werten.
 */
private void applyContentInset() {
    if (this.scrollView != null) {
        this.scrollView.setPadding(
            cachedInsetLeft,
            cachedInsetTop,
            cachedInsetRight,
            cachedInsetBottom
        );
    }
}

/**
 * Setzt contentInset aus einem Dictionary mit top/bottom/left/right Keys.
 */
private void setContentInset(Object value) {
    if (value instanceof HashMap) {
        HashMap dict = (HashMap) value;
        
        // Top
        if (dict.containsKey("top") && dict.get("top") != null) {
            cachedInsetTop = TiConvert.toPixelValue(dict.get("top"), -1);
        }
        
        // Bottom
        if (dict.containsKey("bottom") && dict.get("bottom") != null) {
            cachedInsetBottom = TiConvert.toPixelValue(dict.get("bottom"), -1);
        }
        
        // Left
        if (dict.containsKey("left") && dict.get("left") != null) {
            cachedInsetLeft = TiConvert.toPixelValue(dict.get("left"), -1);
        }
        
        // Right
        if (dict.containsKey("right") && dict.get("right") != null) {
            cachedInsetRight = TiConvert.toPixelValue(dict.get("right"), -1);
        }
        
        applyContentInset();
        updateScrollViewLayoutFromPadding();
    } else {
        Log.w(TAG, "contentInset must be a dictionary with 'top', 'bottom', 'left', 'right' keys.");
    }
}

/**
 * Aktualisiert die parentContentWidth/Height basierend auf dem aktuellen Padding.
 */
private void updateScrollViewLayoutFromPadding() {
    View nativeView = this.scrollView;
    if (nativeView == null) {
        return;
    }
    
    TiScrollViewLayout layout = getLayout();
    if (layout != null) {
        int measuredWidth = nativeView.getMeasuredWidth();
        int measuredHeight = nativeView.getMeasuredHeight();
        
        // Parent-Dimensionen um Padding reduzieren
        int contentWidth = measuredWidth - (cachedInsetLeft + cachedInsetRight);
        int contentHeight = measuredHeight - (cachedInsetTop + cachedInsetBottom);
        
        layout.setParentContentWidth(Math.max(0, contentWidth));
        layout.setParentContentHeight(Math.max(0, contentHeight));
    }
}
```

#### 2.4 `propertyChanged()` erweitern

In der bestehenden `propertyChanged()`-Methode den contentInset-Fall ergänzen:

```java
@Override
public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
    if (Log.isDebugModeEnabled()) {
        Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
    }

    if (key.equals(TiC.PROPERTY_CONTENT_WIDTH) || key.equals(TiC.PROPERTY_CONTENT_HEIGHT)) {
        // ... bestehender Code ...
    } else if (key.equals(TiC.PROPERTY_CONTENT_OFFSET)) {
        // ... bestehender Code ...
    } else if (key.equals(TiC.PROPERTY_CAN_CANCEL_EVENTS)) {
        // ... bestehender Code ...
    } else if (TiC.PROPERTY_SCROLLING_ENABLED.equals(key)) {
        // ... bestehender Code ...
    } else if (TiC.PROPERTY_REFRESH_CONTROL.equals(key)) {
        // ... bestehender Code ...
    } else if (TiC.PROPERTY_OVER_SCROLL_MODE.equals(key)) {
        // ... bestehender Code ...
    }
    // +++ NEU: contentInset Handler +++
    else if (key.equals(TiC.PROPERTY_CONTENT_INSET)) {
        setContentInset(newValue);
    }

    super.propertyChanged(key, oldValue, newValue, proxy);
}
```

### Phase 2: `processProperties()` erweitern

Initial contentInset beim Erstellen des ScrollView setzen:

```java
@Override
public void processProperties(KrollDict d) {
    boolean showHorizontalScrollBar = false;
    boolean showVerticalScrollBar = false;

    // ... bestehender Code ...

    // +++ NEU: Initial contentInset setzen +++
    if (d.containsKey(TiC.PROPERTY_CONTENT_INSET)) {
        setContentInset(d.get(TiC.PROPERTY_CONTENT_INSET));
    } else {
        cachedInsetTop = 0;
        cachedInsetBottom = 0;
        cachedInsetLeft = 0;
        cachedInsetRight = 0;
    }

    // ... restlicher bestehender Code ...
}
```

### Phase 3: iOS-Parität (optional, zukünftig)

Auf iOS sollte die Property ebenfalls als `contentInset` implementiert werden und direkt auf `UIScrollView.contentInset` münden:

```objc
// TiUIScrollViewProxy.m
- (void)setContentInset_:(id)value {
    UIEdgeInsets insets = [TiUtils contentInsets:value];
    [[self scrollView] setContentInset:insets];
}
```

---

## 3. API-Spezifikation

### JavaScript-API

```javascript
var scrollView = Ti.UI.createScrollView({
    width: '100%',
    height: '100%',
    
    // contentInset als Dictionary (iOS-kompatibel)
    contentInset: {
        top: 60,
        bottom: 60,
        left: 20,   // optional
        right: 20   // optional
    },
    
    contentWidth: 800,
    contentHeight: 4000
});
```

### Plattform-Support (aktuell)

| Feature | Android | iOS |
|---|---|---|
| `contentInset` (Dictionary) | ✓ (→ setPadding) | ❌ (separate Implementierung) |
| `top`, `bottom`, `left`, `right` Keys | ✓ | — |
| Native Mapping | `View.setPadding()` | `UIScrollView.contentInset` |

**Hinweis:** Android's `setPadding()` und iOS's `contentInset` verhalten sich leicht unterschiedlich:
- **iOS `contentInset`:** Nur visuell, Touch-Targets unverändert
- **Android `setPadding()`:** Verschiebt den gesamten Content-Bereich inkl. Scrollbar

iOS-Implementierung folgt als separater Branch/PR (noch nicht umgesetzt).

---

## 4. Testfälle

### 4.1 Unit Tests (`tests/Resources/android/scrollview-padding.test.js`)

```javascript
var should = require('should');

describe('Ti.UI.ScrollView padding', function() {
    var win, scrollView;
    
    beforeEach(function() {
        win = Ti.UI.createWindow();
        scrollView = Ti.UI.createScrollView({
            width: 300,
            height: 300,
            padding: 20
        });
        win.add(scrollView);
        win.open();
    });
    
    it('should set equal padding on all sides', function() {
        scrollView.padding.should.equal(20);
    });
    
    it('should update padding dynamically', function() {
        scrollView.padding = 40;
        scrollView.padding.should.equal(40);
    });
    
    it('should support individual padding values', function() {
        scrollView.paddingTop = 10;
        scrollView.paddingBottom = 30;
        scrollView.paddingLeft = 5;
        scrollView.paddingRight = 25;
        
        scrollView.paddingTop.should.equal(10);
        // ... etc
    });
});
```

### 4.2 Integration Tests

- Padding beim Erstellen setzen und prüfen, ob Child-Views korrekt positioniert sind
- Dynamisches Ändern des Paddings während der Laufzeit
- Kombination mit `contentWidth`/`contentHeight`
- Scroll-Verhalten mit verschiedenen Padding-Werten

---

## 5. Dateien die geändert werden müssen

| Datei | Änderung |
|---|---|
| `android/modules/ui/src/java/ti/modules/titanium/ui/widget/TiUIScrollView.java` | Property-Handler + Helper-Methoden für padding |
| `apidoc/Titanium/UI/ScrollView.yml` | API-Dokumentation ergänzen |
| `tests/Resources/android/scrollview-padding.test.js` | Neue Testdatei |

---

## 6. Risiken & Überlegungen

### 6.1 Native ScrollView vs. NestedScrollView

- `TiVerticalScrollView` erweitert `NestedScrollView` (AndroidX)
- `TiHorizontalScrollView` erweitert `HorizontalScrollView`
- Beide unterstützen `setPadding()` von `View` aus

### 6.2 Auswirkung auf Child-Views

`setPadding()` verschiebt den gesamten Content-Bereich nach innen:
- Child-Views werden relativ zum gepaddeten Bereich positioniert
- Die Scrollbar kann sich visuell verschieben (abhängig vom ScrollStyle)
- `parentContentWidth/Height` müssen aktualisiert werden → bereits teilweise implementiert

### 6.3 iOS-Implementierung (separat)

Auf iOS wird `contentInset` als separate Implementierung in einem eigenen Branch/PR nachgereicht.
Dabei wird direkt auf `UIScrollView.contentInset` (UIEdgeInsets) gemappt.

---

## 7. Implementierungsreihenfolge

1. ✅ **Phase 1:** Property-Handler in `TiUIScrollView.java`
2. ✅ **Phase 2:** `processProperties()` für Initialisierung
3. ✅ **Phase 3:** API-Dokumentation (`apidoc/Titanium/UI/ScrollView.yml`) – Android-only
4. ⏳ **Phase 4:** Unit & Integration Tests
5. ⏳ **iOS-Implementierung** (separater Branch, folgt später)

---

## 8. Abhängigkeiten

- Keine externen Abhängigkeiten
- Benötigt nur Standard Android SDK APIs (`View.setPadding()`)
