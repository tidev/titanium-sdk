# Use the --use-libraries switch when pushing or linting this podspec

Pod::Spec.new do |s|

  s.name         = "TitaniumKit"
  s.version      = "1.0.0"
  s.summary      = "Titanium iOS Core framework"

  s.description  = <<-DESC
                   Titanium iOS Core framework.
                   DESC

  s.homepage     = "https://github.com/tidev/titanium_mobile"
  s.license      = { :type => "Apache 2", :file => "LICENSE" }
  s.author       = 'TiDev'

  s.platform     = :ios
  s.ios.deployment_target = '8.0'

  s.source       = { :git => "https://github.com/tidev/titanium_mobile.git" }

  s.vendored_libraries = 'iphone/TitaniumKit/TitaniumKit/Libraries/**/*.{a}'
  s.preserve_paths = 'iphone/TitaniumKit/TitaniumKit/Libraries/**/*.{a}'

  s.ios.weak_frameworks = 'UIKit', 'Foundation'
  s.requires_arc = false

  s.public_header_files = 'iphone/TitaniumKit/TitaniumKit/**/**/*.h'
  s.source_files = 'iphone/TitaniumKit/TitaniumKit/Sources/**/**/*.{h,m}', 'iphone/TitaniumKit/TitaniumKit/Libraries/**/*.h', 'iphone/TitaniumKit/TitaniumKit/TitaniumKit.h'
end