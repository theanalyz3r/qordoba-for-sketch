//@import "editor.js"
@import 'helpers/qordoba-editor.js'


var controller = {
	translateCurrentPage: function(organization,project,language, symbolOption, context){
		var doc = context.document
		if(!project || !language || !organization){
			fireConfiguration(context)
			return;
		}
		var currentPage = [doc currentPage]

		var success = true
		var errors = 0;
		if(utils.isGeneratedPage(currentPage,context)){
			fireError("Warning!", "This Page is the translated version. To fetch an updated version of the translation, please pull from the original Page.")
			return;
		}
		var pageName = [currentPage name]
		var documentName = doc.displayName().replace(/.sketch$/,"");
		var translations = downloadFileByName(context,organization.id,project.id,language.id,documentName + " - "+ pageName);
		if(translations)
		{
			errors = translate.translatePageWithData(context,currentPage, language, translations,symbolOption)	
			if(errors>0){
				fireError("Success!", "Translated Pages created successfully. "+errors+" text layers could not be found.")	
			}else{
				fireError("Success!", "Translated Pages created successfully.")
			}
			return;
		}else{
			fireError("Error!", "Couldn't load the translated content.")
			return;
		}
	},
	uploadCurrentPage: function(organization, project, context){
		log("Upload current page for project: " + project.id)
		var editor = qordobaSDK.editor.init(context);
		editor.upload(organization.id,project.id,context);
	}
}
