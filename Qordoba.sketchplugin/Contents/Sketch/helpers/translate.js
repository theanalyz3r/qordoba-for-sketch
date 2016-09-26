@import "files.js"
@import "utils.js"
@import "qordoba-utils.js"

var translate = {
    alert: function (msg, title) {
        title = title || 'Sketch translate';
        var app = [NSApplication sharedApplication];
        [app displayDialog:msg withTitle:title];
    },
    getOverrideDefaultValuesForChildren: function(layers, data, dict){
         for (var i = 0; i < layers.count(); i++) {
            var layer = [layers objectAtIndex:i];
            if (this.isTextLayer(layer)) {
                var stringVal = layer.stringValue();
                if(data[stringVal]){
                    var transaltedString = data[stringVal];
                    log(""+stringVal+" is found: " + transaltedString)
                    var objectID = layer.objectID();
                    [dict setObject:transaltedString forKey:objectID];
                }else{
                    log(""+data[stringVal]+" is not found")
                }
            }else if(layer.isKindOfClass(MSSymbolInstance)){
                var subObj = [[NSMutableDictionary alloc] init];
                this.getOverrideDefaultValuesForChildren(layer.symbolMaster().children(),data, subObj);
                [dict setObject:subObj forKey:objectID];
            }
        }
        return dict;
    },

    getOverridesForPage: function(page){
        var layers = [page children];
        var textLayers = [];
         for (var i = 0; i < layers.count(); i++) {
            var layer = [layers objectAtIndex:i];
            if(layer.isKindOfClass(MSSymbolInstance)){
                textLayers = textLayers.concat(qutils.common.dictionarytoArray(layer.overrides()));
            }
        }
        return textLayers;
    },
    getPageTextLayersWithoutSymbol: function(layers) {
        var textLayers = [];
         for (var i = 0; i < layers.count(); i++) {
            var layer = [layers objectAtIndex:i];
            if (this.isTextLayer(layer)) {
                textLayers.push(layer);
            }
        }
        return textLayers;
    },

    getTextLayersForChildren: function(layers){
        var textLayers = [];
         for (var i = 0; i < layers.count(); i++) {
            var layer = [layers objectAtIndex:i];
            if (this.isTextLayer(layer)) {
                textLayers.push(layer);
            }else if(layer.isKindOfClass(MSSymbolInstance)){
                var res = this.getTextLayersForChildren(layer.symbolMaster().children());
                textLayers = textLayers.concat(res);
            }
        }
        return textLayers;
    },

    isTextLayer: function(layer) {
        if (layer.class() === MSTextLayer) {
            var string = layer.stringValue()
            if(string.length == 0 || [layer fontPostscriptName] == "FontAwesome" || qutils.common.isNumeric(string))
                return false;
            return true;
        }
        return false;
    },

    generateLocaleForPage: function(page) {
        var textLayers = this.getTextLayersForChildren([page children]);
        var localeObject = {};
        for (var i = 0; i < textLayers.length; i++) {
            var textLayer = textLayers[i],
                stringValue = unescape(textLayer.stringValue());
            localeObject[stringValue] = stringValue;
        }

        var overridesArray = this.getOverridesForPage(page);
        for (var i = 0; i < overridesArray.length; i++) {
            var stringValue = unescape(overridesArray[i]);
            localeObject[stringValue] = stringValue;
        }
        return fileHelper.jsonToCsv(localeObject)
    },

    generateLocaleForCurrentPage: function(context) {
        var doc = context.document
        var currentPage = [doc currentPage];
        return this.generateLocaleForPage(currentPage);
    },

    detachSymbol: function(layer){
        if (layer.isKindOfClass(MSSymbolInstance)) {
            layer = layer.detachByReplacingWithGroup()
            layers = [layer children];

            for (var i = 0; i < [layers count]; i++) {
                this.detachSymbol(layers[i])
            }
        }
    }, 

    detachPageFromSymbols: function(page){
        qutils.call.pageLayers(page,function(layer){
            translate.detachSymbol(layer)
        });
    },
    excludeAllTextLayers: function(context) {
        var doc = context.document
        var pages = [doc pages]
        for (var j = 0; j < pages.count(); j++) {
            var page = [pages objectAtIndex:j];
            var layers = [page children]
            for (var i = 0; i < layers.count(); i++) {
                    var layer = [layers objectAtIndex:i];
                if (layer.class() === MSTextLayer) {
                    [layer setPrimitiveDontSynchroniseWithSymbol:true];
                    layer.dontSynchroniseWithSymbol = true
                }
            }
        }
        return true;
    },
    translatePageWithData: function(context,page, language, data,symbolOption) {
        //NSLog("translatePageWithData")
        //exclude text from all symbols
        //utils.excludeSymbols(context)0;
        var doc = context.document
        var pageName = [page name];
        var symbolsContainer = context.document.documentData().layerSymbols()
        var langaugeSetting = utils.getSettingForLanguage(context,language.name)
        log("Langauge settings is: ")
        log(langaugeSetting)
        var newFont = false;
        if(langaugeSetting){
            newFont = utils.getFontOf(context,langaugeSetting.font)
        }
        
        //Duplicate the page
        var newPage = page.copy();
        //newPage.pageDelegate = page.pageDelegate();
        newPage.setName(pageName + ': ' + language.name);
        doc.documentData().addPage(newPage);
        doc.setCurrentPage(newPage);
        var textLayers = [];
        if(symbolOption == "detach"){
            this.detachPageFromSymbols(newPage);
            textLayers  = this.getTextLayersForChildren([newPage children]);
        }else{
            //handle the symbols overrides
            var pageLayers = [newPage children];
            for (var i = 0; i < pageLayers.count(); i++) {
                var layer = [pageLayers objectAtIndex:i];
                if(layer.isKindOfClass(MSSymbolInstance)){
                    var dict = [[NSMutableDictionary alloc] init];
                    var overrides = layer.overrides();
                    var symbolLayers = layer.symbolMaster().children();
                    
                    var res = this.getOverrideDefaultValuesForChildren(symbolLayers,data, dict);
                    var transaltedOverrides = [[NSMutableDictionary alloc] init];
                    [transaltedOverrides setObject:res forKey:0]
                    layer.applyOverrides(transaltedOverrides);
                    layer.applyOverrides(transaltedOverrides);
                    log("----- Symbole layers and overrides ----");
                    log(transaltedOverrides);
                    log(overrides);
                }
            }
            //other text layers
            textLayers = this.getPageTextLayersWithoutSymbol([newPage children])
            
        }
        
        var errorCount = 0;
        for (var i = 0; i < textLayers.length; i++) {
            var textLayer = textLayers[i], stringValue = unescape(textLayer.stringValue());
            if(data[stringValue]){
                //textLayer.dontSynchroniseWithSymbol = true;

                //Update the layer text and adjust the other layers    
                qutils.translate.updateLayerText(newPage, textLayer, data[stringValue]);
                //textLayer.setStringValue(data[stringValue]);   
                // 0 = flexible, 1 = fixed
                // 0 = left, 1 = right, 2 = center, 3 = justified
                //for some cases we found that 4 is left also
                var ltr = 0;
                var rtl = 1;
                if(language.direction == "rtl"){
                    if(textLayer.textAlignment() == ltr || textLayer.textAlignment() == 4){ //for some cases we found that 4 is left also
                        textLayer.textAlignment = rtl;
                     }
                    [textLayer adjustFrameToFit];
                }
                if(newFont){
                    var newFontSize = (parseInt(langaugeSetting.ratio)/100) * textLayer.fontSize()     
                    [textLayer setFont:newFont];
                    [textLayer setFontSize:newFontSize];
                    [textLayer adjustFrameToFit];
                }
            }else{
                log("Not found: " + stringValue)
                errorCount++;
            }
        }
        utils.addGeneratedPage(newPage,context)
        

        return errorCount;
    }
};
