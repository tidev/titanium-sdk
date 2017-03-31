package org.appcelerator.kroll.runtime.v8;

import java.lang.ref.ReferenceQueue;
import java.lang.ref.WeakReference;
import java.util.HashMap;

import org.appcelerator.kroll.KrollProxySupport;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.common.Log;

public final class ReferenceTable
{
	private static String TAG = "ReferenceTable";

	/**
	 * A simple Map used to hold strong/weak reference to the Java objects we have
	 * paired/wrapped in native titanium::Proxy/JavaObject instances.
	 */
	private static HashMap<Integer, Object> references = new HashMap<Integer, Object>();

	/**
	 * Incrementing key, used to generate new keys when a new strong reference is
	 * created.
	 * FIXME Handle "wrapping" the value around to Integer.MIN_VALUE when
	 * Integer.MAX_VALUE is reached? What if we ever reach back up to 0 - we need to skip it!
	 */
	private static int lastKey = 1;
	/**
	 *  Use a ReferenceQueue to track the WeakReferences that get killed, when we
	 *  get one kill off the matching JS object in native code!
	 */
	private static ReferenceQueue<Object> refQueue = new ReferenceQueue<Object>();

	/**
	 * This is a special WeakReference subclass that attempts to delete the
	 * associated native C++ titanium::Proxy instance once we know the paired Java
	 * object has been GC'd in the JVM.
	 */
	static class ReferenceWithCleanup extends WeakReference<Object> {

		/**
		 * The "pointer" to the native proxy. If set to 0, means we don't have a
		 * valid proxy, or the proxy was already deleted.
		 */
		private long pointer;

		ReferenceWithCleanup(Object obj, ReferenceQueue<Object> queue) {
			super(obj, queue);
			if (obj instanceof KrollProxySupport) {
				KrollProxySupport proxy = (KrollProxySupport) obj;
				KrollObject ko = proxy.getKrollObject();
				if (ko instanceof V8Object) {
					V8Object v8 = (V8Object) ko;
					pointer = v8.getPointer();
				} else {
					pointer = 0;
				}
			} else {
				pointer = 0;
			}
		}

		/**
		 * We already know we deleted the native proxy (due to ReferenceTable#destroyReference)
		 * so set the pointer value to 0 so we don't try to delete it again.
		 */
		void abort() {
			pointer = 0;
		}

		/**
		 * Here we do the equivalent of V8Object.nativeRelease. We kill the native
		 * proxy because we know the Java object has been GC'd.
		 * @return true if we delet the native proxy, false otherwise.
		 */
		boolean cleanUp() {
			if (pointer != 0) {
				return ReferenceTable.nativeRelease(pointer);
			}
			return false;
		}
	}

	/**
	 * Returns a GC'd reference that we can clean up natively (or null if none available)
	 */
	static ReferenceWithCleanup poll()
	{
		return (ReferenceWithCleanup) refQueue.poll();
	}

	/**
	 * Creates a new strong reference. Done when attaching a native Proxy to a
	 * Java object.
	 * @param object the object to reference and retain
	 * @return an unique key for this reference
	 */
	public static int createReference(Object object)
	{
		int key = lastKey++;
		Log.d(TAG, "Creating strong reference for key: " + key, Log.DEBUG_MODE);
		references.put(key, object);
		return key;
	}

	/**
	 * Destroy the reference in our map. Done when we're deleting the native proxy.
	 * @param key the key for the reference to destroy.
	 */
	public static void destroyReference(int key)
	{
		Log.d(TAG, "Destroying reference under key: " + key, Log.DEBUG_MODE);
		Object obj = references.remove(key);
		if (obj instanceof ReferenceWithCleanup) {
			// We know we're deleting the native proxy already, so tell the weak reference stuff not to delete it again
			ReferenceWithCleanup ref = (ReferenceWithCleanup) obj;
			ref.abort(); // don't try and clean up the native proxy
			obj = ref.get();
		}
		// If it's an V8Object, set the ptr to 0, because the proxy is dead on C++ side
		// This *should* prevent the native code from trying to reconstruct the proxy for any reason
		if (obj instanceof KrollProxySupport) {
			KrollProxySupport proxy = (KrollProxySupport) obj;
			KrollObject ko = proxy.getKrollObject();
			if (ko instanceof V8Object) {
				V8Object v8 = (V8Object) ko;
				v8.setPointer(0);
			}
		}
	}

	/**
	 * Makes the reference "weak" which allows it to be
	 * collected if no other references remain.
	 * @param key the key for the reference to weaken.
	 */
	public static void makeWeakReference(int key)
	{
		Log.d(TAG, "Downgrading to weak reference for key: " + key, Log.DEBUG_MODE);
		Object ref = references.get(key);
		references.put(key, new ReferenceWithCleanup(ref, refQueue));
	}

	/**
	 * Make the reference strong again to prevent future collection.
	 * This method will return null if the weak reference was
	 * invalidated and the object collected.
	 * @param key the key for the reference.
	 * @return the referenced object if the reference is still valid.
	 */
	public static Object clearWeakReference(int key)
	{
		Log.d(TAG, "Upgrading weak reference to strong for key: " + key, Log.DEBUG_MODE);
		Object ref = getReference(key);
		references.put(key, ref);
		return ref;
	}

	/**
	 * Returns the referenced object if it's still 'alive'. It may have been a
	 * WeakReference that has been GC'd, in which case we'd return null.
	 * @param key the key of the reference.
	 * @return the object if the reference is still valid, otherwise null.
	 */
	public static Object getReference(int key)
	{
		Object ref = references.get(key);
		if (ref instanceof WeakReference) {
			ref = ((WeakReference<?>)ref).get();
		}
		return ref;
	}

	// JNI method prototypes
	private static native boolean nativeRelease(long pointer);
}
