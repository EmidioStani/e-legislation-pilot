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
require '../vendor/autoload.php';

/*===============*/
/*Folder settings*/
/*===============*/ 
$DOCfolder = 'doc';
$HTMLfolder = 'html';
$RDFafolder = 'rdfa';

/*=============*/
/*Data settings*/
/*=============*/
$inputFormat = 'rdfa';
$outputFormat = 'rdfxml';
$fileName = '2016_04_21_law 3242 2004';

/*============*/
/*URI settings*/
/*============*/
$uriStore = 'http://localhost:8890/sparql-graph-crud';
$iri = 'http://localhost:8890/legislation';


/*===============*/
/*RDFa to RDF+XML*/
/*===============*/
$data = file_get_contents($RDFafolder.'/'.$fileName.'.html');
$subject = 'http://localhost:8890/'.$fileName; //Should be replaced with an ELI identifier
$graph = '';
$graph = new EasyRdf_Graph($iri);
$graph->parse($data, $inputFormat, $subject); 
$output = $graph->serialise($outputFormat);
print $output;
?>