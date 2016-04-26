// Convert a set of Word documents containing legislative text and/or
// its amendments into (1) xHTML and (2) RDF+XML in order to store the 
// information as linked open data in a Virtuoso Triple Store
//
// Copyright 2016 European Union
// Author: Jens Scheerlinck (PwC EU Services)
//
// Licensed under the EUPL, Version 1.1 or - as soon they
// will be approved by the European Commission - subsequent
// versions of the EUPL (the "Licence");
// You may not use this work except in compliance with the
// Licence.
// You may obtain a copy of the Licence at:
// http://ec.europa.eu/idabc/eupl
//
// Unless required by applicable law or agreed to in
// writing, software distributed under the Licence is
// distributed on an "AS IS" basis,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
// express or implied.
// See the Licence for the specific language governing
// permissions and limitations under the Licence.

/******************************/
/***LOAD MODULES***************/
/******************************/

var fs = require('fs');
var mammoth = require('mammoth');

/******************************/
/***DEFINE VARIABLES***********/
/******************************/

//var filePath = process.argv.slice(2);
//var outputPath = process.argv.slice(3);
var filePath = 'doc';
var outputPath = 'html';
var input = fs.readdirSync(filePath);
var output = '';

input.forEach(function(fileName){
	mammoth.convertToHtml({path: filePath+'/'+fileName})
	    .then(function(result){
	        var html = result.value; // The generated HTML
	        html = '<html><head></head><body>'+html+'</body></html>';
	        var messages = result.messages; // Any messages, such as warnings during conversion
			output = fileName.split('.');
			fs.writeFileSync(outputPath+"/"+output[0]+".html", unescape(html));
	        fs.writeFileSync('log/'+output[0]+'.log', messages);
	    })
	    .done();
});