
@import "editor.js"

function _(str){
    return str;
}

var editor = editor || {};

editor.utom = {
    configsPage: undefined,
    configsColors: undefined,
    prefix: "SMConfigs",
    configs: undefined,
    context: undefined,
    command: undefined,
    document: undefined,
    selection: undefined,
    pages: undefined,
    page: undefined,
    artboard: undefined,
    current: undefined,
    styles: undefined,
    isPercentage: false,
    init: function(context, currentIsArtboard){
        this.context = context;
        this.document = context.document;
        this.command = context.command;
        this.selection = context.selection;
        this.pages = this.document.pages();
        this.page = this.document.currentPage();
        this.artboard = this.page.currentArtboard();
        this.current = this.artboard || this.page;
        if(currentIsArtboard && !(this.is(this.current, MSArtboardGroup) || this.is(this.current, MSSymbolMaster))){
            this.message(_("You need an artboard."));
            return false;
        }

        this.initConfigs();
    },
    extend: function( options, target ){
        var target = target || this;

        for ( var key in options ){
            target[key] = options[key];
        }
        return target;
    },
    is: function(layer, theClass){
        if(!layer) return false;
        var klass = layer.class();
        return klass === theClass;
    },
    isIntersect: function(lf, tf){
        return !(
            lf.maxX <= tf.x ||
            lf.x >= tf.maxX ||
            lf.y >= tf.maxY ||
            lf.maxY <= tf.y
        );
    },
    getFrame: function(layer) {
        var rect = layer.absoluteRect();
        return {
            x: Math.round(rect.x()),
            y: Math.round(rect.y()),
            width: Math.round(rect.width()),
            height: Math.round(rect.height()),
            maxX: Math.round(rect.x() + rect.width()),
            maxY: Math.round(rect.y() + rect.height())
        };
    },
    getDistance: function(frame, target){
        var tf = target || this.getFrame(this.current);

        return [
            ( frame.y - tf.y ),
            ( (tf.x + tf.width) - frame.maxX ),
            ( (tf.y + tf.height) - frame.maxY ),
            ( frame.x - tf.x )
        ];
    },
    addLayer: function(type, container){
        var container = container || this.current;
        return container.addLayerOfType(type);
    },
    addGroup: function(container){
        var container = container || this.current;
        return this.addLayer("group", container);
    },
    addShape: function(container){
        var container = container || this.current;
        return this.addLayer("rectangle", container);
    },
    addText: function(container){
        var container = container || this.current;
        return this.addLayer("text", container);
    },
    removeLayer: function(layer){
        var container = layer.parentGroup();
        if (container) container.removeLayer(layer);
    },
    message: function(message){
        this.document.showMessage(message);
    }
};


//Math
editor.utom.extend({
    mathHalf: function(number){
        return Math.round( number / 2 );
    },
    math255: function(number){
        return Math.round( 255 * number );
    },
    updateLength: function(length, sp){
        var unit = (this.configs.resolution > 0)? "pt": "px";
        unit = (this.configs.resolution > 3)? "dp": unit;
        var scale = this.allResolution[this.configs.resolution].scale;

        length = Math.round( length / scale * 10 ) / 10;

        if(this.configs.resolution > 2 && sp){
            unit = "sp";
        }

        if (scale === 27) {
          unit = "gu";
        }

        if (scale === 14) {
          unit = "rem";
        }

        return length + unit;
    },
    updatePercentLength: function(length, width){
        var aFrame = this.artboard.frame();
        if (width) {
             return Math.round((length / aFrame.width()) * 1000) / 10 + "%";

        } 
        return Math.round((length / aFrame.height()) * 1000) / 10 + "%";
    },
    toHex:function(c) {
        var hex = Math.round(c).toString(16).toUpperCase();
        return hex.length == 1 ? "0" + hex :hex;
    },
    rgbToHex:function(r, g, b, a) {
        if (a === undefined) {
            return this.toHex(r) + this.toHex(g) + this.toHex(b);
        } else {
            return this.toHex(a * 255) + this.toHex(r) + this.toHex(g) + this.toHex(b);
        }
    }
});

//Find
editor.utom.extend({
    find: function(name, container, isArray, field){
        var field = field || "name";
        var predicate = NSPredicate.predicateWithFormat("(" + field + " != NULL) && (" + field + " == %@)", name);
        var container = container || this.current;
        var items;
        if(isArray){
            items = container;
        }
        else{
            items = container.children();
        }

        var queryResult = items.filteredArrayUsingPredicate(predicate);

        if (queryResult.count()==1){
            return queryResult[0];
        } else if (queryResult.count()>0){
            return queryResult;
        } else {
            return false;
        }
    }
});

//Shared
editor.utom.extend({
    sharedLayerStyle: function(name, color, alpha) {
        var layerStyles = this.document.documentData().layerStyles();
        var layerStylesLibrary = layerStyles.objectsSortedByName();
        var layerStyle = this.find(name, layerStylesLibrary, true);
        layerStyle = ( !layerStyle || this.is(layerStyle, MSSharedStyle))? layerStyle: layerStyle[0];

        var alpha = alpha || 1;

        if( layerStyle == false ){
            var style = MSStyle.alloc().init();
            var color = MSColor.colorWithSVGString(color);

            color.setAlpha(alpha);

            var fill = style.addStylePartOfType(0);
            fill.color = color;

            layerStyles.addSharedStyleWithName_firstInstance(name, style);

            layerStyle = style;
        }

        return (layerStyle.newInstance)? layerStyle.newInstance(): layerStyle;
    },
    sharedLayerStyleBorder: function(style, color, alpha) {
        var alpha = alpha || 1;
        var border = style.addStylePartOfType(1);
        var color = MSColor.colorWithSVGString(color);
        color.setAlpha(alpha);
        border.color = color;
        border.thickness = 1;

        return style;
    },
    sharedTextStyle: function(name, color, alpha, center) {
        var textStyles = this.document.documentData().layerTextStyles();
        var textStylesLibrary = textStyles.objectsSortedByName();
        var textStyle = this.find(name, textStylesLibrary, true);
        textStyle = (!textStyle || this.is(textStyle, MSSharedStyle))? textStyle: textStyle[0];

        var alpha = alpha || 1;

        if( textStyle == false ){
            var color = MSColor.colorWithSVGString(color);

            color.setAlpha(alpha);

            var textLayer = this.addText(this.page);
            textLayer.setTextColor(color);

            textLayer.setFontSize(14);
            textLayer.setFontPostscriptName("HelveticaNeue");
            if(center) textLayer.setTextAlignment(2);

            var style = textLayer.style();
            this.removeLayer(textLayer);

            textStyles.addSharedStyleWithName_firstInstance(name, textLayer.style());

            textStyle = style;
        }

        return (textStyle.newInstance)? textStyle.newInstance(): textStyle;
    }
})

//Configs
editor.utom.extend({
    getConfigs: function(container){
        var container = (container)? container: this.page;
        var command = this.command;
        var prefix = this.prefix;
        var configsData = [command valueForKey: prefix onLayer: container];
        return JSON.parse(configsData);
    },
    setConfigs: function(newConfigs, container){
        var container = (container)? container: this.page;
        var command = this.command;
        var prefix = this.prefix;
        var configs = this.extend(newConfigs, this.getConfigs(container) || {});
        configs.timestamp = new Date().getTime();

        var configsData = JSON.stringify(configs);
        [command setValue: configsData forKey: prefix onLayer: container];
        return configs;
    },
    removeConfigs: function(container){
        var container = (container)? container: this.page;
        var command = this.command;
        var prefix = this.prefix;

        [command setValue: null forKey: prefix onLayer: container];
    },
    initConfigs: function(){
        this.configs = this.getConfigs();
        
        if(false && !this.configs){
            var defaultConfigs = {};
            var resolution = this.resolutionSetting();

            if(!resolution && resolution !== 0){
                return false;
            }
            defaultConfigs.theme = 0;
            defaultConfigs.resolution = resolution;
            defaultConfigs.property = ["color", "border"];
            defaultConfigs.colorFormat = 0;
            this.configs = this.setConfigs(defaultConfigs);
        }

        

    }
});


editor.utom.extend({
    isHidden: false,
    isLocked: false,
    regexName: /OVERLAYER\#|WIDTH\#|HEIGHT\#|TOP\#|RIGHT\#|BOTTOM\#|LEFT\#|VERTICAL\#|HORIZONTAL\#|NOTE\#|LABEL\#|TYPOGRAPHY\#|PROPERTY\#|LITE\#/,
    toggleHidden: function(){
        if(!this.configs) return false;

        var page = this.page;

        var isHidden = (this.configs.isHidden)? false : !Boolean(this.configs.isHidden);
        this.configs = this.setConfigs({isHidden: isHidden});

        var layers = page.children().objectEnumerator();

        while(item = layers.nextObject()) {
            if(this.is(item, MSLayerGroup) && this.regexName.exec(item.name())){
                item.setIsVisible(!isHidden);
            }
        }
    },
    toggleLocked: function(){
        if(!this.configs) return false;

        var page = this.page;

        var isLocked = (this.configs.isLocked)? false : !Boolean(this.configs.isLocked);
        this.configs = this.setConfigs({isLocked: isLocked});

        var layers = page.children().objectEnumerator();

        while(item = layers.nextObject()) {
            if(this.is(item, MSLayerGroup) && this.regexName.exec(item.name())){
                item.setIsLocked(isLocked);
            }
        }
    },
    moveToGroup: function(){
        if(!this.configs) return false;

        var artboard = this.artboard;

        var groupSpecs = this.find("@Specs");
        if(!groupSpecs){
            groupSpecs = this.addGroup(artboard);
            groupSpecs.setName("@Specs");
        }

        var layers = artboard.children().objectEnumerator();
        var specLayers = [];

        while(item = layers.nextObject()) {
            if(this.is(item, MSLayerGroup) && this.regexName.exec(item.name())){
                this.removeLayer(item);
                specLayers.push(item);
            }
        }

        groupSpecs.addLayers(specLayers);
        groupSpecs.resizeToFitChildrenWithOption(0);
        groupSpecs.setIsLocked(true);
    },
    clearMeasure: function(){
        if(!this.configs) return false;

        var page = this.page;

        var layers = page.children().objectEnumerator();

        while(item = layers.nextObject()) {
            if(this.is(item, MSLayerGroup) && this.regexName.exec(item.name())){
                this.removeLayer(item);
            }
        }
    },
    resetSizeGuide: function(layerGroup){
        if(this.configs.theme) return this.resetSizeGuideNop( layerGroup );
        var smConfigs = this.getConfigs(layerGroup),
            layers = layerGroup.children().objectEnumerator(),
            label, gap, text;

        while(layer = layers.nextObject()) {
            if(layer.name() == "label") label = layer;
            if(layer.name() == "gap") gap = layer;
            if(this.is(layer, MSTextLayer)) text = layer;
        }

        if(/\%/.exec( this.toJSString(text.storage().string()) )) return false;

        lf = this.getFrame(label);
        gf = this.getFrame(gap);
        tf = this.getFrame(text);

        text.setStringValue(this.updateLength(smConfigs.original));
        text.setTextBehaviour(1);
        text.setTextBehaviour(0);

        ntf = this.getFrame(text);

        var la = label.absoluteRect();
        var ta = text.absoluteRect();
        var dx = this.mathHalf(ntf.width - tf.width);
        dx = (gf.maxX > lf.maxX)? (ntf.width - tf.width): dx;
        dx = (gf.x < lf.x && gf.maxX < lf.maxX)? 0: dx;
        ta.setX(tf.x - dx);
        la.setX(lf.x - dx);
        la.setWidth( ta.width() + 7 );

        layerGroup.resizeToFitChildrenWithOption(0);

        return layerGroup;
    },
    resetSizeGuideNop: function(layerGroup){
        var smConfigs = this.getConfigs(layerGroup),
            layers = layerGroup.children().objectEnumerator(),
            arrow, line, text;
        while(layer = layers.nextObject()) {
            if(layer.name() == "arrow") arrow = layer;
            if(layer.name() == "line") line = layer;
            if(this.is(layer, MSTextLayer)) text = layer;
        }

        if(/\%/.exec( this.toJSString(text.storage().string()) )) return false;

        af = this.getFrame(arrow);
        lf = this.getFrame(line);
        tf = this.getFrame(text);

        text.setStringValue(this.updateLength(smConfigs.original));
        text.setTextBehaviour(1);
        text.setTextBehaviour(0);

        ntf = this.getFrame(text);

        var aa = arrow.absoluteRect();
        var ta = text.absoluteRect();
        var dx = this.mathHalf(ntf.width - tf.width);
        if(lf.maxX < af.maxX){
            dx = 0;
        }
        else if(lf.x > af.x){
            dx = dx * 2;
        }

        ta.setX(tf.x - dx);

        layerGroup.resizeToFitChildrenWithOption(0);

        return layerGroup;
    },
    resetPropertyGuide: function(layerGroup){
        var smConfigs = this.getConfigs(layerGroup);
        var splitName = layerGroup.name().split("#");
        var msLayer = this.find(splitName[1], this.page, false, "objectID");
        var msText = this.find(MSTextLayer, layerGroup, false, "class");
        var lf = this.getFrame(layerGroup);
        var nl = this.getProperty(msLayer, smConfigs).absoluteRect();

        nl.setX(lf.x);
        nl.setY(lf.y);

        return layerGroup;
    },
    resetConfigs: function(){
        if(!this.configs) return false;
        var theme = this.configs.theme;
        this.removeConfigs();
        this.initConfigs();

        this.configs = this.setConfigs({theme: theme});

        var page = this.page;

        var layers = page.children().objectEnumerator();

        while(item = layers.nextObject()) {
            if(this.is(item, MSLayerGroup) && /WIDTH\#|HEIGHT\#|TOP\#|RIGHT\#|BOTTOM\#|LEFT\#|VERTICAL\#|HORIZONTAL\#|LITE\#/.exec(item.name())){
                this.resetSizeGuide(item);
            }
            else if( this.is(item, MSLayerGroup) && /PROPERTY\#/.exec(item.name()) ){
                this.resetPropertyGuide(item);
            }
        }
    },
    toggleTheme: function(){
        if(!this.configs) return false;

        this.configs.theme = (this.configs.theme)? 0: 1;

        this.configs = this.setConfigs({theme: this.configs.theme});

        this.message(_("Remeasure all guides to see the new theme."));
    },
    getColors: function(output){
        if (!this.configsColors){
            this.configs.colors = {};
            return false;
        }

        var colorJSON = {};
        var colorDetailJSON = {};
        var colorGroups = this.configsColors.layers().objectEnumerator();

        while (colorGroup = colorGroups.nextObject()) {
            if( this.is( colorGroup, MSLayerGroup ) ){
                var configs = this.getConfigs(colorGroup);
                var nameLayer = this.find(configs.nameLayer, colorGroup, false, "objectID");
                var colorLayer = this.find(configs.colorLayer, colorGroup, false, "objectID");
                var color = this.getFills(colorLayer.style()).pop().color;
                var hex = "#" + this.rgbToHex(color.r, color.g, color.b);
                var argb_hex = "#" + this.rgbToHex(color.r, color.g, color.b, color.a);
                var name = nameLayer.stringValue();

                colorDetailJSON[argb_hex] = this.extend(color, {
                    name: name,
                    hex: hex,
                    argb_hex: argb_hex
                });
                if(name != _("untitled")){
                    colorJSON[argb_hex] = this.toJSString(name);
                }
            }
        }

        this.setConfigs({colors: colorJSON});
        this.configs.colors = colorJSON;
        this.colors = colorDetailJSON;
        return colorDetailJSON;
    },
    addColors: function(colors){
        var self = this;

        var colors = this.extend(this.colors, colors || {});
        var pluginPath = NSString.stringWithString(self.context.scriptPath).stringByDeletingLastPathComponent();
        var imagePath = pluginPath.stringByAppendingPathComponent("assets/transparent-background.png");
        var transparentImage = [[NSImage alloc] initWithContentsOfFile:imagePath];

        var index = 0;
        var column = 0;
        var row = 0;

        for ( var argb_hex in colors ){
            var color = colors[argb_hex];
            var group = self.addGroup( self.configsColors );
            var shape = self.addShape( group );
            var nameText = self.addText( group );
            var infoText = self.addText( group );
            var name = color.name? color.name: _("untitled");
            var shapeColor = MSColor.colorWithSVGString(color.hex);
            shapeColor.setAlpha(color.a);

            var grayscale = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;

            var textHex = ( grayscale >= 180 )? "#4A4A4A": "#FFFFFF";
            textHex = (color.a <= .3)? "#4A4A4A": textHex;

            var textColor =  MSColor.colorWithSVGString(textHex);

            group.setName(name);
            shape.setName("color");
            nameText.setName("name");
            infoText.setName("text");

            shape.frame().setWidth(160);
            shape.frame().setHeight(128);

            var transparentBg = shape.style().addStylePartOfType(0);
            transparentBg.setFillType(4);
            transparentBg.setPatternFillType(0);
            transparentBg.setPatternImage(transparentImage);

            var colorBg = shape.style().addStylePartOfType(0);
            colorBg.setFillType(0);
            colorBg.color = shapeColor;

            nameText.frame().setX(16);
            nameText.frame().setY(16);
            nameText.setTextColor(textColor);
            nameText.setFontSize(18);
            nameText.setFontPostscriptName("HelveticaNeue-Medium");
            nameText.setStringValue(name);
            nameText.setTextBehaviour(1);
            nameText.setTextBehaviour(0);

            info = [
                "#" + self.rgbToHex(color.r, color.g, color.b) + ", " + Math.round(color.a * 100) + "%",
                "#" + self.rgbToHex(color.r, color.g, color.b, color.a),
                "rgba(" + color.r + "," + color.g + "," + color.b + "," + Math.round(color.a * 10) / 10 + ")"
            ]

            textColor.setAlpha(.64)
            infoText.frame().setX(16);
            infoText.frame().setY(48);
            infoText.setTextColor(textColor);
            infoText.setFontSize(14);
            infoText.setFontPostscriptName("HelveticaNeue-Light");
            infoText.setStringValue(info.join("\r\n"));
            infoText.setTextBehaviour(1);
            infoText.setTextBehaviour(0);

            shape.setIsLocked(true);
            // infoText.setIsLocked(true);
            group.resizeToFitChildrenWithOption(0);
            group.frame().setX( 160 * column );
            group.frame().setY( 128 * row );

            self.setConfigs({nameLayer: self.toJSString(nameText.objectID()), colorLayer: self.toJSString(shape.objectID())}, group);

            if(index % 5 == 4 && column == 4){
                if(row * 128 > 640) self.configsColors.frame().setHeight(row * 128)
                row++
            }

            if(index % 5 == 4){
                column = 0
            }
            else{
                column++;
            }
            index++;
        }

    },
    getAllColor: function(){
        var self = this;
        var colors = {};
        var colorsArr = [];
        var context = this.context;
        var document = this.document;
        var selection = this.selection;
        var getColor = function(color){
            var color = color;
            var hex = "#" + self.rgbToHex(color.r, color.g, color.b);
            var argb_hex = "#" + self.rgbToHex(color.r, color.g, color.b, color.a);
            var obj = self.extend(color, {
                name: _("untitled"),
                hex: hex,
                argb_hex: argb_hex
            });

            if(!colors[argb_hex]){
                colorsArr.push(obj);
            }
            colors[argb_hex] = obj

        };
        var getColorType = function(fillJSON){
            var fillJSON = fillJSON;
            
            if(fillJSON.fillType == "color"){
                getColor(fillJSON.color);
            }

            if(fillJSON.fillType == "gradient"){
                fillJSON.gradient.colorStops.forEach(function(gradient){
                    getColor(gradient.color);
                });
            }
        }

        var selectionArtboards = this.find(MSArtboardGroup, selection, true, "class");

        if(!selectionArtboards){
            this.message(_("Select 1 or multiple artboards"));
            return false;
        }

        selectionArtboards = (this.is(selectionArtboards, MSArtboardGroup))? NSArray.arrayWithObjects(selectionArtboards): selectionArtboards;
        selectionArtboards = selectionArtboards.objectEnumerator();
        while(msArtboard = selectionArtboards.nextObject()){
            if(msArtboard instanceof MSArtboardGroup){
                var layerIter = msArtboard.children().objectEnumerator();
                while(msLayer = layerIter.nextObject()) {
                    var msGroup = msLayer.parentGroup();

                    if(msLayer && this.is(msLayer, MSLayerGroup) && /LABEL\#|NOTE\#/.exec(msLayer.name())){
                        var msText = msLayer.children()[2];
                        msLayer.setIsVisible(false);
                    }

                    var layerStates = this.getStates(msLayer);

                    if (
                        !this.isExportable(msLayer) ||
                        !layerStates.isVisible ||
                        layerStates.isLocked ||
                        layerStates.hasSlices ||
                        this.isMeasure(msLayer)
                    )
                    {
                        continue;
                    }

                    if ( !this.is(msLayer, MSSliceLayer) ) {
                        var layerStyle = msLayer.style();


                        var fillsJSON = this.getFills(layerStyle);
                        if(fillsJSON.length > 0){
                            var fillJSON = fillsJSON.pop();
                            getColorType(fillJSON)

                        }

                        var bordersJSON = self.getBorders(layerStyle);
                        if(bordersJSON.length > 0){
                            var borderJSON = bordersJSON.pop();
                            getColorType(borderJSON)
                        }

                    }

                    if ( this.is(msLayer, MSTextLayer) ) {
                        getColor(self.colorToJSON(msLayer.textColor()))
                    }
                }
            }
        }

        return colors
    },
    colorPalette: function(){
        if(!this.configs) return false;

        var currentPage = this.page;
        if(this.configsPage == false){
            this.configsPage = this.document.addBlankPage();
            this.configsPage.setName("Sketch Measure");
            this.document.setCurrentPage(currentPage);
        }

        this.configsColors = this.find("Color Palette", this.configsPage);
        this.configsColors = (!this.configsColors || this.is(this.configsColors, MSArtboardGroup))? this.configsColors: undefined;
        
        if( this.configsColors ){
            this.getColors()
            this.removeLayer(this.configsColors);
        }
        this.configsColors = MSArtboardGroup.new();
        frame = this.configsColors.frame();
        frame.setWidth(800);
        frame.setHeight(640);
        frame.setConstrainProportions(false);
        this.configsPage.addLayers([this.configsColors]);
        this.configsColors.setName("Color Palette");
        this.document.setCurrentPage(this.configsPage);


        this.addColors(this.getAllColor());

    }
});

editor.utom.extend({
    BorderPositions: ["center", "inside", "outside"],
    FillTypes: ["color", "gradient"],
    GradientTypes: ["linear", "radial", "angular"],
    ShadowTypes: ["outer", "inner"],
    TextAligns: ["left", "right", "center", "justify", "left"]
});  

editor.utom.extend({
    slicesPath: undefined,
    maskObjectID: undefined,
    maskRect: undefined,
    symbols: {},
    slices: {},
    isExportable: function(layer) {
        return this.is(layer, MSTextLayer) ||
               this.is(layer, MSShapeGroup) ||
               this.is(layer, MSBitmapLayer) ||
               this.is(layer, MSSliceLayer) ||
               this.is(layer, MSSymbolInstance) ||
               this.is(layer, MSLayerGroup) && this.hasExportSizes(layer)
    },
    isMeasure: function(layer){
        var msGroup = layer.parentGroup();
        return (this.regexName.exec(msGroup.name()));
    },
    getStates: function(layer){
        var isVisible = true;
        var isLocked = false;
        var hasSlices = false;
        var isMaskChildLayer = false;

        while (!( this.is(layer, MSArtboardGroup) || this.is(layer, MSSymbolMaster) ) ) {
            var msGroup = layer.parentGroup();
            if (!layer.isVisible()) {
                isVisible = false;
            }

            if (layer.isLocked()) {
                isLocked = true;
            }

            if ( this.is(msGroup, MSLayerGroup) && this.hasExportSizes(msGroup) ) {
                hasSlices = true
            }

            if (
                this.maskObjectID &&
                msGroup.objectID() == this.maskObjectID &&
                !layer.shouldBreakMaskChain()
            ) {
                isMaskChildLayer = true
            }

            layer = msGroup;
        }
        return {
            isVisible: isVisible,
            isLocked: isLocked,
            hasSlices: hasSlices,
            isMaskChildLayer: isMaskChildLayer
        }
    },
    updateMaskRect: function(layer) {
        var layer = this.extend(layer, {});
        layer.maxX = layer.x + layer.width;
        layer.maxY = layer.y + layer.height;
        var mask = this.extend(this.maskRect, {});
        mask.maxX = mask.x + mask.width;
        mask.maxY = mask.y + mask.height;
        var x = layer.x;
        var y = layer.y;
        var width = layer.width;
        var height = layer.height;
        var dx = 0;
        var dy = 0;

        if(this.isIntersect(layer, mask)){
            if(layer.x < mask.x){
                x = mask.x;
                dx = mask.x - layer.x;
            }

            if(layer.y < mask.y){
                y = mask.y;
                dy = mask.y - layer.y;
            }

            if(layer.maxX > mask.maxX){
                width = width - (layer.maxX - mask.maxX) - dx;
            }
            else{
                width = width - dx;
            }

            if(layer.maxY > mask.maxY){
                height = height - (layer.maxY - mask.maxY) - dy;
            }
            else{
                height = height - dy;
            }

            return {
                x: x,
                y: y,
                width: width,
                height: height
            }
        }
        else{
            return false
        }

    },
    hasExportSizes: function(layer){
        return layer.exportOptions().exportFormats().count() > 0;
    },
    toJSString: function(str){
        return new String(str).toString();
    },
    pointToJSON: function(point){
        return {
            x: parseFloat(point.x),
            y: parseFloat(point.y)
        };
    },
    sizeToJSON: function(size){
        return {
            width: parseFloat(size.width),
            height: parseFloat(size.height)
        };
    },
    rectToJSON: function(rect, referenceRect) {
        if (referenceRect) {
            return {
                x: rect.x() - referenceRect.x(),
                y: rect.y() - referenceRect.y(),
                width: rect.width(),
                height: rect.height()
            };
        }

        return {
            x: rect.x(),
            y: rect.y(),
            width: rect.width(),
            height: rect.height()
        };
    },
    colorToJSON: function(color) {
        return {
            r: Math.round(color.red() * 255),
            g: Math.round(color.green() * 255),
            b: Math.round(color.blue() * 255),
            a: color.alpha()
        };
    },
    colorStopToJSON: function(colorStop) {
        return {
            color: this.colorToJSON(colorStop.color()),
            position: colorStop.position()
        };
    },
    gradientToJSON: function(gradient) {
        var stops = [],
            msStop, stopIter = gradient.stops().objectEnumerator();
        while (msStop = stopIter.nextObject()) {
            stops.push(this.colorStopToJSON(msStop));
        }

        return {
            type: this.GradientTypes[gradient.gradientType()],
            from: this.pointToJSON(gradient.from()),
            to: this.pointToJSON(gradient.to()),
            colorStops: stops
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
    exportSizesToJSON: function(size, layer, slicesPath) {
        var slice = MSExportRequest.exportRequestsFromExportableLayer(layer).firstObject();
        var size = this.toJSString(size).split(" ");
        var document = this.document;
        slice.scale = size[0];
        slice.format = size[2];

        var suffix = this.toJSString(size[1]);
        suffix = (suffix)? suffix : "";

        var sliceName = this.toJSString(layer.name() + suffix + "." + size[2]);
        var sliceFileName = slicesPath.stringByAppendingPathComponent( sliceName );

        [document saveArtboardOrSlice:slice toFile:sliceFileName];

        return {
            sliceName: "slices/" + sliceName,
            scale: size[0],
            suffix: suffix,
            format: size[2]
        };
    },
    getBorders: function(style) {
        var borders = [],
            msBorder, borderIter = style.borders().objectEnumerator();
        while (msBorder = borderIter.nextObject()) {
            if (msBorder.isEnabled()) {
                var fillType = this.FillTypes[msBorder.fillType()],
                    border = {
                        fillType: fillType,
                        position: this.BorderPositions[msBorder.position()],
                        thickness: msBorder.thickness()
                    };

                switch (fillType) {
                    case "color":
                        border.color = this.colorToJSON(msBorder.color());
                        break;

                    case "gradient":
                        border.gradient = this.gradientToJSON(msBorder.gradient());
                        break;

                    default:
                        continue;
                }

                borders.push(border);
            }
        }

        return borders;
    },
    getFills: function(style) {
        var fills = [],
            msFill, fillIter = style.fills().objectEnumerator();
        while (msFill = fillIter.nextObject()) {
            if (msFill.isEnabled()) {
                var fillType = this.FillTypes[msFill.fillType()],
                    fill = {
                        fillType: fillType
                    };

                switch (fillType) {
                    case "color":
                        fill.color = this.colorToJSON(msFill.color());
                        break;

                    case "gradient":
                        fill.gradient = this.gradientToJSON(msFill.gradient());
                        break;

                    default:
                        continue;
                }

                fills.push(fill);
            }
        }

        return fills;
    },
    getShadows: function(style) {
        var shadows = [],
            msShadow, shadowIter = style.shadows().objectEnumerator();
        while (msShadow = shadowIter.nextObject()) {
            if (msShadow.isEnabled()) {
                shadows.push(this.shadowToJSON(msShadow));
            }
        }

        shadowIter = style.innerShadows().objectEnumerator();
        while (msShadow = shadowIter.nextObject()) {
            if (msShadow.isEnabled()) {
                shadows.push(this.shadowToJSON(msShadow));
            }
        }

        return shadows;
    },
    getOpacity: function(style){
        return style.contextSettings().opacity()
    },
    getStyleName: function(style, isText){
        var msStyles = (isText)? this.document.documentData().layerTextStyles(): this.document.documentData().layerStyles();
        var sharedObjectID = style.sharedObjectID();
        var styles = msStyles.objectsSortedByName();
        var style = this.find(sharedObjectID, styles, true, "objectID");
        if(!style) return "";
        return this.toJSString(style.name());
    },
    exportSizes: function(layer, savePath){
        var self = this,
            exportSizes = [],
            size, sizesInter = layer.exportOptions().exportFormats().objectEnumerator();

        while (size = sizesInter.nextObject()) {
            if (!self.slicesPath){
                var slicesPath = savePath.stringByAppendingPathComponent("slices");
                self.slicesPath = slicesPath;
                [[NSFileManager defaultManager] createDirectoryAtPath:slicesPath withIntermediateDirectories:true attributes:nil error:nil];
            }

            exportSizes.push(this.exportSizesToJSON(size, layer, self.slicesPath));
        }

        return exportSizes;
    },
    getSavePath: function(){
        var filePath = this.document.fileURL()? this.document.fileURL().path().stringByDeletingLastPathComponent(): "~";
        var fileName = this.document.displayName().stringByDeletingPathExtension();
        var savePanel = NSSavePanel.savePanel();

        savePanel.setTitle(_("Export spec"));
        savePanel.setNameFieldLabel(_("Export to:"));
        savePanel.setPrompt(_("Export"));
        savePanel.setCanCreateDirectories(true);
        savePanel.setNameFieldStringValue(fileName);

        if (savePanel.runModal() != NSOKButton) {
            return false;
        }

        return savePanel.URL().path();
    },
    getArtboard: function( msArtboard, savePath, isSymbol ){
        var context = this.context;
        var document = this.document;
        var selection = this.selection;

        var tempCon = this.templateContents.tempCon;
        var jqCon = this.templateContents.jqCon;
        var jsappCon = this.templateContents.jsappCon;
        var specCon = this.templateContents.specCon;
        var cssnorCon = this.templateContents.cssnorCon;
        var cssappCon = this.templateContents.cssappCon;

        if(msArtboard instanceof MSArtboardGroup || msArtboard instanceof MSSymbolMaster){
            var artboardFrame = msArtboard.frame();
            var layers = [];
            var notes = [];
            var layerIter = msArtboard.children().objectEnumerator();
            var name = msArtboard.objectID();

            while(msLayer = layerIter.nextObject()) {
                var msGroup = msLayer.parentGroup();

                if(msLayer && this.is(msLayer, MSLayerGroup) && /LABEL\#|NOTE\#/.exec(msLayer.name())){
                    var msText = msLayer.children()[2];

                    notes.push({
                        rect: this.rectToJSON(msLayer.absoluteRect(), artboardFrame),
                        note: this.toJSString(msText.stringValue()).replace(/\n/g,"<br>")
                    });

                    msLayer.setIsVisible(false);
                }

                var layerStates = this.getStates(msLayer);

                if (
                    !this.isExportable(msLayer) ||
                    !layerStates.isVisible ||
                    layerStates.isLocked ||
                    layerStates.hasSlices ||
                    this.isMeasure(msLayer)
                )
                {
                    continue;
                }

                var type = this.is(msLayer, MSTextLayer) ? "text" : "shape";
                type = this.is(msLayer, MSSymbolInstance) ? "symbol" : type;
                type = this.hasExportSizes(msLayer) || this.is(msLayer, MSSliceLayer) ? "slice" : type;

                var layer = {};
                layer.objectID = this.toJSString(msLayer.objectID());
                layer.type = type;
                layer.name = this.toJSString(msLayer.name());
                layer.rect = this.rectToJSON(msLayer.absoluteRect(), artboardFrame);

                layer.exportSizes = this.exportSizes(msLayer, savePath);

                if ( ! ( this.is(msLayer, MSSliceLayer) || this.is(msLayer, MSSymbolInstance) ) ) {
                    var layerStyle = msLayer.style();

                    layer.rotation = msLayer.rotation();
                    layer.radius = ( msLayer.layers && this.is(msLayer.layers().firstObject(), MSRectangleShape) ) ? msLayer.layers().firstObject().fixedRadius(): null;
                    layer.borders = this.getBorders(layerStyle);
                    layer.fills = this.getFills(layerStyle);
                    layer.shadows = this.getShadows(layerStyle);
                    layer.opacity = this.getOpacity(layerStyle);
                    layer.styleName = (this.is(msLayer, MSTextLayer))? this.getStyleName(layerStyle, true): this.getStyleName(layerStyle);
                }

                if ( this.is(msLayer, MSTextLayer) ) {
                    layer.content = this.toJSString(msLayer.storage().string()),
                    layer.color = this.colorToJSON(msLayer.textColor());
                    layer.fontSize = msLayer.fontSize();
                    layer.fontFace = this.toJSString(msLayer.fontPostscriptName());
                    layer.textAlign = this.TextAligns[msLayer.textAlignment()];
                    if(msLayer.characterSpacing() !== null){
                        var characterSpacing = msLayer.characterSpacing();
                        var spacingFloatValue = [characterSpacing floatValue]; // get float value from NSNumber
                        layer.letterSpacing = spacingFloatValue;
                    } else {
                        layer.letterSpacing = 0;
                    }
                    layer.letterSpacing = spacingFloatValue;
                    layer.lineHeight = msLayer.lineHeight();
                    layer.baseLineHeight = msLayer.baseLineHeight();
                }


                if(msLayer.hasClippingMask()){
                    this.maskObjectID = msGroup.objectID();
                    this.maskRect = this.rectToJSON(msLayer.absoluteRect(), artboardFrame);
                }
                else if (this.maskObjectID != msGroup.objectID() || msLayer.shouldBreakMaskChain()) {
                    this.maskObjectID = undefined;
                    this.maskRect = undefined;
                }

                if ( type ===  "slice" ){
                    var sliceObjectID = msLayer.objectID();
                    if (!this.slices[sliceObjectID]){
                        var sliceLayer = this.slices[sliceObjectID] = layer;
                        this.slicesData.push(sliceLayer);
                    }             
                }

                if (layerStates.isMaskChildLayer){
                    layer.rect = this.updateMaskRect(layer.rect)
                }

                if (layer.rect){
                    layers.push(layer);
                }

                if( this.is(msLayer, MSSymbolInstance) ){
                    var symbolObjectID = msLayer.symbolMaster().objectID(),
                        parentRect = {x: layer.rect.x, y: layer.rect.y},
                        symbolLayers = this.symbols[symbolObjectID] = this.getArtboard(msLayer.symbolMaster(), savePath, true);
                    
                    // if( !this.symbols[symbolObjectID] ){
                    //     var symbolLayers = this.symbols[symbolObjectID] = this.getArtboard(msLayer.symbolMaster(), savePath, true);
                    // }
                    // else{
                    //     var symbolLayers = this.symbols[symbolObjectID];
                    // }


                    symbolLayers.forEach(function(symbolLayer){
                        symbolLayer.rect.x = parentRect.x + symbolLayer.rect.x;
                        symbolLayer.rect.y = parentRect.y + symbolLayer.rect.y;
                        layers.push(symbolLayer);
                        // log(layers);
                    });
                }
            }

            if(!isSymbol){
                var imageFileName = name + ".png";
                var imagePath = this.toJSString( NSTemporaryDirectory().stringByAppendingPathComponent(imageFileName) );
                var sliceArtboard = MSExportRequest.exportRequestsFromExportableLayer(msArtboard).firstObject();
                sliceArtboard.scale = 2
                [document saveArtboardOrSlice: sliceArtboard
                    toFile: imagePath ];

                var imageURL = NSURL.fileURLWithPath(imagePath);
                var imageData = NSData.dataWithContentsOfURL(imageURL);
                var imageBase64 = imageData.base64EncodedStringWithOptions(0);

                var artboardData = {
                    objectID: this.toJSString(msArtboard.objectID()),
                    name: this.toJSString(msArtboard.name()),
                    imageBase64: this.toJSString(imageBase64),
                    width: artboardFrame.width(),
                    height: artboardFrame.height()
                };

                this.artboardsData.push(artboardData);


                var data = this.extend(artboardData, {
                    resolution: this.configs.resolution,
                    zoom: 1,
                    layers: layers,
                    notes: notes
                });

                var specContent = this.template(specCon, {json: JSON.stringify(data).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')});

                var content = this.template(tempCon, {
                    cssNormalize: cssnorCon,
                    cssApp: cssappCon,
                    jsjQuery: jqCon,
                    jsApp: jsappCon,
                    jsSpec: specContent
                });
                content = NSString.stringWithString(content);
                var artname = this.toJSString( msArtboard.name() ).replace(/[\/\\]/g, "-");
                var exportURL = savePath.stringByAppendingPathComponent( artname + ".html");

                [content writeToFile: exportURL
                          atomically: false
                            encoding: NSUTF8StringEncoding
                               error: null];
                return exportURL;
            }
            else{
                return layers
            }
        }
    },
    artboardsData: [],
    slicesData: [],
    specExport: function(){
        if(!this.configs) return false;

        var context = this.context;
        var document = this.document;
        var selection = this.selection;

        var selectionArtboards = this.find(MSArtboardGroup, selection, true, "class");
        log("Selected artboards");
        log(selectionArtboards);
        if(!selectionArtboards){
            log("All artboards");
            selectionArtboards = document.currentPage().artboards();
            log(selectionArtboards);
            if(selectionArtboards.count() <= 0){
               this.message(_("Page should contain artboards"));
                return false;
            }
        }

        savePath = NSTemporaryDirectory();//this.getSavePath();
        if(!savePath) return false;
        [[NSFileManager defaultManager] createDirectoryAtPath:savePath withIntermediateDirectories:true attributes:nil error:nil];

        var pluginPath = NSString.stringWithString(this.context.scriptPath).stringByDeletingLastPathComponent();
        var tempPath = pluginPath.stringByAppendingPathComponent("assets/template.html");
        var jqPath = pluginPath.stringByAppendingPathComponent("assets/jquery-1.12.0.min.js");
        var jsappPath = pluginPath.stringByAppendingPathComponent("assets/app.js");
        var specPath = pluginPath.stringByAppendingPathComponent("assets/spec.js");
        var cssnorPath = pluginPath.stringByAppendingPathComponent("assets/normalize-3.0.3.min.css");
        var cssappPath = pluginPath.stringByAppendingPathComponent("assets/app.css");

        var tempCon = [NSString stringWithContentsOfFile:tempPath encoding:NSUTF8StringEncoding error:nil];
        var jqCon = [NSString stringWithContentsOfFile:jqPath encoding:NSUTF8StringEncoding error:nil];
        var jsappCon = [NSString stringWithContentsOfFile:jsappPath encoding:NSUTF8StringEncoding error:nil];
        var specCon = [NSString stringWithContentsOfFile:specPath encoding:NSUTF8StringEncoding error:nil];
        var cssnorCon = [NSString stringWithContentsOfFile:cssnorPath encoding:NSUTF8StringEncoding error:nil];
        var cssappCon = [NSString stringWithContentsOfFile:cssappPath encoding:NSUTF8StringEncoding error:nil];
        this.templateContents = {
            tempCon: tempCon,
            jqCon: jqCon,
            jsappCon: jsappCon,
            specCon: specCon,
            cssnorCon: cssnorCon,
            cssappCon: cssappCon
        }

        selectionArtboards = (this.is(selectionArtboards, MSArtboardGroup))? NSArray.arrayWithObjects(selectionArtboards): selectionArtboards;
        selectionArtboards = selectionArtboards.objectEnumerator();
        var artboardExportUrl = false
        while(msArtboard = selectionArtboards.nextObject()){
            artboardExportUrl = this.getArtboard(msArtboard, savePath);
        }

        var sliceLayers = this.page.exportableLayers();

        var artboardsData = this.artboardsData;
        var slicesData = this.slicesData;

        if(slicesData.length > 0){
            var sContent = NSString.stringWithString("var slices = " + JSON.stringify(slicesData) + ";");
            var sExportURL = savePath.stringByAppendingPathComponent( "slices.js");
            [sContent writeToFile: sExportURL
                              atomically: false
                                encoding: NSUTF8StringEncoding
                                   error: null];
        }

        if(artboardsData.length > 1){
            var aContent = NSString.stringWithString("var artboards = " + JSON.stringify(artboardsData) + ";");
            var aExportURL = savePath.stringByAppendingPathComponent( "artboards.js");

            [aContent writeToFile: aExportURL
                              atomically: false
                                encoding: NSUTF8StringEncoding
                                   error: null];
        }

        if(this.configsColors){
            this.getColors();
            var cContent = NSString.stringWithString("var colors = " + JSON.stringify(this.configs.colors) + ";");
            var cExportURL = savePath.stringByAppendingPathComponent( "colors.js");

            [cContent writeToFile: cExportURL
                              atomically: false
                                encoding: NSUTF8StringEncoding
                                   error: null];
        }
        log("Export complete!"+ artboardExportUrl);
        //this.message(_("Export complete!"+ artboardExportUrl));
        return artboardExportUrl;    
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
    }
});
