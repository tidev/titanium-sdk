# Hot Reload

Hot reload sends changed project files to a running development app and restarts the JavaScript runtime. You do not build or install the app again.

## How to enable it

Add the `--hot-reload` flag to a build that starts the app:

```sh
ti build -p android -T emulator --hot-reload
ti build -p android -T device --hot-reload
ti build -p ios -T simulator --hot-reload
```

Keep the `ti build` process open. The server stops when the process ends.

The build ignores the flag in these cases:

- Android: the deploy type is `production`.
- iOS: the target is not `simulator`.
- Both platforms: the `--build-only` flag is set.

## Architecture

Hot reload has three parts: a server in the CLI, a client in the app, and an override directory that the native asset loader reads.

```
project files --watch--> server (CLI) --TCP 8325--> client (app) --> override directory --> restart
```

### Build

The build does three things when the flag is set:

1. It turns off the JS encryption, because the app must load single files from disk.
2. It writes `_hot_reload_.json` into the app. The file holds the host, the port, and a random token for this build.
3. It copies `client.js` into the app as `ti.hotreload.bootstrap.js` and adds it to the bootstrap list.

The native asset loader turns on the override directory only if `_hot_reload_.json` is in the app package.

### Server

The server starts in the `build.post.compile` hook, before the app starts. It listens on `127.0.0.1:8325`.

- It records a hash of each file in `Resources` as the baseline. A file in a platform directory replaces the file of the same name.
- It watches `Resources`. It collects the changes of 150 ms into one patch.
- It sends only JS and JSON files. The app reads all other files from the app package.
- It also watches `tiapp.xml`, `i18n`, `platform`, and `modules`. If one of these files or a resource of another type changes, the server logs a warning. The warning tells the user to build the app again, and the app does not restart.
- For an Alloy project, it also watches `app` and runs `alloy compile`. The compiler writes to `Resources`, and the server sends the result.
- It does not run the compiler for a file under `app` that needs a build, for example an image or an `i18n` file. It logs the same warning.
- It applies the JS transform of the build to each changed JS file. If a file has a syntax error, the server sends no patch.
- It sends a new require index when a JS or JSON file is new or removed. `require()` finds a file only if the index lists it.

### Client

The client connects to the server and sends the token and its manifest. The manifest is one hash of all project files.

- If the token is wrong, the server rejects the app and the client stops.
- If the manifest does not match, the server tells the client to delete all overrides. Then it sends each difference from the build.
- For each patch, the client writes the files to the override directory and calls `Ti.App._restart()`.
- If the connection closes, the client connects again after 2 seconds.

### Override directory

The directory is `hot-reload` in the cache directory of the app:

| Path | Content |
| --- | --- |
| `files/Resources/` | The changed files |
| `files/index.json` | The require index, if a file is new or removed |
| `manifest` | The manifest of the last patch |
| `install-<id>` | A marker for one install. The loader deletes the directory when the marker does not match. |

The marker uses the update time of the APK on Android and the build token on iOS.

### Connection

| Target | Host in the app | How it gets to the server |
| --- | --- | --- |
| Android emulator | `10.0.2.2` | The emulator maps this address to the host machine. |
| Android device | `127.0.0.1` | The hook runs `adb reverse tcp:8325 tcp:8325` for each device. |
| iOS simulator | `127.0.0.1` | The simulator uses the network of the host machine. |

### Protocol

Each frame is a `uint32` header length (big endian), a JSON header, and an optional body of `header.size` bytes. The header comment in `cli/lib/hot-reload/server.js` lists the messages.

## Files

| File | What it does |
| --- | --- |
| `cli/lib/hot-reload/server.js` | The server: file watcher, diff, Alloy compile, patch frames, protocol. |
| `cli/lib/hot-reload/client.js` | The client. It runs in the app, receives patches, writes the override directory, and restarts. |
| `cli/tests/test-hot-reload-server.js` | Mocha tests for the server. |
| `android/cli/hooks/hot-reload.js` | Starts the server for Android and runs `adb reverse` for devices. |
| `iphone/cli/hooks/hot-reload.js` | Starts the server for iOS. |
| `android/cli/commands/_build.js` | The `--hot-reload` flag and `writeHotReloadFiles()` for Android. |
| `iphone/cli/commands/_build.js` | The `--hot-reload` flag and `writeHotReloadFiles()` for iOS. |
| `android/runtime/common/src/java/org/appcelerator/kroll/util/KrollAssetHelper.java` | Reads the override directory before the APK assets. |
| `iphone/TitaniumKit/TitaniumKit/Sources/API/TiHost.m` | Finds the override directory and the override file for a resource. |
| `iphone/TitaniumKit/TitaniumKit/Sources/API/AssetsModule.m` | Reads the override of a JS or JSON file and of the require index. |
| `iphone/Classes/TiNetworkSocketTCPProxy.m` | Fix for a crash when the socket closes just before the restart. |

Run the server tests with this command:

```sh
npx mocha cli/tests/test-hot-reload-server.js
```

## Todos

- Variable port. The port is always 8325, so a second build at the same time cannot start its server. Add an option or use a free port.
- iOS device support. The server listens on `127.0.0.1` only. A device needs the LAN address of the host machine and the local network permission.
- macOS target. The iOS build accepts the flag for `simulator` only.
- Other file types. Only JS and JSON files change in the app on both platforms. On Android, `TiFileHelper` and the media classes open images, fonts, and media from the APK directly. On iOS, only `AssetsModule` reads the override directory. The server sends no patch for these files and tells the user to build the app again.
- Webpack projects. The server does not watch the Webpack output.
- `adb reverse` after a reconnect. The hook sets the port forward one time after the build. A device that connects again loses it.
- State after a restart. The app starts again from `app.js`. A reload of one module or one window does not exist.
- Unused messages. The server handles `log` and `ping`, but the client sends neither. Send app errors to the CLI or remove the handlers.
- Tests. Only the server has tests. The client and the native loaders have none.
- User documentation. The flag is not in the CLI documentation or the changelog.
