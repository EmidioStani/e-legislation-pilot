<?php
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

/*========================*/
/*Load EasyRDF PHP Library*/
/*========================*/ 
require 'vendor/autoload.php';

/*===============*/
/*Folder settings*/
/*===============*/ 
$DOCfolder = 'doc';
$HTMLfolder = 'html';

/*=============*/
/*Data settings*/
/*=============*/
$data = file_get_contents($HTMLfolder.'/'.$fileName);
$inputFormat = 'rdfa';
$outputFormat = 'rdfxml';

/*============*/
/*URI settings*/
/*============*/
$uriStore = 'http://localhost:8890/sparql-graph-crud';
$subject = 'http://localhost:8890/'.$fileName;
$iri = 'http://localhost:8890/legislation';

/*===================*/
/*Convert DOC to RDFa*/
/*===================*/ 
header("Content-Type: text/html");
exec("node parser.js $DOCfolder $HTMLfolder");


/*===================*/
/*Store data in graph*/
/*===================*/
$gs = new EasyRdf_GraphStore($uriStore);
foreach(glob($HTMLfolder.'/*.*') as $fileName) {
	$graph = '';
	$graph = new EasyRdf_Graph($iri);
	$graph->parse($data, $inputFormat, $subject); 
	$output = $graph->serialise($format);
	$gs->insert($graph, $iri, $format);
}
?>