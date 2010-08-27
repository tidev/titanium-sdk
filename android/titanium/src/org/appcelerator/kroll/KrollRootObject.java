package org.appcelerator.kroll;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;

@Kroll.proxy
public class KrollRootObject extends KrollProxy {
	
	public KrollRootObject(TiContext context) {
		super(context);
	}
}
