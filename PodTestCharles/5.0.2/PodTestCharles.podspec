Pod::Spec.new do |s|
  s.name = "PodTestCharles"
  s.version = "5.0.2"
  s.summary = "TAMEDIA Ads SDK."
  s.homepage = "http://wiki.tamedia.com.tw/wiki/IOS_SDK_Developer_Guide_v2"
  s.license = { "type" => "Copyright","text"=> "Copyright TWM, Inc. All rights reserved."}
  s.author = "TWM"
  s.source = {:http => "http://wiki.tamedia.com.tw/mediawiki/images/1/11/TAMediaSDK_5.0.2.zip"}
  s.platform = :ios,'7.0'
  s.source_files = 'TAMediaSDK_5.0.2/*.h'
  s.vendored_libraries = 'TAMediaSDK_5.0.2/libTWMTAMediaAdsSDK.a'
  s.resources = 'TAMediaSDK_5.0.2/*.png','TAMediaSDK_5.0.2/mute.caf'
  s.frameworks = 'AdSupport','AudioToolbox','AVFoundation','CoreGraphics','CoreTelephony','EventKit','Foundation','MessageUI','StoreKit','MediaPlayer','SystemConfiguration','UIKit','CoreAudio'
  s.xcconfig = {"LIBRARY_SEARCH_PATHS" => "\"$(PODS_ROOT)/PodTestCharles/TAMediaSDK_5.0.2\"" }
  s.requires_arc = true
end