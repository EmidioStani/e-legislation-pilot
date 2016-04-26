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

//var filePath = process.argv.slice(2);
//var outputPath = process.argv.slice(3);
var filePath = 'html';
var outputPath = 'rdfa';
var input = fs.readdirSync(filePath);
var output = '';
var html = '';

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
			//Add namespaces to document
			$('body').contents().wrapAll('<div xmlns:eli="http://data.europa.eu/eli/ontology#">');

			/*=========*/
			/*Act level*/
			/*=========*/ 
			//Add eli:title attribute to the act
			$(paragraph).first().attr({
				property: 'eli:title'
			});
			$(paragraph).first().wrap('<div about="THE ACT">');
			
			/*=============*/
			/*Chapter level*/
			/*=============*/ 
			//Normalize Word structure (two H1s as siblings instead of <br/>)
			var h1s = $(chapter).get().length;
			var chapter_text;
			for(i = 0; i < h1s; i++){
				if($(chapter).eq(i).next().is(chapter)){
					chapter_text = $(chapter).eq(i+1).text();
					$(chapter).eq(i).append("<br/>"+chapter_text);
					$(chapter).eq(i+1).remove();
				}
			}
			//Add eli:is_part_of attributes to link chapters to the act
			h1s = $(chapter).get().length;
			for(i = 0; i < h1s; i++){
				count = i + 1;
				$(chapter).eq(i).attr({
					id: 'chapter'+count,
					about: 'CHAPTER'+count,
					property: 'eli:title'
				});
				act_link = 'THE ACT';
				$(chapter).eq(i).wrap('<div about="CHAPTER'+count+'" property="eli:is_part_of" resource="'+act_link+'">');
			}

			/*===============*/ 
			/* Article level */
			/*===============*/ 
			//Add eli:title attributes to the articles
			//Add eli:is_part_of attributes to link chapters to the act
			var h3s = $(article).get().length;
			for(i = 0; i < h3s; i++){
				count = i + 1;
				$(article).eq(i).attr({
					class: 'article',
					id: 'article'+count,
					property: 'eli:title'
				});
				chapter_link = $(article).eq(i).prevAll('div[resource="THE ACT"]').first().attr('about');
				$(article).eq(i).wrap('<div about="ARTICLE'+count+'" property="eli:is_part_of" resource="'+chapter_link+'">');
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
					if(/^[0-9][.].?|^[«][0-9].?|^(Άρθρ)[.][0-9].?/.test($(this).text()) == true){
						j++;
						$(this).attr({
							class: 'paragraph',
							about: 'PARAGRAPH'+count+'-'+j,
							property: 'eli:is_part_of',
							resource: 'ARTICLE'+count
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
			for(i = 1; i <= h3s; i++){
				paragraphCount = $(article).eq(i).siblings('span').get().length;
				for(j = 1; j <= paragraphCount; j++){
					$(paragraph+'[about="PARAGRAPH'+i+'-'+j+'"]').wrapAll('<div about="PARAGRAPH'+i+'-'+j+'" property="eli:is_part_of" resource="ARTICLE'+i+'">');
				}
			}
			//Strip all attributes from paragraphs (already declared on divs)
			$(paragraph).removeAttr('class');
			$(paragraph).removeAttr('about');
			$(paragraph).removeAttr('property');
			$(paragraph).removeAttr('resource');

			/*=================*/ 				
			/* GENERATE OUTPUT */
			/*=================*/ 
			//Save the file
			output = fileName.split('.');
			fs.writeFile(outputPath+"/"+output[0]+".html", unescape($.html()), function(err) {
			    if(err) {
			        return console.log(err);
			    }
			    console.log("The file was saved!");
			}); 
});