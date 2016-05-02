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

var fs = require('fs');
var mammoth = require('mammoth');
var cheerio = require('cheerio');
var extendCheerio = require('./wrapAll.js');

/******************************/
/***DEFINE VARIABLES***********/
/******************************/
//Identify level of granularity: <name of component>, <identifier for component>
var elem = [
	['law','p:first-of-type'],
	['part',''],
	['chapter','h1'],
	['article','h3'],
	['paragraph','p']
];

//var filePath = process.argv.slice(2);
//var outputPath = process.argv.slice(3);
var filePath = 'html';
var outputPath = 'rdfa';
var host = 'http://84.205.254.61:8890/eli/';
var input = fs.readdirSync(filePath);
var html;

var chapter = 'h1';
var article = 'h3';
var paragraph = 'p';


/******************************/
/***CREATE HTML + RDFa*********/
/******************************/

input.forEach(function(fileName){
			/*==================*/
			/*LOAD DOM STRUCTURE*/
			/*==================*/ 
		html = fs.readFileSync(filePath+'/'+fileName);
        $ = cheerio.load(html, {
			normalizeWhitespace: true
			});
       		extendCheerio($);
       		//Define variables
       		var count;
       		var actID;
			var articleID;
			var paragraphID;

			var h1s = $(chapter).get().length;
			var h3s = $(article).get().length;

			//Add namespaces to document
			$('body').contents().wrapAll('<div prefix="eli: http://data.europa.eu/eli/ontology#">');

			/*=========*/
			/*Act level*/
			/*=========*/ 
			//Deconstruct first paragraph into title, type of document, identifier and year
			var type_document = $(paragraph).first().text().split(' '); //Take first word of sentence as type of document
			var identifier = $(paragraph).first().text().match(/[0-9]{4}\/[0-9]{4}/); //In format ID/YEAR
			var date_document = $(paragraph).first().text().match(/[0-9]{1,2}[.][0-9]{1,2}[.][0-9]{4}/);
			date_document = date_document[0].split('.');
			var day;
			var month;
			var year = date_document[2];
			if(date_document[0].length == 1){
				day = '0'+date_document[0];
			} else { 
				day = date_document[0]; 
			}
			if(date_document[1].length == 1){
				month = '0'+date_document[1];
			} else { 
				month = date_document[1]; 
			}
			date_document = year+"-"+month+"-"+day;

			//Setup the base ELI uri for this LegalResource
			var eli_base = host+type_document[0]+"/"+identifier;

			//Wrap first paragraph and add eli attributes
			$(paragraph).first().attr('property', 'eli:title');	
			$(paragraph).first().wrap('<div about="'+eli_base+'"></div>')
			$('div[about="'+eli_base+'"]').append('<span property="eli:date_document" content="'+date_document+'" datatype="http://www.w3.org/2001/XMLSchema#date"/>' );	

			/*===============*/ 
			/* Article level */
			/*===============*/ 
			//Identify articles with regex
			var text;
			$(paragraph).each(function(index, elem){
				text = $(this).text();
				if(text.match(/Αρθρο [0-9]/)){
					$(this).wrap('<h3></h3>');
					$(this).parent().html(text);
				}
			});

			//Loop through articles
			var h3s = $(article).get().length;
			var number;

			for(i = 0; i < h3s; i++){
				number = $(article).eq(i).text().match(/[0-9]+/);
				$(article).eq(i).nextUntil(article).wrapAll('<div about="'+eli_base+'/article_'+number+'" typeof="'+host+'vocabulary/article"></div>');
				$(article).eq(i).next().children().first().attr({
					property: 'eli:title'
				});
				$(article).eq(i).next('div').prepend('<span property="eli:is_part_of" resource="'+eli_base+'"/>');
			}

			/*=================*/ 				
			/* Paragraph level */
			/*=================*/ 
			var j;
			var k;
			//Identify individual paragraphs and add eli:is_part_of attributes
			for(i = 0; i < h3s; i++){
				count = i+1;
				j = 0;
				$(article).eq(i).next('div').children(paragraph).each(function(index, elem){
					//Determine article number
					number = $(this).parent().attr('about').match(/[0-9]+$/);
					number = number[0];
					//The following regex matches paragraph that start with either: Άρθρ.X, X. or «X. with X between 0-9
					if(/^ *[0-9]+[.]/.test($(this).text()) == true){
						j++;
						$(this).attr({
							class: 'paragraph',
							about: eli_base+'/article_'+number+'/paragraph_'+j,
							property: 'eli:is_part_of',
							resource: eli_base+'/article_'+number
						});
					} else {
						paragraphID = $(this).prev().attr('about');
						$(this).attr('about', paragraphID)
					}
				});
			}
			//Add eli:has_part attributes to establish the link between articles and paragraphs
			$(paragraph+'[class="paragraph"]').each(function(index, elem){
				articleID = $(this).attr('resource');
				paragraphID = $(this).attr('about');
				$('div[about="'+articleID+'"]').prepend('<span about="'+articleID+'" property="eli:has_part" resource="'+paragraphID+'"/>');
			});
			//Wrap paragraphs in div
			var paragraphCount;
			var pcount;
			for(i = 0; i < h3s; i++){
				number = $(article).eq(i).next('div').attr('about').match(/[0-9]+$/);
				number = number[0];
				paragraphCount = $(article).eq(i).next('div').children('span[property="eli:has_part"]').get().length +1; 		
				for(j = 0; j < paragraphCount; j++){
					pcount = j + 1;
					$(paragraph+'[about="'+eli_base+'/article_'+number+'/paragraph_'+j+'"]').wrapAll('<div about="'+eli_base+'/article_'+number+'/paragraph_'+j+'" property="eli:is_part_of" resource="'+eli_base+'/article_'+number+'" typeof="'+host+'vocabulary/paragraph">');
					$('div[about="'+eli_base+'/article_'+number+'/paragraph_'+j+'"]').append('<span property="eli:date_document" content="'+date_document+'"  datatype="http://www.w3.org/2001/XMLSchema#date"/>');
				}
			}
			//Strip all attributes from paragraphs (already declared on divs)
			$(paragraph).removeAttr('class');
			$(paragraph).removeAttr('about');
			$('div[property="eli:is_part_of"]').children(paragraph).removeAttr('property');
			$(paragraph).removeAttr('resource');
			$('div[property="eli:is_part_of"]').each(function(index, eleml){
				$(this).children(paragraph).wrapAll('<div property="eli:description"></div>');
			});

			/*========================*/ 				
			/* eli:changes attributes */
			/*========================*/
			var link; 
			$('div[property="eli:description"]').each(function(){
				link = $(this).children(paragraph).first().text();
				actID = link.match(/[0-9]{4}\/[0-9]{4}/);
				if(actID){ //If a reference is made to another piece of legislation
					actID = actID[0];
					articleID = link.match(/άρθρο +[0-9]+|άρθρου +[0-9]+/);
					if(articleID){ //If granularity of paragraph is defined
						articleID = articleID[0].match(/[0-9]+$/);
						paragraphID = link.match(/παράγραφος +[0-9]+|παράγραφοι +[0-9]+/);
						if(paragraphID){ //If granularity of paragraph is defined
							paragraphID = paragraphID[0].match(/[0-9]+$/);
							//This is the type_doc of the amendment! Type doc in the change is different from the type doc in the consolidated version
							$(this).before('<span property="eli:changes" resource="'+host+type_document[0]+'/'+actID+'/article_'+articleID+'/paragraph_'+paragraphID+'" />');
						} else {
							$(this).before('<span property="eli:changes" resource="'+host+type_document[0]+'/'+actID+'/article_'+articleID+'" />');
						}
					} else {
						$(this).before('<span property="eli:changes" resource="'+host+type_document[0]+'/'+actID+'" />');
					}
				}
			});


			/*=================*/ 				
			/* GENERATE OUTPUT */
			/*=================*/ 
			//Save the file
			var output = fileName.split('.');
			fs.writeFile(outputPath+"/"+output[0]+".html", unescape($.html()), function(err) {
			    if(err) {
			        return console.log(err);
			    }
			    console.log("The file was saved!");
			}); 
});