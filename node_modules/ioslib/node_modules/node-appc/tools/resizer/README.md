# Resizer

Resizer is a Java-based image resize command line tool that uses the imgscalr library.

## Building

    make

or

    javac -cp .:lib/imgscalr-lib-4.2.jar com/appcelerator/image/Resizer.java && jar cfm resizer.jar META-INF/MANIFEST.MF com/appcelerator/image/Resizer.class org/imgscalr/*.class

## Example

    java -cp .:lib/imgscalr-lib-4.2.jar -Dquiet=true resizer appicon.png favicon.png 16 16

## imgscalr

The [imgscalr](https://github.com/thebuzzmedia/imgscalr) Java-based image-scaling library is licensed under the Apache v2.0 license.
Copyright 2011 The Buzz Media, LLC.
