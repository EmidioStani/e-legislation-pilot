<?php
/*========================*/
/*Load EasyRDF PHP Library*/
/*========================*/ 
require '../vendor/autoload.php';


    $graph = EasyRdf_Graph::newAndLoad('http://84.205.254.61:8890/legislation');
        if ($graph) {
            if (isset($_REQUEST['format']) && $_REQUEST['format'] == 'text') {
                print "<pre>".$graph->dump('text')."</pre>";
            } else {
                $dump = $graph->dump('html');
                print preg_replace_callback("/ href='([^#][^']*)'/", 'makeLinkLocal', $dump);
            }
        } else {
            print "<p>Failed to create graph.</p>";
        }

    # Callback function to re-write links in the dump to point back to this script
    function makeLinkLocal($matches)
    {
        $href = $matches[1];
        return " href='?uri=".urlencode($href)."#$href'";
    }
?>
