# TitaniumKit
This project moves the Titanium iOS-Core to an own framework called `TitaniumKit`. It's primary purposes
and challenges are described below.

## About this Project

### Reasons

- Improved compile-time (78+ headers will be precompiled)
- Swift module-support (Swift requires [module-based](https://clang.llvm.org/docs/Modules.html) Obj-C sources)

### Challenges

- Decouple circular dependencies
- Migrate precompile-macros
- Migrate `extern NSString * const` to use shared-config
- Need to remove TiJSCore + Kroll-Thread

### Current State

- [x] All relevant headers have been ported to the framework
- [x] TiJSCore has been removed completely, using JSCore now
- [x] Kroll-Thread has been removed completely, using Main-Thread now 
- [x] Some public headers (`TiProxy`, `TiViewProxy`, `TiModule`, ...) have been exposed for testing
- [x] Migrating precompile-macros

## Build from Source
Either build through Xcode using the "Distribution" target, or use Carthage to build a zipped version of the framework:
```sh
carthage build --archive
```

## Authors
[@hansemannn](https://github.com/hansemannn), Axway
[@janvennemann](https://github.com/janvennemann), Axway

## Copyright
&copy; 2017 - present, Axway

## License
Apache 2
