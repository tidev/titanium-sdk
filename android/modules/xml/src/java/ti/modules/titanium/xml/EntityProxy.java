/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.w3c.dom.Entity;

@Kroll.proxy(parentModule = XMLModule.class)
public class EntityProxy extends NodeProxy
{

	private Entity entity;

	public EntityProxy(Entity entity)
	{
		super(entity);
		this.entity = entity;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getNotationName()
	// clang-format on
	{
		return entity.getNotationName();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getPublicId()
	// clang-format on
	{
		return entity.getPublicId();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getSystemId()
	// clang-format on
	{
		return entity.getSystemId();
	}

	@Override
	public String getApiName()
	{
		return "Ti.XML.Entity";
	}
}
