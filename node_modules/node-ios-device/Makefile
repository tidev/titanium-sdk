NODE_GYP=node node_modules/node-gyp/bin/node-gyp

all: node iojs

node: node_v1 node_v11 node_v14 node_v46 node_v47

iojs: iojs_v42 iojs_v43 iojs_v44 iojs_v45

build = stat node_modules/node-gyp > /dev/null 2>&1 || npm install; \
        $(NODE_GYP) clean; \
        printf "%s\nBuilding for %s v%s\n%s\n" "`printf '*%.0s' {1..78}`" "$(1)" "$(3)" "`printf '*%.0s' {1..78}`"; \
        stat ~/.node-gyp/$(3) || ( \
            rm -f /tmp/$(1)-v$(3).tar.gz && \
            curl -o /tmp/$(1)-v$(3).tar.gz https://$(2)/dist/v$(3)/$(1)-v$(3).tar.gz && \
            $(NODE_GYP) install --target=$(3) --tarball=/tmp/$(1)-v$(3).tar.gz --dist-url=http://$(2)/dist && \
            rm -f /tmp/$(1)-v$(3).tar.gz \
        ); \
        $(NODE_GYP) configure --target=$(3) && \
            $(NODE_GYP) build node_ios_device

# Node.js 0.8.x
node_v1:
	$(call build,node,nodejs.org,0.8.28)

# Node.js 0.10.x
node_v11:
	$(call build,node,nodejs.org,0.10.42)

# Node.js 0.12.x
node_v14:
	$(call build,node,nodejs.org,0.12.10)

# io.js 1.0.x
iojs_v42:
	$(call build,iojs,iojs.org,1.0.4)

# io.js ^1.1.0
iojs_v43:
	$(call build,iojs,iojs.org,1.8.2)

# io.js 2.x
iojs_v44:
	$(call build,iojs,iojs.org,2.5.0)

# io.js 3.x
iojs_v45:
	$(call build,iojs,iojs.org,3.3.0)

# Node.js 4.x
node_v46:
	$(call build,node,nodejs.org,4.3.0)

# Node.js 5.x
node_v47:
	$(call build,node,nodejs.org,5.6.0)

clean:
	$(NODE_GYP) clean
	rm -rf out

.PHONY: clean node_v1 node_v11 node_v14 node_v46 node_v47 iojs_v42 iojs_v43 iojs_v44 iojs_v45
