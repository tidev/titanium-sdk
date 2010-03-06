package org.appcelerator.titanium.kroll;

import org.appcelerator.titanium.TiDict;

public interface IKrollCallable {

	public void call();
	public void call(Object[] args);
	public void callWithProperties(TiDict data);
}
