(function() {
	console.log("MRAID object loading...");

	/***************************************************************************
	 * console logging helper
	 **************************************************************************/

	var LogLevelEnum = {
		"DEBUG"   : 0,
		"INFO"    : 1,
		"WARNING" : 2,
		"ERROR"   : 3,
		"NONE"    : 4
	};

	var logLevel = LogLevelEnum.NONE;
	var log = {};

	log.d = function(msg) {
		if (logLevel <= LogLevelEnum.DEBUG) {
			console.log("(D-mraid.js) " + msg);
		}
	};

	log.i = function(msg) {
		if (logLevel <= LogLevelEnum.INFO) {
			console.log("(I-mraid.js) " + msg);
		}
	};

	log.w = function(msg) {
		if (logLevel <= LogLevelEnum.WARNING) {
			console.log("(W-mraid.js) " + msg);
		}
	};

	log.e = function(msg) {
		if (logLevel <= LogLevelEnum.ERROR) {
			console.log("(E-mraid.js) " + msg);
		}
	};

	/***************************************************************************
	 * MRAID declaration
	 **************************************************************************/
	var mraid = window.mraid = {};
	

	/***************************************************************************
	 * constants
	 **************************************************************************/

	var VERSION = "2.0";

	var STATES = mraid.STATES = {
		"LOADING" : "loading",
		"DEFAULT" : "default",
		"EXPANDED" : "expanded",
		"RESIZED" : "resized",
		"HIDDEN" : "hidden"
	};

	var PLACEMENT_TYPES = mraid.PLACEMENT_TYPES = {
		"INLINE" : "inline",
		"INTERSTITIAL" : "interstitial"
	};

	var RESIZE_PROPERTIES_CUSTOM_CLOSE_POSITION = mraid.RESIZE_PROPERTIES_CUSTOM_CLOSE_POSITION = {
		"TOP_LEFT" : "top-left",
		"TOP_CENTER" : "top-center",
		"TOP_RIGHT" : "top-right",
		"CENTER" : "center",
		"BOTTOM_LEFT" : "bottom-left",
		"BOTTOM_CENTER" : "bottom-center",
		"BOTTOM_RIGHT" : "bottom-right"
	};

	var ORIENTATION_PROPERTIES_FORCE_ORIENTATION = mraid.ORIENTATION_PROPERTIES_FORCE_ORIENTATION = {
		"PORTRAIT" : "portrait",
		"LANDSCAPE" : "landscape",
		"NONE" : "none"
	};

	var EVENTS = mraid.EVENTS = {
		"ERROR" : "error",
		"READY" : "ready",
		"SIZECHANGE" : "sizeChange",
		"STATECHANGE" : "stateChange",
		"VIEWABLECHANGE" : "viewableChange"
		//"EXPOSURECHANGE" : "exposureChange", //Mraid 3.0
		//"AUDIOVOLUMECHANGE" : "audioVolumeChange" //Mraid 3.0
	};
	
	var VPAID_EVENTS = mraid.VPAID_EVENTS = [
		"AdStarted",
		"AdPlaying",
		"AdPaused",
		"AdVideoStart",
		"AdVideoFirstQuartile",
		"AdVideoMidpoint",
		"AdVideoThirdQuartile",
		"AdVideoComplete",
		"AdDurationChange",
		"AdImpression",
		"AdClickThru",
		"AdInteraction",
		"AdUserAcceptInvitation",
		"AdUserMinimize",
		"AdUserClose",
		"AdLog",
		"AdError"
	];

	var SUPPORTED_FEATURES = mraid.SUPPORTED_FEATURES = {
		"SMS" : "sms",
		"TEL" : "tel",
		"CALENDAR" : "calendar",
		"STOREPICTURE" : "storePicture",
		"INLINEVIDEO" : "inlineVideo",
		"VPAID": "vpaid",
		"TAMEDIA_BASE": "tamedia-base",
		"TAMEDIA_VIDEO": "tamedia-video",
		"TAMEDIA_VIBRATE": "tamedia-vibrate",
		"TAMEDIA_CALENDAR": "tamedia-calendar",
		"TAMEDIA_CAMERA": "tamedia-camera",
		"TAMEDIA_FLASH": "tamedia-flash",
		"TAMEDIA_MIC": "tamedia-mic",
		"TAMEDIA_PROXIMITY": "tamedia-proximity",
		"TAMEDIA_FLOAT": "tamedia-float"
	};

	/***************************************************************************
	 * state
	 **************************************************************************/

	var state = STATES.LOADING;
	var placementType = PLACEMENT_TYPES.INLINE;
	
	// set supported module for all SDK
	var supportedFeatures = {};
	supportedFeatures[SUPPORTED_FEATURES.SMS] = true;
	supportedFeatures[SUPPORTED_FEATURES.TEL] = true;
	supportedFeatures[SUPPORTED_FEATURES.CALENDAR] = true;
	supportedFeatures[SUPPORTED_FEATURES.INLINEVIDEO] = true;
	supportedFeatures[SUPPORTED_FEATURES.TAMEDIA_BASE] = true;
	supportedFeatures[SUPPORTED_FEATURES.TAMEDIA_VIDEO] = true;
	supportedFeatures[SUPPORTED_FEATURES.TAMEDIA_VIBRATE] = true;
	supportedFeatures[SUPPORTED_FEATURES.TAMEDIA_CALENDAR] = true;
	supportedFeatures[SUPPORTED_FEATURES.TAMEDIA_CAMERA] = true;
	supportedFeatures[SUPPORTED_FEATURES.TAMEDIA_FLASH] = true;
	supportedFeatures[SUPPORTED_FEATURES.TAMEDIA_PROXIMITY] = true;
	supportedFeatures[SUPPORTED_FEATURES.TAMEDIA_FLOAT] = true;
	
	var isViewable = false;
	var isExpandPropertiesSet = false;
	var isResizeReady = false;

	var expandProperties = {
		"width" : 0,
		"height" : 0,
		"useCustomClose" : false,
		"isModal" : true
	};

	var orientationProperties = {
		"allowOrientationChange" : true,
		"forceOrientation" : ORIENTATION_PROPERTIES_FORCE_ORIENTATION.NONE
	};

	var resizeProperties = {
		"width" : 0,
		"height" : 0,
		"customClosePosition" : RESIZE_PROPERTIES_CUSTOM_CLOSE_POSITION.TOP_RIGHT,
		"offsetX" : 0,
		"offsetY" : 0,
		"allowOffscreen" : true
	};

	var currentPosition = {
		"x" : 0,
		"y" : 0,
		"width" : 0,
		"height" : 0
	};

	var defaultPosition = {
		"x" : 0,
		"y" : 0,
		"width" : 0,
		"height" : 0
	};

	var maxSize = {
		"width" : 0,
		"height" : 0
	};

	var screenSize = {
		"width" : 0,
		"height" : 0
	};

	var currentOrientation = 0;

	var listeners = {};

	var vpaidObject = null;

	/***************************************************************************
	 * "official" API: methods called by creative
	 **************************************************************************/

	mraid.addEventListener = function(event, listener) {
		log.i("mraid.addEventListener " + event + ": " + String(listener));
		if (!event || !listener) {
			mraid.fireErrorEvent("Both event and listener are required.", "addEventListener");
			return;
		}
		if (!contains(event, EVENTS)) {
			mraid.fireErrorEvent("Unknown MRAID event: " + event, "addEventListener");
			return;
		}
		var listenersForEvent = listeners[event] = listeners[event] || [];
		// check to make sure that the listener isn't already registered
		for (var i = 0; i < listenersForEvent.length; i++) {
			var str1 = String(listener);
			var str2 = String(listenersForEvent[i]);
			if (listener === listenersForEvent[i] || str1 === str2) {
				log.i("listener " + str1 + " is already registered for event " + event);
				return;
			}
		}
		listenersForEvent.push(listener);
	};

	mraid.createCalendarEvent = function(parameters) {
		log.i("mraid.createCalendarEvent with " + parameters);
		if (supportedFeatures[mraid.SUPPORTED_FEATURES.CALENDAR]) {
			if(getSdkVer() >= 6){
				// for new SDK
				callNative("createCalendarEvent?eventJSON="	+ JSON.stringify(parameters));
			}else{
				// for old SDK
				if(typeof parameters === 'object'){
					var title = "", 
						startTimeStr = "", 
						endTimeStr = "", 
						address = "",
						description = "";
					
					
					if(typeof parameters.description === "string"){
						title = parameters.description; // MRAID的description是title 
					}
					if(typeof parameters.summary === 'string'){
						description = parameters.summary;
					}	
					if(typeof parameters.start === 'string'){
						try{
							var dStart = new Date(parameters.start);
							startTimeStr = twmParseDate(dStart);
						}catch(e){
							log.e("mraid.createCalendarEvent: "+e);
							mraid.fireErrorEvent(e,"mraid.createCalendarEvent");
						}
					}
					if(typeof parameters.end === 'string'){
						try{
							var dEnd = new Date(parameters.end);
							endTimeStr = twmParseDate(dEnd);
						}catch(e){
							log.e("mraid.createCalendarEvent: "+e);
							mraid.fireErrorEvent(e,"mraid.createCalendarEvent");
						}
					}
					if(typeof parameters.location === 'string'){
						address = parameters.location;
					}
					
					console.log("title:" + title +", startTimeStr:" + startTimeStr + ", endTimeStr:" + endTimeStr + ", address:" + address);
					addCalendarEvent(title, startTimeStr, endTimeStr, address, description);
					//stopBubble(e);
				}
			}
		} else {
			log.e("createCalendarEvent is not supported");
			mraid.fireErrorEvent("CreateCalendarEvent is not supported.","mraid.createCalendarEvent");
		}
	};

	mraid.close = function() {
		log.i("mraid.close");

		// SDK >= 6 代表SDK可支援mraid function
		if(getSdkVer() >= 6){
			if (state === STATES.LOADING
				|| (state === STATES.DEFAULT && placementType === PLACEMENT_TYPES.INLINE)
				|| state === STATES.HIDDEN) {
				// do nothing
				return;
			}
			callNative("close");
		} else{
			handleClose();
		}
	};

	mraid.expand = function(url) {
		if (url === undefined) {
			log.i("mraid.expand (1-part)");
		} else {
			log.i("mraid.expand " + url);
		}
		
		if(getSdkVer() >= 6){
			// The only time it is valid to call expand is when the ad is
			// a banner currently in either default or resized state.
			if (placementType !== PLACEMENT_TYPES.INLINE
					|| (state !== STATES.DEFAULT && state !== STATES.RESIZED)) {
				return;
			}
			if (url === undefined) {
				callNative("expand");
			} else {
				callNative("expand?url=" + encodeURIComponent(url));
			}
		}else{
			mraid.fireErrorEvent("The SDK is not support expand function.", "mraid.expand")
		}
	};

	mraid.getCurrentPosition = function() {
		log.i("mraid.getCurrentPosition");
		return currentPosition;
	};

	mraid.getDefaultPosition = function() {
		log.i("mraid.getDefaultPosition");
		return defaultPosition;
	};

	mraid.getExpandProperties = function() {
		log.i("mraid.getExpandProperties");
		return expandProperties;
	};

	mraid.getMaxSize = function() {
		log.i("mraid.getMaxSize");
		return maxSize;
	};

	mraid.getOrientationProperties = function() {
		log.i("mraid.getOrientationProperties");
		return orientationProperties;
	};

	mraid.getPlacementType = function() {
		log.i("mraid.getPlacementType");
		return placementType;
	};

	mraid.getResizeProperties = function() {
		log.i("mraid.getResizeProperties");
		return resizeProperties;
	};

	mraid.getScreenSize = function() {
		log.i("mraid.getScreenSize");
		return screenSize;
	};

	mraid.getState = function() {
		log.i("mraid.getState");
		return state;
	};

	mraid.getVersion = function() {
		log.i("mraid.getVersion");
		return VERSION;
	};

	mraid.isViewable = function() {
		log.i("mraid.isViewable");
		return isViewable;
	};

	mraid.open = function(url) {
		
		log.i("mraid.open " + url);
		if(typeof url === 'string' && url.length > 0){
			if(getSdkVer() >= 6){
				callNative("open?url=" + encodeURIComponent(url));
			}else{
				// for old SDK
				openUrl(url);
				
			}
		}else{
			// for old SDK
			handleClick();
		}
	};

	mraid.playVideo = function(url) {
		log.i("mraid.playVideo " + url);
		if(getSdkVer() >= 6){
			callNative("playVideo?url=" + encodeURIComponent(url));
		}else{
			mraid.fireErrorEvent("The SDK is not support playVideo function.", "mraid.playVideo");
		}
	};

	mraid.removeEventListener = function(event, listener) {
		log.i("mraid.removeEventListener " + event + " : " + String(listener));
		if (!event) {
			mraid.fireErrorEvent("Event is required.", "removeEventListener");
			return;
		}
		if (!contains(event, EVENTS)) {
			mraid.fireErrorEvent("Unknown MRAID event: " + event, "removeEventListener");
			return;
		}
		if (listeners.hasOwnProperty(event)) {
			if (listener) {
				var listenersForEvent = listeners[event];
				// try to find the given listener
				var len = listenersForEvent.length;
				for (var i = 0; i < len; i++) {
					var registeredListener = listenersForEvent[i];
					var str1 = String(listener);
					var str2 = String(registeredListener);
					if (listener === registeredListener || str1 === str2) {
						listenersForEvent.splice(i, 1);
						break;
					}
				}
				if (i === len) {
					log.i("listener " + str1 + " not found for event " + event);
				}
				if (listenersForEvent.length === 0) {
					delete listeners[event];
				}
			} else {
				// no listener to remove was provided, so remove all listeners
				// for given event
				delete listeners[event];
			}
		} else {
			log.i("no listeners registered for event " + event);
		}
	};

	mraid.resize = function() {
		log.i("mraid.resize");
		if(getSdkVer() >= 6){
			// The only time it is valid to call resize is when the ad is
			// a banner currently in either default or resized state.
			// Trigger an error if the current state is expanded.
			if (placementType === PLACEMENT_TYPES.INTERSTITIAL || state === STATES.LOADING || state === STATES.HIDDEN) {
				// do nothing
				return;
			}
			if (state === STATES.EXPANDED) {
				mraid.fireErrorEvent("mraid.resize called when ad is in expanded state", "mraid.resize");
				return;
			}
			if (!isResizeReady) {
				mraid.fireErrorEvent("mraid.resize is not ready to be called", "mraid.resize");
				return;
			}
			callNative("resize");
		}else{
			mraid.fireErrorEvent("The SDK is not support resize function.", "mraid.resize");
		}
	};

	mraid.setExpandProperties = function(properties) {
		log.i("mraid.setExpandProperties");
		
		if(getSdkVer() < 6){
			mraid.fireErrorEvent("The SDK is not support setExpandProperties function.", "mraid.setExpandProperties");
			return;
		}
		
		if (!validate(properties, "setExpandProperties")) {
			log.e("failed validation");
			return;
		}

		var oldUseCustomClose = expandProperties.useCustomClose;

		// expandProperties contains 3 read-write properties: width, height, and useCustomClose;
		// the isModal property is read-only
		var rwProps = [ "width", "height", "useCustomClose" ];
		for (var i = 0; i < rwProps.length; i++) {
			var propname = rwProps[i];
			if (properties.hasOwnProperty(propname)) {
				expandProperties[propname] = properties[propname];
			}
		}

		// In MRAID v2.0, all expanded ads by definition cover the entire screen,
		// so the only property that the native side has to know about is useCustomClose.
		// (That is, the width and height properties are not needed by the native code.)
		if (expandProperties.useCustomClose !== oldUseCustomClose) {
			callNative("useCustomClose?useCustomClose="	+ expandProperties.useCustomClose);
		}
		
		isExpandPropertiesSet = true;
	};

	mraid.setOrientationProperties = function(properties) {
		log.i("mraid.setOrientationProperties");

		if (!validate(properties, "setOrientationProperties")) {
			log.e("failed validation");
			return;
		}

		var newOrientationProperties = {};
		newOrientationProperties.allowOrientationChange = orientationProperties.allowOrientationChange,
		newOrientationProperties.forceOrientation = orientationProperties.forceOrientation;

		// orientationProperties contains 2 read-write properties:
		// allowOrientationChange and forceOrientation
		var rwProps = [ "allowOrientationChange", "forceOrientation" ];
		for (var i = 0; i < rwProps.length; i++) {
			var propname = rwProps[i];
			if (properties.hasOwnProperty(propname)) {
				newOrientationProperties[propname] = properties[propname];
			}
		}

		// Setting allowOrientationChange to true while setting forceOrientation
		// to either portrait or landscape
		// is considered an error condition.
		if (newOrientationProperties.allowOrientationChange
				&& newOrientationProperties.forceOrientation !== mraid.ORIENTATION_PROPERTIES_FORCE_ORIENTATION.NONE) {
			mraid.fireErrorEvent(
					"allowOrientationChange is true but forceOrientation is "
					+ newOrientationProperties.forceOrientation,
					"setOrientationProperties");
			return;
		}

		orientationProperties.allowOrientationChange = newOrientationProperties.allowOrientationChange;
		orientationProperties.forceOrientation = newOrientationProperties.forceOrientation;

		if(getSdkVer() >= 6){
			var params = "allowOrientationChange="
					+ orientationProperties.allowOrientationChange
					+ "&forceOrientation=" + orientationProperties.forceOrientation;

			callNative("setOrientationProperties?" + params);
		}else{
			// for old SDK
			if(newOrientationProperties.allowOrientationChange){
				mraid.fireErrorEvent("The old sdk cannot support function to lock screen","mraid.setOrientationProperties");
			}else if(newOrientationProperties.forceOrientation === mraid.ORIENTATION_PROPERTIES_FORCE_ORIENTATION.LANDSCAPE){
				changeOrientation(0); // landscape
			}else if(newOrientationProperties.forceOrientation === mraid.ORIENTATION_PROPERTIES_FORCE_ORIENTATION.PORTRAIT){
				changeOrientation(1); // portrait
			}else{
				mraid.fireErrorEvent("The value of the properties is undefined.", "mraid.setOrientationProperties");
			}
		}
	};

	mraid.setResizeProperties = function(properties) {
		log.i("mraid.setResizeProperties");
		
		if(getSdkVer() < 6){
			mraid.fireErrorEvent("The SDK is not support setResizeProperties function.", "mraid.setResizeProperties");
			return;
		}
		
		isResizeReady = false;

		// resizeProperties contains 6 read-write properties:
		// width, height, offsetX, offsetY, customClosePosition, allowOffscreen

		// The properties object passed into this function must contain width, height, offsetX, offsetY.
		// The remaining two properties are optional.
		var requiredProps = [ "width", "height", "offsetX", "offsetY" ];
		for (var i = 0; i < requiredProps.length; i++) {
			var propname = requiredProps[i];
			if (!properties.hasOwnProperty(propname)) {
				mraid.fireErrorEvent(
						"required property " + propname + " is missing",
						"mraid.setResizeProperties");
				return;
			}
		}
		
		if (!validate(properties, "setResizeProperties")) {
			mraid.fireErrorEvent("failed validation", "mraid.setResizeProperties");
			return;
		}
		
        var adjustments = { "x": 0, "y": 0 };
		
		var allowOffscreen = properties.hasOwnProperty("allowOffscreen") ? properties.allowOffscreen : resizeProperties.allowOffscreen;
        if (!allowOffscreen) {
            if (properties.width > maxSize.width || properties.height > maxSize.height) {
                mraid.fireErrorEvent("resize width or height is greater than the maxSize width or height", "mraid.setResizeProperties");
                return;
            }
            adjustments = fitResizeViewOnScreen(properties);
        } else if (!isCloseRegionOnScreen(properties)) {
            mraid.fireErrorEvent("close event region will not appear entirely onscreen", "mraid.setResizeProperties");
            return;
        }
		
		var rwProps = [ "width", "height", "offsetX", "offsetY", "customClosePosition", "allowOffscreen" ];
		for (var i = 0; i < rwProps.length; i++) {
			var propname = rwProps[i];
			if (properties.hasOwnProperty(propname)) {
				resizeProperties[propname] = properties[propname];
			}
		}
		
		var params =
			"width=" + resizeProperties.width +
			"&height=" + resizeProperties.height +
	        "&offsetX=" + (resizeProperties.offsetX + adjustments.x) +
	        "&offsetY=" + (resizeProperties.offsetY + adjustments.y) +
			"&customClosePosition=" + resizeProperties.customClosePosition +
			"&allowOffscreen=" + resizeProperties.allowOffscreen;

		callNative("setResizeProperties?" + params);

		isResizeReady = true;
	};

	mraid.storePicture = function(url) {
		log.i("mraid.storePicture " + url);
		if (supportedFeatures[mraid.SUPPORTED_FEATURES.STOREPICTURE]) {
			callNative("storePicture?url=" + encodeURIComponent(url));
		} else {
			log.e("storePicture is not supported");
			mraid.fireErrorEvent("The SDK is not support storePicture function.", "mraid.setResizeProperties");		
		}
	};

	mraid.supports = function(feature) {
		log.i("mraid.supports " + feature + " " + supportedFeatures[feature]);
		var retval = supportedFeatures[feature];
		if (typeof retval === "undefined") {
			retval = false;
		}
		return retval;
	};

	mraid.useCustomClose = function(isCustomClose) {
		log.i("mraid.useCustomClose " + isCustomClose);
		
		if (expandProperties.useCustomClose !== isCustomClose) {
			expandProperties.useCustomClose = isCustomClose;
			
			if(getSdkVer() >= 6){
				callNative("useCustomClose?useCustomClose="
						+ expandProperties.useCustomClose);
			}else{
				if(isCustomClose){
					disableCloseButton();
				}
			}
		}
	};

	// Mraid + Vpaid
    mraid.initVpaid = function(vObj){
        if(getSdkVer() < 6){
            mraid.fireErrorEvent("The SDK is not support initVpaid function.","mraid.initVpaid");
            return;
        }

        vpaidObject = vObj;
		
        if(typeof vpaidObject != "undefined" && vpaidObject != null) {
		
            // Register listener
            mraid.VPAID_EVENTS.forEach(function(event) {
                log.i('[mraid.js -> AD] Register VPAID event: '+event);
                vpaidObject.subscribe(function() {
                    log.i('[AD -> mraid.js] '+ event + ' is triggered.', arguments);
					callNative("reportVpaidEvent?vpaidEvent=" +  event );
                }, event);
            });
	
			
			// Start
			vpaidObject.subscribe(function() {
				vpaidState.isPlaying = true;
				vpaidState.isEnd = false;
			}, "AdStarted");

			// Resume
			vpaidObject.subscribe(function() {
				vpaidState.isPause = false;
			}, "AdPlaying");

			// Pause
			vpaidObject.subscribe(function() {
				vpaidState.isPause = true;
			}, "AdPaused");
			
			// End
			vpaidObject.subscribe(function() {
				 vpaidState.isPlaying = false;
				 vpaidState.isEnd = true;
			 }, "AdVideoComplete");
			 
			
			// if ad has shown, trigger startAd
			if(mraid.isViewable()){
				vpaidObject.startAd();
			}
			
        }

        // detect viewable change event to control video, like play, resume, pause
        mraid.addEventListener(mraid.EVENTS.VIEWABLECHANGE, function(isViewable){
            if(typeof vpaidObject != "undefined" && vpaidObject != null){
                if( isViewable && !vpaidState.isPlaying && !vpaidState.isPause && !vpaidState.isEnd){
                    // In first play, all flags of vpaid is false
                    vpaidObject.startAd();
                } else if( isViewable && vpaidState.isPlaying && vpaidState.isPause && !vpaidState.isEnd ) {
                    vpaidObject.resumeAd();
                } else if ( !isViewable && vpaidState.isPlaying && !vpaidState.isPause && !vpaidState.isEnd) {
                    vpaidObject.pauseAd();
                }
            }
        });
    };

	/***************************************************************************
	 * helper methods called by SDK
	 **************************************************************************/

	// setters to change state
	mraid.setCurrentPosition = function(x, y, width, height) {
		log.i("mraid.setCurrentPosition " + x + "," + y + "," + width + ","	+ height);

		var previousSize = {};
		previousSize.width = currentPosition.width;
		previousSize.height = currentPosition.height;
		log.i("previousSize " + previousSize.width + "," + previousSize.height);

		currentPosition.x = x;
		currentPosition.y = y;
		currentPosition.width = width;
		currentPosition.height = height;

		if (width !== previousSize.width || height !== previousSize.height) {
			mraid.fireSizeChangeEvent(width, height);
		}
	};

	mraid.setDefaultPosition = function(x, y, width, height) {
		log.i("mraid.setDefaultPosition " + x + "," + y + "," + width + ","	+ height);
		defaultPosition.x = x;
		defaultPosition.y = y;
		defaultPosition.width = width;
		defaultPosition.height = height;
	};

	mraid.setExpandSize = function(width, height) {
		log.i("mraid.setExpandSize " + width + "x" + height);
		expandProperties.width = width;
		expandProperties.height = height;
	};

	mraid.setMaxSize = function(width, height) {
		log.i("mraid.setMaxSize " + width + "x" + height);
		maxSize.width = width;
		maxSize.height = height;
	};

	mraid.setPlacementType = function(pt) {
		log.i("mraid.setPlacementType " + pt);
		placementType = pt;
	};

	mraid.setScreenSize = function(width, height) {
		log.i("mraid.setScreenSize " + width + "x" + height);
		screenSize.width = width;
		screenSize.height = height;
		if (!isExpandPropertiesSet) {
			expandProperties.width = width;
			expandProperties.height = height;;
		}
	};

	mraid.setSupports = function(feature, supported) {
		log.i("mraid.setSupports " + feature + " " + supported);
		supportedFeatures[feature] = supported;
	};

	// methods to fire events

	mraid.fireErrorEvent = function(message, action) {
		log.i("mraid.fireErrorEvent " + message + " " + action);
		fireEvent(mraid.EVENTS.ERROR, message, action);
	};

	mraid.fireReadyEvent = function() {
		log.i("mraid.fireReadyEvent");
		fireEvent(mraid.EVENTS.READY);
	};

	mraid.fireSizeChangeEvent = function(width, height) {
		log.i("mraid.fireSizeChangeEvent " + width + "x" + height);
		if (state !== mraid.STATES.LOADING) {
			fireEvent(mraid.EVENTS.SIZECHANGE, width, height);
		}
	};

	mraid.fireStateChangeEvent = function(newState) {
		log.i("mraid.fireStateChangeEvent " + newState);
		if (state !== newState) {
			state = newState;
			fireEvent(mraid.EVENTS.STATECHANGE, state);
		}
	};

	mraid.fireViewableChangeEvent = function(newIsViewable) {
		log.i("mraid.fireViewableChangeEvent " + newIsViewable);
		if (isViewable !== newIsViewable) {
			isViewable = newIsViewable;
			fireEvent(mraid.EVENTS.VIEWABLECHANGE, isViewable);
		}
	};

	mraid.fireVpaidStartAd = function(){
	    log.i("mraid.fireVpaidStartAd");
	    if(typeof vpaidObject != 'undefined' && vpaidObject != null)
	        vpaidObject.startAd();
	};
	
	// Mraid 3.0
	/*mraid.fireExposureChangeEvent = function(exposedPercentage, visibleRectangle, occlusionRectangles) {
		log.i("mraid.fireExposureChangeEvent("+exposedPercentage+","+visibleRectangle+","+occlusionRectangles+")");
		fireEvent(mraid.EVENTS.EXPOSURECHANGE, exposedPercentage, visibleRectangle, occlusionRectangles);
	};
	
	mraid.fireAudioVolumeChange = function(volumePercentage) {
		log.i("mraid.fireAudioVolumeChange("+ volumePercentage +")");
		fireEvent(mraid.EVENTS.AUDIOVOLUMECHANGE, volumePercentage);
	};*/

	/***************************************************************************
	 * internal helper methods
	 **************************************************************************/

	function callNative(command) {
		var iframe = document.createElement("IFRAME");
		iframe.setAttribute("src", "mraid://" + command);
		document.documentElement.appendChild(iframe);
		iframe.parentNode.removeChild(iframe);
		iframe = null;
	};

	function fireEvent(event) {
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		log.i("fireEvent " + event + " [" + args.toString() + "]");
		var eventListeners = listeners[event];
		if (eventListeners) {
			var len = eventListeners.length;
			log.i(len + " listener(s) found");
			for (var i = 0; i < len; i++) {
				eventListeners[i].apply(null, args);
			}
		} else {
			log.i("no listeners found");
		}
	};

	function contains(value, array) {
		for ( var i in array) {
			if (array[i] === value) {
				return true;
			}
		}
		return false;
	};

	// The action parameter is a string which is the name of the setter function
	// which called this function
	// (in other words, setExpandPropeties, setOrientationProperties, or
	// setResizeProperties).
	// It serves both as the key to get the the appropriate set of validating
	// functions from the allValidators object
	// as well as the action parameter of any error event that may be thrown.
	function validate(properties, action) {
		var retval = true;
		var validators = allValidators[action];
		for (var prop in properties) {
			var validator = validators[prop];
			var value = properties[prop];
			if (validator && !validator(value)) {
				mraid.fireErrorEvent("Value of property " + prop + " (" + value	+ ") is invalid", "mraid." + action);
				retval = false;
			}
		}
		return retval;
	};

	var allValidators = {
		"setExpandProperties" : {
			// In MRAID 2.0, the only property in expandProperties we actually care about is useCustomClose.
			// Still, we'll do a basic sanity check on the width and height properties, too.
			"width" : function(width) {
				return !isNaN(width);
			},
			"height" : function(height) {
				return !isNaN(height);
			},
			"useCustomClose" : function(useCustomClose) {
				return (typeof useCustomClose === "boolean");
			}
		},
		"setOrientationProperties" : {
			"allowOrientationChange" : function(allowOrientationChange) {
				return (typeof allowOrientationChange === "boolean");
			},
			"forceOrientation" : function(forceOrientation) {
				var validValues = [ "portrait", "landscape", "none" ];
				return (typeof forceOrientation === "string" && validValues.indexOf(forceOrientation) !== -1);
			}
		},
		"setResizeProperties" : {
			"width" : function(width) {
				return !isNaN(width) && 50 <= width;
			},
			"height" : function(height) {
				return !isNaN(height) && 50 <= height;
			},
			"offsetX" : function(offsetX) {
				return !isNaN(offsetX);
			},
			"offsetY" : function(offsetY) {
				return !isNaN(offsetY);
			},
			"customClosePosition" : function(customClosePosition) {
				var validPositions = [ "top-left", "top-center", "top-right",
				                       "center",
				                       "bottom-left", "bottom-center",	"bottom-right" ];
				return (typeof customClosePosition === "string" && validPositions.indexOf(customClosePosition) !== -1);
			},
			"allowOffscreen" : function(allowOffscreen) {
				return (typeof allowOffscreen === "boolean");
			}
		}
	};
	
    function isCloseRegionOnScreen(properties) {
        log.d("isCloseRegionOnScreen");
        log.d("defaultPosition " + defaultPosition.x + " " + defaultPosition.y);
        log.d("offset " + properties.offsetX + " " + properties.offsetY);

        var resizeRect = {};
        resizeRect.x = defaultPosition.x + properties.offsetX;
        resizeRect.y = defaultPosition.y + properties.offsetY;
        resizeRect.width = properties.width;
        resizeRect.height = properties.height;
        printRect("resizeRect", resizeRect);

		var customClosePosition = properties.hasOwnProperty("customClosePosition") ?
				properties.customClosePosition : resizeProperties.customClosePosition;
        log.d("customClosePosition " + customClosePosition);
        
        var closeRect = { "width": 50, "height": 50 };

        if (customClosePosition.search("left") !== -1) {
            closeRect.x = resizeRect.x;
        } else if (customClosePosition.search("center") !== -1) {
            closeRect.x = resizeRect.x + (resizeRect.width / 2) - 25;
        } else if (customClosePosition.search("right") !== -1) {
            closeRect.x = resizeRect.x + resizeRect.width - 50;
        }

        if (customClosePosition.search("top") !== -1) {
            closeRect.y = resizeRect.y;
        } else if (customClosePosition === "center") {
            closeRect.y = resizeRect.y + (resizeRect.height / 2) - 25;
        } else if (customClosePosition.search("bottom") !== -1) {
            closeRect.y = resizeRect.y + resizeRect.height - 50;
        }

        var maxRect = { "x": 0, "y": 0 };
        maxRect.width = maxSize.width;
        maxRect.height = maxSize.height;

        return isRectContained(maxRect, closeRect);
    }
    
    function fitResizeViewOnScreen(properties) {
        log.d("fitResizeViewOnScreen");
        log.d("defaultPosition " + defaultPosition.x + " " + defaultPosition.y);
        log.d("offset " + properties.offsetX + " " + properties.offsetY);

        var resizeRect = {};
        resizeRect.x = defaultPosition.x + properties.offsetX;
        resizeRect.y = defaultPosition.y + properties.offsetY;
        resizeRect.width = properties.width;
        resizeRect.height = properties.height;
        printRect("resizeRect", resizeRect);

        var maxRect = { "x": 0, "y": 0 };
        maxRect.width = maxSize.width;
        maxRect.height = maxSize.height;

        var adjustments = { "x": 0, "y": 0 };

        if (isRectContained(maxRect, resizeRect)) {
            log.d("no adjustment necessary");
            return adjustments;
        }

        if (resizeRect.x < maxRect.x) {
            adjustments.x = maxRect.x - resizeRect.x;
        } else if ((resizeRect.x + resizeRect.width) > (maxRect.x + maxRect.width)) {
            adjustments.x = (maxRect.x + maxRect.width) - (resizeRect.x + resizeRect.width);
        }
        log.d("adjustments.x " + adjustments.x);

        if (resizeRect.y < maxRect.y) {
            adjustments.y = maxRect.y - resizeRect.y;
        } else if ((resizeRect.y + resizeRect.height) > (maxRect.y + maxRect.height)) {
            adjustments.y = (maxRect.y + maxRect.height) - (resizeRect.y + resizeRect.height);
        }
        log.d("adjustments.y " + adjustments.y);

        resizeRect.x = defaultPosition.x + properties.offsetX + adjustments.x;
        resizeRect.y = defaultPosition.y + properties.offsetY + adjustments.y;
        printRect("adjusted resizeRect", resizeRect);

        return adjustments;
    }
    
    function isRectContained(containingRect, containedRect) {
        log.d("isRectContained");
        printRect("containingRect", containingRect);
        printRect("containedRect", containedRect);
        return (containedRect.x >= containingRect.x &&
            (containedRect.x + containedRect.width) <= (containingRect.x + containingRect.width) &&
            containedRect.y >= containingRect.y &&
            (containedRect.y + containedRect.height) <= (containingRect.y + containingRect.height));
    }
    
    function printRect(label, rect) {
        log.d(label +
            " [" + rect.x + "," + rect.y + "]" +
            ",[" + (rect.x + rect.width) + "," + (rect.y + rect.height) + "]" +
            " (" + rect.width + "x" + rect.height + ")");
    }
	
	function getSdkVer(){
		if (typeof window.MRAID_ENV != 'undefined'){
			var sdkVersion = window.MRAID_ENV.sdkVersion;
			var version = Number.parseInt(sdkVersion.split('.')[0]);
			return version;
		}else{
			// SDK doesn't inject MRAID_ENV variable
			return -1;
		}
	}
	
	mraid.dumpListeners = function() {
		var nEvents = Object.keys(listeners).length;
		log.i("dumping listeners (" + nEvents + " events)");
		for ( var event in listeners) {
			var eventListeners = listeners[event];
			log.i("  " + event + " contains " + eventListeners.length + " listeners");
			for (var i = 0; i < eventListeners.length; i++) {
				log.i("    " + eventListeners[i]);
			}
		}
	};

    console.log("MRAID object loaded");

})();

/***********************
*		TAMedia
*	  gm-sdk5-ios
*
***********************/
// Debug
/*console = new Object();
 console.log = function(log) {
 try {
 setTimeout(function(){
 window.location.href = "ioslog://?log=" + log;
 }, 100);
 } catch (ex) {
 }
 };
 console.debug = console.log;
 console.info = console.log;
 console.warn = console.log;
 console.error = console.log;
 */


//=============================================================================

var PREVIOUS_SECONDS = 0;
var REPORT_VIDEO_PROGRESS_INTERVAL_SECONDS = 3;

/**
 * 插頁式影音廣告進度回報，通知SDK
 * status 影音撥放狀態 0:開始; 1:撥放中; 2:結束
 */
var reportVideoProgress = function(status, seconds) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_VIDEO)){
		console.log("reportVideoProgress()......status="+status+", seconds="+seconds);

		if (!AD_TYPE || (AD_TYPE !== "16" && AD_TYPE !== "32")) {
			return;
		}

		//狀態為開始和結束，則直接回報
		//狀態為撥放中，判斷時間間隔若是小於REPORT_VIDEO_PROGRESS_INTERVAL，則不回報
		if (status === 1) {
			if ((seconds - PREVIOUS_SECONDS) <= REPORT_VIDEO_PROGRESS_INTERVAL_SECONDS) {
				return;
			}
			
			//讓PREVIOUS_SECONDS總是紀錄REPORT_VIDEO_PROGRESS_INTERVAL_SECONDS倍數的秒數
			PREVIOUS_SECONDS = Math.floor(seconds / REPORT_VIDEO_PROGRESS_INTERVAL_SECONDS) * REPORT_VIDEO_PROGRESS_INTERVAL_SECONDS;
		}

		if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 29) {
			window.location.href = "reportVideoProgress://?status=" + status + "&seconds=" + seconds;
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-video function.", "reportVideoProgress");
    }
};


//=============================================================================
var LOGO_M_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAeCAYAAABNChwpAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QTIwOTlGQzQ0MEMyMTFFNTk2QTZFRTQxNUNENzdBMkUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QTIwOTlGQzU0MEMyMTFFNTk2QTZFRTQxNUNENzdBMkUiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpBMjA5OUZDMjQwQzIxMUU1OTZBNkVFNDE1Q0Q3N0EyRSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBMjA5OUZDMzQwQzIxMUU1OTZBNkVFNDE1Q0Q3N0EyRSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkGwYjEAAAS9SURBVHja5FZtTFtlFD69/YLx1QprpeCYHWiWRbexKQoLbj/UMBFM/JiDTV1idItkakZElmX+weyHZv5aWEzMihqc6EzA6g8WZwxsA+eggymbprhBoXT0m3L7fa/nvb2tXT9uKy7xhyc56dtz3/O+zznv+RKxLAv/JYn+9wCAAIhnIfL7/U+Fw+EhhmHcuJdh/yYG5W6v13txenr6eSmAHJlKdYY0jsl9SR4QiURJSqFQ6EmKonrYQFB96+sBsJzuh8DMHDBeX0QnVw7Scg2odjVD6a5nIEyJrFcnJ9tqtmzpJ7iDeFc8gCgFsgGAln2Om1pnPuwGc7cOQnanoJfEyiJQvbYXtB1tsGi368vV6pdQ7EYQ4X8MAF39U8jmqJ9o3APeqT+Iz7KMLBHI7tPC5u97wSMWjauLixtQakMQoawBEMvDdmfr+LYmCMwvrCi+xOrVsPWCHsze5cHKigriCSvwnogCSBko5M2J2yfR8pVezhlhWYSxht1QrtE88YlOtxtFhcRGwTQkHkDXL5g+6FbffP8jzu2a/S9D/qYNt+1znDsPi3393Fqxo44LwHi61TcAznPD3HOo2w9A+aH9rqK8vDr8ZET2RT2QlIZcqvn87MjarexQwTqOrfqzbCK5Lxli3y293yR9N3Z0xb5fWFPNkjO7T5w4ijGgJikaTcOkJ5BIJO9az+ghaHMIureg+gGQFBZEPPBYrfBTOFww13sGnm5qasG/JfHJQCUHsGgjcZ8QMf4AalJQuO1hyNFWgEyjjhS1UDitzgLWjtUqVQUui5FzhQDk+26aBAEsXTJELN9eC4r6R7i178YshGk6rU5ozgwymUyOSyVyTloABANDewUBuIZGYq6Put9zeQIy1HHgMyBP8AmyIdfwKPe7an0VKB6vjwAwXM1WnVwuFgLAUqtyMz4BFwckaPlAXPrFIHytXM6dnShOAoA1wJOzpkw4CH1+8IxPxrdU8Fz5TVBHUlZKUpygDsZXwyQAgUDgV9ULzZmfYWg0tqavGyHsWRbcf/eLzTA/NzePy2UeRGoAZrP5eMlzjSAtVmYVB9m8P+mQZS3Pgu7UqUFSRKOVMCWA+7XaAUZMWTUH9nFlNB25R8aADYYyvz+eUfJqK9ABv+dYVxdBbUOOpZkkhUpwcmKibdOh108vYkWkp34H88kesOvP3h4HXi9ce+UgF4SOH4c5mfHt94CSRTJs6fKVSMhX3QvrOg/C4c7OL0g94jtiULAZ4RE5JovlKyUlabwT7djwp9FQV1NzHEVjic0oHQDie4XFZvshn4HN/2YgmXE7b6yvrDyGUhIoU8jOaDqmnQf4Gc5NJhkz7RmsPv8t3HP4TZDcpchsNQZc6TtvwEMXv+Ms5y+/xlvuTqoFQlMxekJC2uenOt1bNE07SUs1f9bHGhr3sD9v3MGOVD3K8eiD29mxnS2sqedLru0uud1LHe3tH6PuXuRavgVLUk3FGcdy3ChGViJvIP3cNDt7HQuKN3Es9yFNG43TR48cOYl79yE3EB1eV5z1WC5LnXpESGppEd/PCSsSGkuQLzIOPtVItLtIG0pVgtMGoUwg9/m6IeX7eU5CYwnzIHx8npM1I3TYSgDcUSIA/hJgADqVumX7GEGkAAAAAElFTkSuQmCC";
var LOGO_TA_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAAAeCAYAAACIeIa4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA1ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0iN0FDOEE4RDA0Q0Y0NEJEMkVCNDE1MzQ4RUM5RThBRjAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RTM4RkY1QzM0MEMyMTFFNUIyQjI4NUJGRERFRTEwQzMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RTM4RkY1QzI0MEMyMTFFNUIyQjI4NUJGRERFRTEwQzMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo1MDZCRkRFRTk5NDBFNTExQjA0MzlCMDE0Nzg1NkQ2QSIgc3RSZWY6ZG9jdW1lbnRJRD0iN0FDOEE4RDA0Q0Y0NEJEMkVCNDE1MzQ4RUM5RThBRjAiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6ka8KaAAAF70lEQVR42txZW1NTVxQ+95NzyT2BxNxjwKLEQpuOvtQXZaa1L/WB58apr77XX+APsD/A9idY+2CtM/XBglO0YqVaUBMuCiEQSEjI/Zx+O3PiRIaibccQXDNrkLP3cfZ31lrf+taGTiaT1A6j4QK833ALXDSe94rp8Cq8AM8YXguHw3rnJm7HS7wB6BBcNUBxVG+abATBDPfAX6bT6QwA1tsb2JGRkfa/JXgIHoHbjRcZqreNMc6pGhnGbm5ubttstgbVcXiyIQCPwhXqYJpinD+ACAqd4PoNcDx1sI03cPQDYAucZNSYTL0fJht4JM4oRrVz1eVyEcBUvV7XaJqmGIahWZalNU1rrTcajVfPiRUKhRpMkySJcTgcpmq1qq2trVVa1EvT+j4AJHg8nJGSYufKxYsXz5fL5QYO3CpMXde1Jgw/dZZhWAZI8VATRNGEfeXJycmpp3NzL8+MjQ3EYrEPc+vrhV9u3/7t/v37iyaTqbEPAAmefs6gUrZzJRgMfrZzN6JRIY2OFwQBh33FoohuNZ1KUSZRnB8dHR1zu91DXq+3uLW1ZftzZubHSqWS2QeABI+ZM5jyNXv29OltpJUZQeGRgs1INOqORqM+koorKysbqefPszh0lUZa5kG996amKqfHxoYA7ChSlVUUxYZ3Rvx+/7Pp6ekCvkcRwe529ARuN+Vx+fLl7xcXFvrw+ZU66uvrCxeGk+fPf8HzvPDrnTtL3165MlUsFtdEUaw16vUGgDBfJZMfEGAENCIl2u12G8AG8X/MKKpaRj1qXQZH76o+tsvlDUmWy5wgtNIVJOEw0oqUHfDUs1hPqYpSQv1pX547d9zj9QZRaznU2crpM2eOqqoqDgwMBCxWq7NZr2/o+1B7uyoQpFHTZreXwJoFfP2Cw+kkB2uvMYhKUzWbi06sjYyO6h8nEnFZlh0zMzOL3129+nt2dXUdUeaG4/HgJ4lErFgqSWDarmvTXcGRL0wcaaa/6WsHAgG70+k8gtqs352cXJ6bm0vDZ0iIQSyOwcHBKFJYRdMQ8Yjed3Bv/TIIZWhoKIaouefT6eVbt24tAMD6o0eP7oItNxE91h8MepG+TqSnGWtUNwH+L3DRSMQKFT7KcZwMwVoJhULc52fP2vo9HhZtkYwkVCgYdH966tQgS9MWtBOOAOyW/adxRidKBTUYjkScVqs1Slhy8MiRwDeXLqmyomgkYmaz2UH2gmhsIJbQ4tLSHMCRNtk05rGeixyRYDppDyQlIUcOg+Jd2zCiaKyYNdAGCLOq+Xy+BDB19DcGosDj9/kCyEcZUofuycgRxiTggKWZGB62oLGfwDPu55s3H/x048YSmjdhVY1oT7PFIoyPj3909NixSDAUcseHhwdEQchNTE7eYzmuQsiqJ8AxbYVsGDRn8+SJE2GnyzUEoKUfrl17NjExMYtUzEF7Nttkk0gkeJKuHo/HFgqH/c9TqRSYUxZNpjoEQKMb4PQ33Y9wLMsBE0vIgBz6kM8nH47FBpFyEnTli2w2u4Xay/Z7vVmB51uHRnqyq9nsdCaTOe7z+cKELaFelHg87p+fny+R2nvXTZ2Aq5Gz7LUJZLAMvfkQ9K5ADC+jidOFfH778ePHD65fv74AvZmxWCwlWZIIYzSNSYL+4+HDWa/HMwFQ9F9PnuSWl5e37Q6HjJplIXOY9t53pr+SyeRJorB2Tgavjbc8L+PgwdVMxokD1gAk5w8EdOhGeXZ2luJ4Pt/X17cG1fJaLaEdMIikE5EPIYoSxHgOBLQGrbnV+SHe1Q0ZZ1yLKXtN4vjylY319TTqa8UkSTTDcVUA1aq1Gu9wuRjZZKpKilLbSRLkd7yaQ52V8VMAyTTJXlGSmkhprRs1twLv2wscOYisqi0AndO1pOs1Q6rtOnGTZ4iqhhZRsuj6dhtwtyZ0Aq5M7vyM0VzegzH1XZqv/hbtQzdEd9evG9pNnKTmIhmsqffI2n2uZoAj5j/Ad5f/2MRJeqbIrEodjOv0f61QSFq+gGep3v5DyFu1gr8FGACL8o/JLU9mWQAAAABJRU5ErkJggg==";

/**
 * 取得Container的寬度
 *
 * @returns {d.documentElement.clientWidth}
 */
var getContainerWidth = function() {
	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0],
		x = w.innerWidth || e.clientWidth || g.clientWidth;
	return x;
};

/**
 * 取得Container的高度
 *
 * @returns {d.documentElement.clientHeight}
 */
var getContainerHeight = function() {
	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0],
		y = w.innerHeight || e.clientHeight || g.clientHeight;
	return y;
};

/**
 * AdFormatEnum.ADFORMAT640x100 return "0";
 * AdFormatEnum.ADFORMAT300x250 return "1";
 * AdFormatEnum.ADFORMAT468x60 return "2";
 * AdFormatEnum.ADFORMAT728x90 return "3";
 */
var getBaseWidth = function() {
	if (!AD_FORMAT) {
		console.log("[error] AD_FORMAT is null [@getBaseWidth()]");
		return;
	}

	if (AD_FORMAT === "0") {
		return 640;
	}

	if (AD_FORMAT === "1") {
		return 300;
	}

	if (AD_FORMAT === "2") {
		return 468;
	}

	if (AD_FORMAT === "3") {
		return 728;
	}
};

/**
 * AdFormatEnum.ADFORMAT640x100 return "0";
 * AdFormatEnum.ADFORMAT300x250 return "1";
 * AdFormatEnum.ADFORMAT468x60 return "2";
 * AdFormatEnum.ADFORMAT728x90 return "3";
 */
var getBaseHeight = function() {
	if (!AD_FORMAT) {
		console.log("[error] AD_FORMAT is null [@getBaseHeight()]");
		return;
	}

	if (AD_FORMAT === "0") {
		return 100;
	}

	if (AD_FORMAT === "1") {
		return 250;
	}

	if (AD_FORMAT === "2") {
		return 60;
	}

	if (AD_FORMAT === "3") {
		return 90;
	}
};

var AD_TEXT;
var PIC_URL;
var BIG_PIC_URL;
var AD_TYPE; //1:圖片廣告, 2:文字廣告
var AD_FORMAT;
var IS_HOME_AD;
var LOCATION_LNG; //經度(longitude)
var LOCATION_LAT; //緯度(latitude)
var LOCATION_ACC; //精度
var LOCATION_PARAMS;
var SMART_BANNER_FLAG;
var SDK_VERSION_CODE;
var SDK_VERSION;

var parseUrl = function() {
	// console.log("parseUrl()......");

	var nameValues, nameValue;
	var paraArray = [];

	var queryString = window.location.search;

	if (queryString.indexOf("?") !== -1) {
		var getSearch = queryString.split("?");

		nameValues = getSearch[1].split("&");

		for (i = 0; i < nameValues.length; i++) {
			nameValue = nameValues[i].split("=");
			paraArray.push(nameValue[0]);
			paraArray[nameValue[0]] = nameValue[1];
		}

		if (!parseData(paraArray)) {
			console.log("***[error] parse queryString fail. [@parseUrl()]");
			return false;
		} else {
			return true;
		}
	} else {
		console.log("***[error] window.location.search is null. [@parseUrl()]");
		return false;
	}
};

var parseData = function(paraArray) {
	// console.log("parseData()......");

	if (paraArray["at"]) {
		AD_TYPE = paraArray["at"];
	} else {
		console.log("***[error] paraArray['at'] is null");
		return false;
	}

	if (paraArray["as"]) {
		AD_FORMAT = paraArray["as"];
	} else {
		AD_FORMAT = "";
		console.log("***[warn] paraArray['as'] is null");
	}

	if (paraArray["hd"]) {
		IS_HOME_AD = paraArray["hd"];
	} else {
		IS_HOME_AD = "0";
		console.log("***[warn] paraArray['hd'] is null");
	}

	if (paraArray["lo"]) {
		var temp = atob(paraArray["lo"]);
		var tempArray = temp.split("|");

		if (tempArray && tempArray.length >= 3) {
			LOCATION_LNG = tempArray[0];
			LOCATION_LAT = tempArray[1];
			LOCATION_ACC = tempArray[2];
			LOCATION_PARAMS = temp;
		} else {
			console.log("***[error] location.length: " + location.length);
		}
	} else {
		console.log("***[warn] paraArray['lo'] is null");
		// return false; //因為lo非必傳參數就不返回false
	}

	if (paraArray["sb"]) {
		SMART_BANNER_FLAG = paraArray["sb"];
	} else {
		console.log("***[warn] paraArray['sb'] is null");
		// return false; //因為素材有可能執行於SDK2，考慮相容性就不返回false
	}

	//取得sdkVersionCode
	if (paraArray["svc"]) {
		SDK_VERSION_CODE = paraArray["svc"];
	} else {
		console.log("***[warn] paraArray['svc'] is null");
		// return false; //因為素材有可能執行於SDK2，考慮相容性就不返回false
	}

	//取得sdkVersion
	if (paraArray["sv"]) {
		SDK_VERSION = paraArray["sv"];

		if (!SDK_VERSION_CODE) {
			if (SDK_VERSION.indexOf("2.0.4") != -1
				|| SDK_VERSION.indexOf("2.0.5") != -1
				|| SDK_VERSION.indexOf("2.0.6") != -1
				|| SDK_VERSION.indexOf("2.0.7") != -1
				|| SDK_VERSION.indexOf("2.0.8") != -1) {

				SDK_VERSION_CODE = 23;
			}
		}
	} else {
		console.log("***[error] paraArray['sv'] is null");
		return false;
	}

	return true;
};


//=============================================================================

var handleAd = function() {
	console.log("handleAd()......");

	if (AD_TYPE === "16" || AD_TYPE === "32") {
		return;
	}
	
	if(document.getElementById("adDiv") == null){
		return;
	}

	// var adDiv, picture;

	// //開始處理Banner廣告
	// adDiv = document.createElement("div");
	// adDiv.setAttribute("id", "adDiv");
	// adDiv.style.margin = "0px";
	// adDiv.style.padding = "0px";
	// adDiv.style.position = "relative";
	// adDiv.style.width = "100%";
	// adDiv.style.height = "100%";
	// adDiv.style.textAlign = "center";
	// adDiv.style.backgroundColor = "rgba(0%, 0%, 0%, 0)";
	// // adDiv.style.border = "1px red solid";

	// document.getElementsByTagName('body')[0].appendChild(adDiv);

	handleRichMediaBannerPicture();
	
	if (IS_HOME_AD === "0") {
		handleBannerLogo();
	}
};

var handleSmartBannerPicture = function() {
	console.log("handleSmartBannerPicture()......");

	var baseWidth = getBaseWidth();
	var baseHeight = getBaseHeight();
	var tempWidth, tempHeight, largeSizeFlag;

	var containerWidth = getContainerWidth();
	if (containerWidth <= 0) {
		console.log("***[error] containerWidth <= 0, containerWidth: " + containerWidth);
	}

	var containerHeight = getContainerHeight();
	if (containerHeight <= 0) {
		console.log("***[error] containerHeight <= 0, containerHeight: " + containerHeight);
	}

	tempWidth = baseWidth * (containerHeight / baseHeight);

	var adDiv = document.getElementById("adDiv");
	var adDivWidth = adDiv.clientWidth;
	
	var adImage = document.getElementById("adImage");
	if (tempWidth < containerWidth) {
		adImage.style.width = tempWidth + "px";
		adImage.style.height = containerHeight + "px";
	} else {
		tempHeight = baseHeight * (containerWidth / baseWidth);
		adImage.style.width = containerWidth + "px";
		adImage.style.height = tempHeight + "px";
	}
	
	var adImageWidth = adImage.clientWidth;
	var adImageHeight = adImage.clientHeight;
	var adImageLeft = (adDivWidth - adImageWidth) / 2;

	// var calendarDiv = document.getElementById("calendarDiv");
	// calendarDiv.style.width = (adImageWidth * (216/1280)) + "px";
	// calendarDiv.style.height = (adImageHeight * (86/200)) + "px";
	// calendarDiv.style.left = (adImageLeft + adImageWidth * (1055 / 1280)) + "px";
	// calendarDiv.style.top = (adImageHeight * (50/200)) + "px";
};

var handleRichMediaBannerPicture = function() {
	console.log("handleRichMediaBannerPicture()......");
	
	if (SMART_BANNER_FLAG === "1") { //smart banner 廣告
		handleSmartBannerPicture();
	} else {
		handleSmartBannerPicture();
	}
};

/**
 * 顯示TAMEDIA的LOGO圖示
 */
var handleBannerLogo = function() {
	console.log("handleBannerLogo()......");

	var containerWidth = getContainerWidth();
	if (containerWidth <= 0) {
		console.log("***[error] containerWidth <= 0, containerWidth: " + containerWidth);
	}

	var containerHeight = getContainerHeight();
	if (containerHeight <= 0) {
		console.log("***[error] containerHeight <= 0, containerHeight: " + containerHeight);
	}

	new LogoPanel(containerWidth, containerHeight);
};

var LogoPanel = function(containerWidth, containerHeight) {
	this.containerWidth = containerWidth;
	this.containerHeight = containerHeight;
	this.logoMDefaultWidth = 32;
	this.logoMDefaultHeight = 30;
	this.logoTaDefaultWidth = 55;
	this.logoTaDefaultHeight = 30;
	this.baseWidth = 640;
	this.baseHeight = 100;

	this.init = function() {
		this.baseWidth = getBaseWidth();
		this.baseHeight = getBaseHeight();

		var adDiv = document.getElementById("adDiv");
		var adDivWidth = adDiv.clientWidth;

		var adImage = document.getElementById("adImage");
		var adImageWidth = adImage.clientWidth;
		var adImageHeight = adImage.clientHeight;
		var adImageLeft = (adDivWidth - adImageWidth) / 2;

		var logoTaDivWidth = this.logoTaDefaultWidth * (adImageWidth / this.baseWidth);
		var logoTaDivHeight = this.logoTaDefaultHeight * (adImageHeight / this.baseHeight);
		var logoTaDivLeft = adImageLeft + adImageWidth - logoTaDivWidth;
		var logoTaDivRight = adDivWidth - (adImageLeft + adImageWidth);

		var logoMDivWidth = this.logoMDefaultWidth * (adImageWidth / this.baseWidth);
		var logoMDivHeight = this.logoMDefaultHeight * (adImageHeight / this.baseHeight);
		var logoMDivLeft = adImageLeft + adImageWidth - logoMDivWidth;
		var logoMDivRight = adDivWidth - (adImageLeft + adImageWidth);

		var logoTaDiv = document.createElement("div");
		logoTaDiv.setAttribute("id", "logoTaDiv");
		logoTaDiv.style.margin = "0px";
		logoTaDiv.style.padding = "0px";
		logoTaDiv.style.overflow = "hidden";
		logoTaDiv.style.position = "absolute";
		logoTaDiv.style.right = logoTaDivRight + "px";
		logoTaDiv.style.top = (adImageHeight - logoTaDivHeight) + "px";
		logoTaDiv.style.width = logoTaDivWidth + "px";
		logoTaDiv.style.height = logoTaDivHeight + "px";
		logoTaDiv.style.zIndex = 9999;
		// logoTaDiv.style.border = "1px yellow solid";

		var logoTaImage = document.createElement("img");
		logoTaImage.setAttribute("id", "logoTaImage");
		logoTaImage.setAttribute("src", LOGO_TA_BASE64);
		logoTaImage.style.left = "0px";
		logoTaImage.style.top = "0px";
		logoTaImage.style.width = "100%";
		logoTaImage.style.height = "100%";

		logoTaDiv.appendChild(logoTaImage);
		adDiv.appendChild(logoTaDiv);

		var logoMDiv = document.createElement("div");
		logoMDiv.setAttribute("id", "logoMDiv");
		logoMDiv.style.margin = "0px";
		logoMDiv.style.padding = "0px";
		logoMDiv.style.position = "absolute";
		logoMDiv.style.right = logoMDivRight + "px";
		logoMDiv.style.top = (adImageHeight - logoTaDivHeight) + "px";
		logoMDiv.style.width = logoMDivWidth + "px";
		logoMDiv.style.height = logoMDivHeight + "px";
		logoMDiv.style.zIndex = 9999;
		// logoMDiv.style.border = "1px red solid";

		var logoMImage = document.createElement("img");
		logoMImage.setAttribute("id", "logoMImage");
		logoMImage.setAttribute("src", LOGO_M_BASE64);
		logoMImage.style.position = "absolute";
		logoMImage.style.left = "0px";
		logoMImage.style.top = "0px";
		logoMImage.style.width = "100%";
		logoMImage.style.height = "100%";

		logoMDiv.appendChild(logoMImage);
		adDiv.appendChild(logoMDiv);

		logoMDiv.addEventListener("touchend", logoTouch, false);
		logoMDiv.addEventListener("mouseup", logoTouch, false);

		//因為預設Logo為全展開，一秒鐘後收合Logo
		closeLogo();
	};

	this.init();
};

var isLogoBusy = false;

var closeLogo = function() {
	var timerId1, timerId2, timerId3, timerId4;
	var n = 10;
	var ms = 100; //單位:毫秒
	var count1 = 0, count2 = 0;

	var logoMDiv = document.getElementById("logoMDiv");
	var logoTaDiv = document.getElementById("logoTaDiv");
	var w = (logoTaDiv.clientWidth - logoMDiv.clientWidth) / n;
	// var logoTaDivWidth = logoTaDiv.clientWidth;
	var logoTaDivStyleWidth = logoTaDiv.style.width;

	isLogoBusy = true;

	timerId1 = window.setInterval(function() {
		window.clearInterval(timerId1);

		timerId2 = window.setInterval(function() {
			if (count2++ < n && logoTaDiv.clientWidth > logoMDiv.clientWidth) {
				logoTaDiv.style.width = (logoTaDiv.clientWidth - w) + "px";
			} else {
				window.clearInterval(timerId2);
				logoTaDiv.style.display = "none";
				logoTaDiv.style.right = logoMDiv.style.right;
				logoTaDiv.style.width = logoTaDivStyleWidth;
				isLogoBusy = false;
			}
		}, ms);
	}, 1000);
};

var logoTouch = function() {
	if (isLogoBusy) {
		return;
	}

	isLogoBusy = true;

	var timerId1, timerId2, timerId3, timerId4;

	timerId1 = window.setInterval(function() {
		window.clearInterval(timerId1);

		var logoMDiv = document.getElementById("logoMDiv");

		var logoTaDiv = document.getElementById("logoTaDiv");
		logoTaDiv.style.display = "block";

		var n = 6;
		var ms = 50;
		var count1 = 0, count2 = 0;
		var w = (logoTaDiv.clientWidth - logoMDiv.clientWidth) / n;
		// var logoTaDivWidth = logoTaDiv.clientWidth;
		var logoTaDivStyleWidth = logoTaDiv.style.width;

		logoTaDiv.style.width = logoMDiv.style.width;

		timerId2 = window.setInterval(function() {
			if (count1++ < n) {
				logoTaDiv.style.width = (logoTaDiv.clientWidth + w) + "px";
			} else {
				window.clearInterval(timerId2);

				logoTaDiv.style.width = logoTaDivStyleWidth;

				timerId3 = window.setInterval(function() {
					window.clearInterval(timerId3);

					timerId4 = window.setInterval(function() {
						if (count2++ < n && logoTaDiv.clientWidth > logoMDiv.clientWidth) {
							logoTaDiv.style.width = (logoTaDiv.clientWidth - w) + "px";
						} else {
							window.clearInterval(timerId4);
							//logoMDiv.style.display = "block";
							logoTaDiv.style.display = "none";
							logoTaDiv.style.right = logoMDiv.style.right;
							logoTaDiv.style.width = logoTaDivStyleWidth;
							isLogoBusy = false;
						}
					}, ms);
				}, 1000);
			}
		}, ms);
	}, 50);
};

//=============================================================================

var oldonload;
function addLoadEvent(func) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
		oldonload = window.onload;
		if (typeof window.onload != 'function') {
			window.onload = func;
		} else {
			window.onload = function() {
				oldonload();
				func();
			}
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "addLoadEvent");
	}
}

var tamediaCustomLoad;
function init() {
	// console.log("init()......");
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){

		if (!parseUrl()) {
			//console.log("***[error] Can't handle AD. [@init()]");
			//return;
			
			// If parseUrl failed, it represents SDK load ad by html content
			console.log("*** Cannot fetch parameters in url. [@init]");
		}

		//initialCamera函式宣告於gm-sdk3-ios-x.js，所以要判斷是否可以於onload事件中執行
		// if (initialCamera && (typeof initialCamera === "function")) {
			// addLoadEvent(initialCamera);
		// }

		addLoadEvent(handleAd);

		if (AD_TYPE && AD_TYPE === "16") {
			try {
				//執行新流程；搬移onload至tamediaCustomLoad
				if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 23) {    //TODO 測試時改成31, 正式時改回23
					if (typeof window.onload == 'function') {
						var windowOnload = window.onload;

						//待SDK呼叫tamediaCustomLoad()時，再執行原先的window.onload
						tamediaCustomLoad = function() {
							windowOnload();
						};

						//設為空白；不執行原先的window.onload
						window.onload = function() {
						};
					} else {
					}
				} else {
					console.log("***[warn] SDK_VERSION_CODE(" + SDK_VERSION_CODE + ") <= 23). [@init()]");
				}
			} catch (e) {
				console.log("***[error] exception: " + e + " [@init()]");
			}
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "init");
	}
}

function twmParseDate(d){
	if(typeof d === "object"){

		var result = d.getFullYear() +"/"+
				(d.getMonth()+1 < 10 ? "0"+(d.getMonth()+1) : d.getMonth()+1) +"/"+
				(d.getDate() < 10 ? "0"+d.getDate() : d.getDate() ) +" "+
				(d.getHours() < 10 ? "0"+d.getHours() : d.getHours() ) +":"+
				(d.getMinutes() < 10 ? "0"+d.getMinutes() : d.getMinutes());

		return result;
	}
	return "";
}

//When the HTML elements load, call init()
document.addEventListener("DOMContentLoaded", init, false);

//=============================================================================



/***********************
*		TAMedia
*    gm-sdk5-ios-x
*
***********************/
/*
 * [MADP] SDK 5.0 多媒體特殊功能
 */

//=============================================================================

/**
 * 通知SDK不顯示"x"按鈕
 */
var disableCloseButton = function() {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
		// console.log("disableCloseButton()");
		window.location.href = "disableclosebutton://?Type=1";
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "disableCloseButton");
    }
};

//=============================================================================

/**
 * 通知SDK關閉廣告
 */
var handleClose = function() {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
		// console.log("handleClose()......");
		window.location.href = "closewebview://?Type=1";
	}else{
        mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "handleClose");
    }
};

//=============================================================================

/**
 * 播放影片
 */
function autoplay() {
	// console.log("autoplay()......");
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_VIDEO)){
		var video = document.getElementById("video");

		if (video) {
			video.play();
		} else {
			 //console.log("***[error] The 'video' element is null. [@autoplay()]");
			mraid.fireErrorEvent("The 'video' element is null.", "autoplay");
		}
	}else{
        mraid.fireErrorEvent("The SDK does not support tamedia-video function.", "autoplay");
    }
}

//=============================================================================

/**
 * 通知iOS SDK震動手機
 */
function vibrate() {
	// console.log("vibrate()......");
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_VIBRATE)){
		window.location.href = "vibration://vibration.do";
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-vibrate function.", "vibrate");
	}
}

//=============================================================================

/**
 * 指定增加行事曆的參數值，並通知iOS SDK增加行事曆
 *
 * @param {type} title 表示該記事的title
 * @param {String} startTimeStr 表示起始時間, 以yyyy/MM/dd HH:mm格式表示
 * @param {String} endTimeStr 表示迄止時間, 以yyyy/MM/dd HH:mm格式表示
 * @param {type} address 表示該記事的發生地點
 * @param {type} description 表示該記事的描述
 */
function addCalendarEvent(title, startTimeStr, endTimeStr, address, description) {
	// console.log("addCalendarEvent()......");
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_CALENDAR)){
		window.open("addevent://?title=" + title
				+ "&startTimeStr=" + startTimeStr
				+ "&endTimeStr=" + endTimeStr
				+ "&address=" + address
				+ "&description=" + description, "_self");
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-calendar function.", "addCalendarEvent");
	}
}

//=============================================================================

/**
 * 首先，要求使用者定義input元素，其type參數為"file"，capture參數為"camera", accept參數為"image/*", id參數為"camera"
 * 例子:<input type="file" capture="camera" accept="image/*" id="camera">
 *
 * 當使用者操作上述元素後，會觸發元素的change事件，將照片設給使用者定義id為"capturePhoto"的img元素
 */
function initialCamera() {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_CAMERA)){
		// console.log("initialCamera()......");
		var camera = document.getElementById("camera");

		if (camera) {
			camera.addEventListener("change", showImage, false);
		} else {
			// console.log("***[info] The 'camera' element is null. [@initialCamera()]");
			mraid.fireErrorEvent("The 'camera' element is null.", "initialCamera");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-camera function.", "initialCamera");
	}
}

function showImage(event) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_CAMERA)){
		// console.log("showImage()......");
		if (event.target.files.length === 1 && event.target.files[0].type.indexOf("image/") === 0) {
			var capturePhoto = document.getElementById("capturePhoto");

			if (capturePhoto) {
				capturePhoto.src = URL.createObjectURL(event.target.files[0]);
			} else {
				//console.log("***[error] The 'capturePhoto' element is null. [@showImage()]");
				mraid.fireErrorEvent("The 'capturePhoto' element is null.", "showImage");
			}
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-camera function.", "showImage");
	}
}

//=============================================================================

/**
 * isMute 0:非靜音; 1:靜音
 */
function audioSwitch(isMute) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
		// console.log("audioSwitch()......");
		// if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 29) {
			window.location.href = "audioswitch://?ismute=" + isMute;
		// } else {
			// console.log("***[warn] SDK_VERSION_CODE(" + SDK_VERSION_CODE + ") < 29). [@audioSwitch()]");
		// }
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "audioSwitch");
	}
}

//=============================================================================

/**
 * 另開視窗時，通知SDK
 */
var openUrl = function(targetUrl, sdkVersionCode) {
	// console.log("openUrl()......");
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
	
		if (!targetUrl) {
			// console.log("targetUrl is null.");
			mraid.fireErrorEvent("targetUrl is null.", "openUrl");
			return;
		}

		if (typeof targetUrl !== 'string') {
			// console.log("targetUrl is not a string.");
			mraid.fireErrorEvent("targetUrl is not a string.", "openUrl");
			return;
		}

		var _https = "https";
		var _http = "http";
		var _tel = "tel";
		var _sms = "sms";

		// if (typeof sdkVersionCode === 'undefined') {
		// 	sdkVersionCode = SDK_VERSION_CODE;
		// }
		//if (sdkVersionCode && sdkVersionCode >= 29) {
			if (targetUrl.substr(0, _http.length) === _http
					||targetUrl.substr(0, _http.length) === _https) {
				window.location.href = "openurl://?targetUrl=" + targetUrl;
			} else if (targetUrl.substr(0, _tel.length) === _tel) {
				window.location.href = "openurl://?telprompt:" + targetUrl.substr(4, targetUrl.length);
			} else if (targetUrl.substr(0, _sms.length) === _sms) {
				window.location.href = targetUrl; // sms://123455...
			} else {
				window.location.href = "mailto:" + targetUrl;
			}
		//} else {
			// console.log("***[error] SDK_VERSION_CODE(" + SDK_VERSION_CODE + ") < 29). [@openUrl()]");
		//}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "openUrl");
	}
};

//=============================================================================

/**
 * 廣告被點擊時，通知SDK
 */
var handleClick = function() {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
		// console.log("handleClick()......");
		// if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 29) { //SDK3
			window.location.href = "click://?id=main";
		// } else { //SDK2
			// window.location.href = "click://?clickType=1";
		// }
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "handleClick");
	}
};

/**
 * 廣告被額外點擊時，通知SDK
 */
var handleExtraClick = function(extraClickId, extraClickCallback) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
		// console.log("handleExtraClick()......" + SDK_VERSION_CODE);
		// if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 29) { //SDK3
			window.location.href = "extraClick://?id=" + extraClickId;
		// } else {
			// console.log("***[error] SDK_VERSION_CODE(" + SDK_VERSION_CODE + ") < 29). [@handleExtraClick()]");
		// }

		if (extraClickCallback && typeof extraClickCallback == "function") {
			extraClickCallback();
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "handleExtraClick");
	}
};

//=============================================================================

/**
 * SDK通知廣告素材硬體音量鍵操作
 * status	0:關, 1:開 
 */
var changeVolume = function(status) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
		// console.log("changeVolume()...... status: " + status);
		if (VOLUME_STATUS_CALLBACK 
			&& (typeof VOLUME_STATUS_CALLBACK === "function")) {
			VOLUME_STATUS_CALLBACK(status);
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "changeVolume");
	}
};

var VOLUME_STATUS_CALLBACK;

/**
 * 主動通知廣告硬體音量鍵操作
 * 廣告素材須提供一個函式，該函式必須有一個輸入參數
 */
var registerVolumeStatusEvent = function(callback) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
		// console.log("registerVolumeStatusEvent()......");	
		if (callback && (typeof callback === "function")) {
			VOLUME_STATUS_CALLBACK = callback;
		} else {
			// console.log("[error] callback is not function. [@registerVolumeStatusEvent()]");
			mraid.fireErrorEvent("Callback is not function.", "registerVolumeStatusEvent");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "registerVolumeStatusEvent");
	}
};

//=============================================================================

var ORIENTATION_STATUS_CALLBACK;

/**
 * 通知SDK手機轉向
 * status	0:landscape, 1:portrait
 */
var changeOrientation = function(status) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
		// console.log("changeOrientation()...... status: " + status);
		// if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 29) { //SDK3
			window.location.href = "orientation://?direction=" + status;
		// } else {
			// console.log("***[error] SDK_VERSION_CODE(" + SDK_VERSION_CODE + ") < 29). [@changeOrientation()]");
		// }
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "changeOrientation");
	}
};

/**
 * SDK通知廣告素材
 * status	0:landscape, 1:portrait, 2:mix
 */
var supportOrientation = function(status) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
		//// console.log("supportOrientation()...... status: " + status);
			
		if (ORIENTATION_STATUS_CALLBACK 
			&& (typeof ORIENTATION_STATUS_CALLBACK === "function")) {
			ORIENTATION_STATUS_CALLBACK(status);
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "supportOrientation");
	}
};

/**
 * 通知廣告素材Orientation Status
 * 廣告素材須提供一個函式，該函式必須有一個輸入參數
 */
var registerOrientationStatusEvent = function(callback) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_BASE)){
	//	console.log("registerOrientationStatusEvent()......");
		if (callback && (typeof callback === "function")) {
			ORIENTATION_STATUS_CALLBACK = callback;
		} else {
			// console.log("[error] callback is not function. [@registerOrientationStatusEvent()]");
			mraid.fireErrorEvent("Callback is not function.", "registerOrientationStatusEvent");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-base function.", "registerOrientationStatusEvent");
	}
};

//=============================================================================

/**
 *  通知 SDK 開啟/關閉麥克風
 *  @param {int} switchNum 0:關閉, 1:開啟
 */
function microphoneSwitch(switchNum) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_MIC)){
		switchNum = parseInt(switchNum);
		if(typeof switchNum === 'number' && !isNaN(switchNum)){
			if(switchNum === 0 || switchNum === 1){
				if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 30) { //SDK4
					console.log("microphoneSwitch was called.  switchNum="+switchNum);
					window.location.href = "microphoneSwitch://?state=" + switchNum;
				}else{
					console.log('[warning] call SDK2 or do nothing?')
				}
			}else{
				//console.log("*** [error] The switchNum is illegal number. (switchNum="+switchNum+") [@microphoneSwitch(switchNum)]");
				mraid.fireErrorEvent("The switchNum is illegal number. (switchNum="+switchNum+")", "microphoneSwitch");
			}
		}else{
			//console.log("*** [error] The switchNum type is not number. (switchNum="+switchNum+", switchNum type is "+(typeof switchNum)+") [@microphoneSwitch(switchNum)]");
			mraid.fireErrorEvent("The switchNum type is not number. (switchNum="+switchNum+", switchNum type is "+(typeof switchNum)+")", "microphoneSwitch");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-mic function.", "microphoneSwitch");
	}
}


/**
 *  通知 SDK 開啟偵測麥克風秒數
 *  @param {float} openSec 0.1~∞, 單位:秒
 */
function maxDecibel(openSec) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_MIC)){
		openSec = parseFloat(openSec);
		if(typeof openSec === 'number' && !isNaN(openSec)){
			if(openSec > 0){
				if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 30) { //SDK4
					console.log("maxDecibel was called.  openSec="+openSec);
					window.location.href = "maxDecibel://?second=" + openSec;              
				}else{
					console.log("[warning] call SDK2 or do nothing?")                    
					//TODO call SDK2 or do nothing?  
				}
			}else{
				//console.log("*** [error] The openSec is not bigger than 0.1 . (openSec="+openSec+") [@maxDecibel(openSec)]");
				mraid.fireErrorEvent("The openSec is not bigger than 0.1 . (openSec="+openSec+")", "maxDecibel");
			}
		}else{
			//console.log("*** [error] The openSec type is not number. (openSec="+openSec+", openSec type is "+(typeof openSec)+") [@maxDecibel(openSec)]");
			mraid.fireErrorEvent("The openSec type is not number. (openSec="+openSec+", openSec type is "+(typeof openSec)+")", "maxDecibel");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-mic function.", "maxDecibel");
	}
}
    
    
/**
 *  通知 SDK 開啟偵測麥克風秒數及偵測最大分貝量
 *  @param {float}  openSec 0.1~∞, 單位:秒
 *  @param {int}    maxDec 1~∞, 單位:分貝
 */
function isOverDecibel(openSec, maxDec) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_MIC)){
		openSec = parseFloat(openSec);
		maxDec = parseInt(maxDec);
		if(typeof openSec === 'number' && typeof maxDec === 'number' && (!isNaN(openSec) && !isNaN(maxDec))){
			if(openSec > 0 && maxDec >= 1){
				if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 30) { //SDK4
					console.log("isOverDecibel was called.  openSec="+openSec+", maxDec="+maxDec);
					window.location.href = "isOverDecibel://?second="+openSec+"&decibelValue=" + maxDec;              
				}else{
					console.log("[warning] call SDK2 or do nothing? ");
					//TODO call SDK2 or do nothing?  
				}
			}else{
				//console.log("*** [error] The openSec or maxDec is less than define. (openSec="+openSec+", maxDec="+maxDec+") [@isOverDecibel(openSec, maxDec)]");    
				mraid.fireErrorEvent("The openSec or maxDec is less than define. (openSec="+openSec+", maxDec="+maxDec+")", "isOverDecibel");
			}
		}else{
			//console.log("*** [error] The openSec or maxDec type is not number. (openSec("+openSec+") is type '"+(typeof openSec)+"', maxDec("+maxDec+") type is '"+typeof maxDec+"') [@isOverDecibel(openSec, maxDec)]");
			mraid.fireErrorEvent("The openSec or maxDec type is not number. (openSec("+openSec+") is type '"+(typeof openSec)+"', maxDec("+maxDec+") type is '"+typeof maxDec+"')", "isOverDecibel");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-mic function.", "isOverDecibel");
	}
}



/**
 *  通知 SDK 開啟/關閉補光燈
 *  @param {int}  switchNum 0:關閉, 1:開啟
 */
function flashSwitch(switchNum){
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_FLASH)){
		switchNum = parseInt(switchNum);
		if(typeof switchNum === 'number' && !isNaN(switchNum)){
			if(switchNum === 0 || switchNum === 1){
				if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 30) { //SDK4
					console.log("flashSwitch was called.  switchNum="+switchNum);
					window.location.href = "flashSwitch://?state="+switchNum;              
				}else{
					console.log("[warning] call SDK2 or do nothing? ");
					//TODO call SDK2 or do nothing?  
				}
			}else{
				console.log("*** [error] The switchNum is illegal number. (switchNum="+switchNum+") [@flashSwitch(switchNum)]");
				mraid.fireErrorEvent("The switchNum is illegal number. (switchNum="+switchNum+")", "flashSwitch");
			}
		}else{
			//console.log("*** [error] The switchNum type is not Number. (switchNum="+switchNum+", switchNum type is '"+(typeof switchNum)+"') [@flashSwitch(switchNum)]");
			mraid.fireErrorEvent("The switchNum type is not Number. (switchNum="+switchNum+", switchNum type is '"+(typeof switchNum)+"')", "flashSwitch");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-flash function.", "flashSwitch");
	}
}

  
/**
 *  通知 SDK 補光燈時間及頻率
 *  @param {float}  openSec 開啟時間
 *  @param {int}    openTimes 開啟次數,if -1 則無限次
 */
function flashEffect(openSec, openTimes){
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_FLASH)){
		openSec = parseFloat(openSec);
		openTimes = parseInt(openTimes);
		if(typeof openSec === 'number' && typeof openTimes === 'number' && !isNaN(openSec) && !isNaN(openTimes)) {
			if(openSec > 0 && (openTimes > 0 || openTimes === -1)) {
				if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 30) { //SDK4
					console.log("flashEffect was called.  openSec="+openSec+", openTimes="+openTimes);
					window.location.href = "flashEffect://?interval="+openSec+"&times="+openTimes;              
				}else{
					console.log("[warning] call SDK2 or do nothing? ");
					//TODO call SDK2 or do nothing?  
				}
			}else{
			   //console.log("*** [error] The openSec or openTimes is illegal number. (openSec="+openSec+", openTimes="+openTimes+") [@flashEffect(openSec, openTimes)]");
				mraid.fireErrorEvent("The openSec or openTimes is illegal number. (openSec="+openSec+", openTimes="+openTimes+")", "flashEffect");
			}
		}else{
			//console.log("*** [error] The openSec or openTimes type is not Number. (openSec="+openSec+", openTimes="+openTimes+" And openSec type is '"+(typeof openSec)+"', openTimes type is '"+(typeof openTimes)+"') [@flashEffect(openSec, openTimes)]");
			mraid.fireErrorEvent("The openSec or openTimes type is not Number.", "flashEffect");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-flash function.", "flashEffect");
	}
}

/**
 *  通知 IOS SDK 開啟/關閉 距離感測器
	Callback會回覆 -1(No sensor)、0(偵測不成功)、1(偵測成功)
    Callback詳情請看-CallBack_Proximity-
 *  @param {float} secNum 0.1 ~ ∞, 單位:秒 [偵測秒數]
 */
function proximityDetectWithTime(secNum) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_PROXIMITY)){
		secNum = parseFloat(secNum);
		if(typeof secNum === 'number' && !isNaN(secNum)){
			if(secNum >= 0.1){
				if (SDK_VERSION_CODE && SDK_VERSION_CODE >= 50) {
					console.log("proximityDetectWithTime was called.  secNum=" + secNum);
					window.location.href = "proximityDetect://?second=" + secNum;
				}else{
					// TODO call SDK3 or do nothing?
					console.log('[warning] call SDK3 or do nothing?')
				}
			}else{
				//console.log("*** [error] The secNum is illegal number. (secNum=" + secNum + ") [@proximityDetectWithTime(secNum)]");
				mraid.fireErrorEvent("The secNum is illegal number. (secNum=" + secNum + ")", "proximityDetectWithTime");
			}
		}else{
			//console.log("*** [error] The secNum type is not number. (secNum=" + secNum + ", secNum type is " + (typeof secNum) + ") [@proximityDetectWithTime(secNum)]");
			mraid.fireErrorEvent("The secNum type is not number. (secNum=" + secNum + ", secNum type is " + (typeof secNum) + ")", "proximityDetectWithTime");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-proximity function.", "proximityDetectWithTime");
	}
}

/********************* CallBack_Proximity *************************/
var Proximity_CALLBACK;
/**
 *  iOS SDK回報   偵測秒數內是否成功感測
 *  @param {int}  finialProximity : -1(No Sensor)、0(Not Detected)、1(Detected)
 */
var proximityDetectCallBack = function(finialProximity) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_PROXIMITY)){
		// console.log("proximityDetectCallBack()...... finialProximity: " + finialProximity);
		if (Proximity_CALLBACK
			&& (typeof Proximity_CALLBACK === "function")) {
			Proximity_CALLBACK(finialProximity);
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-proximity function.", "proximityDetectCallBack");
	}
};

/**
 * 通知廣告素材proximityDetect finialProximity
 * 廣告素材須提供一個函式，該函式必須有一個輸入參數
 */
var registerproximityDetectEvent = function(callback) {
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_PROXIMITY)){
	//	console.log("registerproximityDetectEvent()......");
		if (callback && (typeof callback === "function")) {
			Proximity_CALLBACK = callback;
		} else {
			// console.log("[error] callback is not function. [@registerproximityDetectEvent()]");
			mraid.fireErrorEvent("Callback is not function.", "registerproximityDetectEvent");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-proximity function.", "registerproximityDetectEvent");
	}
};


/********************* CallBack_Microphone *************************/

var MAX_DECIBEL_CALLBACK;
/**
 *  iOS SDK回報 最大分貝量
 *  @param {int}    maxDec 1~∞, 單位:分貝
 */
var maxDecibelCallback = function(maxDec) {
	// console.log("maxDecibelCallback()...... maxDec: " + maxDec);
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_MIC)){
		if (MAX_DECIBEL_CALLBACK 
			&& (typeof MAX_DECIBEL_CALLBACK === "function")) {
			MAX_DECIBEL_CALLBACK(maxDec);
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-mic function.", "maxDecibelCallback");
	}
};

/**
 * 通知廣告素材maxDecibel maxDec
 * 廣告素材須提供一個函式，該函式必須有一個輸入參數
 */
var registerMaxDecibelEvent = function(callback) {
//	console.log("registerMaxDecibelEvent()......");
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_MIC)){
		if (callback && (typeof callback === "function")) {
			MAX_DECIBEL_CALLBACK = callback;
		} else {
			// console.log("[error] callback is not function. [@registerMaxDecibelEvent()]");
			mraid.fireErrorEvent("Callback is not function.", "registerMaxDecibelEvent");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-mic function.", "registerMaxDecibelEvent");
	}
};

var IS_OVER_DECIBEL_CALLBACK;
/**
 * iOS SDK回報 是否超過分貝量
 * @param {boolean}    isOver 是否超過(true/false)
 */
var isOverDecibelCallback = function(isOver) {
	// console.log("isOverDecibelCallback()...... isOver: " + isOver);
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_MIC)){	
		if (IS_OVER_DECIBEL_CALLBACK 
			&& (typeof IS_OVER_DECIBEL_CALLBACK === "function")) {
			IS_OVER_DECIBEL_CALLBACK(isOver);
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-mic function.", "isOverDecibelCallback");
	}
};

/**
 * 通知廣告素材isOverDecibel isOver
 * 廣告素材須提供一個函式，該函式必須有一個輸入參數
 */
var registerIsOverDecibelEvent = function(callback) {
//	console.log("registerIsOverDecibelEvent()......");
	if(mraid.supports(mraid.SUPPORTED_FEATURES.TAMEDIA_MIC)){
		if (callback && (typeof callback === "function")) {
			IS_OVER_DECIBEL_CALLBACK = callback;
		} else {
			// console.log("[error] callback is not function. [@registerIsOverDecibelEvent()]");
			mraid.fireErrorEvent("Callback is not function.", "registerIsOverDecibelEvent");
		}
	}else{
		mraid.fireErrorEvent("The SDK does not support tamedia-mic function.", "registerIsOverDecibelEvent");
	}
};