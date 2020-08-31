#
# Be sure to run `pod lib lint TestPod.podspec' to ensure this is a
# valid spec before submitting.
#
# Any lines starting with a # are optional, but their use is encouraged
# To learn more about a Podspec see https://guides.cocoapods.org/syntax/podspec.html
#

Pod::Spec.new do |s|
  s.name             = 'TestPod'
  s.version          = '0.1.2'
  s.summary          = 'A short description of TestPod.'

# This description is used to generate tags and improve search results.
#   * Think: What does it do? Why did you write it? What is the focus?
#   * Try to keep it short, snappy and to the point.
#   * Write the description between the DESC delimiters below.
#   * Finally, don't worry about the indent, CocoaPods strips it!

  s.description      = <<-DESC
TODO: Add long description of the pod here.
                       DESC

  s.homepage         = 'https://github.com/charlesstw/TestPod'
  # s.screenshots     = 'www.example.com/screenshots_1', 'www.example.com/screenshots_2'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'charlesstw' => 'charleswang@taiwanmobile.com' }
  s.source           = { :http => "https://dl.dropboxusercontent.com/s/4sbwh06m9gnqq1s/SDKCarthageTest.framework.zip"}
  # s.social_media_url = 'https://twitter.com/<TWITTER_USERNAME>'

  s.ios.deployment_target = '8.0'  
  s.swift_version = "5.0"
  # s.subspecs         = [{"vendored_frameworks":["TWMID.framework"]}]    
  s.vendored_frameworks = "Build/iOS/TWMID.framework"
  # s.resource_bundles = {
  #   'TestPod' => ['TestPod/Assets/*.png']
  # }

  # s.public_header_files = 'Pod/TWMID.framework/Headers/*.h'
  # s.frameworks = 'UIKit', 'MapKit'
  # s.dependency 'AFNetworking', '~> 2.3'
end
