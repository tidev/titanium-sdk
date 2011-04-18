/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import java.io.File;
import java.io.IOException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.proxy.BufferProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;


@Kroll.module
public class StreamModule extends KrollModule
{
	@Kroll.constant public static int MODE_READ = 0;
	@Kroll.constant public static int MODE_WRITE = 1;
	@Kroll.constant public static int MODE_APPEND = 2;

	private static final String LCAT = "TiFilesystem";
	private static final boolean DBG = TiConfig.LOGD;


	public StreamModule(TiContext tiContext)
	{
		super(tiContext);
	}

	@Kroll.method
	public void read(TiStream sourceStream, BufferProxy buffer, KrollCallback resultsCallback)
	{
		// fire as async task
		//sourceStream.read(buffer);
	}

	@Kroll.method
	public void read(TiStream sourceStream, BufferProxy buffer, int offset, int length, KrollCallback resultsCallback)
	{
		// fire as async task
		//sourceStream.read(buffer, offset, length);
	}

	@Kroll.method
	public BufferProxy readAll(TiStream sourceStream) throws IOException
	{
		BufferProxy buffer = new BufferProxy(context, 1024);
		int offset = 0;

		while(true) {
			int bytesRead = sourceStream.read(buffer, offset, 1024);
			if(bytesRead == -1) {
				break;
			}

			buffer.resize(bytesRead);
			offset += bytesRead;
		}

		return buffer;
	}

	@Kroll.method
	public void readAll(TiStream sourceStream, BufferProxy buffer, KrollCallback resultsCallback)
	{
		// call as async
		int offset = 0;

		if(buffer.getLength() < 1024) {
			buffer.resize(1024);
		}

		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("source", sourceStream);

		try {
			while(true) {
				int bytesRead = sourceStream.read(buffer, offset, 1024);
				if(bytesRead == -1) {
					break;
				}

				buffer.resize(bytesRead);
				offset += bytesRead;
			}

			callbackArgs.put("errorState", "OK");
			callbackArgs.put("errorDescription", "");

		} catch (IOException e) {
			callbackArgs.put("errorState", "ERROR");
			callbackArgs.put("errorDescription", "there was an error");
		}

		callbackArgs.put("bytesProcessed", buffer.getLength());
		resultsCallback.callAsync(callbackArgs);
	}

	@Kroll.method
	public void write(TiStream outputStream, BufferProxy buffer, KrollCallback resultsCallback)
	{
		// fire as async task
		//outputStream.write(buffer);
	}

	@Kroll.method
	public void write(TiStream outputStream, BufferProxy buffer, int offset, int length, KrollCallback resultsCallback)
	{
		// fire as async task
		//outputStream.write(buffer, offset, length);
	}

	@Kroll.method
	public void writeStream(TiStream inputStream, TiStream outputStream, int maxChunkSize)
	{
		
	}

	@Kroll.method
	public void writeStream(TiStream inputStream, TiStream outputStream, int maxChunkSize, KrollCallback resultsCallback)
	{
		
	}

	@Kroll.method
	public void pump(TiStream inputStream, KrollCallback handler, int maxChunkSize)
	{
		
	}

	@Kroll.method
	public void pump(TiStream inputStream, KrollCallback handler, int maxChunkSize, boolean isAsync)
	{
		
	}
}
