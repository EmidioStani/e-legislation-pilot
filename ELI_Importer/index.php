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

if(isset($_GET['a']) && $_GET['a'] == 'parse'){ //If the form is submitted
	if(empty($_POST['source'])){ //If no alternative source is provided
		/*===================*/
		/*Convert DOC to HTML*/
		/*===================*/ 
		header("Content-Type: text/html");
		exec("node docxtohtml.js $DOCfolder $HTMLfolder");

	} else { //An alternative data source (url) is provided
		/*==================*/
		/*Save HTML from URL*/
		/*==================*/ 	
		$source = $_POST['source'];
		header("Content-Type: text/html");
		exec("node savehtml.js $source $HTMLfolder");	
	}

	/*=============*/
	/*Data settings*/
	/*=============*/
	$inputFormat = 'rdfa';
	$outputFormat = 'rdfxml';

	/*============*/
	/*URI settings*/
	/*============*/
	$uriStore = $_POST['uriStore'];
	$iri = $_POST['iri'];
	$host = $_POST['host'];

	/*====================*/
	/*Convert HTML to RDFa*/
	/*====================*/
	if($_POST['type'] == 'act'){ //If the type of legislation is an act
		header("Content-Type: text/html");
		exec("node parser.js $HTMLfolder $RDFafolder $host");//

	} else { //If the type of legislation is an amendment
		header("Content-Type: text/html");
		exec("node parser2.js $HTMLfolder $RDFafolder $host");//	
	}

	/*===================*/
	/*Store data in graph*/
	/*===================*/
	$gs = new EasyRdf_GraphStore($uriStore);
	foreach(glob($RDFafolder.'/*.*') as $fileName) {
		$data = file_get_contents($fileName);
		$subject = 'http://localhost:8890/'.$fileName; //Should be replaced with an ELI identifier

		$graph = '';
		$graph = new EasyRdf_Graph($iri);
		$graph->parse($data, $inputFormat, $subject); 

		$output = $graph->serialise($outputFormat);
		$gs->insert($graph, $iri, $outputFormat);
		//print($output);
		rename(str_replace($RDFafolder, $HTMLfolder, $fileName), "archive/".str_replace($RDFafolder, $HTMLfolder, $fileName)); //Archive HTML folder
		rename($fileName, "archive/".$fileName); //Archive RDFa folder
	}
}
?>
<!DOCTYPE html>
<html>
<head>
  <title>e-Legislation Pilot</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" type="text/css" href="../css/normalize.css" />
  <link rel="stylesheet" type="text/css" href="../css/gridism.css" />
  <link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Open+Sans:400,300,600&amp;subset=latin,greek" />
  <link rel="stylesheet" type="text/css" href="../css/screen.css" />
  <link rel="stylesheet" type="text/css" href="../css/jquery.treemenu.css" />
</head>

<body>
<div class="wrapper">
	<header>
	  <a href="/legislation-pilot/">
	    <img src="../ELI_Visualisation/images/logo.png" alt="Υπουργείο Διοικητικής Μεταρρύθμισης και Ηλεκτρονικής Διακυβέρνησης" height="70" width="370" />
	  </a>
	</header>

<article>
<form name="parser" id="parser" method="post" action="?a=parse">
	<h1><label for="source">Specifcy your data source</label></h1>
	<p><input type="text" id="source" name="source" placeholder="http://www.example.com/index.html" style="width:400px;"></p>
	<p>If no data source is specified, the script will use the .docx files present in the <em>./doc</em> folder</p>
	<h1>Parameters</h1>
	<input type="radio" name="type" value="act"> <label for="type">Base Act</label><br>
  	<input type="radio" name="type" value="amendment"> <label for="type">Amendment</label><br>
	<p>Triple store: <input type="text" id="uriStore" name="uriStore" value="http://localhost:8890/sparql-graph-crud" style="width:400px;"></p>
	<p>Graph name: <input type="text" id="iri" name="iri" value="http://localhost:8890/legislation" style="width:400px;"></p>
	<p>Host name: <input type="text" id="host" name="host" value="http://openlaw.e-themis.gov.gr/eli/" style="width:400px;"></p>
	<input type="submit" value="Submit">
	</article>

	<footer>
	  <p>Work in progress.</p>

	  <p>This work is supported by
	  <a href="http://ec.europa.eu/isa/actions/01-trusted-information-exchange/1-1action_en.htm" target="_blank">Action 1.1</a>
	  of the
	  <a href="http://ec.europa.eu/isa/" target="_blank">Interoperability Solutions
	  for European Public Adminstrations (ISA)</a> Programme of the European
	  Commission.</p>

	  <p><strong>Linked Data pilots: </strong>
	    <a href="http://location.testproject.eu/BEL">Core Location pilot</a> |
	    <a href="http://cpsv.testproject.eu/CPSV">Core Public Service pilot</a> |
	    <a href="http://health.testproject.eu/PPP">Plant Protection Products pilot</a> |
	    <a href="http://maritime.testproject.eu/CISE">Maritime Surveillance pilot</a>
	  </p>

	  <p>
	    <a href="https://joinup.ec.europa.eu/asset/dcat_application_profile/description" target="_blank"><img alt="DCAT application profile for European data portals" src="https://joinup.ec.europa.eu/sites/default/files/imagecache/community_logo/DCAT_application_profile_for_European_data_portals_logo_0.png" width="70" height="70" /></a>
	    <a href="https://joinup.ec.europa.eu/asset/adms/description" target="_blank"><img alt="Asset Description Metadata Schema (ADMS)" src="http://joinup.ec.europa.eu/sites/default/files/imagecache/community_logo/adms_logo.png" width="70" height="70" /></a>
	    <a href="https://joinup.ec.europa.eu/asset/adms_foss/description" target="_blank"><img alt="Asset Description Metadata Schema for Software (ADMS.SW)" src="http://joinup.ec.europa.eu/sites/default/files/imagecache/community_logo/ADMS_SW_Logo.png" width="70" height="70" /></a>
	    <a href="https://joinup.ec.europa.eu/asset/core_business/description" target="_blank"><img alt="Core Business Vocabulary" src="http://joinup.ec.europa.eu/sites/default/files/imagecache/community_logo/core_business_logo.png" width="70" height="70" /></a>
	    <a href="https://joinup.ec.europa.eu/asset/core_person/description"><img alt="Core Person Vocabulary" src="http://joinup.ec.europa.eu/sites/default/files/imagecache/community_logo/core_person_logo.png" width="70" height="70" /></a>
	    <a href="https://joinup.ec.europa.eu/asset/core_location/description" target="_blank"><img alt="Core Location Vocabulary" src="http://joinup.ec.europa.eu/sites/default/files/imagecache/community_logo/core_location_logo.png" width="70" height="70" /></a>
	    <a href="https://joinup.ec.europa.eu/asset/core_public_service/description" target="_blank"><img alt="Core Public Service Vocabulary" src="https://joinup.ec.europa.eu/sites/default/files/imagecache/community_logo/core_public_service_logo.png" width="70" height="70" /></a>
	    <a href="http://ec.europa.eu/isa/" target="_blank"><img alt="isa" src="http://joinup.ec.europa.eu/sites/default/files/ckeditor_files/images/isa_logo.png" width="70" height="70" /></a>
	  </p>
	</footer>
</div>
<script type="text/javascript" src="http://code.jquery.com/jquery-1.11.0.min.js"></script>
</body>

</html>