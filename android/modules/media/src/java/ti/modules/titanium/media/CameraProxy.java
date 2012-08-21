/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;


@Kroll.proxy(creatableInModule=MediaModule.class)
public class CameraProxy extends KrollProxy
{
	private static TiCamera camera = null;
	private static CameraPreviewProxy cameraPreview = null;

	public CameraProxy()
	{
		super();

		if(camera == null) {
			camera = new TiCamera();
		}
	}

	public CameraProxy(TiContext tiContext)
	{
		this();
	}

	@Kroll.method
	public CameraPreviewProxy getPreview(KrollDict options)
	{
		if(cameraPreview == null) {
			cameraPreview = new CameraPreviewProxy();
			cameraPreview.setCamera(camera.getCamera());
			cameraPreview.handleCreationDict(options);
		}

		return cameraPreview;
	}
}


