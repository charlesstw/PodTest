function ViewerSchemeUtils(config) {
    //viewer Scheme
    var iosViewerScheme = config.iosViewerScheme;
    var androidPhoneScheme = config.androidPhoneScheme;
    var androidPadScheme = config.androidPadScheme;
    //download page
    var iosPhoneDownload = config.iosPhoneDownload;
    var iosPadDownload = config.iosPadDownload;    
    var _send = function(os) {
        os = os || "all";
        if (window.navigator.userAgent.match(/iPhone|iPad/) && (os == "all" || os == "ios"))
        {
            if(iosViewerScheme) {
                location.href = iosViewerScheme;
            }

            if (window.navigator.userAgent.match(/iPhone/)) {
                evn = iosPhoneDownload;
            }
            
            if (window.navigator.userAgent.match(/iPad/)) {
                evn = iosPhoneDownload;
            }
            
            setTimeout(function() {
                location.href = evn;
            }, 100);
            
            return true;
        } else if (window.navigator.userAgent.match(/Android/) && (os == "all" || os == "android")) {
            if (window.navigator.userAgent.match(/Mobile/)) {
                location.href = androidPhoneScheme;
            } else {
                location.href = androidPhoneScheme;
            }
            return true;
        } else {
            return false;
        }
    };
    this.send = _send;
}
;
