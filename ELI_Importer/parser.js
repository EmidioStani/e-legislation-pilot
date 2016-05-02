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
var host = 'http://openlaw.e-themis.gov.gr/eli/';
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
			var chapter_link;
			var chapterID;
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
			var full_title = $(paragraph).first().text();
			full_title = full_title.split(' - ');
			var title = full_title[0];
			if(full_title[1] != null){
				full_title = full_title[1].split(' ');
				var type_document = full_title[0];
				if(full_title[1] != null){
					full_title = full_title[1].split('/');
					var identifier = full_title[0];
					var year = full_title[1];
				}
			}
			//Setup the base ELI uri for this LegalResource
			var eli_base = host+type_document+"/"+identifier+"/"+year+"/";

			//Find the document date
			var date_document;
			$(paragraph).first().nextUntil(article).each(function(index, elem){
				if($(this).text().match(/\d{2}\/\d{2}\/\d{4}/)){
					$(this).addClass('document_date');
					date_document = $(this).text().match(/\d{2}\/\d{2}\/\d{4}/);
					date_document = date_document.toString().split('/');
					date_document = date_document[2]+"-"+date_document[1]+"-"+date_document[0];
					return false;
				}
			});

			//Find the description of the document between the title and the document datae
			$(paragraph).first().nextUntil('p[class="document_date"]').wrapAll('<div about="'+eli_base+'" property="eli:description">');

			//Add eli attributes to the act
			$(paragraph).first().wrap('<div about="'+eli_base+'" typeof="'+host+'vocabulary/act">');
			$('div[about="'+eli_base+'"]').append('<span about="'+eli_base+'" property="eli:title" content="'+title+'"/>' );
			$('div[about="'+eli_base+'"]').append('<span about="'+eli_base+'" property="eli:type_document" content="'+type_document+'"/>' );
			$('div[about="'+eli_base+'"]').append('<span about="'+eli_base+'" property="eli:local_id" content="'+identifier+'"/>' );
			$('div[about="'+eli_base+'"]').append('<span about="'+eli_base+'" property="eli:date_document" content="'+date_document+'" datatype="http://www.w3.org/2001/XMLSchema#date"/>' );
			
			/*=============*/
			/*Chapter level*/
			/*=============*/ 
			//Normalize Word structure (two H1s as siblings instead of <br/>)
			var chapter_text;
			for(i = 0; i < h1s; i++){
				if($(chapter).eq(i).next().is(chapter)){
					chapter_text = $(chapter).eq(i+1).text();
					$(chapter).eq(i).append("<br/>"+chapter_text);
					$(chapter).eq(i+1).remove();
				}
			}
			//Convert first H1 into H2 -> this is not a chapter but a description
			var text = $(chapter).first().text();
			$(chapter).first().wrap('<h2></h2>');
			$('h2').first().html(text);
			//Add eli:is_part_of attributes to link chapters to the act
			h1s = $(chapter).get().length;
			for(i = 0; i < h1s; i++){
				count = i + 1;
				$(chapter).eq(i).attr({
					id: 'chapter'+count,
					about: eli_base+'chapter_'+count,
					property: 'eli:title'
				});
				$(chapter).eq(i).wrap('<div about="'+eli_base+'chapter_'+count+'" property="eli:is_part_of" resource="'+eli_base+'" typeof="'+host+'vocabulary/chapter">');
				$('div[about="'+eli_base+'chapter_'+count+'"]').append('<span property="eli:date_document" content="'+date_document+'" datatype="http://www.w3.org/2001/XMLSchema#date"/>');
			}
			//Add eli:has_part attributes to establish the link between act and chapters
			$(chapter).each(function(index, elem){
				actID = $(this).parent().attr('resource');
				chapterID = $(this).parent().attr('about');
				$('div[about="'+actID+'"]').append('<span about="'+actID+'" property="eli:has_part" resource="'+chapterID+'"/>');
			});

			/*===============*/ 
			/* Article level */
			/*===============*/ 
			//Add eli:title attributes to the articles
			//Add eli:is_part_of attributes to link chapters to the act
			for(i = 0; i < h3s; i++){
				count = i + 1;
				$(article).eq(i).attr({
					class: 'article',
					id: eli_base+'article_'+count,
					property: 'eli:title'
				});
				chapter_link = $(article).eq(i).prevAll('div[resource="'+eli_base+'"]').first().attr('about');
				$(article).eq(i).wrap('<div about="'+eli_base+'article_'+count+'" property="eli:is_part_of" resource="'+chapter_link+'" typeof="'+host+'vocabulary/article">');
				$('div[about="'+eli_base+'article_'+count+'"]').append('<span property="eli:date_document" content="'+date_document+'" datatype="http://www.w3.org/2001/XMLSchema#date"/>');
			}
			//Add eli:has_part attributes to establish the link between chapters and articles
			$(article).each(function(index, elem){
				chapterID = $(this).parent().attr('resource');
				articleID = $(this).parent().attr('about');
				$('div[about="'+chapterID+'"]').append('<span about="'+chapterID+'" property="eli:has_part" resource="'+articleID+'"/>');
			});

			/*=================*/ 				
			/* Paragraph level */
			/*=================*/ 
			var j;
			var k;
			//Identify individual paragraphs and add eli:is_part_of attributes
			for(i = 0; i < h3s; i++){
				count = i+1;
				j = 0;
				$(article).eq(i).parent().nextUntil(article, paragraph).each(function(index, elem){
					//The following regex matches paragraph that start with either: Άρθρ.X, X. or «X. with X between 0-9
					if(/^[0-9][.].?|^[«][0-9].?|^(Άρθρ)[.][0-9].?|^(΄Αρθρ)[.][0-9].?/.test($(this).text()) == true){
						j++;
						$(this).attr({
							class: 'paragraph',
							about: eli_base+'article_'+count+'/paragraph_'+j,
							property: 'eli:is_part_of',
							resource: eli_base+'article_'+count
						});
					} else {
						paragraphID = $(this).prev().attr('about');
						$(this).attr('about', paragraphID)
					}
				});
				//Normalize Word structure (merge paragraphs)
				//$(article).eq(i).parent().nextUntil(article, paragraph).each(function(index, elem){
				//$(pagragraph+'[about="PARGRAPH1-1"]').wrapAll('<div about="PARAGRAPH1-1">');
			}	
			//Add eli:has_part attributes to establish the link between articles and paragraphs
			$(paragraph+'[class="paragraph"]').each(function(index, elem){
				articleID = $(this).attr('resource');
				paragraphID = $(this).attr('about');
				$('div[about="'+articleID+'"]').append('<span about="'+articleID+'" property="eli:has_part" resource="'+paragraphID+'"/>');
			});
			//Wrap paragraphs in div
			var paragraphCount;
			var pcount;
			for(i = 0; i < h3s; i++){
				count = i + 1;
				paragraphCount = $(article+'[id="'+eli_base+'article_'+count+'"]').siblings('span').get().length; 		
				for(j = 0; j < paragraphCount; j++){
					pcount = j + 1;
					$(paragraph+'[about="'+eli_base+'article_'+count+'/paragraph_'+j+'"]').wrapAll('<div about="'+eli_base+'article_'+count+'/paragraph_'+j+'" typeof="'+host+'vocabulary/paragraph">');
					$('div[about="'+eli_base+'article_'+count+'/paragraph_'+j+'"]').append('<span class="plink" property="eli:is_part_of" resource="'+eli_base+'article_'+count+'" />');
					$('div[about="'+eli_base+'article_'+count+'/paragraph_'+j+'"]').append('<span property="eli:date_document" content="'+date_document+'"  datatype="http://www.w3.org/2001/XMLSchema#date"/>');
				}
			}
			//Strip all attributes from paragraphs (already declared on divs)
			$(paragraph).removeAttr('class');
			$(paragraph).removeAttr('about');
			$('span[class="plink"]').siblings(paragraph).removeAttr('property');
			$(paragraph).removeAttr('resource');
			$('span[class="plink"]').each(function(index, eleml){
				$(this).siblings(paragraph).wrapAll('<div property="eli:description"></div>');
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