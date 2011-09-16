#include <jni.h>
#include <v8.h>

#include <KrollProxy.h>
#include "org.appcelerator.kroll.KrollProxy.h"

namespace titanium
{
	static Handle<Value> KrollProxy_extend(const Arguments& args)
	{
		HandleScope scope;
		if (args.Length() == 0) return Undefined();
		if (!args[0]->IsObject()) return Undefined();

		Local<Object> options = args[0]->ToObject();
		Local<Array> names = options->GetPropertyNames();
		int len = names->Length();

		for (int i = 0; i < len; i++)
		{
			Handle<Value> name = names->Get(i);
			args.This()->Set(name, options->Get(name));
		}

		return Undefined();
	}

	void KrollProxy_init()
	{
		HandleScope scope;
		Handle<ObjectTemplate> prototype = KrollProxy::proxyTemplate->PrototypeTemplate();
		prototype->Set(String::NewSymbol("extend"), FunctionTemplate::New(KrollProxy_extend)->GetFunction());
	}
}
