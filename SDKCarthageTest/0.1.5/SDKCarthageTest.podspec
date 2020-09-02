#
# Be sure to run `pod lib lint TestPod.podspec' to ensure this is a
# valid spec before submitting.
#
# Any lines starting with a # are optional, but their use is encouraged
# To learn more about a Podspec see https://guides.cocoapods.org/syntax/podspec.html
#

Pod::Spec.new do |s|
  s.name             = 'SDKCarthageTest'
  s.version          = '0.1.5'
  s.summary          = 'A summary description of TestPod.'

# This description is used to generate tags and improve search results.
#   * Think: What does it do? Why did you write it? What is the focus?
#   * Try to keep it short, snappy and to the point.
#   * Write the description between the DESC delimiters below.
#   * Finally, don't worry about the indent, CocoaPods strips it!

  s.description      = 'test description test description test description test description test description'

  s.homepage         = 'https://tw.yahoo.com'
  # s.screenshots     = 'www.example.com/screenshots_1', 'www.example.com/screenshots_2'
  s.license          = {"type" => "Copyright","text"=> "Copyright charlesstw. All rights reserved."}
  s.author           = { 'charlesstw' => 'charleswang@taiwanmobile.com' }
  s.source           = { :http => 'https://dl.dropboxusercontent.com/s/19paxsrh7h1jf4x/SDKCarthageTest.zip' }

  # s.social_media_url = 'https://twitter.com/<TWITTER_USERNAME>'


  s.ios.deployment_target = '8.0'  
  s.swift_version = '4.0'
  # s.subspecs         = [{"vendored_frameworks":["TWMID.framework"]}]    
  s.vendored_frameworks = 'SDKCarthageTest.framework'
  # s.public_header_files = "SDKCarthageTest-0.1.4/SDKCarthageTest.framework/Headers/*.h"
  # s.source_files = 'SDKCarthageTest.framework/Headers/*.h'
  # s.xcconfig = {"FRAMEWORK_SEARCH_PATHS" => "\"$(inherited)\"" }
  # s.preserve_paths = "SDKCarthageTest-0.1.4/SDKCarthageTest.framework"
  s.requires_arc = true
  # s.resource_bundles = {
  #   'TestPod' => ['TestPod/Assets/*.png']
  # }

  # s.public_header_files = 'Pod/SDKCarthageTest.framework/Headers/*.h'
  # s.frameworks = 'UIKit', 'MapKit'
  # s.dependency 'AFNetworking', '~> 2.3'
end
