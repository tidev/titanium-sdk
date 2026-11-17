/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <memory>
#include <string>
#include <vector>

#include "../AndroidUtil.h"
#include "../JNIUtil.h"
#include "../JSException.h"
#include "../JSUtil.h"
#include "../TiRuntime.h"
#include "../TypeConverter.h"
#include "ScriptsModule.h"

#define TAG "ScriptsModule"

namespace titanium {

// Script.runInThisContext(code, filename, displayError)
// The JS kernel calls this to turn the source of a module into a function.
static jsi::Value runInThisContext(jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count)
{
	if (count < 1 || !args[0].isString()) {
		throw jsi::JSError(rt, "needs at least 'code' argument.");
	}
	std::string filename = "evalmachine.<anonymous>";
	if (count > 1 && args[1].isString()) {
		filename = args[1].getString(rt).utf8(rt);
	}
	try {
		// A runtime error leaves this function as a JS exception.
		return JSUtil::executeString(rt, args[0].getString(rt).utf8(rt), filename);
	} catch (const jsi::JSINativeException& error) {
		// Hermes reports a script that does not compile with a native exception.
		// JS code expects a SyntaxError, like V8 throws.
		jsi::Value syntaxError = rt.global().getPropertyAsFunction(rt, "SyntaxError")
			.callAsConstructor(rt, jsi::String::createFromUtf8(rt, error.what()));
		throw jsi::JSError(rt, std::move(syntaxError));
	}
}

// The memory of a bytecode file while Hermes runs from it.
class BytecodeBuffer : public jsi::Buffer
{
public:
	explicit BytecodeBuffer(size_t size)
		: bytes_(size)
	{
	}

	size_t size() const override
	{
		return bytes_.size();
	}

	const uint8_t* data() const override
	{
		return bytes_.data();
	}

	uint8_t* writableData()
	{
		return bytes_.data();
	}

private:
	std::vector<uint8_t> bytes_;
};

// Script.runBytecodeAsset(assetPath, filename)
// Runs an asset if it is Hermes bytecode and returns { value: <result> }.
// Returns undefined if the app has no bytecode or if the asset is not bytecode. The caller then
// reads the asset as source text.
static jsi::Value runBytecodeAsset(jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count)
{
	if (!TiRuntime::bytecodeEnabled || count < 1 || !args[0].isString()) {
		return jsi::Value::undefined();
	}

	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		JSException::GetJNIEnvironmentError(rt);
	}

	jstring assetPath = TypeConverter::jsStringToJavaString(rt, env, args[0].getString(rt));
	jbyteArray assetData = (jbyteArray) env->CallStaticObjectMethod(
		JNIUtil::krollAssetHelperClass,
		JNIUtil::krollAssetHelperReadAssetMethod,
		assetPath);
	env->DeleteLocalRef(assetPath);
	if (env->ExceptionCheck()) {
		env->ExceptionClear();
		return jsi::Value::undefined();
	}
	if (!assetData) {
		return jsi::Value::undefined();
	}

	jsize length = env->GetArrayLength(assetData);
	std::shared_ptr<BytecodeBuffer> buffer = std::make_shared<BytecodeBuffer>((size_t) length);
	if (length > 0) {
		env->GetByteArrayRegion(assetData, 0, length, reinterpret_cast<jbyte*>(buffer->writableData()));
	}
	env->DeleteLocalRef(assetData);

	if (!TiRuntime::isHermesBytecode(buffer->data(), buffer->size())) {
		return jsi::Value::undefined();
	}

	std::string filename = count > 1 && args[1].isString() ? args[1].getString(rt).utf8(rt) : std::string("bytecode");
	jsi::Object result(rt);
	result.setProperty(rt, "value", rt.evaluateJavaScript(buffer, filename));
	return result;
}

// Hermes has one global object per runtime. It cannot create a second script context.
static jsi::Value unsupported(jsi::Runtime& rt, const jsi::Value&, const jsi::Value*, size_t)
{
	throw jsi::JSError(rt, "The Hermes runtime supports Script.runInThisContext() only. It has no separate script contexts.");
}

void ScriptsModule::Initialize(jsi::Runtime& rt, const jsi::Object& target)
{
	// The kernel uses the static function only. "new Script(code)" is not supported.
	jsi::Function script = JSUtil::hostFunction(rt, "Script", 1, unsupported);
	JSUtil::setMethod(rt, script, "runInThisContext", 3, runInThisContext);
	JSUtil::setMethod(rt, script, "runBytecodeAsset", 2, runBytecodeAsset);
	JSUtil::setMethod(rt, script, "runInContext", 3, unsupported);
	JSUtil::setMethod(rt, script, "runInNewContext", 3, unsupported);
	JSUtil::setMethod(rt, script, "createContext", 1, unsupported);
	JSUtil::setMethod(rt, script, "disposeContext", 1, unsupported);
	target.setProperty(rt, "Script", script);
}

void ScriptsModule::Dispose(jsi::Runtime& rt)
{
}

} // namespace titanium
