@import "editor.js"

var controller = {
	translateCurrentPage: function(organization,project,language, symbolOption, context){
		log("translate current page project: " + project.id)
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
		var documentName = [doc displayName]
		var fileId = utils.getFileIdForPage(project.id,documentName,currentPage,context)
		
		if(fileId){
			var translations = downloadFileNSUrlConnection(context,organization.id,project.id,language.id,fileId.fileId)
			if(translations){
				errors = translate.translatePageWithData(context,currentPage, language, translations,symbolOption)	
				if(errors>0){
					fireError("Success!", "Translated Pages created successfully. "+errors+" text layers could not be found.")	
				}else{
					fireError("Success!", "Translated Pages created successfully.")
				}
				return;
			}else{
				success = false;
				fireError("Error!", "Something went wrong.")
				return;
			}
		}else {
			fireError("Error!", "Your Page \""+pageName+"\" is not found in selected project")
			return;
		}
	},
	uploadCurrentPage: function(organization,project, context){
		log("Upload current page for project: " + project.id)
		var doc = context.document
		var documentName = [doc displayName]
		var currentPage = [doc currentPage]
		var stringsAsJson = translate.generateLocaleForPage(currentPage)
		var pageName = [currentPage name]

		var filePath = fileHelper.generateFile(context,stringsAsJson,pageName)
		var fileId = postFile(context,filePath,organization.id,project.id,pageName)
		if(fileId){
			var screenShotFile = fileHelper.exportPageToPng(context,currentPage);
			editor.utom.init(context);
			var geometryPath = editor.utom.specExport();
			postReference(context, screenShotFile, geometryPath, organization.id, project.id, fileId.fileId, pageName)
			utils.saveFileIdForPage(project.id,documentName,currentPage,fileId,context)		
			fireError("Success!", "Your page \""+pageName+"\" has been uploaded to Qordoba.")	
		}
	}
}
