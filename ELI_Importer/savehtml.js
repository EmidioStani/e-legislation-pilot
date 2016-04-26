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
var http = require('http');
var fs = require('fs');

/******************************/
/***DEFINE VARIABLES***********/
/******************************/
var url = process.argv.slice(2);
var outputPath = process.argv.slice(3);
//var url = 'http://localhost/e-legislation/html-output.html';
//var outputPath = 'html';
var output = url[0].split('.');
    output = output[0];
    output = output.split('/');
    output = output[output.length -1];
    output = outputPath[0]+'/'+output+'.html';

/******************************/
/***FETCH HTML*****************/
/******************************/
var file = fs.createWriteStream(output);
var request = http.get(url, function(response) {
  console.log('got data');
  response.pipe(file);
  file.on('finish', function() {
    file.close();  // close() is async, call cb after close completes.
  });
}).on('error', function(err) { // Handle errors
  fs.unlink(output); // Delete the file async. (But we don't check the result)
  console.log("Got error: " + err.message);
});

