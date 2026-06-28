# Linux Desktop Platform für Titanium SDK – Implementierungsplan

## 1. Zusammenfassung

Dieser Plan beschreibt die Aufnahme einer **Linux-Desktop-Plattform** in das Titanium SDK, um native GUI-Apps für KDE/GNOME-Desktop-Umgebungen mit JavaScript zu entwickeln. Die Apps verwenden **GTK4** als GUI-Toolkit und **V8** als JavaScript-Engine, eingebettet in einen Linux-spezifischen Kroll-Runtime.

---

## 2. Architektur-Entscheidungen

### 2.1 JavaScript-Engine: Eingebetteter V8

**Begründung:**
- Android verwendet bereits V8 mit dem Kroll-Bridge-System (`kroll-apt` mit FreeMarker-Templates für V8-JNI-Bindings).
- Das V8-Bindings-Template-System (`ProxyBindingV8.cpp.fm`) ist plattformunabhängig – es erzeugt C++-Code, der mit jeder V8-Host-Plattform funktioniert.
- JavaScriptCore auf iOS erfordert ein ganz anderes Binding-System (`JSContext`/`JSValue`). Eine Linux-Plattform mit V8 ermöglicht Code-Sharing mit Android.
- Node.js wäre eine Alternative, aber das Kroll-Annotationssystem (`@Kroll.method`, `@Kroll.getProperty`) ist direkt auf V8 ausgelegt.

**Implementierung:**
- V8 als Submodule/Dependency (z.B. via `node-addon-api`-ähnlicher Abstraktion oder direkt)
- Eigenes Host-Programm (`linux-runtime`) statt Android `Application`-Klasse oder iOS `main.m`

### 2.2 GUI-Toolkit: GTK4 + libadwaita

**Begründung:**
- **GTK4** ist der aktuelle Standard, aktiv entwickelt und wird von GNOME und KDE (via Portal-Integration) unterstützt.
- **libadwaita** (GTK4-Bibliothek) bietet ein modernes, plattformübergreifendes Design (GNOME-Style), das auch auf KDE gut aussieht.
- GTK4 hat eine sehr gute C-API mit C++-Wrappern – ideal für die C++-V8-Bindings.
- Alternative Qt6 wäre für KDE-nativer, aber GTK4 ist auf allen Linux-Desktops verfügbar und hat bessere JS-Bindings (GJS/GNOME).

**Abbildung auf Titanium-Konzept:**

| Titanium | GTK4-Entsprechung |
|----------|-------------------|
| `Ti.UI.Window` | `GtkWindow` / `AdwWindow` |
| `Ti.UI.View` | `GtkBox` / `GtkStack` |
| `Ti.UI.Label` | `GtkLabel` |
| `Ti.UI.Button` | `GtkButton` / `AdwButton` |
| `Ti.UI.ScrollView` | `GtkScrolledWindow` |
| `Ti.UI.TableView` | `GtkTreeView` / `AdwPreferencesGroup` |
| `Ti.UI.ListView` | `GtkListView` (GtkDropDown-basiert) |
| `Ti.UI.WebView` | `WebKitWebView` (GTK4-Integration) |
| `Ti.UI.ImageView` | `GtkImage` |
| `Ti.UI.TabGroup` | `GtkStack` / `GtkNotebook` |
| `Ti.UI.NavigationWindow` | `AdwNavigationSplitView` / `AdwNavigationStack` |

### 2.3 Projektstruktur

```
linux/                          <-- Neue Wurzel für die Linux-Plattform
├── build/
│   ├── lib/
│   │   └── linux.js            <-- Build-Plattform-Integration (wie android.js, ios.js)
│   └── scons-linux.js          <-- Linux-spezifische Build-Targets
├── src/
│   ├── api/
│   │   ├── TiApp.cpp           <-- Linux-Äquivalent zu TiApplication.java / TiApp.m
│   │   ├── TiProxy.cpp         <-- Linux-Äquivalent zu KrollProxy.java / TiProxy.m
│   │   ├── TiModule.cpp        <-- Linux-Äquivalent zu KrollModule.java / TiModule.m
│   │   ├── TiBridge.cpp        <-- KrollBridge auf Linux
│   │   └── TiView.h            <-- TiUIView-Äquivalent
│   ├── modules/
│   │   ├── platform/           <-- Ti.Platform-Modul (osname, version, battery, ...)
│   │   ├── app/                <-- Ti.App-Modul
│   │   ├── ui/                 <-- Ti.UI-Module (alle UI-Proxys)
│   │   ├── network/            <-- Ti.Network-Modul
│   │   ├── filesystem/         <-- Ti.Filesystem-Modul
│   │   ├── media/              <-- Ti.Media-Modul
│   │   ├── database/           <-- Ti.Database-Modul
│   │   ├── geolocation/        <-- Ti.Geolocation-Modul
│   │   ├── locale/             <-- Ti.Locale-Modul
│   │   ├── stream/             <-- Ti.Stream-Modul
│   │   ├── xml/                <-- Ti.XML-Modul
│   │   └── codec/              <-- Ti.Codec-Modul
│   └── common/
│       ├── V8Host.cpp          <-- V8-Engine-Initialisierung und -Management
│       ├── V8Binding.cpp       <-- V8 <-> C++ Wertkonvertierung
│       └── EventBus.cpp        <-- Event-System (Android-Äquivalent)
├── templates/                  <-- App-Template für Linux
│   └── app/
│       └── linux-default/
│           └── template/
│               ├── platform/
│               │   └── linux/  <-- Linux-spezifische Template-Dateien
│               ├── Resources/
│               └── tiapp.xml
└── tests/
    └── linux/                  <-- Linux-Integrationstests
```

### 2.4 Module-Implementierung: C++ vs. C

Jedes Linux-Modul wird als **C++-Datei** implementiert:

```cpp
// Beispiel: linux/src/modules/platform/PlatformModule.cpp

#include "TiModule.h"
#include "TiProxy.h"

namespace ti::modules::platform {

class LinuxPlatformModule : public TiModule {
public:
    static void Init(v8::Local<v8::Object> exports, v8::Local<v8::Object> module);

private:
    void GetName(TiInvocation inv, v8::Local<v8::Value>& ret);
    void GetOsname(TiInvocation inv, v8::Local<v8::Value>& ret);
    void GetVersion(TiInvocation inv, v8::Local<v8::Value>& ret);
    void GetRuntime(TiInvocation inv, v8::Local<v8::Value>& ret);
};

// Register the module with annotations
TIO_MODULE("ti.platform", LinuxPlatformModule)
    TIO_PROPERTY("name", &LinuxPlatformModule::GetName)
    TIO_PROPERTY("osname", &LinuxPlatformModule::GetOsname)
    TIO_PROPERTY("version", &LinuxPlatformModule::GetVersion)
    TIO_PROPERTY("runtime", &LinuxPlatformModule::GetRuntime)
    TIO_PROPERTY("ostype", &LinuxPlatformModule::GetOstype)
    TIO_PROPERTY("architecture", &LinuxPlatformModule::GetArchitecture)
    TIO_PROPERTY("manufacturer", &LinuxPlatformModule::GetManufacturer)
    // ...
END_TIO_MODULE

} // namespace ti::modules::platform
```

**Vorteile gegenüber Android (Java):**
- Keine Annotation-Processor-Pipeline nötig (C++-Template/Makro-basiert)
- Weniger Build-Abhängigkeiten (kein Kotlin, kein Gradle)
- Kompakteres Binary

**Vorteile gegenüber iOS (ObjC):**
- Plattformübergreifend mit Linux
- Keine CocoaPods/Xcode-Abhängigkeiten

---

## 3. Build-System-Integration

### 3.1 Änderungen an `build/lib/builder.js`

```javascript
const ALL_OSES = ['win32', 'osx', 'linux'];
const ALL_PLATFORMS = ['ios', 'android', 'linux'];
const OS_TO_PLATFORMS = {
    win32: ['android', 'linux'],
    osx:   ['android', 'ios', 'linux'],
    // Auf Windows: Linux-Build via Docker/Cross-Toolchain oder Wine
    // Alternativ nur macOS und Linux als Host-OS für Linux-Builds
    linux: ['android', 'linux']
};
```

### 3.2 `build/lib/linux.js` (Plattform-Integration)

Analysiert das Linux-Build wie `android.js` und `ios.js`:
- Stellt `babelOptions()` mit `Ti.Platform.osname = 'linux'`, `Ti.Platform.runtime = 'v8'`, `Ti.Platform.manufacturer = 'linux'`
- Kompiliert C++-Quellen mit `g++`/`clang++` und GTK4/V8-Headers
- Lädt GTK4/libadwaita als Runtime-Dependency
- Generiert das Linux-Runtime-Binary

### 3.3 `cli/lib/tasks/process-js-task.js`

Neuer Fall für die neue Plattform:

```javascript
case 'linux':
    transform.Ti.Platform.osname = 'linux';
    transform.Ti.Platform.name = 'linux';
    transform.Ti.Platform.runtime = 'v8';
    transform.Ti.Platform.manufacturer = 'linux';
    break;
```

### 3.4 `templates/app/`

Neues Template `linux-default/` hinzufügen, das neben `platform/android/` und (künftig) `platform/ios/` auch `platform/linux/` unterstützt.

---

## 4. UI-Proxy-Implementierung (GTK4)

### 4.1 Basis-Klasse: `TiLinuxView` / `TiLinuxViewProxy`

Jeder UI-Proxy enthält:
- Einen `GtkWindow`/`GtkWidget`-Zeiger als natives View
- Property-Setter, die GTK-Methoden aufrufen
- Event-Handler, die von GTK-Callbacks getriggert werden und `TiInvocation` an JavaScript weiterleiten
- Lebenszyklus-Management (create, open, close, destroy)

### 4.2 GTK4-Integration in V8-Bindings

```cpp
// Beispiel: TiLinuxButtonProxy.cpp

class TiLinuxButtonProxy : public TiLinuxViewProxy {
public:
    void SetTitle(TiInvocation inv, v8::Local<v8::Value> val);
    void SetTitle(TiInvocation inv, v8::Local<v8::Value>& ret) {
        ret = v8::String::NewFromUtf8(isolate(), title_.c_str()).ToLocalChecked();
    }

    void OnClick(GtkButton*, void* self) {
        TiLinuxButtonProxy* proxy = static_cast<TiLinuxButtonProxy*>(self);
        proxy->FireEvent("click", {});
    }

private:
    GtkButton* button_ = nullptr;
    std::string title_ = "";
};
```

### 4.3 Zuordnung: Titanium UI → GTK4

| Titanium Component | GTK4 Widget | libadwaita Widget |
|---|---|---|
| Window | `GtkWindow` | `AdwWindow` |
| View/ViewProxy | `GtkBox` | `AdwBin` |
| Label | `GtkLabel` | – |
| Button | `GtkButton` | `AdwSplitButton` |
| TextField | `GtkEntry` | `AdwEntryRow` |
| ScrollView | `GtkScrolledWindow` | – |
| ListView | `GtkListView` | `AdwListItemFactory` |
| TableView | `GtkTreeView` | – |
| WebView | `WebKitWebView` | – |
| ImageView | `GtkImage` | – |
| TabGroup | `GtkStack` | `AdwTabBar` |
| NavigationWindow | `GtkStack` | `AdwNavigationPage` |
| Toolbar | `GtkActionBar` | `AdwHeaderBar` |
| ProgressIndicator | – | `AdwProgressBar` |
| Switch | `GtkSwitch` | `AdwSwitchRow` |
| Slider | `GtkScale` | `AdwActionRow` |

### 4.4 WebKitGTK für WebView

`Ti.UI.WebView` wird über **WebKitGTK4** implementiert:
- `WebKitWebView`-Widget in ein GTK4-Fenster eingebettet
- ETag-Caching, Cookies, LocalStorage über `WebKitNetworkSession`
- JavaScript-GTK-Brücke über `webkit_web_view_run_javascript()`

---

## 5. System-API-Module

Jedes System-API-Modul muss GTK4/Linux-spezifische APIs abbilden:

| Modul | GTK4/Linux API |
|---|---|
| **Ti.Platform** | `Glib::get_os_info()`, `g_get_application_name()`, `getpwuid()` |
| **Ti.App** | `GApplication` (GTK4-App-Infrastruktur) |
| **Ti.Network** | `Gio.Socket`, `Gio.SocketClient`, `Soup3` (libsoup3 für HTTP) |
| **Ti.Filesystem** | `GIO` (GFile, GFileInputStream/OutputStream) |
| **Ti.Media** | `GStreamer` (Audio/Video), `PulseAudio`/`Pipewire` |
| **Ti.Database** | `SQLite3` (bereits als C-Dependency verfügbar) |
| **Ti.Geolocation** | `Gio.NetworkMonitor`, `systemd-logind` D-Bus, oder `freedesktop/geoclue` |
| **Ti.Locale** | `Glib::get_language()`, `gettext` |
| **Ti.Stream** | `GIO` (GMemoryInputStream/OutputStream) |
| **Ti.XML** | `Libxml2` |
| **Ti.Codec** | `Gdk-Pixbuf`, `LodePNG`, `libjpeg-turbo` |
| **Ti.Calendar** | `GData` oder D-Bus zu `evolution-data-server` |
| **Ti.Contacts** | D-Bus zu `evolution-data-server` (GNOME Contacts) |
| **Ti.Accelerometer** | `udev` oder D-Bus zu `upower`/`iio-sensor-proxy` |
| **Ti.Notification** | `libnotify` / `GNotification` |
| **Ti.Clipboard** | `GtkClipboard` |

---

## 6. CMake-Buildkonfiguration

```cmake
# linux/CMakeLists.txt (Haupt-Build)
cmake_minimum_required(VERSION 3.20)
project(titanium-linux)

# Dependencies
find_package(V8 REQUIRED)
find_package(GTK4 REQUIRED)
find_package(Libsoup 3.0)
find_package(WebKit4 REQUIRED)
find_package(GStreamer REQUIRED)
find_package(SQLite3 REQUIRED)
find_package(LibXml2 2.9)
find_package(GioUnix REQUIRED)
find_package(Notify)

# Main runtime
add_library(titanium-core
    src/api/TiApp.cpp
    src/api/TiProxy.cpp
    src/api/TiModule.cpp
    src/common/V8Host.cpp
    src/common/V8Binding.cpp
    src/common/EventBus.cpp
)
target_link_libraries(titanium-core
    ${GTK4_LIBRARIES}
    ${WEBKITGTK_LIBRARIES}
    ${V8_LIBRARIES}
)

# Each module
add_library(ti-platform MODULE
    src/modules/platform/PlatformModule.cpp
)
target_link_libraries(ti-platform titanium-core)

# Runtime binary
add_executable(titanium-runtime
    src/main.cpp
)
target_link_libraries(titanium-runtime
    titanium-core
    ti-platform
    ti-app
    ti-ui
    ...
)
```

---

## 7. JavaScript-Seite (ti.kernel.js / ti.main.js)

### 7.1 Neue Platform-Guards in `babel-plugin-transform-titanium`

```javascript
// builder.js babelOptions für Linux:
transform.Ti.Platform.osname = 'linux';
transform.Ti.Platform.name = 'linux';
transform.Ti.Platform.runtime = 'v8';
transform.Ti.Platform.manufacturer = 'linux';
transform.OS_LINUX = true;
```

### 7.2 `ti.internal`-Erweiterungen

Neue Dateien in `common/Resources/ti.internal/`:

```
ti.internal/
  linux/
    ui/
      index.js              <-- Linux-spezifische UI-Initialisierung
      view.js               <-- Linux View-Proxy-Setup
      window.js             <-- Linux Window-Proxy-Setup
    app.js                  <-- Linux App-Startup
    platform.js             <-- Linux Platform-Infos
```

### 7.3 `os.type()` für Linux

```javascript
// common/Resources/ti.internal/extensions/node/os.js
} else if (isLinux) {
    OS.type = () => 'Linux';
}
```

### 7.4 `Ti.Platform.osname`

Für Linux: `'linux'`. Keine Untervarianten wie bei iOS (`iphone`/`ipad`).

---

## 8. Test-Infrastruktur

### 8.1 TiMocha-Tests für Linux

```
tests/
  linux/
    resources/
      ti.ui.window.test.js
      ti.ui.button.test.js
      ti.ui.label.test.js
      ti.ui.webview.test.js
      ti.platform.test.js
      ...
  Utilities:
    utilities.js → add `isLinux()` und `linuxBroken()`
```

### 8.2 Test-Ausführung

- **Headless-Testmodus**: GTK4 kann mit `GDK_BACKEND=headless` headless ausgeführt werden
- **Xvfb** für X11-basierte Tests in CI
- **D-Bus Session**: Für D-Bus-Integration (Notifications, Contacts)
- **JUnit XML**: Wie Android/iOS

---

## 9. CI/CD-Integration

### 9.1 GitHub Actions-Änderungen

```yaml
# .github/workflows/linux-test.yml
name: Linux Integration Tests
on: [push, pull_request]
jobs:
  linux-tests:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libgtk-4-dev libwebkit2gtk-4.1-dev \
            libgstreamer1.0-dev libgirepository1.0-dev \
            libsoup-3.0-dev libnotify-dev libxml2-dev
      - name: Build Linux platform
        run: node ./build/scons build linux
      - name: Run integration tests
        run: npm run test:linux
```

### 9.2 Paketerzeugung

```
mobilesdk-linux/
├── titanium/
│   ├── api/              <-- Ti.* API-Definitionen
│   ├── modules/          <-- Modul-Bindings
│   └── runtime/          <-- V8 + GTK-Runtime
└── templates/
    └── linux-default/    <-- App-Template
```

---

## 10. Entwicklungs-Workflow

### 10.1 App erstellen

```bash
# CLI-Befehl (neuer Befehl)
titanium create --platform linux --template linux-default --name MyApp

# Oder bestehende App erweitern
titanium build --platform linux
```

### 10.2 `tiapp.xml`-Eintrag

```xml
<ti:app>
    <sdk-version>14.0.0</sdk-version>
    <android/>
    <iphone/>
    <ios/>
    <linux>                    <-- Neuer Bereich
        <gtk-version>4.0</gtk-version>
        <libadwaita>true</libadwaita>
        <package-name>com.example.myapp</package-name>
    </linux>
</ti:app>
```

### 10.3 Build-Prozess

```
titanium build --platform linux

1. CLI: Prozessiert tiapp.xml, generiert JS-Bundle (Rollup + Babel)
2. Build: Kompiliert linux/src/ C++-Quellen (CMake)
3. Link: Erstellt libti-platform.so, libti-ui.so, etc.
4. Package: Erzeugt SDK-Zip für Linux
5. Install: Kopiert in ~/.titanium/
```

---

## 11. Migrationspfad: Bestehende Module wiederverwenden

### 11.1 Android → Linux: Was geteilt werden kann

| Android | Linux (gemeinsam) |
|---|---|
| `babel-plugin-transform-titanium` | ✅ Identisch |
| `ti.kernel.js` / `ti.main.js` | ✅ Identisch |
| `ti.internal/node/*.js` | ✅ Identisch (NodeJS-APIs) |
| `kroll-apt/FreeMarker-Templates` | ✅ V8-Template ist plattformunabhängig |
| `common/Resources/ti.internal/` | ✅ Identisch |
| `android/modules/platform/` | 🔄 Parallele Implementierung nötig |

### 11.2 iOS → Linux: Was geteilt werden kann

| iOS | Linux (gemeinsam) |
|---|---|
| `Ti.*` API-Definitionen (apidoc/) | ✅ Identisch |
| `Ti.Platform` JS-Seite | ✅ Identisch |
| `Ti.App` JS-Seite | ✅ Identisch |
| `Ti.Network` JS-Seite | ✅ Identisch |
| `Ti.Filesystem` JS-Seite | ✅ Identisch |
| JavaScriptCore-Bindings | ❌ V8-Bindings nötig |
| `TiUIView`/`TiUIViewProxy` | 🔄 GTK4-Entsprechung |

---

## 12. Phasenplan

### Phase 1: Grundlagen (12–16 Wochen)
- [ ] `linux/`-Verzeichnisstruktur aufsetzen
- [ ] CMake-Buildsystem mit V8 und GTK4-Dependency
- [ ] `TiApp`-Klasse: Linux-Hauptprogramm, V8-Initialisierung, GTK-Initialisierung
- [ ] `TiProxy`-Basis: V8-Bindings, Event-System, Property-Management
- [ ] `TiModule`-Basis: Modul-Registrierung, Lebenszyklus
- [ ] Build-System-Integration (`build/lib/linux.js`, `builder.js`-Änderungen)
- [ ] CLI-Integration (`process-js-task.js`-Änderungen)
- [ ] `Ti.Platform`-Modul (osname, version, architecture, runtime)
- [ ] `Ti.App`-Modul (Events, Lifecycle, Preferences)
- [ ] JS-Bootstrap (`ti.kernel.js`/`ti.main.js`-Kompatibilität)

### Phase 2: UI-Grundlagen (12–16 Wochen)
- [ ] `Ti.UI.View`-Proxy (GtkBox/AdwBin)
- [ ] `Ti.UI.Window`-Proxy (AdwWindow)
- [ ] `Ti.UI.Label`-Proxy (GtkLabel)
- [ ] `Ti.UI.Button`-Proxy (GtkButton)
- [ ] `Ti.UI.TextField`-Proxy (GtkEntry)
- [ ] `Ti.UI.ScrollView`-Proxy (GtkScrolledWindow)
- [ ] Layout-System (GTK4-Alignment, Constraints)
- [ ] Event-System für UI-Komponenten (click, focus, etc.)
- [ ] `Ti.UI.TiApp`-Initialisierung (GtkApplication)

### Phase 3: Fortgeschrittene UI (12–16 Wochen)
- [ ] `Ti.UI.ListView`-Proxy (GtkListView)
- [ ] `Ti.UI.TableView`-Proxy (GtkTreeView)
- [ ] `Ti.UI.WebView`-Proxy (WebKitWebView)
- [ ] `Ti.UI.ImageView`-Proxy (GtkImage)
- [ ] `Ti.UI.TabGroup`-Proxy (GtkStack/AdwTabBar)
- [ ] `Ti.UI.NavigationWindow`-Proxy (AdwNavigationPage)
- [ ] `Ti.UI.ImageView`-Proxy (GtkImage)
- [ ] `Ti.UI.Color`-Unterstützung (GdkRGBA)
- [ ] Animations-System (GtkAnimation)

### Phase 4: System-APIs (8–12 Wochen)
- [ ] `Ti.Network`-Modul (Gio.Socket, libsoup3)
- [ ] `Ti.Filesystem`-Modul (GIO/GFile)
- [ ] `Ti.Media`-Modul (GStreamer)
- [ ] `Ti.Database`-Modul (SQLite3)
- [ ] `Ti.Locale`-Modul (Glib/Gettext)
- [ ] `Ti.Stream`-Modul (GIO)
- [ ] `Ti.XML`-Modul (Libxml2)
- [ ] `Ti.Codec`-Modul (Gdk-Pixbuf)
- [ ] `Ti.Notification`-Modul (libnotify)
- [ ] `Ti.Clipboard`-Modul (GtkClipboard)
- [ ] `Ti.Geolocation`-Modul (GeoClue)

### Phase 5: Test & CI (4–6 Wochen)
- [ ] TiMocha-Test-Infrastruktur für Linux
- [ ] Headless-Test-Setup (GDK_BACKEND=headless)
- [ ] GitHub Actions CI-Pipeline
- [ ] Testabdeckung für alle Module
- [ ] JUnit-XML-Integration

### Phase 6: Template & Packaging (4–6 Wochen)
- [ ] Linux-App-Template (`linux-default`)
- [ ] GTK4-Icons und Ressource-Management
- [ ] Flatpak-Paketierung (optional)
- [ ] AppImage-Paketierung (optional)
- [ ] Doku und Beispiele

### Phase 7: Alpha-Release (2–4 Wochen)
- [ ] SDK-Zip für Linux erstellen
- [ ] Dokumentierte API-Referenz
- [ ] Migrationsguide (Android/iOS → Linux)
- [ ] Beispiel-Apps
- [ ] Community-Feedback sammeln

---

## 13. Dependencies (Linux-Runtime)

### Core
| Paket | Version | Zweck |
|---|---|---|
| GTK4 | ≥ 4.8 | GUI-Toolkit |
| libadwaita | ≥ 1.4 | Moderne Widget-Bibliothek |
| V8 | ≥ 11.0 | JavaScript-Engine |
| WebKitGTK4 | ≥ 2.38 | WebView |
| GStreamer | ≥ 1.22 | Audio/Video |
| libsoup3 | ≥ 3.0 | HTTP/HTTPS |
| GIO/GTK4 | ≥ 4.8 | Dateisystem, Pipes, Sockets |
| SQLite3 | ≥ 3.39 | Datenbank |
| Libxml2 | ≥ 2.9 | XML-Verarbeitung |
| Gdk-Pixbuf | ≥ 2.42 | Bildverarbeitung |

### Optional
| Paket | Version | Zweck |
|---|---|---|
| GeoClue | ≥ 2.6 | Geolocation |
| libnotify | ≥ 0.8 | Benachrichtigungen |
| evolution-data-server | ≥ 3.46 | Kalender/Kontakte |
| iio-sensor-proxy | ≥ 3.0 | Beschleunigungsmesser |
| PulseAudio | ≥ 14.0 | Audio-Ausgabe |

---

## 14. Risikoanalyse

### 14.1 Technische Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| GTK4-API-Änderungen zwischen Minor-Versionen | Breaking Changes | API-Stabilitätsgarantie von GTK4 (ab 4.0 stabil) |
| V8-API-Änderungen zwischen Major-Versionen | Binding-Bruch | V8-Abstraktionsschicht (wie Node.js `node-addon-api`) |
| WebKitGTK4 JS-Engines | WebView-Inkonsistenzen | Headless-Test-Suite mit mehreren Versionen |
| D-Bus-Integration auf verschiedenen Desktops | Inkompatibilität mit KDE/Other DEs | Fallback-Implementierung (z.B. `freedesktop/geoclue` als primär) |

### 14.2 Ressourcen-Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| 48–60 Wochen Entwicklungszeit | Langer Roadmap-Horizont | Alpha nach Phase 2, Beta nach Phase 4 |
| GTK4-/V8-Experten notwendig | Enges Talente-Pool | Dokumentation, Templates, CI-Testing |
| Parallel-Wartung von 3 Plattformen | Höherer Wartungsaufwand | Maximales Code-Sharing in `common/` und `ti.internal/` |

---

## 15. Alternative Ansätze (für künftige Betrachtung)

### 5.1 Node.js-basierter Runtime

Anstatt V8 einzubetten, einen **Node.js-basierten Runtime**-Ansatz:
- **Vorteile**: Native Node.js-Module, NPM-Integration, `process`-Objekt vollständig verfügbar
- **Nachteile**: Grösseres Binary, Node.js-spezifische APIs statt Titanium-Standard
- **Geeignet für**: Apps die bereits Node.js-Code verwenden

### 5.2 Qt6-basierter Runtime

Anstatt GTK4 einen **Qt6-basierter Runtime**:
- **Vorteile**: Native KDE-Integration, bessere Cross-Platform-API, eingebettete Qt-WebEngine
- **Nachteile**: Qt-Lizenz (LGPL/Commercial), weniger JS-Integration als GTK
- **Geeignet für**: KDE-fokussierte Apps

### 5.3 Hybrid-Ansatz (GTK4 + Electron-ähnlich)

- **Vorteile**: Web-First-Entwicklung, breite Browser-Unterstützung
- **Nachteile**: Grösseres Binary, speicherintensiv
- **Geeignet für**: Web-Entwickler die native Apps bauen wollen

---

## 16. Fazit

Die Aufnahme einer Linux-Desktop-Plattform in das Titanium SDK ist **technisch machbar** und profitiert stark von der vorhandenen Architektur:

1. **V8-Bindings** sind plattformunabhängig (FreeMarker-Templates) → Code-Sharing mit Android
2. **Babel-Transform** (`babel-plugin-transform-titanium`) ist bereits plattform-agnostisch → minimale Änderungen nötig
3. **Kroll-Brücke** ist bereits als C++-Schicht implementiert → GTK4-Integration als nativer Layer
4. **GTK4 + libadwaita** sind stabil und gut dokumentiert → geringes Risiko für API-Brüche
5. **ti.internal/** bietet NodeJS-Kompatibilität → bestehende Node.js-Apps portierbar

Der **Aufwand** beträgt ca. **3000–4000 Entwicklerstunden** (16–24 Monate mit 2–3 Entwicklern) für eine Alpha bis Beta-Reife. Eine frühe Alpha (Phase 1–2) ist nach ca. **6–8 Monaten** erreichbar.
