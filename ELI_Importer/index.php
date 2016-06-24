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
$RDFafolder = 'rdfa';

if(isset($_GET['a']) && $_GET['a'] == 'parse'){ //If the form is submitted
	if(empty($_POST['source'])){ 
	//If no alternative source is provided
		/*===================*/
		/*Convert DOC to HTML*/
		/*===================*/
		$DOCname = basename($_FILES["fileToUpload"]["name"]);
		$target_file = $DOCfolder . "/" . $DOCname; 
		move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file);

		header("Content-Type: text/html");
		exec("node docxtohtml.js $DOCfolder $HTMLfolder");
	} else { 
	//An alternative data source (url) is provided
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
	$dateLastChecked = $_POST['dateLastChecked'];

	/*============*/
	/*URI settings*/
	/*============*/
	$uriStore = $_POST['uriStore'];
	$iri = $_POST['iri'];
	$host = $_POST['host'];

	/*==========================================*/
	/*Convert subject division array into string*/
	/*==========================================*/
	foreach($_POST['subjectDivision'] as $subjectdiv){
		$subjectparam .= $subjectdiv . " ";
	}

	/*====================*/
	/*Convert HTML to RDFa*/
	/*====================*/
	if($_POST['type'] == 'act'){ 
	//If the type of legislation is an act
		header("Content-Type: text/html");
		exec("node parser.js $HTMLfolder $RDFafolder $host $dateLastChecked $subjectparam");

	} else { //If the type of legislation is an amendment
		header("Content-Type: text/html");
		exec("node parser2.js $HTMLfolder $RDFafolder $host $dateLastChecked $subjectparam");	
	}

	/*===================*/
	/*Store data in graph*/
	/*===================*/
	//$gs = new EasyRdf_GraphStore($uriStore);
	foreach(glob($RDFafolder.'/*.*') as $fileName) {
		$data = file_get_contents($fileName);
		$subject = $host.$fileName; //Should be replaced with an ELI identifier
		$graph = '';
		$graph = new EasyRdf_Graph($iri);
		$graph->parse($data, $inputFormat, $subject); 

		$output = $graph->serialise($outputFormat);
		//$gs->insert($graph, $iri, $outputFormat);
		rename($target_file, "archive/".$target_file); //Archive DOC folder
		rename(str_replace($RDFafolder, $HTMLfolder, $fileName), "archive/".str_replace($RDFafolder, $HTMLfolder, $fileName)); //Archive HTML folder
		rename($fileName, "archive/".$fileName); //Archive RDFa folder
	}
	header("Content-Disposition: attachment; filename=\"" . str_replace("docx", "rdf", "$DOCname") . "\"");
	header("Content-Type: text/plain");
	header("Content-Length: " . strlen($output));
	echo $output;
	exit;
}
?>
<!DOCTYPE html>
<html>
<head>
  <title>e-Legislation Pilot</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" type="text/css" href="http://52.50.205.146/legislation-pilot/css/normalize.css" />
  <link rel="stylesheet" type="text/css" href="http://52.50.205.146/legislation-pilot/css/gridism.css" />
  <link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Open+Sans:400,300,600&amp;subset=latin,greek" />
  <link rel="stylesheet" type="text/css" href="http://52.50.205.146/legislation-pilot/css/screen.css" />
  <link rel="stylesheet" type="text/css" href="http://52.50.205.146/legislation-pilot/css/jquery.treemenu.css" />
  <link rel="stylesheet" type="text/css" href="vendor/select2.min.css" />
</head>

<body>
<div class="wrapper">
	<header>
	  <a href="http://52.50.205.146/legislation-pilot/">
	    <img src="http://52.50.205.146/legislation-pilot/images/logo.png" alt="Υπουργείο Διοικητικής Μεταρρύθμισης και Ηλεκτρονικής Διακυβέρνησης" height="70" width="370" />
	  </a>
	</header>

<article>
<form name="parser" id="parser" method="post" action="?a=parse" enctype="multipart/form-data">
	<!--User form for parsing legislativie data -->
	<h1><label for="source">Specify your data source</label></h1>
	<p>URL: <input type="text" id="source" name="source" placeholder="http://www.example.com/index.html" style="width:400px;"> OR</p>
	<p>File upload (.docx) <input type="file" name="fileToUpload" id="fileToUpload"></p>
	<h1>Parameters</h1>
	<input type="radio" name="type" value="act" checked> <label for="type">Base Act</label><br>
  	<input type="radio" name="type" value="amendment"> <label for="type">Amendment</label><br>
	<p>Date last checked: <input type="date" id="dateLastChecked" name="dateLastChecked" value="<?php print date('Y-m-d'); ?>"></p>
	<p>Subject divisions: 
		<select name="subjectDivision[]" class="js-example-basic-multiple" multiple="multiple">
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Administrative_law_-_civil_servants">Administrative law - civil servants</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Agricultural_law_-_water_resources">Agricultural law - water resources</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Airforce_-_civil_aviation">Airforce - civil aviation</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Anonymous_companies_-_limited_liability_companies_-_stock_markets_-_banks">Anonymous companies - limited liability companies - stock markets - banks</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Civil_law">Civil law</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Civil_procedure">Civil procedure</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Commercial_law">Commercial law</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Constitutional_law">Constitutional law</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Court_of_audit_-_public_servants_pensions">Court of audit - public servants pensions</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Criminal_law">Criminal law</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Criminal_procedure">Criminal procedure</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Currency_-_public_property">Currency - public property</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Customs_law">Customs law</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Diplomatic_law_-_international_organizations">Diplomatic law - international organizations</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Direct_taxation">Direct taxation</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Ecclesiastical_law">Ecclesiastical law</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Educational_law_-_sport">Educational law - sport</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Financial_management_-_environment">Financial management - environment</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Health_law_-_hospitals_-_doctors">Health law - hospitals - doctors</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Indirect_taxation">Indirect taxation</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Industrial_law_-_development_law_-_fishing">Industrial law - development law - fishing</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Justice_administration">Justice administration</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Labour_law">Labour law</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Legal_entities_of_public_law_-_pension_funds">Legal entities of public law - pension funds</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Marketplace_law">Marketplace law</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Merchant_shipping">Merchant shipping</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Municipalities_and_communities_-_prefecture_self_administration">Municipalities and communities - prefecture self administration</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#National_defence_-_land_army">National defence - land army</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Navy">Navy</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Police_law_-_fire_department">Police law - fire department</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Port_law">Port law</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Post_-_telecommunications">Post - telecommunications</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Press_-_media_-_tourism">Press - media - tourism</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Public_accounting_-_K.E.D.E.">Public accounting - K.E.D.E.</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Public_works_-_engineers_-_urban_planning">Public works - engineers - urban planning</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Rural_law_-_forests_-_animal_farming">Rural law - forests - animal farming</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Science_and_arts_-_universities_-_antiquities">Science and arts - universities - antiquities</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Social_welfare">Social welfare</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Transportation">Transportation</option>
			<option value="http://openlaw.e-themis.gov.gr/eli/vocabulary#Worker_association_-_chambers_-_cooperatives">Worker association - chambers - cooperatives</option>
		</select>
	</p>
	<p>Triple store: <input type="text" id="uriStore" name="uriStore" value="http://openlaw.e-themis.gov.gr/sparql-graph-crud" style="width:400px;"></p>
	<p>Graph name: <input type="text" id="iri" name="iri" value="http://openlaw.e-themis.gov.gr" style="width:400px;"></p>
	<p>Host name: <input type="text" id="host" name="host" value="http://openlaw.e-themis.gov.gr/eli/" style="width:400px;"></p>
	<input type="submit" value="Submit">
	<?php if(!empty($output)){ ?>
	<h1>RDF/XML Output</p>
	<div style="border:1px solid #ededed; padding:20px; color:#444; font-size:12px;">
	<?php echo nl2br(htmlentities($output, ENT_QUOTES, "UTF-8")); ?>
	</div>
	<?php } ?>

	<h1>Documentation</h1>
	<p>Read the <a href="documentation/index.html">technical documentation</a> regarding this ELI Importer</p>
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
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/js/select2.min.js"></script>
<script type="text/javascript">$(".js-example-basic-multiple").select2();</script>
</body>

</html>