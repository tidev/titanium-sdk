/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.hardware.Camera;


@Kroll.proxy(parentModule=MediaModule.class)
public class CameraPreviewProxy extends TiViewProxy
{
	private static final String LCAT = "CameraPreviewProxy";

	private Camera camera;


	@Override
	public TiUIView createView(Activity activity) {
		return new TiUICameraPreview(this, camera);
	}

	public void setCamera(Camera camera)
	{
		this.camera = camera;
	}
}


