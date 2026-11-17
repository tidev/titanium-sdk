package org.appcelerator.kroll.runtime.hermes;

/** Harness stand-in for the runtime class of Phase 2. It only declares the native methods. */
public class HermesRuntime
{
	public native void nativeInit(Object jsDebugger, boolean debug, boolean profilerEnabled);
	public native void nativeRunModule(String source, String filename, Object activityProxy);
	public native Object nativeEvalString(String source, String filename);
	public native boolean nativeIdle();
	public native void nativeDispose();
}
