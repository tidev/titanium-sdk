/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino.modules;

import org.appcelerator.kroll.util.KrollAssetHelper;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.IdFunctionObject;
import org.mozilla.javascript.IdScriptableObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;

/**
 * A module that provides access to the Android AssetManager API
 */
public class AssetsModule extends IdScriptableObject
{
	private static final long serialVersionUID = 588171218329958799L;

	private static final String ASSETS_TAG = "Assets";

	public static void init(Scriptable scope)
	{
		AssetsModule module = new AssetsModule();
		Context context = Context.getCurrentContext();

		Scriptable holder = context.newObject(scope);
		IdFunctionObject constructor = module.exportAsJSClass(MAX_PROTOTYPE_ID, holder, false);

		Scriptable instance = constructor.construct(context, scope, ScriptRuntime.emptyArgs);
		putProperty(scope, "readAsset", getProperty(instance, "readAsset"));
		putProperty(scope, "readFile", getProperty(instance, "readFile"));
	}

	private String readAsset(Object[] args)
	{
		if (args.length < 1 || !(args[0] instanceof String)) {
			throw new IllegalArgumentException("readAsset requires an asset path");
		}

		String assetPath = (String) args[0];
		return KrollAssetHelper.readAsset(assetPath);
	}

	private String readFile(Object[] args)
	{
		if (args.length < 1 || !(args[0] instanceof String)) {
			throw new IllegalArgumentException("readFile requires a filesystem path");
		}

		String filePath = (String) args[0];
		return KrollAssetHelper.readFile(filePath);
	}

// #string_id_map#
	private final static int
		Id_constructor = 1,
		Id_readAsset = 2,
		Id_readFile = 3,
		MAX_PROTOTYPE_ID = Id_readFile;

	@Override
	protected int findPrototypeId(String s)
	{
		int id = 0;
// #generated# Last update: 2011-10-14 16:04:09 CDT
        L0: { id = 0; String X = null;
            int s_length = s.length();
            if (s_length==8) { X="readFile";id=Id_readFile; }
            else if (s_length==9) { X="readAsset";id=Id_readAsset; }
            else if (s_length==11) { X="constructor";id=Id_constructor; }
            if (X!=null && X!=s && !X.equals(s)) id = 0;
            break L0;
        }
// #/generated#
		if (id == 0) {
			return super.findPrototypeId(s);
		}
		return id;
	}
// #/string_id_map#

	@Override
	protected void initPrototypeId(int id)
	{
		String name;
		int arity;
		switch (id) {
			case Id_constructor:
				arity = 0; name = "constructor";
				break;
			case Id_readAsset:
				arity = 1; name = "readAsset";
				break;
			case Id_readFile:
				arity = 1; name = "readFile";
				break;
			default:
				super.initPrototypeId(id);
				return;
		}
		initPrototypeMethod(ASSETS_TAG, id, name, arity);
	}

	@Override
	public Object execIdCall(IdFunctionObject f,
		Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
	{
		if (!f.hasTag(ASSETS_TAG)) {
			return super.execIdCall(f, cx, scope, thisObj, args);
		}

		int id = f.methodId();
		switch (id) {
			case Id_constructor:
				return new AssetsModule();
			case Id_readAsset:
				return readAsset(args);
			case Id_readFile:
				return readFile(args);
			default:
				throw new IllegalArgumentException(String.valueOf(id));
		}
	}

	@Override
	public String getClassName()
	{
		return ASSETS_TAG;
	}

}
