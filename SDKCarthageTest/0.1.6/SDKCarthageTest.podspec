#
# Be sure to run `pod lib lint TestPod.podspec' to ensure this is a
# valid spec before submitting.
#
# Any lines starting with a # are optional, but their use is encouraged
# To learn more about a Podspec see https://guides.cocoapods.org/syntax/podspec.html
#

Pod::Spec.new do |s|
  s.name             = 'SDKCarthageTest'
  s.version          = '0.1.6'
  s.summary          = 'A summary description of TestPod.'
  s.description      = 'test description test description test description test description test description'
  s.homepage         = 'https://tw.yahoo.com'
  # s.screenshots     = 'www.example.com/screenshots_1', 'www.example.com/screenshots_2'
  s.license          = {"type" => "Copyright","text"=> "Copyright charlesstw. All rights reserved."}
  s.author           = { 'charlesstw' => 'charleswang@taiwanmobile.com' }
  s.source           = { :http => 'https://dl.dropboxusercontent.com/s/kxhi5xlgtp8l0q0/SDKCarthageTest-0.1.6.zip' }
  s.ios.deployment_target = '8.0'  
  s.swift_version = '4.0'  
  s.vendored_frameworks = 'SDKCarthageTest.framework'
  s.requires_arc = true
  # s.social_media_url = 'https://twitter.com/<TWITTER_USERNAME>'
  # s.subspecs         = [{"vendored_frameworks":["TWMID.framework"]}]    
  # s.resource_bundles = {
  #   'TestPod' => ['TestPod/Assets/*.png']
  # }

  # s.public_header_files = 'Pod/SDKCarthageTest.framework/Headers/*.h'
  # s.frameworks = 'UIKit', 'MapKit'
  # s.dependency 'AFNetworking', '~> 2.3'
end
