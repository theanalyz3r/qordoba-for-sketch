var utils = utils || {};
utils = {
  "getPageId" : function(page){
    var string = page.toString()
    var openRange = [string rangeOfString:@"("]
    var closeRange = [string rangeOfString:@")"]
    var length = closeRange.location - openRange.location -1
    return [[string substringFromIndex:NSMaxRange(openRange)] substringToIndex:length]
  },

  "isRetinaDisplay": function(){
    return NSScreen.isOnRetinaScreen();
  },

  "escapedFileName": function(string){
    var notAllowedChars = [NSCharacterSet characterSetWithCharactersInString:@"\\<>=,!#$&'()*+/:;=?@[]%"];
    var cleanString = [[string componentsSeparatedByCharactersInSet:notAllowedChars] componentsJoinedByString:@""];
    return cleanString
  },

  "createLabel": function(text, rect) {
    var label = [[NSTextField alloc] initWithFrame:rect]
    label.stringValue = text
    label.editable = false
    label.borderd = false
    label.bezeled = false
    label.setAlignment(1)
    label.useSingleLineMode = true
    label.drawsBackground = false
    return label
  },

  "getNames" : function(objs){
      var arr = []
      for (i = 0; i < objs.length; ++i) {
          arr.push(objs[i].name);
      }
      return arr;
    },

  "getArrayNames" : function(objs){
      var arr = []
      for (i = 0; i < objs.length; ++i) {
          arr.push(objs[i].name);
      }
      return arr;
    },
  "getIndexOfArray": function(objs, name){
    var index = 0;
    for (i = 0; i < objs.length; ++i) {
      if(name == objs[i]){
        index = i;
        return index;
      }
    }
    return index;
  },
  "getIndexOf": function(objs, name){
    var index = 0;
    for (i = 0; i < objs.length; ++i) {
      if(name == objs[i]){
        index = i;
        return index;
      }
    }
    return index;
  },
  "saveActiveTokenToComputer": function(context,token,userid,username,useremail) {
    [[NSUserDefaults standardUserDefaults] setObject:token forKey:"QUSER_qordoba_token" + "_" + qordobaSDK.common.version]
    [[NSUserDefaults standardUserDefaults] setObject:userid forKey:"QUSER_qordoba_user_id" + "_" + qordobaSDK.common.version]
    [[NSUserDefaults standardUserDefaults] setObject:username forKey:"QUSER_qordoba_user_name" + "_" + qordobaSDK.common.version]
    [[NSUserDefaults standardUserDefaults] setObject:useremail forKey:"QUSER_qordoba_user_email" + "_" + qordobaSDK.common.version]
    [[NSUserDefaults standardUserDefaults] synchronize]
  },

  "getUserName": function(context) {
    var value = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba_user_name" + "_" + qordobaSDK.common.version];
    if (value) {
      return value;
    } else {
      return false;
    }
  },

  "getUserEmail": function(context) {
    var value = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba_user_email" + "_" + qordobaSDK.common.version];
    if (value) {
      return value;
    } else {
      return false;
    }
  },
  "getUserId": function(context) {
    var value = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba_user_id" + "_" + qordobaSDK.common.version];
    if (value) {
      return value;
    } else {
      return false;
    }
  },

  "deleteActiveToken": function(context) {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:@"QUSER_qordoba_token" + "_" + qordobaSDK.common.version];
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:@"QUSER_qordoba_user_id" + "_" + qordobaSDK.common.version];
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:@"QUSER_qordoba_user_name" + "_" + qordobaSDK.common.version];
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:@"QUSER_qordoba_user_email" + "_" + qordobaSDK.common.version];
    this.deleteAllKeys(context)
  },
  "saveUserOrganizations": function(context,organizations) {
      [[NSUserDefaults standardUserDefaults] setObject:organizations forKey:"QUSER_qordoba_user_organizations" + "_" + qordobaSDK.common.version]
      [[NSUserDefaults standardUserDefaults] synchronize]
  },

  "getUserOrganizations": function(context) {
    var value = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba_user_organizations" + "_" + qordobaSDK.common.version];
    if (value) {
      return value;
    } else {
      return false;
    }
  },
  "fireError": function(title,text){
    [app displayDialog:text withTitle:title]
  },
  "deleteAllKeys": function(context){
    var defaultsDictionary = [[NSUserDefaults standardUserDefaults] dictionaryRepresentation];
    var keys = [defaultsDictionary allKeys]
    for (i = 0; i < [keys count]; ++i) {
        var key = keys[i]
        if([key hasPrefix:@"QUSER"]){
          [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
        }
    }
    [[NSUserDefaults standardUserDefaults] synchronize];
  },
  "getOrganization": function(context){
    var object = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba connected organization" + "_" + qordobaSDK.common.version];
    if (object) {
      return object;
    } else {
      return false;
    }
  },

  "saveOrganization": function(organization, context){
    [[NSUserDefaults standardUserDefaults] setObject:organization forKey:"QUSER_qordoba connected organization" + "_" + qordobaSDK.common.version]
    [[NSUserDefaults standardUserDefaults] synchronize]
  },

  "getProject": function(context){
    var object = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba connected project" + "_" + qordobaSDK.common.version];
    if (object) {
      return object;
    } else {
      return false;
    }
  },

  "saveProject": function(project, context){
    [[NSUserDefaults standardUserDefaults] setObject:project forKey:"QUSER_qordoba connected project" + "_" + qordobaSDK.common.version]
    [[NSUserDefaults standardUserDefaults] synchronize]
  },

  "getTargetLanguage": function(context){
    var object = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba connected project target language" + "_" + qordobaSDK.common.version];
    if (object) {
      return object;
    } else {
      return false;
    }
  },

  "saveTargetLanguage": function(language, context){
    [[NSUserDefaults standardUserDefaults] setObject:language forKey:"QUSER_qordoba connected project target language" + "_" + qordobaSDK.common.version]
    [[NSUserDefaults standardUserDefaults] synchronize]
  },

  "getOrganizationProjects": function(organizationId, context){
    var object = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba organization id:"+ organizationId+": projects" + "_" + qordobaSDK.common.version];
    if (object) {
      return object;
    } else {
      return false;
    }
  },

  "saveOrganizationProjects": function(organizationId, projects, context){
    [[NSUserDefaults standardUserDefaults] setObject:projects forKey:"QUSER_qordoba organization id:"+ organizationId+": projects" + "_" + qordobaSDK.common.version]]
    [[NSUserDefaults standardUserDefaults] synchronize]
  },
  "saveLanguages": function(context,languages){
    [[NSUserDefaults standardUserDefaults] setObject:languages forKey:"QUSER_qordoba_languages" + "_" + qordobaSDK.common.version]]
    [[NSUserDefaults standardUserDefaults] synchronize]
  },
  "getLanguages": function(context){
    var object = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba_languages" + "_" + qordobaSDK.common.version];
    if (object) {
      return object;
    } else {
      return false;
    }
  },

  "getOrganizations": function(context){
    var object = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba_user_organizations" + "_" + qordobaSDK.common.version];
    if (object) {
      return object;
    } else {
      return false;
    }
  },

  "saveOrganizations": function(organizations, context){
     [[NSUserDefaults standardUserDefaults] setObject:organizations forKey:"QUSER_qordoba_user_organizations" + "_" + qordobaSDK.common.version]
     [[NSUserDefaults standardUserDefaults] synchronize]
    },

    "saveFileIdForPage": function(projectId,documentName, page, fileId, context) {
      var pageId = page.objectID()
      [[NSUserDefaults standardUserDefaults] setObject:fileId forKey:"QUSER_qordoba_org_api_key_" + projectId +"_"+ documentName + "-" + pageId];
      [[NSUserDefaults standardUserDefaults] synchronize]
    },

    "getFileIdForPage": function(projectId,documentName,page,context) {
      var pageId = page.objectID()
      var key = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba_org_api_key_" +projectId +"_"+ documentName + "-" + pageId];
      if (key) {
        return key;
      } else {
        return false;
      }
    },

    "deleteFileIdForPage": function(projectId,documentName,page,context) {
      var pageId = page.objectID()
      [[NSUserDefaults standardUserDefaults] removeObjectForKey:"QUSER_qordoba_org_api_key_" +projectId +"_"+ documentName + "-" + pageId];
    },

    "addGeneratedPage": function(page,context){
      var pages = [NSMutableArray arrayWithArray:[[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba_generated_pages"]];
      if (!pages) {
        pages =  [NSMutableArray array];
      }
      var pageId = page.objectID()
      [pages addObject:pageId]
      [[NSUserDefaults standardUserDefaults] setObject:pages forKey:"QUSER_qordoba_generated_pages"];
      [[NSUserDefaults standardUserDefaults] synchronize]
    },
    "isGeneratedPage": function(page,context){
      var pages = [NSMutableArray arrayWithArray:[[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba_generated_pages"]];
      var pageId = page.objectID()
      return [pages containsObject:pageId]
    },
    "getDebugSetting": function(context){
    var debug = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_debug"]
    if (debug) {
      return debug
    } else {
      return 1
      //return 0
    }
  },

  "saveDebugSetting": function(debugValue,context){
    [[NSUserDefaults standardUserDefaults] setObject:debugValue forKey:"QUSER_debug"]
    [[NSUserDefaults standardUserDefaults] synchronize]
  },

  "getLastUsedProject": function(context){
    var last = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba last used project" + "_" + qordobaSDK.common.version];
    if (last) {
      return last;
    } else {
      return false;
    }
  },

  "saveLastUsedProject": function(projectId,context){
    [[NSUserDefaults standardUserDefaults] setObject:projectId forKey:"QUSER_qordoba last used project" + "_" + qordobaSDK.common.version]
    [[NSUserDefaults standardUserDefaults] synchronize]
  },

  "getLastVersionChecked": function(context){
    var last = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba_last_version_checked"];
    if (last) {
      return last;
    } else {
      return [NSDate date];
    }
  },
  "checkLastVersionChecked": function(context){
    var last = this.getLastVersionChecked(context);
    var dateNow = [NSDate date];
    var secondsBetween = [dateNow timeIntervalSinceDate:last];
    //if(secondsBetween > 100){
    if(secondsBetween/86400 > 1){
      return true;
    }else {
      return false;
    }
  },

  "setLastVersionChecked": function(datetime,context){
    [[NSUserDefaults standardUserDefaults] setObject:datetime forKey:"QUSER_qordoba_last_version_checked"]
    [[NSUserDefaults standardUserDefaults] synchronize]
  },

  "getLastUsedOrganization": function(context){
    var last = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba last used organization" + "_" + qordobaSDK.common.version];
    if (last) {
      return last;
    } else {
      return false;
    }
  },

  "saveLastUsedOrganization": function(projectId,context){
    [[NSUserDefaults standardUserDefaults] setObject:projectId forKey:"QUSER_qordoba last used organization" + "_" + qordobaSDK.common.version]
    [[NSUserDefaults standardUserDefaults] synchronize]
  },

  "filterArray": function(myArray,searchTerm, property){
    var len = myArray.length;
    var newArray = []
    for(var i = 0; i < len; i++) {
          if (myArray[i][property].toLowerCase != searchTerm.toLowerCase){
            newArray.push(myArray[i])
          }
      }
      return newArray;
  },
  "findFirstInArray": function(myArray,searchTerm, property){
    var len = myArray.length;
    for(var i = 0; i < len; i++) {
          if (myArray[i][property].toLowerCase === searchTerm.toLowerCase){
            return myArray[i];
          }
    }
      return false;
  },

  "arrayObjectIndexOf": function(myArray, searchTerm, property) {
    var len = myArray.length;
    for(var i = 0; i < len; i++) {
          if (myArray[i][property] == searchTerm){
            return i;
          }
      }
      return -1;
  },
  "resetLanguageSettings": function(context){
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:@"QUSER_qordoba_language_settings"];
    [[NSUserDefaults standardUserDefaults] synchronize]
  },
  "getLanguageSettings": function(context){
    var objs = [[NSUserDefaults standardUserDefaults] objectForKey:"QUSER_qordoba_language_settings"];
    if (objs) {
      objs = JSON.parse(objs)
      return objs;
    } else {
      return JSON.parse("[]");
    }
  },
  "getSettingForLanguage": function(context,language){
    language = language + ""
    var objs = this.getLanguageSettings(context)
    if (objs) {
      objs = objs.filter(function (el) {return (el.language.toLowerCase() === language.toLowerCase());});
      if(objs.length>0){
        return objs[0];
      }
    }
    return false
  },
  "removeLanguageSetting": function(context,language){
    settings = this.getLanguageSettings(context)
    settings = settings.filter(function (el) {return (el.language !=language);});
    this.saveLanguageSettings(settings,context)
    return settings;
  },
  "addLanguageSetting": function(context,obj){
    var settings = this.getLanguageSettings(context)
    var index = this.arrayObjectIndexOf(settings,obj.language,"language")
    if(index>=0){
      settings[index] = obj
    }else{
      settings.push(obj)
    }
    this.saveLanguageSettings(settings,context)
    return settings;
  },
  "saveLanguageSettings": function(languageSettings,context){
    languageSettings = JSON.stringify(languageSettings)
    [[NSUserDefaults standardUserDefaults] setObject:languageSettings forKey:"QUSER_qordoba_language_settings"]
    [[NSUserDefaults standardUserDefaults] synchronize]
  },
"getFontOf": function(context,fontName) {
    var doc = context.document
    var fontList = [doc fontList];

    //get index
    var objs = [fontList allFonts]
    var index = -1;
    for (i = 0; i < objs.count(); ++i) {
       if(objs[i].toLowerCase() === fontName.toLowerCase()){
          index = i;
       }
    }
    if(index >=0){
      var font =  [fontList fontForFontAtIndex:index]
      return font
    }
    return false;
  },
 "excludeSymbols": function(context){
    var doc = context.document
    var symbols = doc.documentData().layerSymbols().objects();
      for(var j = 0; j < symbols.count(); j++){
        var symbol = symbols[j];
        var layers = symbol.value().layers()
        for(var i = 0; i < layers.count(); i++){
          var layer = layers[i];
          if(layer.class() == MSTextLayer){
            [layer setPrimitiveDontSynchroniseWithSymbol:true];
          }else if(layer.class() == MSLayerGroup ){
            this.exlcudeGroups(context,layer.layers())
          }
        }
      }
  },
"exlcudeGroups": function(context,layers){
    for(var i = 0; i< layers.count(); i++){
      var layer = layers[i];
      if(layer.class() == MSTextLayer){
        [layer setPrimitiveDontSynchroniseWithSymbol:true];
        log(layer.dontSynchroniseWithSymbol());
      }else if(layer.class() == MSLayerGroup ){
        this.exlcudeGroups(context,layer.layers())
      }
    }
  }
}

var config = utils
