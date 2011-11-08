/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.w3c.dom.EntityReference;

@Kroll.proxy(parentModule=XMLModule.class)
public class EntityReferenceProxy extends NodeProxy {

	public EntityReferenceProxy(EntityReference ref)
	{
		super(ref);
	}

	public EntityReferenceProxy(TiContext context, EntityReference ref)
	{
		this(ref);
	}
}
