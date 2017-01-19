@import "framework-utils/MochaJSDelegate.js"
@import 'helpers/translate.js'
@import 'helpers/files.js'

var qordobaSDK = qordobaSDK || {};
log("Start....");
var I18N = {},
    lang = "en-US",
    language = "";

function _(str, data){
    var str = (I18N[lang] && I18N[lang][str])? I18N[lang][str]: str;

    var idx = -1;
    return str.replace(/\%\@/gi, function(){
        idx++;
        return data[idx];
    });
}

qordobaSDK.editor = {
		init: function(context) {
			this.extend(context);
            this.document = context.document;
            this.documentData = this.document.documentData();
            this.window = this.document.window();
            this.pages = this.document.pages();
            this.page = this.document.currentPage();
            this.artboard = this.page.currentArtboard();
            this.current = this.artboard || this.page;
            this.pluginRoot = this.scriptPath
                    .stringByDeletingLastPathComponent()
                    .stringByDeletingLastPathComponent()
                    .stringByDeletingLastPathComponent();
            this.pluginSketch = this.pluginRoot + "/Contents/Sketch/helpers";

            if(NSFileManager.defaultManager().fileExistsAtPath(this.pluginSketch + "/i18n/" + lang + ".json")){
                language = NSString.stringWithContentsOfFile_encoding_error(this.pluginSketch + "/i18n/" + lang + ".json", NSUTF8StringEncoding, nil);

                I18N[lang] = JSON.parse(language);
                language = "I18N[\'" + lang + "\'] = " + language;
            }

            this.symbolsPage = this.find({key: "(name != NULL) && (name == %@)", match: "Symbols"}, this.document);
            this.symbolsPage = (this.symbolsPage.count)? this.symbolsPage[0]: this.symbolsPage;
            if(!this.symbolsPage){
                this.symbolsPage = this.document.addBlankPage();
                this.symbolsPage.setName("Symbols");
                this.document.setCurrentPage(this.page);
            }

            this.configs = this.getConfigs();
            return this;
		},
        extend: function( options, target ){
            var target = target || this;

            for ( var key in options ){
                target[key] = options[key];
            }
            return target;
        }
};

var BorderPositions = ["center", "inside", "outside"];
var FillTypes = ["color", "gradient"];
var GradientTypes = ["linear", "radial", "angular"];
var TextAligns = ["left", "right", "center", "justify", "left"];

qordobaSDK.editor.extend({
    regexNames: /OVERLAY\#|WIDTH\#|HEIGHT\#|TOP\#|RIGHT\#|BOTTOM\#|LEFT\#|VERTICAL\#|HORIZONTAL\#|NOTE\#|PROPERTY\#|LITE\#/,
    colors: {
        overlay: {
            layer: { r: 1, g: 0.333333, b: 0, a: 0.3 },
            text: { r: 1, g: 1, b: 1, a: 1 }
        },
        size: {
            layer: { r: 1, g: 0.333333, b: 0, a: 1 },
            text: { r: 1, g: 1, b: 1, a: 1 }
        },
        spacing: {
            layer: { r: 0.313725, g: 0.890196, b: 0.760784, a: 1 },
            text: { r: 1, g: 1, b: 1, a: 1 }
        },
        property: {
            layer: { r: 0.960784, g: 0.650980, b: 0.137255, a: 1 },
            text: { r: 1, g: 1, b: 1, a: 1 }
        },
        lite: {
            layer: { r: 0.564706, g: 0.074510, b: 0.996078, a: 1 },
            text: { r: 1, g: 1, b: 1, a: 1 }
        },
        note: {
            layer: { r: 1, g: 0.988235, b: 0.862745, a: 1 },
            border: { r: 0.8, g: 0.8, b: 0.8, a: 1},
            text: { r: 0.333333, g: 0.333333, b: 0.333333, a: 1 }
        }
    }
});

// api.js
qordobaSDK.editor.extend({
    is: function(layer, theClass){
        if(!layer) return false;
        var klass = layer.class();
        return klass === theClass;
    },
    addGroup: function(){
        return MSLayerGroup.new();
    },
    addShape: function(){
        var shape = MSRectangleShape.alloc().initWithFrame(NSMakeRect(0, 0, 100, 100));
        return MSShapeGroup.shapeWithPath(shape);
    },
    addText: function(container){
        var text = MSTextLayer.new();
        text.setStringValue("text");
        return text;
    },
    removeLayer: function(layer){
        var container = layer.parentGroup();
        if (container) container.removeLayer(layer);
    },
    getRect: function(layer){
     var rect = layer.absoluteRect();
        return {
            x: Math.round(rect.x()),
            y: Math.round(rect.y()),
            width: Math.round(rect.width()),
            height: Math.round(rect.height()),
            maxX: Math.round(rect.x() + rect.width()),
            maxY: Math.round(rect.y() + rect.height()),
            setX: function(x){ rect.setX(x); this.x = x; this.maxX = this.x + this.width; },
            setY: function(y){ rect.setY(y); this.y = y; this.maxY = this.y + this.height; },
            setWidth: function(width){ rect.setWidth(width); this.width = width; this.maxX = this.x + this.width; },
            setHeight: function(height){ rect.setHeight(height); this.height = height; this.maxY = this.y + this.height; }
        };
    },
    toNopPath: function(str){
        return this.toJSString(str).replace(/[\/\\\?]/g, " ");
    },
    toHTMLEncode: function(str){
        return this.toJSString(str)
                    .replace(/\&/g, "&amp;")
                    .replace(/\</g, "&lt;")
                    .replace(/\>/g, '&gt;')
                    .replace(/\'/g, "&#39;")
                    .replace(/\"/g, "&quot;")
                    .replace(/\u2028/g,"\\u2028")
                    .replace(/\u2029/g,"\\u2029")
                ;
        // return str.replace(/\&/g, "&amp;").replace(/\"/g, "&quot;").replace(/\'/g, "&#39;").replace(/\</g, "&lt;").replace(/\>/g, '&gt;');
    },
    toSlug: function(str){
        return this.toJSString(str)
                .toLowerCase()
                .replace(/(<([^>]+)>)/ig, "")
                .replace(/[\/\+\|]/g, " ")
                .replace(new RegExp("[\\!@#$%^&\\*\\(\\)\\?=\\{\\}\\[\\]\\\\\\\,\\.\\:\\;\\']", "gi"),'')
                .replace(/\s+/g,'-')
                ;
    },
    toJSString: function(str){
        return new String(str).toString();
    },
    toJSNumber: function(str){
        return Number( this.toJSString(str) );
    },
    pointToJSON: function(point){
        return {
            x: parseFloat(point.x),
            y: parseFloat(point.y)
        };
    },
    rectToJSON: function(rect, referenceRect) {
        if (referenceRect) {
            return {
                x: Math.round( rect.x() - referenceRect.x() ),
                y: Math.round( rect.y() - referenceRect.y() ),
                width: Math.round( rect.width() ),
                height: Math.round( rect.height() )
            };
        }

        return {
            x: Math.round( rect.x() ),
            y: Math.round( rect.y() ),
            width: Math.round( rect.width() ),
            height: Math.round( rect.height() )
        };
    },
    colorToJSON: function(color) {
        return {
            r: Math.round(color.red() * 255),
            g: Math.round(color.green() * 255),
            b: Math.round(color.blue() * 255),
            a: color.alpha(),
            "color-hex": color.immutableModelObject().stringValueWithAlpha(false) + " " + Math.round(color.alpha() * 100) + "%",
	    "argb-hex": "#" + this.toHex(color.alpha() * 255) + color.immutableModelObject().stringValueWithAlpha(false).replace("#", ""),
            "css-rgba": "rgba(" + [
                            Math.round(color.red() * 255),
                            Math.round(color.green() * 255),
                            Math.round(color.blue() * 255),
                            (Math.round(color.alpha() * 100) / 100)
                        ].join(",") + ")",
            "ui-color": "(" + [
                            "r:" + (Math.round(color.red() * 100) / 100).toFixed(2),
                            "g:" + (Math.round(color.green() * 100) / 100).toFixed(2),
                            "b:" + (Math.round(color.blue() * 100) / 100).toFixed(2),
                            "a:" + (Math.round(color.alpha() * 100) / 100).toFixed(2)
                        ].join(" ") + ")"
        };
    },
    colorStopToJSON: function(colorStop) {
        return {
            color: this.colorToJSON(colorStop.color()),
            position: colorStop.position()
        };
    },
    gradientToJSON: function(gradient) {
        var stopsData = [],
            stop, stopIter = gradient.stops().objectEnumerator();
        while (stop = stopIter.nextObject()) {
            stopsData.push(this.colorStopToJSON(stop));
        }

        return {
            type: GradientTypes[gradient.gradientType()],
            from: this.pointToJSON(gradient.from()),
            to: this.pointToJSON(gradient.to()),
            colorStops: stopsData
        };
    },
    shadowToJSON: function(shadow) {
        return {
            type: shadow instanceof MSStyleShadow ? "outer" : "inner",
            offsetX: shadow.offsetX(),
            offsetY: shadow.offsetY(),
            blurRadius: shadow.blurRadius(),
            spread: shadow.spread(),
            color: this.colorToJSON(shadow.color())
        };
    },
    getRadius: function(layer){
        return ( layer.layers && this.is(layer.layers().firstObject(), MSRectangleShape) ) ? layer.layers().firstObject().fixedRadius(): 0;
    },
    getBorders: function(style) {
        var bordersData = [],
            border, borderIter = style.borders().objectEnumerator();
        while (border = borderIter.nextObject()) {
            if (border.isEnabled()) {
                var fillType = FillTypes[border.fillType()],
                    borderData = {
                        fillType: fillType,
                        position: BorderPositions[border.position()],
                        thickness: border.thickness()
                    };

                switch (fillType) {
                    case "color":
                        borderData.color = this.colorToJSON(border.color());
                        break;

                    case "gradient":
                        borderData.gradient = this.gradientToJSON(border.gradient());
                        break;

                    default:
                        continue;
                }

                bordersData.push(borderData);
            }
        }

        return bordersData;
    },
    getFills: function(style) {
        var fillsData = [],
            fill, fillIter = style.fills().objectEnumerator();
        while (fill = fillIter.nextObject()) {
            if (fill.isEnabled()) {
                var fillType = FillTypes[fill.fillType()],
                    fillData = {
                        fillType: fillType
                    };

                switch (fillType) {
                    case "color":
                        fillData.color = this.colorToJSON(fill.color());
                        break;

                    case "gradient":
                        fillData.gradient = this.gradientToJSON(fill.gradient());
                        break;

                    default:
                        continue;
                }

                fillsData.push(fillData);
            }
        }

        return fillsData;
    },
    getShadows: function(style) {
        var shadowsData = [],
            shadow, shadowIter = style.shadows().objectEnumerator();
        while (shadow = shadowIter.nextObject()) {
            if (shadow.isEnabled()) {
                shadowsData.push(this.shadowToJSON(shadow));
            }
        }

        shadowIter = style.innerShadows().objectEnumerator();
        while (shadow = shadowIter.nextObject()) {
            if (shadow.isEnabled()) {
                shadowsData.push(this.shadowToJSON(shadow));
            }
        }

        return shadowsData;
    },
    getOpacity: function(style){
        return style.contextSettings().opacity()
    },
    getStyleName: function(layer){
        var styles = (this.is(layer, MSTextLayer))? this.document.documentData().layerTextStyles(): this.document.documentData().layerStyles(),
            layerStyle = layer.style(),
            sharedObjectID = layerStyle.sharedObjectID(),
            style;

        styles = styles.objectsSortedByName();

        if(styles.count() > 0){
            style = this.find({key: "(objectID != NULL) && (objectID == %@)", match: sharedObjectID}, styles);
        }
        
        if(!style) return "";
        return this.toJSString(style.name());
    }
});

// help.js
qordobaSDK.editor.extend({
    toHex:function(c) {
        var hex = Math.round(c).toString(16).toUpperCase();
        return hex.length == 1 ? "0" + hex :hex;
    },
    isIntersect: function(targetRect, layerRect){
        return !(
            targetRect.maxX <= layerRect.x ||
            targetRect.x >= layerRect.maxX ||
            targetRect.y >= layerRect.maxY ||
            targetRect.maxY <= layerRect.y
        );
    },
    getDistance: function(targetRect, containerRect){
        var containerRect = containerRect || this.getRect(this.current);

        return {
            top: (targetRect.y - containerRect.y),
            right: (containerRect.maxX - targetRect.maxX),
            bottom: (containerRect.maxY - targetRect.maxY),
            left: (targetRect.x - containerRect.x),
        }
    },
    message: function(message){
        this.document.showMessage(message);
    },
    find: function(format, container, returnArray){
        if(!format || !format.key  || !format.match){
            return false;
        }
        var predicate = NSPredicate.predicateWithFormat(format.key,format.match),
            container = container || this.current,
            items;

        if( (container.class && container.class() == __NSArrayI) ){
            items = container;
        }
        else if(container.pages){
            items = container.pages();
        }
        else if( this.is( container, MSSharedStyleContainer ) || this.is( container, MSSharedTextStyleContainer ) ){
            items = container.objectsSortedByName();
        }
        else if( container.children ){
            items = container.children();
        }
        else{
             items = container;
        }

        var queryResult = items.filteredArrayUsingPredicate(predicate);

        if(returnArray) return queryResult;

        if (queryResult.count() == 1){
            return queryResult[0];
        } else if (queryResult.count() > 0){
            return queryResult;
        } else {
            return false;
        }
    }
});

// configs.js
qordobaSDK.editor.extend({
    getConfigs: function(container){
        return JSON.parse('{"colorFormat": "argb-hex", "exportOption": "1","scale": "0.5","timestamp": 1471251211802,"unit": "pt"}');
    }
});

// Panel.js
qordobaSDK.editor.extend({
    WebPanel: function(options){
        var self = this,
            options = this.extend(options, {
                url: this.pluginSketch + "/panel/processing.html",
                width: 240,
                height: 316,
                state: 1,
                floatWindow: false,
                data: {
                    density: 2,
                    unit: "dp/sp"
                },
                titleBgColor: {
                    r: 0.305,
                    g: 0.294,
                    b: 0.450,
                    a: 1
                },
                contentBgColor: {
                    r: 0.305,
                    g: 0.294,
                    b: 0.450,
                    a: 1
                },
                hideClostButton: true,
                callback: function( data ){ return data; }
            }),
            result = false;
        options.url = encodeURI("file://" + options.url);

        COScript.currentCOScript().setShouldKeepAround_(true);

        var frame = NSMakeRect(0, 0, options.width, (options.height + 32)),
            //titleBgColor = NSColor.colorWithRed_green_blue_alpha(0.1, 0.1, 0.1, 1),
            //titleBgColor = NSColor.colorWithRed_green_blue_alpha(0.92,0.92,0.92,1),
            titleBgColor = NSColor.colorWithRed_green_blue_alpha(options.titleBgColor.r,options.titleBgColor.g,options.titleBgColor.b,options.titleBgColor.a),
            contentBgColor = NSColor.colorWithRed_green_blue_alpha(options.contentBgColor.r,options.contentBgColor.g,options.contentBgColor.b,options.contentBgColor.a);
            //contentBgColor = NSColor.colorWithRed_green_blue_alpha(1, 1, 1, 1);
            //contentBgColor = NSColor.colorWithRed_green_blue_alpha(0.13, 0.13, 0.13, 1);

        var Panel = NSPanel.alloc().init();

        Panel.setTitlebarAppearsTransparent(true);
        Panel.standardWindowButton(NSWindowCloseButton).setHidden(options.hideClostButton);
        Panel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
        Panel.standardWindowButton(NSWindowZoomButton).setHidden(true);
        Panel.setFrame_display(frame, false);
        Panel.setBackgroundColor(contentBgColor);

        var contentView = Panel.contentView(),
            webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, options.width, options.height)),
            windowObject = webView.windowScriptObject(),
            delegate = new MochaJSDelegate({
                "webView:didFinishLoadForFrame:": (function(webView, webFrame){
                        var WebAction = [
                                    "function WebAction(data){",
                                        "window.SMData = encodeURI(JSON.stringify(data));",
                                        "window.location.hash = 'submit';",
                                        // "console.log(SMData)",
                                    "}",
                                    "function SMImportAction(data){",
                                        "window.location.hash = 'import';",
                                        // "console.log(SMData)",
                                    "}"
                                ].join(""),
                            DOMReady = [
                                    "$(",
                                        "function(){",
                                            "init(" + JSON.stringify(options.data) + ")",
                                        "}",
                                    ");"
                                ].join("");

                        windowObject.evaluateWebScript(WebAction);
                        windowObject.evaluateWebScript(language);
                        windowObject.evaluateWebScript(DOMReady);
                        COScript.currentCOScript().setShouldKeepAround_(false);
                    }),
                "webView:didChangeLocationWithinPageForFrame:": (function(webView, webFrame){
                        var request = NSURL.URLWithString(webView.mainFrameURL()).fragment();

                        if( options.state ){
                            Panel.orderOut(nil);
                            NSApp.stopModal();
                            if(request == "submit"){
                                var data = JSON.parse(decodeURI(windowObject.valueForKey("SMData")));
                                options.callback(data);
                                result = true;
                            }
                        }
                        else if(request == "import"){
                            if( options.importCallback(Panel, NSApp) ){
                                 self.message(_("Import complete!"));
                            }
                            else{
                                windowObject.evaluateWebScript("window.location.hash = '';");
                            }
                        }
                        else if(request == "complete"){

                        }
                        COScript.currentCOScript().setShouldKeepAround_(false);
                    })
            });

        contentView.setWantsLayer(true);
        contentView.layer().setFrame( contentView.frame() );
        contentView.layer().setCornerRadius(6);
        contentView.layer().setMasksToBounds(true);

        webView.setBackgroundColor(contentBgColor);
        webView.setFrameLoadDelegate_(delegate.getClassInstance());
        webView.setMainFrameURL_(options.url);

        contentView.addSubview(webView);

        var closeButton = Panel.standardWindowButton(NSWindowCloseButton);
        closeButton.setCOSJSTargetFunction(function(sender) {
            var request = NSURL.URLWithString(webView.mainFrameURL()).fragment();
            if(options.state == 0 && request == "submit"){
                data = JSON.parse(decodeURI(windowObject.valueForKey("SMData")));
                options.callback(data);
            }
            self.wantsStop = true;
            Panel.orderOut(nil);
            NSApp.stopModal();
        });
        closeButton.setAction("callAction:");

        var titlebarView = contentView.superview().titlebarViewController().view(),
            titlebarContainerView = titlebarView.superview();
        closeButton.setFrameOrigin(NSMakePoint(8, 8));
        titlebarContainerView.setFrame(NSMakeRect(0, options.height, options.width, 32));
        titlebarView.setFrameSize(NSMakeSize(options.width, 32));
        titlebarView.setTransparent(true);
        titlebarView.setBackgroundColor(titleBgColor);
        titlebarContainerView.superview().setBackgroundColor(titleBgColor);

        if(options.floatWindow){
            Panel.becomeKeyWindow();
            Panel.setLevel(NSFloatingWindowLevel);
            Panel.center();
            Panel.orderFront(NSApp.mainWindow());
            return webView;
        }
        else{
            NSApp.runModalForWindow(Panel);
        }

        return result;
    }
});


// export.js
qordobaSDK.editor.extend({
    slices: [],
    sliceCache: {},
    maskCache: [],
    hasExportSizes: function(layer){
        return layer.exportOptions().exportFormats().count() > 0;
    },
    isSliceGroup: function(layer) {
        return this.is(layer, MSLayerGroup) && this.hasExportSizes(layer);
    },
    isExportable: function(layer) {
        return this.is(layer, MSTextLayer) ||
               this.is(layer, MSShapeGroup) ||
               this.is(layer, MSBitmapLayer) ||
               this.is(layer, MSSliceLayer) ||
               this.is(layer, MSSymbolInstance) ||
               this.isSliceGroup(layer)
    },
    getStates: function(layer){
        var isVisible = true,
            isLocked = false,
            hasSlice = false,
            isEmpty = false,
            isMaskChildLayer = false,
            isMeasure = false;

        while (!( this.is(layer, MSArtboardGroup) || this.is(layer, MSSymbolMaster) ) ) {
            var group = layer.parentGroup();

            if( this.regexNames.exec(group.name()) ){
                isMeasure = true;
            }

            if (!layer.isVisible()) {
                isVisible = false;
            }

            if (layer.isLocked()) {
                isLocked = true;
            }

            if ( this.is(group, MSLayerGroup) && this.hasExportSizes(group) ) {
                hasSlice = true
            }

            if (
                this.maskObjectID &&
                group.objectID() == this.maskObjectID &&
                !layer.shouldBreakMaskChain()
            ) {
                isMaskChildLayer = true
            }

            if (
                this.is(layer, MSTextLayer) &&
                layer.isEmpty()
            ) {
                isEmpty = true
            }

            layer = group;
        }
        return {
            isVisible: isVisible,
            isLocked: isLocked,
            hasSlice: hasSlice,
            isMaskChildLayer: isMaskChildLayer,
            isMeasure: isMeasure,
            isEmpty: isEmpty
        }
    },
    checkMask: function(group, layer, layerData, layerStates){
        if(layer.hasClippingMask()){
            if(layerStates.isMaskChildLayer){
                this.maskCache.push({
                    objectID: this.maskObjectID,
                    rect: this.maskRect
                });
            }
            this.maskObjectID = group.objectID();
            this.maskRect = layerData.rect;
        }
        else if( !layerStates.isMaskChildLayer && this.maskCache.length > 0 ){
            var mask = this.maskCache.pop();
            this.maskObjectID = mask.objectID;
            this.maskRect = mask.rect;
            layerStates.isMaskChildLayer = true;
        }
        else if ( !layerStates.isMaskChildLayer ) {
            this.maskObjectID = undefined;
            this.maskRect = undefined;
        }

        if (layerStates.isMaskChildLayer){
            var layerRect = layerData.rect,
                maskRect = this.maskRect;

            layerRect.maxX = layerRect.x + layerRect.width;
            layerRect.maxY = layerRect.y + layerRect.height;
            maskRect.maxX = maskRect.x + maskRect.width;
            maskRect.maxY = maskRect.y + maskRect.height;

            var distance = this.getDistance(layerRect, maskRect),
                width = layerRect.width,
                height = layerRect.height;

            if(distance.left < 0) width += distance.left;
            if(distance.right < 0) width += distance.right;
            if(distance.top < 0) height += distance.top;
            if(distance.bottom < 0) height += distance.bottom;

            layerData.rect = {
                    x: ( distance.left < 0 )? maskRect.x: layerRect.x,
                    y: ( distance.top < 0 )? maskRect.y: layerRect.y,
                    width: width,
                    height: height
                }

        }
    },
    getExportable: function(layer, savePath){
        var self = this,
            exportable = [],
            size, sizes = layer.exportOptions().exportFormats(),
            sizesInter = sizes.objectEnumerator();

        var androidDensity = {
            "@0.75x": "ldpi",
            "@1x": "mdpi",
            "@1.5x": "hdpi",
            "@2x": "xhdpi",
            "@3x": "xxhdpi",
            "@4x": "xxxhdpi"
        }

        while (size = sizesInter.nextObject()) {

            var size = this.toJSString(size).split(" "),
                scale = self.toJSNumber(size[0]),
                format = size[2],
                suffix = this.toJSString(size[1]),
                suffix = suffix || "",
                density = suffix,
                drawablePath = "";

            if( sizes.count() == 1 && self.configs.scale != 1 && !density ){
                suffix = "@" + self.configs.scale + "x";
                density = suffix;
            }

            if( ( ( sizes.count() == 1 && scale == 1 && self.configs.scale == 1 ) && !density ) || ( sizes.count() > 1 && !density ) ){
                density = "@1x";
            }

            // Android
            if(self.configs.unit == "dp/sp"){
                drawablePath = "drawable-" + androidDensity[density] + "/";
                density = androidDensity[density];
                suffix = "";
            }

            this.exportImage({
                    layer: layer,
                    path: self.assetsPath,
                    scale: scale,
                    name: drawablePath + layer.name(),
                    suffix: suffix,
                    format: format
                });

            exportable.push({
                    name: self.toJSString(layer.name()),
                    density: density,
                    format: format,
                    path: drawablePath + layer.name() + suffix + "." + format
                });
        }

        return exportable;
    },
    checkSlice: function(layer, layerData, symbolLayer){
        var objectID = ( layerData.type == "symbol" )? this.toJSString(layer.symbolMaster().objectID()):
                        ( symbolLayer )? this.toJSString(symbolLayer.objectID()):
                        layerData.objectID;
        if( 
            (
                layerData.type == "slice" ||
                (
                    layerData.type == "symbol" &&
                    this.hasExportSizes(layer.symbolMaster())
                )
            ) &&
            !this.sliceCache[objectID]
        ){
            var sliceLayer = ( layerData.type == "symbol" )? layer.symbolMaster(): layer;
            if(symbolLayer && this.is(symbolLayer.parentGroup(), MSSymbolMaster)){
                layer.exportOptions().setLayerOptions(2);
            }

            this.assetsPath = this.savePath + "/assets";
            NSFileManager
                .defaultManager()
                .createDirectoryAtPath_withIntermediateDirectories_attributes_error(this.assetsPath, true, nil, nil);

            this.sliceCache[objectID] = layerData.exportable = this.getExportable(sliceLayer);
            this.slices.push({
                name: layerData.name,
                objectID: objectID,
                rect: layerData.rect,
                exportable: layerData.exportable
            })
        }
        else if( this.sliceCache[objectID] ){
            layerData.exportable = this.sliceCache[objectID];
        }
    },
    checkSymbol: function(artboard, layer, layerData, data){
        if( layerData.type == "symbol" ){
            var self = this,
                symbolObjectID = this.toJSString(layer.symbolMaster().objectID());

            layerData.objectID = symbolObjectID;

            if( !self.hasExportSizes(layer.symbolMaster()) && layer.symbolMaster().children().count() > 1 ){
                var symbolRect = this.getRect(layer),
                    symbolChildren = layer.symbolMaster().children(),
                    tempSymbol = layer.duplicate(),
                    tempGroup = tempSymbol.detachByReplacingWithGroup(),
                    tempGroupRect = this.getRect(tempGroup),
                    tempSymbolLayers = tempGroup.children().objectEnumerator(),
                    idx = 0;

                var tempArtboard = this.addShape();
                tempGroup.addLayers([tempArtboard]);
                var tempArtboardRect = this.getRect(tempArtboard),
                    symbolMasterFrame = layer.symbolMaster().frame();

                tempArtboardRect.setX(symbolRect.x);
                tempArtboardRect.setY(symbolRect.y);
                tempArtboardRect.setWidth(symbolMasterFrame.width());
                tempArtboardRect.setHeight(symbolMasterFrame.height());

                tempGroup.resizeToFitChildrenWithOption(0);
                tempGroupRect.setX(symbolRect.x);
                tempGroupRect.setY(symbolRect.y);
                tempGroupRect.setWidth(symbolRect.width);
                tempGroupRect.setHeight(symbolRect.height);
                this.removeLayer(tempArtboard);

                while(tempSymbolLayer = tempSymbolLayers.nextObject()){
                    self.getLayer(
                        artboard,
                        tempSymbolLayer,
                        data,
                        symbolChildren[idx]
                    );
                    idx++
                }
                this.removeLayer(tempGroup);
            }
        }
    },
    upload: function(organizationID, projectID, context){
    	var self = this,
        	savePath = NSTemporaryDirectory();
        log("Saving the reference at: " + savePath);

        var hasArtboards = (self.page.artboards().count() > 0)
        
        this.selectionArtboards  = this.page.artboards();
        //self.message(_("Exporting..."));
	    var processingPanel = this.WebPanel({
	            url: this.pluginSketch + "/panel/processing.html",
	            width: 350,
	            height: 70,
	            floatWindow: true
	        }),
	        processing = processingPanel.windowScriptObject(),
	        template = NSString.stringWithContentsOfFile_encoding_error(this.pluginSketch + "/template.html", NSUTF8StringEncoding, nil);
            //processing.evaluateWebScript("processing('"  + Math.round( 50 ) +  "%', '" + "Processing the files that will be" + "')");
         //return;   
	    this.savePath = savePath;
	    var idx = 1;
		var doc = self.document
		var currentPage = self.page;
		var documentName = self.document.displayName().replace(/.sketch$/,"");
		var pageName = [currentPage name]
		
		var fileGenerated = false;
	    coscript.shouldKeepAround = true
        
        var filePath = false;
        var fileId = false;
        var geometryPath = false;
        var error = false;
        var processMessage = _("Intialization...");
	    coscript.scheduleWithRepeatingInterval_jsFunction( 0, function( interval ){
	        // self.message('Processing layer ' + idx + ' of ' + self.allCount);
            //Generate the source file
	        if(idx > 20 && filePath === false && fileId === false && geometryPath === false && !error){
                log("Generating the File.....");
                fileGenerated = true;
                processMessage = "Generating the source document.."
	        	processing.evaluateWebScript("processing('"  + Math.round( idx ) +  "%', '" + processMessage + "')");
	        	var stringsAsJson = translate.generateLocaleForPage(currentPage)
	        	filePath = fileHelper.generateFile(context,stringsAsJson,pageName)
	        }

            if(idx > 40 && filePath != false && fileId === false && geometryPath === false && !error){
                processMessage = _("Uploading the source document..");
                processing.evaluateWebScript("processing('"  + Math.round( idx ) +  "%', '" + processMessage + "')");
                //upload the file
                fileId = postFile(context,filePath,organizationID,projectID,documentName + " - "+ pageName)
                if(fileId === false){
                    error  = true;
                }
                utils.saveFileIdForPage(projectID,documentName,currentPage,fileId,self.context)
                log("file id is: " + fileId)
            }
            if(idx > 70 && filePath != false && fileId != false && geometryPath === false && hasArtboards){
                processMessage = _("Uploading the reference document..");
                processing.evaluateWebScript("processing('"  + Math.round( idx ) +  "%', '" + processMessage + "')");
                var screenShotFile = fileHelper.exportPageToPng(context,currentPage);
                
                log("screenShotFile file name: " + screenShotFile)

                geometryPath = self.specExport();
                if(geometryPath){
                    geometryPath = geometryPath + "index.html";
                }
                var reference_id = postReference(context, screenShotFile, geometryPath, organizationID, projectID, fileId.fileId, documentName + " - "+ pageName)
                if(reference_id === false){
                    error = true;
                }

            }
            
            if(idx > 40 && filePath === false){
                //upload the file
                coscript.shouldKeepAround = false;
                fireError("Error!", _("an error happened while genertaing source document, please try again."));
                return interval.cancel();
            }

            if(idx > 70 && fileId === false && geometryPath === false){
                //upload the file
                coscript.shouldKeepAround = false;
                fireError("Error!", _("an error happened while uploading the document, please try again."));
                return interval.cancel();
            }
            //Handle the errors

            idx++;
            processing.evaluateWebScript("processing('"  + Math.round( idx ) +  "%', '" + processMessage + "')");
            
            if( idx >100 && filePath != false && fileId != false && geometryPath != false){
	            coscript.shouldKeepAround = false;
                fireError("Success!", "Your page \""+documentName + " - "+ pageName+"\" has been uploaded to Qordoba.")       
	            return interval.cancel();
	        }

            if( idx >100 && filePath != false && fileId != false && geometryPath == false && !hasArtboards){
                coscript.shouldKeepAround = false;
                fireError("Success!", "Your page \""+documentName + " - "+ pageName+"\" has been uploaded to Qordoba. \nNote: Qordoba couldn't upload the page preview because the selected page has no artboards!")       
                return interval.cancel();
            }
	    });
    },
    specExport: function(){
        var self = this,
            savePath = NSTemporaryDirectory();
        log("Saving the reference at: " + savePath);
        this.selectionArtboards  = this.page.artboards();
        //self.message(_("Exporting..."));
        
        this.savePath = savePath;
        var artboardIndex = 0,
            layerIndex = 0,
            data = {
                scale: self.configs.scale,
                unit: self.configs.unit,
                colorFormat: self.configs.colorFormat,
                artboards: [],
                slices: [],
                colors: []
            },
            template = NSString.stringWithContentsOfFile_encoding_error(this.pluginSketch + "/template.html", NSUTF8StringEncoding, nil);

        self.single = false;

        //Generate artboards data
        for(artboardIndex=0; artboardIndex < this.selectionArtboards.length; artboardIndex++){
            log("Export artboard num: " + artboardIndex);
            if(!data.artboards[artboardIndex]){
                data.artboards.push({layers: [], notes: []});
                self.maskCache = [];
                self.maskObjectID = undefined;
                self.maskRect = undefined;
            }
            
            var artboard = self.selectionArtboards[artboardIndex],
                page = artboard.parentGroup(),
                artboardChildrenLength = artboard.children().length;

            

            for(layerIndex=0; layerIndex < artboardChildrenLength; layerIndex++){
                var layer = artboard.children()[layerIndex];
                self.getLayer(
                    artboard, // Sketch artboard element
                    layer, // Sketch layer element
                    data.artboards[artboardIndex] // Save to data
                );
                if( self.is(layer, MSArtboardGroup) ){
                    log(layer);
                    var objectID = artboard.objectID(),
                        artboardRect = self.getRect(artboard),
                        page = artboard.parentGroup(),
                        name = self.toSlug(page.name() + ' ' + artboard.name());

                    data.artboards[artboardIndex].pageName = self.toHTMLEncode(page.name());
                    data.artboards[artboardIndex].pageObjectID = self.toJSString(page.objectID());
                    data.artboards[artboardIndex].name = self.toHTMLEncode(artboard.name());
                    data.artboards[artboardIndex].objectID = self.toJSString(artboard.objectID());
                    data.artboards[artboardIndex].width = artboardRect.width;
                    data.artboards[artboardIndex].height = artboardRect.height;
                    // data.artboards[artboardIndex].imagePath = "preview/" + objectID + ".png";
                    var imageURL = NSURL.fileURLWithPath(self.exportImage({
                            layer: artboard,
                            scale: 2,
                            name: objectID
                        })),
                        imageData = NSData.dataWithContentsOfURL(imageURL),
                        imageBase64 = imageData.base64EncodedStringWithOptions(0);
                    data.artboards[artboardIndex].imageBase64 = 'data:image/png;base64,' + imageBase64;
                }
            }
        }

        var selectingPath = savePath;
        if(self.configs.exportOption){
            self.writeFile({
                    content: self.template(template, {lang: language, data: JSON.stringify(data).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')}),
                    path: self.toJSString(savePath),
                    fileName: "index.html"
                });
            selectingPath = savePath + "/index.html";
        }
        //NSWorkspace.sharedWorkspace().activateFileViewerSelectingURLs(NSArray.arrayWithObjects(NSURL.fileURLWithPath(selectingPath)));
        //self.message(_("Export complete!"));
        return savePath;
    },
    writeFile: function(options) {
        var options = this.extend(options, {
                content: "Type something!",
                path: this.toJSString(NSTemporaryDirectory()),
                fileName: "temp.txt"
            }),
            content = NSString.stringWithString(options.content),
            savePathName = [];

        NSFileManager
            .defaultManager()
            .createDirectoryAtPath_withIntermediateDirectories_attributes_error(options.path, true, nil, nil);

        savePathName.push(
            options.path,
            "/",
            options.fileName
        );
        savePathName = savePathName.join("");

        content.writeToFile_atomically_encoding_error(savePathName, false, NSUTF8StringEncoding, null);
    },
    exportImage: function(options) {
        var options = this.extend(options, {
                layer: this.artboard,
                path: this.toJSString(NSTemporaryDirectory()),
                scale: 1,
                name: "preview",
                suffix: "",
                format: "png"
            }),
            document = this.document,
            slice = MSExportRequest.exportRequestsFromExportableLayer(options.layer).firstObject(),
            savePathName = [];

        slice.scale = options.scale;
        slice.format = options.format;

        savePathName.push(
                options.path,
                "/",
                options.name,
                options.suffix,
                ".",
                options.format
            );
        savePathName = savePathName.join("");

        document.saveArtboardOrSlice_toFile(slice, savePathName);

        return savePathName;
    },
    getLayer: function(artboard, layer, data, symbolLayer){
        var artboardRect = artboard.absoluteRect(),
            group = layer.parentGroup(),
            layerStates = this.getStates(layer);

        if(layer && this.is(layer, MSLayerGroup) && /NOTE\#/.exec(layer.name())){
            var textLayer = layer.children()[2];

            data.notes.push({
                rect: this.rectToJSON(textLayer.absoluteRect(), artboardRect),
                note: this.toHTMLEncode(textLayer.stringValue()).replace(/\n/g, "<br>")
            });

            layer.setIsVisible(false);
        }

        if (
            !this.isExportable(layer) ||
            !layerStates.isVisible ||
            ( layerStates.isLocked && !this.is(layer, MSSliceLayer) ) ||
            layerStates.isEmpty ||
            layerStates.hasSlice ||
            layerStates.isMeasure
        ){
            return this;
        }

        var layerType = this.is(layer, MSTextLayer) ? "text" :
               this.is(layer, MSSymbolInstance) ? "symbol" :
               this.is(layer, MSSliceLayer) || this.hasExportSizes(layer)? "slice":
               "shape",
            layerData = {
                    objectID: this.toJSString( layer.objectID() ),
                    type: layerType,
                    name: this.toHTMLEncode(layer.name()),
                    rect: this.rectToJSON(layer.absoluteRect(), artboardRect)
                };

        if(symbolLayer) layerData.objectID = this.toJSString( symbolLayer.objectID() )

        if ( ! ( layerType == "slice" || layerType == "symbol" ) ) {
            var layerStyle = layer.style();
            layerData.rotation = layer.rotation();
            layerData.radius = this.getRadius(layer);
            layerData.borders = this.getBorders(layerStyle);
            layerData.fills = this.getFills(layerStyle);
            layerData.shadows = this.getShadows(layerStyle);
            layerData.opacity = this.getOpacity(layerStyle);
            layerData.styleName = this.getStyleName(layer);
        }

        if ( layerType == "text" ) {
            layerData.content = this.toHTMLEncode(layer.stringValue());
            layerData.color = this.colorToJSON(layer.textColor());
            layerData.fontSize = layer.fontSize();
            layerData.fontFace = this.toJSString(layer.fontPostscriptName());
            layerData.textAlign = TextAligns[layer.textAlignment()];
            layerData.letterSpacing = this.toJSNumber(layer.characterSpacing());
            layerData.lineHeight = layer.lineHeight();
        }

        var layerCSSAttributes = layer.CSSAttributes(),
            css = [];

        for(var i = 0; i < layerCSSAttributes.count(); i++) {
            var c = layerCSSAttributes[i]
            if(! /\/\*/.exec(c) ) css.push(this.toJSString(c));
        }
        if(css.length > 0) layerData.css = css;

        this.checkMask(group, layer, layerData, layerStates);
        this.checkSlice(layer, layerData, symbolLayer);
        data.layers.push(layerData);
        this.checkSymbol(artboard, layer, layerData, data);
    },
    template: function(content, data) {
        var content = content.replace(new RegExp("\\<\\!\\-\\-\\s([^\\s\\-\\-\\>]+)\\s\\-\\-\\>", "gi"), function($0, $1) {
            if ($1 in data) {
                return data[$1];
            } else {
                return $0;
            }
        });
        return content;
    },
    languageSettingsPanel: function(context){
        var self = this,
            data = {};

        var languages = getLanguagesArray(context)
        //var languageNames = utils.getNames(languages)
    
        //utils.resetLanguageSettings(context);
        data = {
                languages: [],
                fonts: [],
                settings: utils.getLanguageSettings(context)
            };
         for(var i = 0; i < languages.count(); i++){
            data.languages.push({
                id: (languages[i].name + "").toLowerCase(),
                name: languages[i].name + ""
            });
         }
        var doc = context.document
        var fonts = doc.fontList()
        fonts = fonts.allFonts()
        for(var i = 0; i < fonts.count(); i++){
            data.fonts.push({
                id: (fonts[i] + "").toLowerCase(),
                name: fonts[i] + ""
            });
         }

        return this.WebPanel({
            url: this.pluginSketch + "/panel/language_settings.html",
            width: 702,
            height: 500,
            data: data,
            callback: function( data ){
                log("Final Data ***** ")
                log(data)
                utils.saveLanguageSettings(data,context);
            },
            titleBgColor: {
                r: 1,
                g: 1,
                b: 1,
                a: 1
            },
            contentBgColor: {
                r: 1,
                g: 1,
                b: 1,
                a: 1
            },
            hideClostButton: false
        });
    
    },
});
