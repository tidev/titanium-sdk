{
	'conditions': [
		['OS=="mac"',
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
							'/System/Library/PrivateFrameworks/MobileDevice.framework'
						],
						'mac_framework_dirs': [
							'/System/Library/PrivateFrameworks'
						],
						'include_dirs': [
							'<!(node -e "require(\'nan\')")'
						],
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
		]
	]
}