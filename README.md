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
* Jenkins v1.651.2
* jQuery v1.11.0
* jQuery UI v1.11.4
* JS-Cookie v2.1.2

## How to use

To get started, clone this repository or download the repository as a .zip file.
We used Jenkins to deploy the code to our PoC server, using the following shell execution script:
```
rm -rf /var/lib/virtuoso/vsp/legislation-pilot/*
rm -rf /var/www/eli-importer/*
cp ELI_Visualisation/* -R /var/lib/virtuoso/vsp/legislation-pilot
cp ELI_Model -R /var/lib/virtuoso/vsp/legislation-pilot/documentation
cp ELI_Importer/* -R /var/www/eli-importer
```

In your Virtuoso Conductor, create a Virtual Directory named `legislation-pilot`
Subsequently, create the following URL Rewriting Rules for your Virtual Domain, these will integrate the ELI URI structure.

Source pattern | Destination | Rule matching 
--- | --- | ---
/legislation-pilot/(.*)\/(.*)\/(.*)\/?$ | /legislation-pilot/display.vsp?type=$U1&level=act&id=$U2&year=$U3 | Last matching
/legislation-pilot/(.*)\/(.*)\/(.*)\/(chapter_[0-9]*)\/?$ | /legislation-pilot/display.vsp?type=$U1&level=chapter&id=$U2&year=$U3&ref=$U4 | Last matching
/legislation-pilot/(.*)\/(.*)\/(.*)\/(article_[0-9]*)\/?$ | /legislation-pilot/display.vsp?type=$U1&level=article&id=$U2&year=$U3&ref=$U4 | Last matching
/legislation-pilot/(.*)\/(.*)\/(.*)\/(article_[0-9]*)\/(paragraph_[0-9]*)\/?$ | /legislation-pilot/display.vsp?type=$U1&level=article&id=$U2&year=$U3&ref=$U4&par=$U5 | Last matching
/legislation-pilot/documentation/(.*)$ | /legislation-pilot/documentation/$U1 | Last matching
/legislation-pilot/vocabulary\/?$ | /legislation-pilot/vocabulary.html | Last matching

###ELI_Import
The ELI Importer reads all **.docx** files present in `ELI_Importer/doc`, transforms the files into (x)HTML and annotates these with RDFa.  
The HTML+RDFA is then automatically converted into RDF+XML and stored in the Virtuoso triplestore.
All parameters are to be set in ELI_Importer/index.php

Detailed documentation on the ELI importer can be found here: [http://52.50.205.146:8890/eli-importer/documentation/](http://52.50.205.146:8890/eli-importer/documentation/)

###ELI_Model
This folder contains all relevant information concerning the data model that was created for the purpose of this e-legislation pilot.

Detailed documentation on the model is hosted here: [http://52.50.205.146/legislation-pilot/documentation/index.html](http://52.50.205.146/legislation-pilot/documentation/index.html)

###ELI_Visualisation
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

