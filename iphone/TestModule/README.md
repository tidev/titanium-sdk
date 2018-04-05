# titanium-swift-module-poc
This is a `Proof of Concept` project that tries to use Swift to build native modules for Titanium.

> ⚠️ Warning: This project is not ready for production, yet. It was open-sourced to get more possible contribution on it. Go ahead! 

## General Challenges
- [x] Titanium used Objective-C static libraries to export module before, Swift only uses frameworks.
- [x] The module project used Xcode Configuration (.xcconfig) files to inject the header search paths
- [x] Swift frameworks require modular framework references (module-maps)
- [ ] The Titanium API loads native module by `require`'ing them. Not sure if the .framework files will even be directly recongnized by the SDK

## Open issues
- Every Titanium header (e.g. `TiModule.h`) needs to be mapped in the module-map manually
  - Could be solved by generated the module-map in a precompile `Build Script Phase`
- Symbol errors when compiling, e.g. `_OBJC_METACLASS_$_ referenced from` and `_OBJC_$_ referenced from` when trying to load Titanium classes

Code Strong! :rocket:
