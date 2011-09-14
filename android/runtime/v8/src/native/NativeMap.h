#ifndef NATIVE_MAP
#define NATIVE_MAP

#include <v8.h>
//#include <string>

using namespace v8;
//using namespace std;

/*class NativeMap {
private:
    Persistent<Object> jsObject;

public:
    NativeMap(Persistent<Object> jsObject);
    string get(string name);
    void set(string name, string value);
    bool has(string name);
    string* keys();

    static void process(NativeMap *map);
};*/

void NativeMap_init(Handle<Object> global);

#endif
