{
	'targets': [
		{
			'target_name': 'node_ios_device',
			'sources': [
				'src/ios-device.cpp',
				'src/mobiledevice.h'
			],
			'libraries': [
				'/System/Library/Frameworks/CoreFoundation.framework',
				'/System/Library/PrivateFrameworks/MobileDevice.framework',
				'../deps/boost/lib/libboost_system-mt.a',
				'../deps/boost/lib/libboost_thread-mt.a'
			],
			'mac_framework_dirs': [
				'/System/Library/PrivateFrameworks'
			],
			'include_dirs': [
				'<!(node -e "require(\'nan\')")',
				'deps/boost/include'
			],
			'cflags': [
				'-Wl,-whole-archive -lboost_system -Wl,--no-whole-archive'
			],
			'cflags!': [
				'-fno-exceptions'
			],
			'cflags_cc!': [
				'-fno-exceptions'
			],
			'xcode_settings': {
				'OTHER_CPLUSPLUSFLAGS' : [ '-std=c++11', '-stdlib=libc++' ],
				'OTHER_LDFLAGS': [ '-stdlib=libc++' ],
				'MACOSX_DEPLOYMENT_TARGET': '10.11',
				'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
			}
		},
		{
			"target_name": "action_after_build",
			"type": "none",
			"dependencies": [ "<(module_name)" ],
			"copies": [
				{
					"files": [ "<(PRODUCT_DIR)/<(module_name).node" ],
					"destination": "<(module_path)"
				}
			]
		}
	]
}
