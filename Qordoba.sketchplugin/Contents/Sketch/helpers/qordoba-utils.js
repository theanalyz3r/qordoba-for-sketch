// global sketch variables setup and init
var app = [NSApplication sharedApplication],
  doc, page, plugin, pluginPath, pluginURL, pluginCommand, selection, artboard;

// debug for profiling and logging
var debug = debug || {};
debug = {
  on : false,
  startTime: 0,
  partialTime: 0,
  // start the profiling
  start : function(){
    debug.on = true;
    startTime = Date.now();
    partialTime = Date.now();
    log("======= DEBUG START =========");
  },
  // log with current time elapsed from start
  log : function(message){
    if (!debug.on) {
      return;
    } else {
      log("==" + (Date.now() - startTime) + "ms== " + message);
    }
  },
  // log with partial time elapsed and resets partial time
  logPart : function(message){
    if (!debug.on) {
      return;
    } else {
      log("--" +(Date.now() - partialTime) + "ms-- " + message);
      partialTime = Date.now();
    }
  },
  // end debug, log total time
  end : function(){
    if (!debug.on) {
      return;
    } else {
      log("======= DEBUG END: " + (Date.now() - startTime) + "ms =========");
    }
  }
}

// namespace qutils and initialize with global vars init
var qutils = qutils || {};

qutils.init = function(context){
  doc = context.document;
  page = doc.currentPage();
  pages = [doc pages];
  selection = context.selection;
  artboard = [[doc currentPage] currentArtboard];
  plugin = context.plugin;
  pluginPath = [plugin url] + "";
  pluginURL = context.scriptURL;
  pluginCommand = context.command;
};

// call a function on multiple layers at once
qutils.call = {
  // call a function recursively on child layers of layer, including the layer.
  childLayers : function(layer, callback){
    callback(layer);
    if (qutils.is.group(layer)) {
      if(layer.isKindOfClass(MSSymbolInstance)){
          var childLayers = layer.symbolMaster().layers();
      }else{
          var childLayers = [layer layers];  
      }
      if (childLayers) {
        for (var i = 0; i < childLayers.count(); i++) {
          qutils.call.childLayers(childLayers[i], callback);
        };
      };
    };
  },
  containedLayers : function(layer, callback){
    var containedLayers = layer.containedLayers();
    for (var i = 0; i < containedLayers.count(); i++) {
          callback(containedLayers[i]);
    };
  },
  layerById : function(currentPage, layerId){
    var res = false;
    qutils.call.pageLayers(currentPage,function(layer){
      if(layer.objectID() == layerId ){
        res = layer;
        return layer;
      }
    }); 
    return res;
  },
  layerByName : function(currentPage, layerName){
    var res = false;
    qutils.call.pageLayers(currentPage,function(layer){
      if(layer.name() == layerName){
        res = layer;
        return layer;
      }
    }); 
    return res;
  },
  // call a function recursively on child layers of layer, including the layer.
  ancestorLayersReverse : function(layer, callback){
    var ancestors = layer.ancestors();
    for (var i = 0; i < ancestors.count(); i++) {
      if(ancestors[i].objectID() != layer.objectID()){
          callback(ancestors[i]);
      }
    };
  },
  ancestorLayers : function(layer, callback){
    var ancestors = layer.ancestors();
    for (var i = ancestors.count() - 1; i >= 0 ; i--) {
      if(ancestors[i].objectID() != layer.objectID()){
          callback(ancestors[i]);
      }
    };
  },
  parentLayer : function(layer){
    var ancestors = layer.ancestors();
    if(ancestors.count() >= 2){
      return ancestors[ancestors.count() - 2];  
    }else{
      return false;
    }
    
  },
  // call a function on all layers on a page recursively, including the page layer.
  pageLayers : function(page,callback){
    qutils.call.childLayers(page, callback);
  },
  // call a function on selected layers
  selectedLayers : function(callback){
    var selectionCount = selection.count();
    if (selectionCount > 0) {
      for (var i = 0; i < selectionCount; i++) {
        callback(selection[i]);
      }
    } else {
      log("selection is empty");
    }
  },
  "getFontOf": function(context,fontName) {
    var doc = context.document
    var fontList = [doc fontList];

    
    //get index
    var objs = [fontList allFonts]

    var index = -1;
    for (i = 0; i < objs.count(); ++i) {
       if(objs[i] == fontName){
          index = i;
       }
    }
    if(index >=0){
      var font =  [fontList fontForFontAtIndex:index]
      return font
    }
    return false;
  }
}

// layer boolean checks
qutils.is = {
  // returns whether a layer is a group
  group : function(layer){
    if (layer && layer.isKindOfClass(MSLayerGroup) && !layer.isKindOfClass(MSShapeGroup)) {
      return true;
    }
    return false;
  },
  page : function(layer){
    return (layer && layer.isKindOfClass(MSPage));
  },
  // returns whether a layer is a text layer
  textLayer : function(layer){
    if (layer && layer.isKindOfClass(MSTextLayer)) {
            var string = layer.stringValue()
            if(string.length == 0 || [layer fontPostscriptName] == "FontAwesome" || qutils.common.isNumeric(string))
                return false;
            return true;
        }
        return false;
  },
  maskLayer: function(layer){
    return layer.name().match(/q-mask/i);
  },
  buttonLayer: function(layer){
    return qutils.is.group(layer) && layer.name().match(/button/i);
  },
  // returns whether nothing is selected
  selectionEmpty : function(){
    return (selection.count() == 0);
  }
}

// common low-level qutils
qutils.common = {
  // returns whether a string ends with a suffix
  endsWithString : function(str, suffix){
    return [str hasSuffix:suffix];
  },
  // returns whether a string starts with a prefix
  startsWithString : function(str, prefix){
    return [str hasPrefix:prefix];
  },
  // returns whether a string contains with a substring
  containsString : function(str, substring){
    return str.match(substring);
  },

  isNumeric: function(num){
    return !isNaN(num);
  },

  // returns javascript object size
  objectSize : function(obj){
    return Object.keys(obj).length;
  },
  // flatten a multidimensional js array
  flattenArray : function(arr) {
  	var r = [];
    function arrayEqual(a, b) {
    	var i = Math.max(a.length, b.length, 1);
    	while(i-- >= 0 && a[i] === b[i]);
    	return (i === -2);
    }
  	while (!arrayEqual(r, arr)) {
  		r = arr;
  		arr = [].concat.apply([], arr);
  	}
  	return arr;
  },
  copyStringToClipboard: function(string) {
    var clipboard = NSPasteboard.generalPasteboard();
    clipboard.declareTypes_owner([NSPasteboardTypeString], null);
    clipboard.setString_forType(string , NSPasteboardTypeString);
    return true;
  },
  //given an array of objects and a key, returns an object with the key value as properties
  keyedObjectFromArray : function(array, key){
    var keyedObject = {};
    for (var i = 0; i < array.length; i++) {
      var arrayMember = array[i];
      var arrayKey = arrayMember[key];
      delete arrayMember[key];
      keyedObject[arrayKey] = arrayMember;
    }
    return keyedObject;
  },
  // given an object where children ha
  arrayOfValuesByKey : function(arr, key){
    var returnArray = [];
    for (var i = 0; i < arr.length; i++) {
      returnArray.push(arr[i][key]);
    }
    return returnArray;
  },
  dictionarytoArray : function(dict){
    if(dict == null){
        return [];
    }
    var values = [];
    var enumerator = [dict keyEnumerator];
    while((key = [enumerator nextObject])){
        var obj = [dict objectForKey:key];
       if((obj.isKindOfClass(NSDictionary) || obj.isKindOfClass(NSMutableDictionary))){
            var res = this.dictionarytoArray(obj)
            values = values.concat(res);
       }else{
            values.push(obj);
       }
    }
    return values;
}

}

// miscellaneous layer manipulation and such
qutils.misc = {
  // moves provided layer into the current selection
  moveLayerToSelection : function(layer){
    var selectedLayer = selection[0];
    if (qutils.is.group(selectedLayer)) {
      [layer removeFromParent];
      [selectedLayer addLayers:[layer]];
    }
  },
  setLayerUserInfo: function(layer,key,value){
    var info = layer.userInfo()
    if(info == null){
        info = [[NSMutableDictionary alloc] init];
    }else{
        info = [NSMutableDictionary dictionaryWithDictionary:info];
    }
    var qordobaInfo = [info objectForKey: "com.qordoba.sketch"];
    if(qordobaInfo == null){
        qordobaInfo = [[NSMutableDictionary alloc] init];
    }else{
        qordobaInfo = [NSMutableDictionary dictionaryWithDictionary:qordobaInfo];
    }
    [qordobaInfo setObject:value forKey:key];
    [info setObject:qordobaInfo  forKey: "com.qordoba.sketch"];
    layer.setUserInfo(info);
  },
  getLayerUserInfo: function(layer,key){
    var info = layer.userInfo()
    if(info == null){
        return false;
    }else{
        info = [NSMutableDictionary dictionaryWithDictionary:info];
    }
    var qordobaInfo = [info objectForKey: "com.qordoba.sketch"];
    if(qordobaInfo == null){
        return false;
    }else{
        return [qordobaInfo objectForKey: key];
    }
    return false;
  }
};

// interaction with a separate javascript context
qutils.js = {
  loadLibrary : function(path){
    var scriptFolder = [pluginURL URLByDeletingLastPathComponent];
    var libraryURL = [scriptFolder URLByAppendingPathComponent:path];
    var fileString = NSString.stringWithContentsOfFile(libraryURL);
    return fileString;
  }
};

// ------------ UI --------- //

// UI
qutils.UI = {
  showInput : function (doc,message, initialValue){
    var initial = initialValue || "";
    return [doc askForUserInput:message initialValue:initial];
  },
  showMessage : function(doc,message){
    [doc showMessage:message];
  },
  showError : function(message){
    qutils.UI.showDialog("Error", message);
  },
  showDialog : function(title, message){
    var app = [NSApplication sharedApplication];
    [app displayDialog:message withTitle:title];
  },
  showSelect : function(doc,msg, items, selectedItemIndex){
    var selectedItemIndex = selectedItemIndex || 0;

    var accessory = [[NSComboBox alloc] initWithFrame:NSMakeRect(0,0,200,25)]
    [accessory addItemsWithObjectValues:items]
    [accessory selectItemAtIndex:selectedItemIndex]

    var alert = [[NSAlert alloc] init]
    [alert setMessageText:msg]
    [alert addButtonWithTitle:'OK']
    [alert addButtonWithTitle:'Cancel']
    [alert setAccessoryView:accessory]

    var responseCode = [alert runModal]
    var sel = [accessory indexOfSelectedItem]

    return [responseCode, sel]
  }
};




// Derive the padding between the text layer and the background layers
function getButtonPadding(buttonRect, textLayer) {
  var textFrame = [textLayer frame];

  return {
    top: [textFrame y] - [buttonRect y],
    right: ([buttonRect x] + [buttonRect width]) - ([textFrame x] + [textFrame width]),
    bottom: ([buttonRect y] + [buttonRect height]) - ([textFrame y] + [textFrame height]),
    left: [textFrame x] - [buttonRect x]
  };
};

// Set the new padding (resizes layers that surround the text and repositions any 
// layers to the right of the text layer's left edge)
function setButtonPadding(buttonRect, textLayer, layers, padding) {
  // determine how much the background is changing
  var textFrame = [textLayer frame];
  var newWidth = padding.left + [textFrame width] + padding.right;
  var deltaWidth = newWidth - [buttonRect width];

  // loop through the layers and resize or reposition all (except textLayer)
  for (var i = 0; i < [layers length]; i++) {
    var layer = [layers objectAtIndex:i];
    if (layer != textLayer) {
      var layerFrame = [layer frame];
      var textFrameRight = [textFrame x] + [textFrame width];

      if ([layerFrame x] < textFrameRight && [layerFrame x] + [layerFrame width] > textFrameRight) {
        // if the layer spans the x coordinate of the *right edge* of the text layer, assume it's
        // a background layer and resize its width accordingly
        [layerFrame addWidth: deltaWidth];
        [layerFrame subtractX: deltaWidth];
      }
      else if ([layerFrame x] + [layerFrame width]  < textFrameRight) {
        // if the layer is entirely to the left of the text layer's right edge, just reposition it
        [layerFrame subtractX:deltaWidth];
      }
    }
  }
};

qutils.translate = {
  setSelectionMaxWidth: function(context){
    var doc = context.document
    var currentPage = [doc currentPage];
    var selectedLayers = context.selection;//[currentPage selectedLayers];
    log(selectedLayers);
    log(selectedLayers.count());
    
    for(i = 0; i < selectedLayers.count(); i++){
      var layer = selectedLayers[i];
      var parent = qutils.call.parentLayer(layer);
      var maxWidth = qutils.misc.getLayerUserInfo(layer,"maxWidth");
      if(!maxWidth && !parent.isKindOfClass(MSPage)){
        var maxWidth = parent.frame().width();
      }else{
        var maxWidth = layer.frame().width();
      }
      maxWidth = qutils.UI.showInput(doc,"Set the layer '" + layer.name() + "''s Max Witdh: ", maxWidth);
      if(maxWidth > 0){
        qutils.misc.setLayerUserInfo(layer,"maxWidth",maxWidth);
      }
    }
    
  },
  updateLayerText: function(currentPage,layer, newText){

    if(layer == null){
      return false;
    }
    //log("set the text for layer: " + layer.name());
    var layerId = layer.objectID();
    var textLayer = layer;
    var parent = qutils.call.parentLayer(layer);
    var layerFrame = layer.frame();
    var orginalHeight = layerFrame.height();
    var orgY = layerFrame.y();
    var orgAbsoluteY = layer.absoluteRect().y();
    var maxWidth = qutils.misc.getLayerUserInfo(layer,"maxWidth");
    if(!maxWidth){
      maxWidth = layerFrame.width();
    }
    // Extract current padding based on buttonRect and textLayer
    //Get the buttom parents
    var buttonPadding = false;
    qutils.call.ancestorLayers(layer,function(parent){
        if(!buttonPadding && qutils.is.buttonLayer(parent)){
          
          buttonPadding = getButtonPadding(parent.absoluteRect(), textLayer);  
        }
    });
    //qutils.UI.showMessage("Max witdth is :  " + maxWidth);
    //var maxWidth = parent.frame().width();
    var shiftY = 0;

    //Step 1: Set the width to auto 
    ///////////////layer.textBehaviour = 0; // width 0 auto/ 1fixed
    //Step 2: update the text
    layer.setStringValue(newText)
    //Step 3: auto adjust the frame
    
    [layer adjustFrameToFit];

    //Step 3: force the max width
    if(layer.frame().width() > maxWidth){
        layer.frame().setWidth(maxWidth)
    }

    //Step 3: auto adjust the frame
    [layer adjustFrameToFit];

    //Step 4: Set back the textBehaviour
    ///////////////layer.textBehaviour = 1; // width 0 auto/ 1fixed
    //School
    var updatedLayer = qutils.call.layerById(currentPage,layerId);
    if(updatedLayer){
      layer = updatedLayer;
    }
    shiftY = layer.frame().height() - orginalHeight;
    //log("orginal height is : " + orginalHeight);
    //log("current height is : " + layer.frame().height());
    //log("Shif Y is : " + shiftY);
        
    //qutils.call.childLayers(parent,function(child){
    //        if(child.frame().y() > orgY){
               // child.frame().setY(child.frame().y() + shiftY);
    //        }
    //}); 
    qutils.call.ancestorLayers(layer,function(parent){
       [parent layerWillResize];
       qutils.call.containedLayers(parent,function(child){
            if(shiftY > 0 && child.absoluteRect().y() > orgAbsoluteY){
               //log("layer: " + child.name() + ", Y: " + child.frame().y() + "and Shift is " + shiftY); 
                child.frame().setY(child.frame().y() + shiftY);
            }
        });
        if(buttonPadding && qutils.is.buttonLayer(parent)){
          setButtonPadding(parent.absoluteRect(), textLayer, [parent layers], buttonPadding);
        }
        [parent layerFinishedResize];
    });

    //Resize the masks
    qutils.call.pageLayers(currentPage,function(layer){
        if(qutils.is.maskLayer(layer)){
            var parent = qutils.call.parentLayer(layer);
            layer.frame().setHeight(parent.frame().height());
        }
    });
  }
};
