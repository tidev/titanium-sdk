package org.appcelerator.kroll.runtime.hermes;

import java.lang.ref.WeakReference;
import java.util.HashMap;

import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;

/**
 * Holds the Java proxies that the native runtime refers to by key.
 *
 * A reference is strong, or it is "armed". An armed reference is weak, and the proxy holds a
 * canary object. When no Java code holds the proxy anymore, the garbage collector runs the
 * finalizer of the canary. A finalizer can make its object reachable again: the canary puts
 * the proxy back with a strong reference and tells the native runtime. From then on, the JS
 * side decides how long the proxy pair lives. See titanium::Proxy in Proxy.h.
 */
public final class ReferenceTable
{
	// How long getReference() waits for a canary that the finalizer thread did not run yet.
	private static final long RESURRECT_TIMEOUT_MS = 2000;

	private static final HashMap<Long, Object> references = new HashMap<>(1024);
	private static long lastKey = 1;

	/** A weak reference that a canary watches. */
	private static final class ArmedReference extends WeakReference<Object>
	{
		ArmedReference(Object referent)
		{
			super(referent);
		}
	}

	/** Reachable from its proxy only. Its finalizer runs when Java code dropped the proxy. */
	private static final class Canary
	{
		private final long key;
		private final long proxyId;
		private final Object proxy;
		private final ArmedReference armed;

		Canary(long key, long proxyId, Object proxy, ArmedReference armed)
		{
			this.key = key;
			this.proxyId = proxyId;
			this.proxy = proxy;
			this.armed = armed;
		}

		@Override
		protected void finalize() throws Throwable
		{
			try {
				ReferenceTable.resurrect(this);
			} finally {
				super.finalize();
			}
		}
	}

	private static HermesObject hermesObjectOf(Object object)
	{
		if (object instanceof KrollProxy) {
			KrollObject krollObject = ((KrollProxy) object).getKrollObject();
			if (krollObject instanceof HermesObject) {
				return (HermesObject) krollObject;
			}
		}
		return null;
	}

	public static synchronized long createReference(Object object)
	{
		long key = lastKey++;
		references.put(key, object);
		return key;
	}

	public static synchronized void destroyReference(long key)
	{
		Object object = resolve(references.get(key));
		HermesObject hermesObject = hermesObjectOf(object);
		if (hermesObject != null) {
			hermesObject.setPointer(0);
			hermesObject.canary = null;
		}
		references.remove(key);
		ReferenceTable.class.notifyAll();
	}

	/** Makes the reference weak and gives the proxy a canary. */
	public static synchronized void armReference(long key, long proxyId)
	{
		Object entry = references.get(key);
		Object object = resolve(entry);
		if (object == null) {
			return;
		}
		HermesObject hermesObject = hermesObjectOf(object);
		if (hermesObject == null) {
			// No place for the canary. The reference stays strong, and the pair lives until
			// the runtime shuts down.
			references.put(key, object);
			return;
		}
		ArmedReference armed = new ArmedReference(object);
		references.put(key, armed);
		hermesObject.canary = new Canary(key, proxyId, object, armed);
	}

	/** Called by the finalizer of a canary, on the finalizer thread. */
	private static void resurrect(Canary canary)
	{
		synchronized (ReferenceTable.class)
		{
			if (references.get(canary.key) != canary.armed) {
				// The reference was destroyed or armed again. This canary is out of date.
				return;
			}
			references.put(canary.key, canary.proxy);
			HermesObject hermesObject = hermesObjectOf(canary.proxy);
			if (hermesObject != null && hermesObject.canary == canary) {
				hermesObject.canary = null;
			}
			ReferenceTable.class.notifyAll();
		}
		nativeJavaUnreachable(canary.proxyId);
	}

	public static synchronized void makeWeakReference(long key)
	{
		Object object = resolve(references.get(key));
		references.put(key, new WeakReference<>(object));
	}

	public static synchronized void makeSoftReference(long key)
	{
		makeWeakReference(key);
	}

	public static synchronized Object clearReference(long key)
	{
		Object object = getReference(key);
		references.put(key, object);
		return object;
	}

	public static synchronized Object getReference(long key)
	{
		Object entry = references.get(key);
		if (!(entry instanceof ArmedReference)) {
			return resolve(entry);
		}
		Object object = ((ArmedReference) entry).get();
		if (object != null) {
			return object;
		}
		// The garbage collector cleared the weak reference, but the canary did not run yet.
		// The proxy is still alive. Wait until the canary puts it back.
		long deadline = System.currentTimeMillis() + RESURRECT_TIMEOUT_MS;
		while (references.get(key) == entry) {
			long remaining = deadline - System.currentTimeMillis();
			if (remaining <= 0) {
				return null;
			}
			try {
				ReferenceTable.class.wait(remaining);
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				return null;
			}
		}
		return resolve(references.get(key));
	}

	public static synchronized boolean isStrongReference(long key)
	{
		return !(references.get(key) instanceof WeakReference);
	}

	public static synchronized int size()
	{
		return references.size();
	}

	private static Object resolve(Object entry)
	{
		if (entry instanceof WeakReference) {
			return ((WeakReference<?>) entry).get();
		}
		return entry;
	}

	private static native void nativeJavaUnreachable(long proxyId);
}
