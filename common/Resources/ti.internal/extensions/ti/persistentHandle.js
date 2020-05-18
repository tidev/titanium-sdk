// Keeps an object alive until dispose() is called.
// This is currently used to keep "top level" objects
// (ex: windows, tab groups) alive until their lifecycle ends.
function PersistentHandle(object) {
	this.cell = PersistentHandle.lastId++;
	PersistentHandle.objects[this.cell] = object;
}

// Objects retained by persistent handles.
// Each element in this array acts as a storage "cell"
// keeping the object reachable and alive until it is removed.
PersistentHandle.objects = {};

PersistentHandle.lastId = 0;

PersistentHandle.prototype.dispose = function () {
	if (this.cell === -1) {
		// This handle has already been disposed.
		return;
	}

	delete PersistentHandle.objects[this.cell];
	this.cell = -1;
};

export default PersistentHandle;
