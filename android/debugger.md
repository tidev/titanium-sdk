Android V8 Debugger
====================

With newer versions of V8, the included debug-agent that was embedded in V8 has been removed. This means that we need to implement the functionality of the debug agent ourselves as embedders.

The role of the debug-agent is fairly simple:
- Open a port to listen for a debugger connection
- Process messages received from the debugger and forward them on to V8 via V8::Debug::SendCommand and ask V8 to process them via V8::Debug::ProcessDebugMessages()
- Process responses received from V8 and forward them on to the debugger. Hook a message handler in C++ to get called when V8 issues a message.


We achieve this using a hybrid C++, JNI, and Java implementation.


## C++
On the native side, we hook into the V8::Debug APIs.
Our implementation is almost entirely done in runtime/v8/src/native/JSDebugger.cpp

When we start up our system in V8Runtime.cpp, we call JSDebugger::Init() to initialize the debugger. There we simply grab the class/methods from Java we'll need to interact with via JNI, and record the V8::Isolate to use.

We then hook some simple methods for Java code to use to interact with the debug system: enable/disable/processDebugMessages/debugBreak/sendCommand. The JNI hooks are at the bottom of the file.

The important hook to start is enable() which hangs a MessageHandler off the V8::Debug API. This method gets called as a callback when V8 issues a response message. In turn, it calls up to Java to handle the message.

### Ti.API hooks and Studio-specific changes

It's important to note that our Studio/Titanium debugging requires special Ti.API hooks to work. When V8Runtime::debuggingEnabled is true, we add two special methods to Ti.API:
- debugBreak()
- terminate()

Studio implements process termination and process suspension by calling those methods.

## Java

On the java side, we begin in V8Runtime again and set up a JSDebugger instance if debugging is enabled. We pass that instance down to C++ V8Runtime to use as part of JSDebugger::Init.

Once the runtime is initialized, we then ask the java JSDebugger to "start()". This implementations spins up a new Thread to listen for debugger connections on the specified port via a ServerSocket.

Once we receive a connection we spin up two additional threads to handle the incoming and outgoing messages between V8 and the debugger.

### Handshake

Some debuggers (like Studio's) expect a handshake message to establish the connection. As such, we currently hard-coded a handshake message as the first message to send to the debugger after connecting.


### Handling Messages coming from V8

When we receive a V8 message via the C++ callback, that forwards the message's JSON on up to the Java JSDebugger by calling handleMessage(String).

That simply places the message in a queue. One of the two threads spun up after a connection is made simply loops on the blocking queue and grabs messages and spits them out onto the socket to go to the debugger.


### Handling messages coming from the Debugger

The second thread spun up after a connection is made simply reads lines from the debugger's stream and does very basic parsing of the message. Once the headers are stripped, we grab the JSON body and call down into C++ to do a V8::Debug::SendCommand to give the command to V8.

The next step is to call V8::Debug::ProcessDebugMessages(). We do so indirectly by using a Handler.post(Runnable) to ensure this gets called on the main thread.

### Debugger Protocol

This has a detailed overview of the V8 debug protocol. We really only need to understand the special handshake message and the general structure of messages (V8/debuggers handle the nitty gritty of specific commands):
https://github.com/buggerjs/bugger-v8-client/blob/master/PROTOCOL.md
