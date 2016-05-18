# e-legislation-pilot

## Project description

The objective of this pilot is to develop two proofs of concept, one for Greece and one for Italy, to demonstrate the following:
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

## How to use

To get started, clone this repository and run `composer install` in the root of the repository.  
Make sure that you have installed and configured PHP, Composer, Openlink Virtuoso and NodeJS on your machine or server.

#ELI_Import
The ELI Importer reads all **.docx** files present in `ELI_Importer/doc`, transforms the files into (x)HTML and annotates these with RDFa.  
The HTML+RDFA is then automatically converted into RDF+XML and stored in the Virtuoso triplestore.
All parameters are to be set in ELI_Importer/index.php

#ELI_Model
This folder contains all relevant information concerning the data model that was created for the purpose of this e-legislation pilot.

#ELI_Visualisation
Folder containing all the files (Virtuoso Server Pages, CSS and JavaScript) to generate the visualisation of the content of the graph containing legislation as linked open data.

## License

Copyright 2016 European Union  
Author: Jens Scheerlinck (PwC EU Services)  

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

