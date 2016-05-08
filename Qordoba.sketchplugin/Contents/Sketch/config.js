@import 'api.js'
@import 'api_v2.js'

var width = 500;
var height = 400;
var yDropdowns = height - 150;
var fSizeLanguages = [];
function getFontsList(context){
	var doc = context.document
	var objs = [[doc fontList] allFonts]
	return objs;
	var arr = []
      for (i = 0; i < objs.length; ++i) {
          arr.push(objs[i].displayName());
      }
      return arr;
}

function addConfigRow(context,configView,top,language,font,size){
	var doc = context.document
	//Language
	var languages = getLanguagesArray(context)
	var languageNames = utils.getNames(languages)
	languageNames.push("---------");
	var languageDropdown = [[NSPopUpButton alloc] initWithFrame:NSMakeRect(20, top - 30 , 180, 25))]
	[languageDropdown addItemsWithTitles:languageNames]
	languageDropdown.tag = "form"
	[languageDropdown setAlternateTitle:language]
	var languageIndex = 0
	if(language){
		languageIndex = utils.getIndexOfArray(languageNames,language);
		[languageDropdown selectItemAtIndex:languageIndex]	
	}
	[languageDropdown setCOSJSTargetFunction:function(sender) {
		var langname = [sender alternateTitle]
		var oldObj = utils.getSettingForLanguage(context,langname)
		var newLang = [sender titleOfSelectedItem]
		utils.removeLanguageSetting(context,langname)
		utils.addLanguageSetting(context,{"language":newLang +"","font":oldObj.font +"","fsize":oldObj.fsize})
		var settings = utils.getLanguageSettings(context)
		reLoadSettingsViews(context,configView)
	}]
	[languageDropdown setAction:"callAction:"]
	[[configView contentView] addSubview:languageDropdown]
	
	//FONT
	var fonts = [doc fontList]
	fonts = fonts.allFonts()
	var fontNames = getFontsList(context)
	var fontDropdown = [[NSPopUpButton alloc] initWithFrame:NSMakeRect(210, top - 30 , 150, 25))]
	[fontDropdown addItemsWithTitles:fontNames]
	fontDropdown.tag = "form"
	var fontIndex = 0
	if(font){
		fontIndex = utils.getIndexOf(fontNames,font);
		[fontDropdown selectItemAtIndex:fontIndex]	
	}
	[fontDropdown setAlternateTitle:language]
	[fontDropdown setCOSJSTargetFunction:function(sender) {
		var langname = [sender alternateTitle]
		log("language name is : " + langname)
		var oldObj = utils.getSettingForLanguage(context,langname)
		log("the old ojbect is: ")
		log(oldObj)
		oldObj.font = sender.titleOfSelectedItem() + ""
		log(font)
		utils.addLanguageSetting(context,oldObj)
	}]
	[fontDropdown setAction:"callAction:"]
	[[configView contentView] addSubview:fontDropdown]


	
	var ratio = [[NSTextField alloc] initWithFrame:NSMakeRect(370, top - 30 , 45, 25)]
	fSizeLanguages[ratio.hash()] = language;
	ratio.tag = "form"
	[[ratio cell] setPlaceholderString:"100%"]
	if(size){
		[[ratio cell] setStringValue:size]
	}
	[[ratio cell] setCOSJSTargetFunction:function(sender) {
		var langname = fSizeLanguages[sender.hash()]
		var oldObj = utils.getSettingForLanguage(context,langname)
		var value = parseInt(sender.stringValue() + "")
		if(value >1000){
			value = 1000;
			[sender setStringValue:"1000"]
		}
		if(isNaN(value) || value<0){
			value = 0;
			[sender setStringValue:"0"]
		}
		oldObj.fsize = sender.stringValue() + ""
		utils.addLanguageSetting(context,oldObj)
	}]
	[[ratio cell] setAction:"callAction:"]
	
	[[configView contentView] addSubview:ratio]	

	var minusButton = [[NSButton alloc] initWithFrame:NSMakeRect(425, top - 30 , 75, 25)]
	[minusButton setBezelStyle:NSRoundedBezelStyle]
	[minusButton setTitle:"Remove"]
	[minusButton setAlternateTitle:language]
	minusButton.tag = "form"
	[minusButton setCOSJSTargetFunction:function(sender) {
		var langname = [sender alternateTitle]
		utils.removeLanguageSetting(context,langname)
		/*
		while([configView viewWithTag:"form"]){
			[[configView viewWithTag:"form"] setCOSJSTargetFunction:undefined];
			[[configView viewWithTag:"form"] removeFromSuperview];
		}
		while([configView viewWithTag:"formButton"]){
			[[configView viewWithTag:"formButton"] setCOSJSTargetFunction:undefined];
			[[configView viewWithTag:"formButton"] removeFromSuperview];
		}
		*/
		reLoadSettingsViews(context,configView)
	}];
	[minusButton setAction:"callAction:"]
	[[configView contentView] addSubview:minusButton]
}

function newRowConfig(context,view,top){
	var settings = utils.getLanguageSettings(context)
	var doc = context.document
	if(settings.length >= 11){
		var app = [NSApplication sharedApplication];
    	[app displayDialog:"Sorry! You can't add more languages." withTitle:"Error!"]
		return;
	}
	utils.addLanguageSetting(context,{"language":"---------","font":"","fsize":100})
	while([view viewWithTag:"formButton"]){
		[[view viewWithTag:"formButton"] setCOSJSTargetFunction:undefined];
		[[view viewWithTag:"formButton"] removeFromSuperview];
	}
	reLoadSettingsViews(context,view)
}

function reLoadSettingsViews(context,view){
	var top = yDropdowns;
	fSizeLanguages = [];
	var settings = utils.getLanguageSettings(context);
	//Remove the old form
	while([view viewWithTag:"form"]){
		[[view viewWithTag:"form"] setCOSJSTargetFunction:undefined];
		[[view viewWithTag:"form"] removeFromSuperview];
	}
	var x = 0;
	for(x = 0; x <settings.length;x++){
		var item = settings[x];
		addConfigRow(context,view,top - (x*30),item.language,item.font,item.fsize)
    }
    x +=1;
    //add the plus button
    var plusButton = [[NSButton alloc] initWithFrame:NSMakeRect(150, yDropdowns - ( x * 30) , 200, 25)]
	[plusButton setTitle:"Add New Language"]
	[plusButton setBezelStyle:NSRoundedBezelStyle]
	plusButton.tag = "formButton"
	[plusButton setCOSJSTargetFunction:function(sender) {
			newRowConfig(context,view,yDropdowns - (Object.keys(settings).length *30))
	}];
	[plusButton setAction:"callAction:"]
	[[view contentView] addSubview:plusButton]
}
/**
 *
 * Show Config window to sepicfy the organization id, project id and language id
 *
**/
function fireConfiguration(context){
	var doc = context.document
	var shifX
	var windowTitle = "Default Language Settings"
	var settings = utils.getLanguageSettings(context);
	height = 500 + ((settings.length - 2) * 30);
	height  = Math.min(600,height)

	yDropdowns = height - 170;


	var xDropPos = 79;
	var mainConfigView = [[NSWindow alloc] init]
	[mainConfigView setFrame:NSMakeRect(0, 0, width, height) display:true]
	[mainConfigView setBackgroundColor:NSColor.whiteColor()]
	[mainConfigView setTitle:windowTitle]
	
	var configView = [[NSScrollView alloc] initWithFrame:NSMakeRect(0, 0, 350, 500)];
	[configView setHasVerticalScroller:true];
	[configView setAcceptsTouchEvents:true];
	[mainConfigView setContentView:configView];

	//Logo
	var plugin = context.plugin
	if(utils.isRetinaDisplay()){
		var imageFilePath=[plugin urlForResourceNamed:"logo@2x.png"];
	} else {
		var imageFilePath=[plugin urlForResourceNamed:"logo.png"];
	}
	var imageData = [NSData dataWithContentsOfURL:imageFilePath];
	var image = NSImage.alloc().initWithData(imageData);

	var imageView = [[NSImageView alloc] initWithFrame:NSMakeRect((width - 164)/2, height - 130, 164, 149)];
	[imageView setImage: image];
	[[configView contentView] addSubview:imageView];
	
	//The default settings below allow you to set font and font ratio defaults for various languages. 
	//Qordoba will automatically apply your preferences to localized files.
	var languageTitle = [[NSTextField alloc] initWithFrame:NSMakeRect(25, height - 145, 450, 60)]
    languageTitle.stringValue = "The default settings below allow you to set font and font ratio defaults for various languages. \n Qordoba will automatically apply your preferences to localized files."
    languageTitle.editable = false
    languageTitle.borderd = false
    languageTitle.bezeled = false
    languageTitle.setAlignment(2)
    languageTitle.useSingleLineMode = false
    languageTitle.drawsBackground = false
    [languageTitle setFont:[NSFont systemFontOfSize:13.5]];
	[[configView contentView] addSubview:languageTitle]

	///Language Title
	var languageTitle = utils.createLabel("Language",NSMakeRect(-93, yDropdowns - 10, 180, 25))
	[languageTitle setFont:[NSFont boldSystemFontOfSize:13]];
	[[configView contentView] addSubview:languageTitle]
	//Font Title
	var fontTitle = utils.createLabel("Font Family",NSMakeRect(140, yDropdowns - 10, 150, 25))
	[fontTitle setFont:[NSFont boldSystemFontOfSize:13]];
	[[configView contentView] addSubview:fontTitle]
	//Font Title
	var fontRatioTitle = utils.createLabel("Font Ratio %",NSMakeRect(300, yDropdowns - 10, 150, 25))
	[fontRatioTitle setFont:[NSFont boldSystemFontOfSize:13]];
	[[configView contentView] addSubview:fontRatioTitle]
	
	reLoadSettingsViews(context,configView,yDropdowns)
	

	var yPosButtons = 40;
	//Buttons
	var bottomActionsView = [[NSView alloc] initWithFrame:NSMakeRect(0, yPosButtons, 500, 1)]
	bottomActionsView.setWantsLayer(true)
	[[configView contentView] addSubview:bottomActionsView]	
		
	var borderLayer = [CALayer layer]
	borderLayer.frame = CGRectMake(40, 1, 800, 1)
	[borderLayer setBackgroundColor:CGColorCreateGenericRGB(220/255, 220/255, 220/255, 1.0)]
	[bottomActionsView setLayer:borderLayer];
	
	// Buttons
	var cancelButton = [[NSButton alloc] initWithFrame:NSMakeRect((width -120)/2, yPosButtons -45, 120, 46)]

	[cancelButton setTitle:"Close"]
	[cancelButton setBezelStyle:NSRoundedBezelStyle]
	[cancelButton setCOSJSTargetFunction:function(sender) {
	    [mainConfigView orderOut:nil]
	    [app stopModal]
	    [cancelButton setCOSJSTargetFunction:undefined]
	    //var views = [mainConfigView allSubviewsInView:configView];
	    //log(views)
	    while([configView viewWithTag:"form"]){
	    	var view = [configView viewWithTag:"form"]
	    	view.tag = ""
			[view setCOSJSTargetFunction:undefined];
		}
		while([configView viewWithTag:"formButton"]){
			var view = [configView viewWithTag:"formButton"]
			view.tag = ""
			[[configView viewWithTag:"formButton"] setCOSJSTargetFunction:undefined];
		}
	}];
	[cancelButton setAction:"callAction:"]
	[[configView contentView] addSubview:cancelButton]

	[mainConfigView setDefaultButtonCell:[cancelButton cell]];
	[app runModalForWindow:mainConfigView]
}

var onRun = function (context) {
	if(utils.checkLastVersionChecked(context) == true){
		fireUpdate(context);
 	} else if (utils.getActiveTokenFromComputer(context) == false) {
		fireLoginWindowWithContext(context)
	} else {
		fireConfiguration(context)
	}
}