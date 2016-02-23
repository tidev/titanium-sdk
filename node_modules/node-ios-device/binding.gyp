{
	'targets': [
		{
			'target_name': 'node_module_version',
			'type': 'executable',
			'sources': [
				'src/node-module-version.cpp'
			]
		},
		{
			'target_name': 'node_ios_device',
			'dependencies': [ 'node_module_version' ],
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
			'xcode_settings': {
				'OTHER_CPLUSPLUSFLAGS' : [ '-std=c++11', '-stdlib=libc++' ],
				'OTHER_LDFLAGS': [ '-stdlib=libc++' ],
				'MACOSX_DEPLOYMENT_TARGET': '10.7'
			},
			'postbuilds': [
				{
					'postbuild_name': 'Copy release to output directory',
					'action': [
						'sh',
						'../dist.sh',
						'${BUILT_PRODUCTS_DIR}/${EXECUTABLE_PATH}',
						'${SRCROOT}/out'
					]
				}
			]
		}
	]
}
