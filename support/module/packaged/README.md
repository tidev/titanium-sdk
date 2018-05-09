# Prepackaged Titanium Modules

The modules listed inside `modules.json` will be bundled with the Titanium SDK.

The easiest way to update this properly is to add/edit the url listing for a module and then run `node scons.js modules-integrity`.
That command will re-generate JSON content with the integrity hashes that is written to the modules.json file.

We use integrity hashes now to verify that the remote file contents match our expectations as well as to make use of local cached copies of the modules
to avoid unnecessarily re-downloading them. If we've downloaded them once before and have cleared our OS temp folder location, and they match the
integrity hash, we'll re-use the cached file, which improves the build time for compiling the SDK locally (using `node scons.js cleanbuild`).

Read more about building the Titanium SDK locally [here](https://github.com/appcelerator/titanium_mobile#building-locally).
