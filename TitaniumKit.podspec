# Use the --use-libraries switch when pushing or linting this podspec

Pod::Spec.new do |s|

  s.name         = "TitaniumKit"
  s.version      = "1.0.0"
  s.summary      = "Axway Titanium iOS Core framework"

  s.description  = <<-DESC
                   The Axway Titanium iOS Core framework.
                   DESC

  s.homepage     = "https://github.com/appcelerator/titanium_mobile"
  s.license      = { :type => "Apache 2", :file => "LICENSE" }
  s.author       = 'Axway Appcelerator'

  s.platform     = :ios
  s.ios.deployment_target = '8.0'

  s.source       = { :git => "https://github.com/appcelerator/titanium_mobile.git" }

  s.vendored_libraries = 'iphone/TitaniumKit/TitaniumKit/Libraries/**/*.{a}'
  s.preserve_paths = 'iphone/TitaniumKit/TitaniumKit/Libraries/**/*.{a}'

  s.ios.weak_frameworks = 'UIKit', 'Foundation'
  s.requires_arc = false

  s.public_header_files = 'iphone/TitaniumKit/TitaniumKit/**/**/*.h'
  s.source_files = 'iphone/TitaniumKit/TitaniumKit/Sources/**/**/*.{h,m}', 'iphone/TitaniumKit/TitaniumKit/Libraries/**/*.h', 'iphone/TitaniumKit/TitaniumKit/TitaniumKit.h'
end