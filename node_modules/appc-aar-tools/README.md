# AAR Transform
Extract and copy the contents from Android Archive (.aar) files.

## Installation
`npm install appc-aar-transform`

## Usage
This module is used to extract the contents of an Android Archive (.aar) to a desired location and optionally copy any bundled assets and libraries to a new location.

```js
var AarTransformer = require('appc-aar-transform');
var transformer = new AarTransformer(logger) // logger is optional, can be any bunyan based logger
transformer.transform(options, function(err, result) {
  console.log(result.packageName); // package key from AndroidManifest.xml
  console.log(result.jars); // array of JAR files found in the Android Archive
});
```

### Options

| Option | Type | Description |
|--------|------| ------------|
| `aarPathAndFilename` | String | The path and filename pointing to the .aar file to process. |
| `outputPath` | String | Base directory where the .aar file will be extracted to. The actual content will be extracted into a sub-directory (basename of the AAR file). |
| `assetsDestinationPath` | String | (Optional) Copy all assets contained in the .aar to this path. |
| `libraryDestinationPath` | String | (Optional) Copy all libraries (.jar) contained in the .aar to this path. |
| `sharedLibraryDestinationPath` | String | (Optional) Copy all shared libraries (.so) contained in the .aar to this path. |

## Contributing

This is an open source project. Please consider forking this repo to improve,
enhance or fix issues. If you feel like the community will benefit from your
fork, please open a pull request.

To protect the interests of the contributors, Appcelerator, customers
and end users we require contributors to sign a Contributors License Agreement
(CLA) before we pull the changes into the main repository. Our CLA is simple and
straightforward - it requires that the contributions you make to any
Appcelerator open source project are properly licensed and that you have the
legal authority to make those changes. This helps us significantly reduce future
legal risk for everyone involved. It is easy, helps everyone, takes only a few
minutes, and only needs to be completed once.

[You can digitally sign the CLA](http://bit.ly/app_cla) online. Please indicate
your e-mail address in your first pull request so that we can make sure that
will locate your CLA. Once you've submitted it, you no longer need to send one
for subsequent submissions.

## License

This project is open source and provided under the [Apache Public License
(version 2)](https://tldrlegal.com/license/apache-license-2.0-(apache-2.0)).

Copyright (c) 2017, [Appcelerator](http://www.appcelerator.com/) Inc. All Rights Reserved.
