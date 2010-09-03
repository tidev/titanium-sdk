/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.w3c.dom.Entity;

@Kroll.proxy
public class EntityProxy extends NodeProxy {

	private Entity entity;
	public EntityProxy(TiContext context, Entity entity)
	{
		super(context, entity);
		this.entity = entity;
	}
	
	@Kroll.getProperty @Kroll.method
	public String getNotationName() {
		return entity.getNotationName();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getPublicId() {
		return entity.getPublicId();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getSystemId() {
		return entity.getSystemId();
	}
}
