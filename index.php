<?php
require 'vendor/autoload.php';

header("Content-Type: text/html");
exec("node cheerio.js", $output);

/*===============*/
/*Folder settings*/
/*===============*/
$HTMLfolder = 'html';
$fileName = 'legislation.html';

/*===============*/
/*URI settings****/
/*===============*/
$uriStore = 'http://localhost:8890/sparql-graph-crud';
$subject = 'http://localhost:8890/dummy_legislation_id';
$iri = 'http://localhost:8890/legislation';

/*===================*/
/*Store data in graph*/
/*===================*/
$data = file_get_contents($HTMLfolder.'/'.$fileName);
$format = EasyRdf_Format::getFormat('turtle');


//$gs = new EasyRdf_Sparql_Client($uriStore);
$gs = new EasyRdf_GraphStore($uriStore);
$graph = new EasyRdf_Graph($iri);
$graph->parse($data, 'rdfa', $subject); 
$output = $graph->serialise($format);
//$gs->insert($graph, 'http://localhost:8890/legislation');
$gs->insert($graph, $iri, 'rdfxml');
print '<pre>'.htmlspecialchars($output).'</pre>';

?>