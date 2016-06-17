# e-legislation-pilot

## Project description

The objective of this pilot is to develop a reusable proof of concept, to demonstrate the following benefits of publishing legal information as (linked) open data, using the ELI ontology:
* Legal information can be accessed and displayed to end users;
* Legal information can be accessed in machine readable format;
* The evolution of legal information can be displayed in a timeline, to enable users to consult the text in force at any point in time (i.e. at the time of consultation or in the past).


## Requirements and dependencies

* Openlink Virtuoso v7.2.2
* PHP v5.6.15
* Composer v1.0.1
* EasyRDF v0.9.0
* NodeJS v4.4.3
* Cheerio.js v0.20
* Mammoth.js v0.3.33
* Jenkins v1.651.2
* jQuery v1.11.0
* jQuery UI v1.11.4
* jQuery UI Touch Punch v0.2.3
* JS-Cookie v2.1.2
* treeMenu v0.4

## How to use

To get started, clone this repository or download the repository as a .zip file.
In the target environment, make sure that Openlink Virtuoso is installed and configured and that you have access to the Virtuoso Conductor at `http://hostname:port/conductor`. Additionally, if you wish to also install the ELI Parser to transform Word Documents to RDF data, [install PHP 5.6 or above](http://php.net/manual/en/install.php) and [NodeJS v4.4.3 or above](https://nodejs.org/en/download/package-manager/) on your destination server.

To deploy this GitHub repository, adapt the following shell execution script to your target environment:
```
rm -rf /var/lib/virtuoso/vsp/legislation-pilot/*
rm -rf /var/www/eli-importer/*
cp ELI_Visualisation/* -R /var/lib/virtuoso/vsp/legislation-pilot
cp ELI_Model -R /var/lib/virtuoso/vsp/legislation-pilot/documentation
cp ELI_Importer/* -R /var/www/eli-importer
```

Please note that in the source files, literal references are made to the pilot URI ``http://52.50.205.146/legislation-pilot/``. Therefore it is advised to performed a search and replace on all files, where this URI is replaced by the URI of your target installation.

To set up the pilot in your Virtuoso Conductor, create a Virtual Directory named `legislation-pilot` by clicking the ``New Directory`` button under the tab ``Web Application server > Virtual Domains & Directories``
Subsequently, create the following URL Rewriting Rules for your Virtual Domain, these will integrate the ELI URI structure.

This pilot also makes use of the inferencing capabilities of Virtuoso. For this to function properly, the model's .owl files (`ELI_Model/eli.owl` and `ELI_Model/elegislation.owl`) need to be uploaded into a seperate graph. Once uploaded, inferencing needs to be set up for this graph by excuting the following command in Virtuoso's ``Database > Interactive SQL`` interface: `rdfs_rule_set('legislation-pilot', 'name_of_model_graph');`

Source pattern | Destination | Rule matching 
--- | --- | ---
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/?$ | /legislation-pilot/display.vsp?type=$U1&level=act&id=$U2&year=$U3 | Last matching
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/html\/?$ | /legislation-pilot/display.vsp?type=$U1&level=act&id=$U2&year=$U3 | Last matching
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/(rdf&#124;ttl)\/?$ | /legislation-pilot/sparql.vsp?format=$U4&id=$U2&year=$U3 | Last matching
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/(chapter_[0-9]*)\/?$ | /legislation-pilot/display.vsp?type=$U1&level=chapter&id=$U2&year=$U3&ref=$U4 | Last matching
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/(chapter_[0-9]*)\/html\/?$ | /legislation-pilot/display.vsp?type=$U1&level=chapter&id=$U2&year=$U3&ref=$U4 | Last matching
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/(chapter_[0-9]*)\/(rdf&#124;ttl)\/?$ | /legislation-pilot/sparql.vsp?format=$U5&id=$U2&year=$U3&ref=$U4 | Last matching
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/(article_[0-9]*)\/?$ | /legislation-pilot/display.vsp?type=$U1&level=article&id=$U2&year=$U3&ref=$U4 | Last matching
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/(article_[0-9]*)\/html\/?$ | /legislation-pilot/display.vsp?type=$U1&level=article&id=$U2&year=$U3&ref=$U4 | Last matching
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/(article_[0-9]*)\/(rdf&#124;ttl)\/?$ | /legislation-pilot/sparql.vsp?format=$U5&id=$U2&year=$U3&ref=$U4 | Last matching
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/(article_[0-9]*)\/(paragraph_[0-9]*)\/?$ | /legislation-pilot/display.vsp?type=$U1&level=article&id=$U2&year=$U3&ref=$U4&par=$U5 | Last matching
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/(article_[0-9]*)\/(paragraph_[0-9]*)\/html\/?$ | /legislation-pilot/display.vsp?type=$U1&level=paragraph&id=$U2&year=$U3&ref=$U4&par=$U5 | Last matching
/legislation-pilot/(.\*)\/(.\*)\/(.\*)\/(article_[0-9]*)\/(paragraph_[0-9]*)\/(rdf&#124;ttl)\/?$ | /legislation-pilot/sparql.vsp?format=$U6&id=$U2&year=$U3&ref=$U4&par=$U5 | Last matching
/legislation-pilot/documentation/(.\*)$ | /legislation-pilot/documentation/$U1 | Last matching
/legislation-pilot/vocabulary\/?$ | /legislation-pilot/vocabulary.html | Last matching

In order to upload test data to the Virtuoso Triple Store, two RDF files with test data have been provided at ``ELI_Model/legislation-server.rdf`` and ``ELI_Model/legislation-amendment.rdf``. These can be uploaded using Virtuoso's Quad Store Upload, which can be found in the Conductor under ``Linked Data > Quad Store Upload``. As a name for your graph, it is advised to use the same URI as where you intend to host the pilot. In our demo this is ``http://52.50.205.146/legislation-pilot``.
Please note that the RDF files reference our current demo implementation. Therefore, similar to the source files mentiond above, first perform a search and replace to replace all references to ``52.50.205.146/legislation-pilot`` with your target implementation.

###ELI_Import
The ELI Importer reads all **.docx** files present in `ELI_Importer/doc`, transforms the files into (x)HTML and annotates these with RDFa.  
The HTML+RDFA is then automatically converted into RDF+XML and stored in the Virtuoso triplestore.
All parameters are to be set via the User Interface in `ELI_Importer/index.php` which.

Detailed documentation on the ELI importer can be found here: [http://52.50.205.146:8890/eli-importer/documentation/](http://52.50.205.146:8890/eli-importer/documentation/)

###ELI_Model
This folder contains all relevant information concerning the data model that was created for the purpose of this e-legislation pilot.

Detailed documentation on the model is hosted here: [http://52.50.205.146/legislation-pilot/documentation/index.html](http://52.50.205.146/legislation-pilot/documentation/index.html)

###ELI_Visualisation
Folder containing all the files (Virtuoso Server Pages, CSS and JavaScript) to generate the visualisation of the content of the graph containing legislation as linked open data.

*Demo:* [http://52.50.205.146/legislation-pilot/](http://52.50.205.146/legislation-pilot/)

## License

Copyright 2016 European Union  
Authors: Jens Scheerlinck (PwC EU Services), Emidio Stani (PwC EU Services), Dimitrios Hytiroglou (PwC EU Services)

Licensed under the EUPL, Version 1.1 or - as soon they
will be approved by the European Commission - subsequent
versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.

You may obtain a copy of the Licence at:
http://ec.europa.eu/idabc/eupl  
Unless required by applicable law or agreed to in
writing, software distributed under the Licence is
distributed on an "AS IS" basis,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied.

See the Licence for the specific language governing
permissions and limitations under the Licence.

