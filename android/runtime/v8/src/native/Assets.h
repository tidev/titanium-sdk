#ifndef _ASSETS_H_
#define _ASSETS_H_

#include <v8.h>

namespace assets {
	
	v8::Handle<v8::Primitive> readResource(v8::Handle<v8::String> path);

}

#endif
