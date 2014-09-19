/**
 * Appcelerator Titanium License
 * This source code and all modifications done by Appcelerator
 * are licensed under the Apache Public License (version 2) and
 * are Copyright (c) 2009-2014 by Appcelerator, Inc.
 */

#import "TiHyperloopHelper.h"
#import "TiCore.h"
#import <string>

namespace Hyperloop
{
	class AbstractObject
	{
	public:
		AbstractObject(void* data)
		: data{data}
		{
		}
		
		~AbstractObject()
		{
		}
		
		void* getData() const
		{
			return data;
		}
		
		void setData(void* data)
		{
			this->data = data;
		}
		
		void* getObject() const
		{
			return nullptr;
		}
		
	private:
		void * data;
	};
	
	template <typename T>
	class NativeObject : public AbstractObject
	{
	public:
		NativeObject(T &t)
		: object(t), AbstractObject{nullptr}, owning{false}
		{
		}		
		NativeObject(T &t, bool own)
		: object(t), AbstractObject{nullptr}, owning{own}
		{
		}
		~NativeObject<T>()
		{
		}
		T& getObject() {
			return object;
		}
		void release();
		void retain();
		std::string toString(TiContextRef, TiContextRef*);
		double toNumber(TiContextRef, TiContextRef*);
		bool toBoolean(TiContextRef, TiContextRef*);
		bool hasInstance(TiContextRef, TiContextRef, TiValueRef*);
	private:
		T object;
		bool owning;
	};
};


@implementation TiHyperloopHelper

// WARNING!
// Code taken from hyperloop, do not modify. Only update if hyperloop changes
+(id)GetObjectFromHyperloopPointer:(void *)pointer
{
	// Gets the abstract object from the pointer or null it can't cast it
	auto po1 = static_cast<Hyperloop::AbstractObject*>(pointer);
	if(po1 == nullptr) return nil;
	// Cast the object to a NativeObject of type `void*`
	auto po2 = static_cast<Hyperloop::NativeObject<void *> *>(po1);
	if(po2 == nullptr) return nil;
	
	// Extract the data
	void * obj = po2->getObject();
	// Try to get an Objective-C class out of the pointer
	Class objcClass = *((Class *)obj);
	// Return nil if it not an Objective-C class
	if(objcClass == nil) {
		return nil;
	}
	// cast the object to an `id` and return it.
	return static_cast<id>(obj);
}
@end
