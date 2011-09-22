#ifndef EVENT_LISTENER_H
#define EVENT_LISTENER_H

#include <v8.h>

namespace titanium {

class EventListener
{
public:
	static v8::Handle<v8::Value> handleEvent(const v8::Arguments& args);
};

}

#endif
