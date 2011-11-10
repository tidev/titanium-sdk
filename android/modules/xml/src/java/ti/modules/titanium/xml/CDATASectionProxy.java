/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.w3c.dom.CDATASection;

@Kroll.proxy(parentModule=XMLModule.class)
public class CDATASectionProxy extends TextProxy {

	public CDATASectionProxy(CDATASection section)
	{
		super(section);
	}

	public CDATASectionProxy(TiContext context, CDATASection section)
	{
		this(section);
	}
}
