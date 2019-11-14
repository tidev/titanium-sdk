/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Warning: This file is GENERATED, and should not be modified
 */
package <%- moduleId %>;

import org.appcelerator.kroll.common.KrollSourceCodeProvider;
import org.appcelerator.kroll.util.KrollAssetHelper;

public class CommonJsSourceProvider implements KrollSourceCodeProvider
{
	public String getSourceCode()
	{
		return getSourceCode("<%- moduleId %>");
	}

	public String getSourceCode(String module)
	{
		if (module.equals("${moduleid}/<%- moduleId %>")) {
			module = "<%- moduleId %>";
		}

		return KrollAssetHelper.readAsset("Resources/<%- moduleId %>/" + module + ".js");
	}
}
