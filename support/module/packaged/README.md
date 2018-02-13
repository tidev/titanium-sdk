The modules listed inside modules.json will be bundled with the SDK.

The easiest way to update this properly is to add/edit the url listing for a module and then run 'scons update-modules-integrity'. That command will re-generate JSON content with the integrity hashes filled in. The result can be copy/pasted into modules.json.

We use integrity hashes now to verify that the remote file contents match our expectations as well as to make use of local cached copies of the modules to avoid unnecessarily re-downloading them. If we've downloaded them once before and have cleared our OS temp folder location, and they match the integrity hash, we'll re-use the cached file.
