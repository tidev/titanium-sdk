package org.appcelerator.kroll;

import org.appcelerator.titanium.TiContext;
import org.mozilla.javascript.Scriptable;

public interface KrollBindings {
	public void initBindings(TiContext context, Scriptable scope, KrollProxy proxy);
	public KrollProxyBinding getBinding(Class<? extends KrollProxy> proxyClass);
	public KrollProxyBinding getBinding(KrollProxy proxy);
}
