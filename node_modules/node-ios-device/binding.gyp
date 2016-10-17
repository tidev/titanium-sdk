{
	'targets': [
		{
			'target_name': 'node_ios_device',
			'sources': [
				'src/device.h',
				'src/device.cpp',
				'src/message.h',
				'src/mobiledevice.h',
				'src/node-ios-device.cpp',
				'src/runloop.h',
				'src/runloop.cpp',
				'src/util.h',
				'src/util.cpp'
			],
			'libraries': [
				'/System/Library/Frameworks/CoreFoundation.framework',
				'/System/Library/PrivateFrameworks/MobileDevice.framework'
			],
			'mac_framework_dirs': [
				'/System/Library/PrivateFrameworks'
			],
			'include_dirs': [
				'<!(node -e "require(\'nan\')")'
			],
			'cflags': [
				'-Wl,-whole-archive -Wl,--no-whole-archive'
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
			'target_name': 'action_after_build',
			'type': 'none',
			'dependencies': [ '<(module_name)' ],
			'copies': [
				{
					'files': [ '<(PRODUCT_DIR)/<(module_name).node' ],
					'destination': '<(module_path)'
				}
			]
		}
	]
}
