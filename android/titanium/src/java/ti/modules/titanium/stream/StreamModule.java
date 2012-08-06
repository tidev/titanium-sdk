/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.stream;

import java.io.IOException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.io.TiStream;

import ti.modules.titanium.BufferProxy;
import ti.modules.titanium.TitaniumModule;

@Kroll.module(parentModule=TitaniumModule.class)
public class StreamModule extends KrollModule
{
	@Kroll.constant public static final int MODE_READ = 0;
	@Kroll.constant public static final int MODE_WRITE = 1;
	@Kroll.constant public static final int MODE_APPEND = 2;

	@Kroll.method
	public Object createStream(KrollDict params)
	//public Object createStream(Object container)
	{
		Object source = params.get("source");

		Object rawMode = params.get("mode");
		if (!(rawMode instanceof Number)) {
			throw new IllegalArgumentException("Unable to create stream, invalid mode");
		}
		int mode = ((Number)rawMode).intValue();
		
		if (source instanceof TiBlob) {
			if (mode != MODE_READ) {
				throw new IllegalArgumentException("Unable to create a blob stream in a mode other than read");
			}

			return new BlobStreamProxy((TiBlob) source);

		} else if (source instanceof BufferProxy) {
			return new BufferStreamProxy((BufferProxy) source, mode);

		} else {
			throw new IllegalArgumentException("Unable to create a stream for the specified argument");
		}
	}

	@Kroll.method
	//public void read(TiStream sourceStream, BufferProxy buffer, KrollFunction resultsCallback)
	//public void read(TiStream sourceStream, BufferProxy buffer, int offset, int length, KrollFunction resultsCallback)
	public void read(Object args[])
	{
		TiStream sourceStream = null;
		BufferProxy buffer = null;
		int offset = 0;
		int length = 0;
		KrollFunction resultsCallback = null;

		if (args.length == 3 || args.length == 5) {
			if (args[0] instanceof TiStream) {
				sourceStream = (TiStream) args[0];

			} else {
				throw new IllegalArgumentException("Invalid stream argument");
			}

			if (args[1] instanceof BufferProxy) {
				buffer = (BufferProxy) args[1];
				length = buffer.getLength();

			} else {
				throw new IllegalArgumentException("Invalid buffer argument");
			}

			if (args.length == 3) {
				if (args[2] instanceof KrollFunction) {
					resultsCallback = (KrollFunction) args[2];

				} else {
					throw new IllegalArgumentException("Invalid callback argument");
				}

			} else if (args.length == 5) {
				if (args[2] instanceof Number) {
					offset = ((Number)args[2]).intValue();

				} else{
					throw new IllegalArgumentException("Invalid offset argument");
				}

				if (args[3] instanceof Number) {
					length = ((Number)args[3]).intValue();

				} else {
					throw new IllegalArgumentException("Invalid length argument");
				}

				if (args[4] instanceof KrollFunction) {
					resultsCallback = (KrollFunction) args[4];

				} else {
					throw new IllegalArgumentException("Invalid callback argument");
				}
			}

		} else {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		final TiStream fsourceStream = sourceStream;
		final BufferProxy fbuffer = buffer;
		final int foffset = offset;
		final int flength = length;
		final KrollFunction fResultsCallback = resultsCallback;

		new Thread(new Runnable() {
			public void run()
			{
				int bytesRead = -1;
				int errorState = 0;
				String errorDescription = "";

				try {
					bytesRead = fsourceStream.read(new Object[] {fbuffer, foffset, flength});


				} catch (IOException e) {
					e.printStackTrace();
					errorState = 1;
					errorDescription = e.getMessage();
				}

				fResultsCallback.callAsync(getKrollObject(), buildRWCallbackArgs(fsourceStream, bytesRead, errorState, errorDescription));
			}
		}).start();
	}

	@Kroll.method
	//public BufferProxy readAll(TiStream sourceStream) throws IOException
	//public void readAll(final TiStream sourceStream, final BufferProxy buffer, final KrollFunction resultsCallback)
	public Object readAll(Object args[]) throws IOException
	{
		TiStream sourceStream = null;
		BufferProxy bufferArg = null;
		KrollFunction resultsCallback = null;

		if (args.length == 1 || args.length == 3) {
			if (args[0] instanceof TiStream) {
				sourceStream = (TiStream) args[0];

			} else {
				throw new IllegalArgumentException("Invalid stream argument");
			}

			if (args.length == 3) {
				if (args[1] instanceof BufferProxy) {
					bufferArg = (BufferProxy) args[1];

				} else {
					throw new IllegalArgumentException("Invalid buffer argument");
				}

				if (args[2] instanceof KrollFunction) {
					resultsCallback = (KrollFunction) args[2];

				} else {
					throw new IllegalArgumentException("Invalid callback argument");
				}
			}

		} else {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		if (args.length == 1) {
			BufferProxy buffer = new BufferProxy(1024);
			int offset = 0;

			readAll(sourceStream, buffer, offset);

			return buffer;

		} else {
			final TiStream fsourceStream = sourceStream;
			final BufferProxy fbuffer = bufferArg;
			final KrollFunction fResultsCallback = resultsCallback;

			new Thread(new Runnable() {
				public void run()
				{
					int offset = 0;
					int errorState = 0;
					String errorDescription = "";

					if (fbuffer.getLength() < 1024) {
						fbuffer.resize(1024);
					}

					try {
						readAll(fsourceStream, fbuffer, offset);

					} catch (IOException e) {
						errorState = 1;
						errorDescription = e.getMessage();
					}

					fResultsCallback.callAsync(getKrollObject(), buildRWCallbackArgs(fsourceStream, fbuffer.getLength(), errorState, errorDescription));
				}
			}).start();

			return null; // TODO KrollProxy.UNDEFINED;
		}
	}

	private void readAll(TiStream sourceStream, BufferProxy buffer, int offset) throws IOException
	{
		int totalBytesRead = 0;

		while(true) {
			int bytesRead = sourceStream.read(new Object[] {buffer, offset, 1024});
			if (bytesRead == -1) {
				break;
			}

			totalBytesRead += bytesRead;
			buffer.resize(1024 + totalBytesRead);
			offset += bytesRead;
		}

		buffer.resize(totalBytesRead);
	}

	@Kroll.method
	//public void write(TiStream outputStream, BufferProxy buffer, KrollFunction resultsCallback)
	//public void write(TiStream outputStream, BufferProxy buffer, int offset, int length, KrollFunction resultsCallback)
	public void write(Object args[])
	{
		TiStream outputStream = null;
		BufferProxy buffer = null;
		int offset = 0;
		int length = 0;
		KrollFunction resultsCallback = null;

		if (args.length == 3 || args.length == 5) {
			if (args[0] instanceof TiStream) {
				outputStream = (TiStream) args[0];

			} else {
				throw new IllegalArgumentException("Invalid stream argument");
			}

			if (args[1] instanceof BufferProxy) {
				buffer = (BufferProxy) args[1];
				length = buffer.getLength();

			} else {
				throw new IllegalArgumentException("Invalid buffer argument");
			}

			if (args.length == 3) {
				if (args[2] instanceof KrollFunction) {
					resultsCallback = (KrollFunction) args[2];

				} else {
					throw new IllegalArgumentException("Invalid callback argument");
				}

			} else if (args.length == 5) {
				if (args[2] instanceof Number) {
					offset = ((Number)args[2]).intValue();

				} else{
					throw new IllegalArgumentException("Invalid offset argument");
				}

				if (args[3] instanceof Number) {
					length = ((Number)args[3]).intValue();

				} else {
					throw new IllegalArgumentException("Invalid length argument");
				}

				if (args[4] instanceof KrollFunction) {
					resultsCallback = (KrollFunction) args[4];

				} else {
					throw new IllegalArgumentException("Invalid callback argument");
				}
			}

		} else {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		final TiStream foutputStream = outputStream;
		final BufferProxy fbuffer = buffer;
		final int foffset = offset;
		final int flength = length;
		final KrollFunction fResultsCallback = resultsCallback;

		new Thread(new Runnable() {
			public void run()
			{
				int bytesWritten = -1;
				int errorState = 0;
				String errorDescription = "";

				try {
					bytesWritten = foutputStream.write(new Object[] {fbuffer, foffset, flength});

				} catch (IOException e) {
					e.printStackTrace();
					errorState = 1;
					errorDescription = e.getMessage();
				}

				fResultsCallback.callAsync(getKrollObject(), buildRWCallbackArgs(foutputStream, bytesWritten, errorState, errorDescription));
			}
		}).start();
	}

	@Kroll.method
	//public void writeStream(TiStream inputStream, TiStream outputStream, int maxChunkSize) throws IOException
	//public void writeStream(TiStream inputStream, TiStream outputStream, int maxChunkSize, KrollFunction resultsCallback)
	public int writeStream(Object args[]) throws IOException
	{
		TiStream inputStream = null;
		TiStream outputStream = null;
		int maxChunkSize = 0;
		KrollFunction resultsCallback = null;

		if (args.length == 3 || args.length == 4) {
			if (args[0] instanceof TiStream) {
				inputStream = (TiStream) args[0];

			} else {
				throw new IllegalArgumentException("Invalid input stream argument");
			}

			if (args[1] instanceof TiStream) {
				outputStream = (TiStream) args[1];

			} else {
				throw new IllegalArgumentException("Invalid output stream argument");
			}

			if (args[2] instanceof Number) {
				maxChunkSize = ((Number)args[2]).intValue();

			} else{
				throw new IllegalArgumentException("Invalid max chunk size argument");
			}

			if (args.length == 4) {
				if (args[3] instanceof KrollFunction) {
					resultsCallback = (KrollFunction) args[3];

				} else {
					throw new IllegalArgumentException("Invalid callback argument");
				}
			}

		} else {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		if (args.length == 3) {
			return writeStream(inputStream, outputStream, maxChunkSize);

		} else {
			final TiStream finputStream = inputStream;
			final TiStream foutputStream = outputStream;
			final int fmaxChunkSize = maxChunkSize;
			final KrollFunction fResultsCallback = resultsCallback;

			new Thread(new Runnable() {
				public void run()
				{
					int totalBytesWritten = 0;
					int errorState = 0;
					String errorDescription = "";

					try {
						totalBytesWritten = writeStream(finputStream, foutputStream, fmaxChunkSize);

					} catch (IOException e) {
						errorState = 1;
						errorDescription = e.getMessage();
					}

					fResultsCallback.callAsync(getKrollObject(), buildWriteStreamCallbackArgs(finputStream, foutputStream, totalBytesWritten, errorState, errorDescription));
				}
			}).start();

			return 0;
		}
	}

	private int writeStream(TiStream inputStream, TiStream outputStream, int maxChunkSize) throws IOException
	{
		BufferProxy buffer = new BufferProxy(maxChunkSize);
		int totalBytesWritten = 0;

		while(true) {
			int bytesRead = inputStream.read(new Object[] {buffer, 0, maxChunkSize});
			if (bytesRead == -1) {
				break;
			}

			int bytesWritten = outputStream.write(new Object[] {buffer, 0, bytesRead});
			totalBytesWritten += bytesWritten;
			buffer.clear();
		}

		return totalBytesWritten;
	}

	@Kroll.method
	//public void pump(TiStream inputStream, KrollFunction handler, int maxChunkSize)
	//public void pump(TiStream inputStream, KrollFunction handler, int maxChunkSize, boolean isAsync)
	public void pump(Object args[])
	{
		TiStream inputStream = null;
		KrollFunction handler = null;
		int maxChunkSize = 0;
		boolean isAsync = false;

		if (args.length == 3 || args.length == 4) {
			if (args[0] instanceof TiStream) {
				inputStream = (TiStream) args[0];

			} else {
				throw new IllegalArgumentException("Invalid stream argument");
			}

			if (args[1] instanceof KrollFunction) {
				handler = (KrollFunction) args[1];

			} else {
				throw new IllegalArgumentException("Invalid handler argument");
			}

			if (args[2] instanceof Number) {
				maxChunkSize = ((Number)args[2]).intValue();

			} else{
				throw new IllegalArgumentException("Invalid max chunk size argument");
			}

			if (args.length == 4) {
				if (args[3] instanceof Boolean) {
					isAsync = ((Boolean) args[3]).booleanValue();

				} else {
					throw new IllegalArgumentException("Invalid async flag argument");
				}
			}

		} else {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		if (isAsync)
		{
			final TiStream finputStream = inputStream;
			final KrollFunction fHandler = handler;
			final int fmaxChunkSize = maxChunkSize;

			new Thread(
					new Runnable()
					{
						public void run()
						{
							pump(finputStream, fHandler, fmaxChunkSize);
						}
					}
				) {}.start();

		} else {
			pump(inputStream, handler, maxChunkSize);
		}
	}

	private void pump(TiStream inputStream, KrollFunction handler, int maxChunkSize)
	{
		int totalBytesRead = 0;
		int errorState = 0;
		String errorDescription = "";

		try {
			while (true) {
				BufferProxy buffer = new BufferProxy(maxChunkSize);
				int bytesRead = inputStream.read(new Object[] {buffer, 0, maxChunkSize});
				if (bytesRead != -1) {
					totalBytesRead += bytesRead;
				}

				if (bytesRead != buffer.getLength()) {
					if (bytesRead == -1) {
						buffer.resize(0);

					} else {
						buffer.resize(bytesRead);
					}
				}

				handler.call(getKrollObject(), buildPumpCallbackArgs(inputStream, buffer, bytesRead, totalBytesRead, errorState, errorDescription));
				buffer = null;

				if (bytesRead == -1) {
					break;
				}
			}

		} catch (IOException e) {
			errorState = 1;
			errorDescription = e.getMessage();
			handler.call(getKrollObject(), buildPumpCallbackArgs(inputStream, new BufferProxy(), 0, totalBytesRead, errorState, errorDescription));
		}
	}

	private KrollDict buildRWCallbackArgs(TiStream sourceStream, int bytesProcessed, int errorState, String errorDescription)
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("source", sourceStream);
		callbackArgs.put("bytesProcessed", bytesProcessed);
		callbackArgs.put("errorState", errorState);
		callbackArgs.put("errorDescription", errorDescription);

		return callbackArgs;
	}

	private KrollDict buildWriteStreamCallbackArgs(TiStream fromStream, TiStream toStream, int bytesProcessed, int errorState, String errorDescription)
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("fromStream", fromStream);
		callbackArgs.put("toStream", toStream);
		callbackArgs.put("bytesProcessed", bytesProcessed);
		callbackArgs.put("errorState", errorState);
		callbackArgs.put("errorDescription", errorDescription);

		return callbackArgs;
	}

	private KrollDict buildPumpCallbackArgs(TiStream sourceStream, BufferProxy buffer, int bytesProcessed, int totalBytesProcessed, int errorState, String errorDescription)
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("source", sourceStream);
		callbackArgs.put("buffer", buffer);
		callbackArgs.put("bytesProcessed", bytesProcessed);
		callbackArgs.put("totalBytesProcessed", totalBytesProcessed);
		callbackArgs.put("errorState", errorState);
		callbackArgs.put("errorDescription", errorDescription);

		return callbackArgs;
	}
}
