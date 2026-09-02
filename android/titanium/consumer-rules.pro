# ProGuard/R8 rules bundled into "titanium.aar" and applied to apps that enable code shrinking.

# The @Kroll.* annotations are retained in the compiled class files (CLASS retention) so that Gradle can
# compile Java incrementally, but the annotation classes themselves ("kroll-apt") are compile-time only and
# never ship with the app. Tell R8 not to fail on these missing classes. It strips the annotations anyway.
-dontwarn org.appcelerator.kroll.annotations.**
