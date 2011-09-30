/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.w3c.dom.Notation;

@Kroll.proxy(parentModule=XMLModule.class)
public class NotationProxy extends NodeProxy {

	private Notation notation;
	public NotationProxy(Notation notation)
	{
		super(notation);
		this.notation = notation;
	}
	
	@Kroll.getProperty @Kroll.method
	public String getPublicId() {
		return notation.getPublicId();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getSystemId() {
		return notation.getSystemId();
	}
}
