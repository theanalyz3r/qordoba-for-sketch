@import "files.js"
@import "utils.js"

var translate = {
    alert: function (msg, title) {
        title = title || 'Sketch translate';
        var app = [NSApplication sharedApplication];
        [app displayDialog:msg withTitle:title];
    },
    
    getTextLayersForPage: function(page) {
        var layers = [page children],
                textLayers = [];

        for (var i = 0; i < layers.count(); i++) {
            var layer = [layers objectAtIndex:i];
            if (this.isTextLayer(layer)) {
                textLayers.push(layer);
            }
        }

        return textLayers;
    },

    isTextLayer: function(layer) {
        if (layer.class() === MSTextLayer) {
            var string = layer.stringValue()
            if(string.length == 0 || [layer fontPostscriptName] == "FontAwesome") 
                return false;
            return true;
        }
        return false;
    },

    localeStringFromTextLayers: function(textLayers) {
        var localeObject = {};
        for (var i = 0; i < textLayers.length; i++) {
            var textLayer = textLayers[i],
                stringValue = unescape(textLayer.stringValue());
            localeObject[stringValue] = stringValue;
        }
        var csvString = fileHelper.jsonToCsv(localeObject)    
        return csvString;
    },

    generateLocaleForPage: function(page) {
        var textLayers = this.getTextLayersForPage(page);
        return this.localeStringFromTextLayers(textLayers);
    },

    generateLocaleForCurrentPage: function(context) {
        var doc = context.document
        var currentPage = [doc currentPage];
        return this.generateLocaleForPage(currentPage);
    },

    copyStringToClipboard: function(string) {
        var clipboard = NSPasteboard.generalPasteboard();
        clipboard.declareTypes_owner([NSPasteboardTypeString], null);
        clipboard.setString_forType(string , NSPasteboardTypeString);
        this.alert('The translation file has been copied to your clipboard, paste it in your favorite editor and save it as a *.json file for example \'en-US.json\'.\n\nWhen you are ready to import your changes run \'2. Translate page\' and pick your json file that contains the translations.', null);
        return true;
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
    excludeTextLayersFromSymbol: function(context,page) {
         var layers = this.getTextLayersForPage(page)
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            [layer setPrimitiveDontSynchroniseWithSymbol:true];
        }
        return true;
    },
    translatePageWithData: function(context,page, language, data) {
        NSLog("translatePageWithData")
        //exclude text from all symbols
        utils.excludeSymbols(context);
        
        var doc = context.document
        var pageName = [page name];
        var symbolsContainer = context.document.documentData().layerSymbols()
        var langaugeSetting = utils.getSettingForLanguage(context,language.name)
        var newFont = false;
        if(langaugeSetting){
            newFont = utils.getFontOf(context,langaugeSetting.font)
        }
        //** Exclude all text layers from old page
        var oldTextLayers = this.getTextLayersForPage(page);
        for (var i = 0; i < oldTextLayers.length; i++) {
            oldTextLayers[i].dontSynchroniseWithSymbol = true
        }
        
        var newPage = page.copy();
        newPage.setName(pageName + ': ' + language.name);
        doc.documentData().addPage(newPage);
        doc.setCurrentPage(newPage);

        //De-attach the new page from all symbols 
        var layers = [newPage children];
        //TODO check the symbolsContainer issue
        //TypeError: symbolsContainer.symbolForInstance is not a function
        for (var i = 0; i < layers.count(); i++) {
           utils.detachFromSymbolAndStyle(context,symbolsContainer,layers[i])
        }

        var textLayers = this.getTextLayersForPage(newPage);
        var errorCount = 0;
        for (var i = 0; i < textLayers.length; i++) {
            var textLayer = textLayers[i], stringValue = unescape(textLayer.stringValue());
            if(data[stringValue]){
                textLayer.dontSynchroniseWithSymbol = true
                textLayer.setStringValue(data[stringValue]);   
                // 0 = flexible, 1 = fixed
                // 0 = left, 1 = right, 2 = center, 3 = justified
                //for some cases we found that 4 is left also
                var ltr = 0;
                var rtl = 1;
                if(language.direction == "rtl"){
                    if(textLayer.textAlignment() == ltr || textLayer.textAlignment() == 4){ //for some cases we found that 4 is left also
                        //this.alert(textLayer.textAlignment(),textLayer.stringValue())
                        textLayer.textAlignment = rtl;
                     }
                    [textLayer adjustFrameToFit];
                }
                //NSLog(textLayer.textAlignment());
                if(newFont){
                    var newFontSize = (parseInt(langaugeSetting.fsize)/100) * textLayer.fontSize()     
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
    },

    translatePageWithFilePicker: function(context,page) {
        var openPanel = [NSOpenPanel openPanel];
        var doc = context.document;

        var defaultDirectory = [NSURL fileURLWithPath:"~/Downloads/"];
        if([doc fileURL]) {
            defaultDirectory = [[doc fileURL] URLByDeletingLastPathComponent]]
        }

        [openPanel setCanChooseDirectories:true];
        [openPanel setCanChooseFiles:true];
        [openPanel setAllowedFileTypes:['csv']];
        [openPanel setCanCreateDirectories:false];
        [openPanel setDirectoryURL:defaultDirectory];
        [openPanel setAllowsMultipleSelection: true]

        [openPanel setTitle:"Pick a translation file"];
        [openPanel setPrompt:"Translate"];

        if ([openPanel runModal] == NSOKButton) {
            var urls = [openPanel URLs];
            var errorCount = 0;

            var url, filename, getString;
            for (var i = 0; i < urls.count(); i++) {
                url = urls[i];
                log(url)
                filename = [[url lastPathComponent] stringByDeletingPathExtension];
                log(filename)
                getString = NSString.stringWithContentsOfFile_encoding_error(url, NSUTF8StringEncoding, null);
                if(getString){
                    data = fileHelper.csvToJson(getString)
                    //data = JSON.parse(getString.toString());
                    errorCount += this.translatePageWithData(context,page, filename, data);
                }
            }
            if (errorCount > 0){
                this.alert('Translation completed with ' + errorCount + ' errors.', null);
            }else{
                this.alert('Translation completed successfully', null);
            }
        }

        return true;
    },

    debug: false

};
