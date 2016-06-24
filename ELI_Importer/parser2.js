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
    ['law', 'p:first-of-type'],
    ['part', ''],
    ['chapter', 'h1'],
    ['article', 'h3'],
    ['paragraph', 'p']
];

var args = process.argv.slice(2);
var filePath = args[0];
var outputPath = args[1];
var host = args[2];
var available = args[3];
var subjectDivision;
//Identify all subject division, range: from element 4 of array up until last element of array
for (i = 4; i < args.length; i += 1) {
    subjectDivision += '<span property="law:has_subject_division" resource="'+args[i]+'"></span>';
}
//var filePath = 'html';
//var outputPath = 'rdfa';
//var host = 'http://localhost:8890/e-legislation';
if (host.slice(-1) !== '/') {
    host = host + '/';
}
var input = fs.readdirSync(filePath);
var html;

var chapter = 'h1';
var article = 'h3';
var paragraph = 'p';


/******************************/
/***CREATE HTML + RDFa*********/
/******************************/

input.forEach(function (fileName) {
	/*==================*/
	/*LOAD DOM STRUCTURE*/
	/*==================*/
	html = fs.readFileSync(filePath + '/' + fileName);
    $ = cheerio.load(html, {
		normalizeWhitespace: true
	});
    extendCheerio($);
    //Define variables
    var count,
        actID,
        articleID,
        paragraphID,
        h1s,
        h3s,
        first_text,
        type_document,
        identifier,
        date_document,
        day,
        month,
        year,
        eli_base,
        text,
        number,
        i,
        j,
        k,
        paragraphCount,
        pcount,
        link,
        output,
        wrap_base,
        article_number,
        paragraph_attributes,
        wrap_paragraph,
        paragraph_append,
        seen,
        article_next,
        article_prepend;

    seen = {};
	h1s = $(chapter).get().length;
	h3s = $(article).get().length;

	//Add namespaces to document
    $('body').contents().wrapAll('<div prefix="eli: http://data.europa.eu/eli/ontology# dct: http://purl.org/dc/terms/ law: http://openlaw.e-themis.gov.gr/eli/vocabulary#">');

    /*=========*/
	/*Act level*/
	/*=========*/
	//Deconstruct first paragraph into title, type of document, identifier and year
    first_text = $(paragraph).first().text();
	type_document = first_text.split(' '); //Take first word of sentence as type of document
	identifier = first_text.match(/[0-9]{4}\/[0-9]{4}/); //In format ID/YEAR
	date_document = first_text.match(/[0-9]{1,2}[.][0-9]{1,2}[.][0-9]{4}/);
	date_document = date_document[0].split('.');

	year = date_document[2];
	if (date_document[0].length === 1) {
		day = '0' + date_document[0];
	} else {
		day = date_document[0];
	}
	if (date_document[1].length === 1) {
        month = '0' + date_document[1];
	} else {
		month = date_document[1];
	}
	date_document = year + "-" + month + "-" + day;

	//Setup the base ELI uri for this LegalResource
	eli_base = host + type_document[0] + "/" + identifier;

	//Wrap first paragraph and add eli attributes
	$(paragraph).first().attr('property', 'eli:title');
    wrap_base = $('<div about="' + eli_base + '" typeof="' + host + 'vocabulary#amendment"></div>');
	$(paragraph).first().wrap(wrap_base);
    paragraph_attributes = '<span property="eli:type_document" content="' + type_document[0] + '"></span>';
	paragraph_attributes += '<span property="eli:date_document" content="' + date_document + '" datatype="http://www.w3.org/2001/XMLSchema#date"></span>';
	paragraph_attributes += '<span property="eli:id_local" content="' + identifier + '"></span>';
	paragraph_attributes += '<span property="eli:publisher" content="http://www.et.gr/"></span>';
	paragraph_attributes += '<span property="eli:language" content="http://publications.europa.eu/resource/authority/language/ELL"></span>';
    paragraph_attributes += '<span property="dct:available" content="' + available + '" datatype="http://www.w3.org/2001/XMLSchema#date"></span>';
    wrap_base.append(paragraph_attributes);
    wrap_base.append(subjectDivision);

	/*===============*/
	/* Article level */
    /*===============*/
	//Identify articles with regex
	$(paragraph).each(function (index, elem) {
		text = $(this).text();
		if (text.match(/Αρθρο [0-9]/)) {
			$(this).wrap('<h3></h3>');
			$(this).parent().html(text);
		}
	});

	//Loop through articles
	h3s = $(article).get().length;
    article_prepend = '<span property="eli:publisher" content="http://www.et.gr/"></span>';
    article_prepend += '<span property="eli:date_document" content="' + date_document + '" datatype="http://www.w3.org/2001/XMLSchema#date"></span>';
    
	for (i = 0; i < h3s; i += 1) {
        article_number = $(article).eq(i);
		number = article_number.text().match(/[0-9]+/);
		article_number.nextUntil(article).wrapAll('<div about="' + eli_base + '/article_' + number + '" typeof="' + host + 'vocabulary#article"></div>');
		article_number.next().children().first().attr({
			property: 'dct:title'
		});
		article_number.next('div').prepend(article_prepend);
		article_number.next('div').prepend('<span property="eli:id_local" content="' + i + '" datatype="http://www.w3.org/2001/XMLSchema#integer"></span>');
		wrap_base.append('<span property="eli:has_part" resource="' + eli_base + '/article_' + number + '"></span>');
	}

	/*=================*/
	/* Paragraph level */
	/*=================*/
	//Identify individual paragraphs and add eli attributes
    function setParagraphAttributes(index, element) {
        //Determine article number
        number = $(this).parent().attr('about').match(/[0-9]+$/);
        number = number[0];
        //The following regex matches paragraph that start with either: Άρθρ.X, X. or «X. with X between 0-9
        if (/^ *[0-9]+[.]/.test($(this).text()) === true) {
            j += 1;
            $(this).attr({
                class: 'paragraph',
                about: eli_base + '/article_' + number + '/paragraph_' + j
            });
        } else {
            paragraphID = $(this).prev().attr('about');
            $(this).attr('about', paragraphID);
        }
    }
	for (i = 0; i < h3s; i += 1) {
		count = i + 1;
		j = 0;

		$(article).eq(i).next('div').children(paragraph).each(setParagraphAttributes);
	}
	//Add eli:has_part attributes to establish the link between articles and paragraphs
	$(paragraph + '[class="paragraph"]').each(function (index, elem) {
		articleID = $(this).parent().attr('about');
		paragraphID = $(this).attr('about');
		$('div[about="' + articleID + '"]').prepend('<span about="' + articleID + '" property="eli:has_part" resource="' + paragraphID + '"/>');
	});

	//Wrap paragraphs in div
    paragraph_append = '<span property="eli:date_document" content="' + date_document + '"  datatype="http://www.w3.org/2001/XMLSchema#date"></span>';
    paragraph_append += '<span property="eli:publisher" content="http://www.et.gr/"></span>';
	for (i = 0; i < h3s; i += 1) {
        article_next = $(article).eq(i).next('div');
		number = article_next.attr('about').match(/[0-9]+$/);
		number = number[0];
		paragraphCount = article_next.children('span[property="eli:has_part"]').get().length + 1;
		for (j = 0; j < paragraphCount; j += 1) {
			pcount = j + 1;
            wrap_paragraph = $('<div about="' + eli_base + '/article_' + number + '/paragraph_' + j + '" typeof="' + host + 'vocabulary#paragraph">');
			$(paragraph + '[about="' + eli_base + '/article_' + number + '/paragraph_' + j + '"]').wrapAll(wrap_paragraph);
			$('div[about="'+ eli_base + '/article_' + number + '/paragraph_' + j +'"]').append(paragraph_append);
			$('div[about="'+ eli_base + '/article_' + number + '/paragraph_' + j +'"]').append('<span property="eli:id_local" content="' + j + '" datatype="http://www.w3.org/2001/XMLSchema#integer"></span>');
		}
	}
    //Strip all attributes from paragraphs (already declared on divs)
	$(paragraph).removeAttr('class');
	$(paragraph).removeAttr('about');
	$('div[typeof="' + host + 'vocabulary#paragraph"]').children(paragraph).removeAttr('property');
	$(paragraph).removeAttr('resource');
	$('div[typeof="' + host + 'vocabulary#paragraph"]').each(function (index, eleml) {
		$(this).children(paragraph).wrapAll('<div property="eli:description"></div>');
	});

	/*========================*/
	/* eli:changes attributes */
	/*========================*/
	//Add changes elements
	$('div[property="eli:description"]').each(function () {
		link = $(this).children(paragraph).first().text();
		actID = link.match(/[0-9]{4}\/[0-9]{4}/);
		if (actID) { //If a reference is made to another piece of legislation
			actID = actID[0];
			articleID = link.match(/άρθρο +[0-9]+|άρθρου +[0-9]+/);
			if (articleID) { //If granularity of article is defined
				articleID = articleID[0].match(/[0-9]+$/);
				paragraphID = link.match(/παράγραφος +[0-9]+|παράγραφοι +[0-9]+/);
				if (paragraphID) { //If granularity of paragraph is defined
					paragraphID = paragraphID[0].match(/[0-9]+$/);
					//This is the type_doc of the amendment! Type doc in the change is different from the type doc in the consolidated version
					$(this).before('<span property="eli:changes" resource="' + host + type_document[0] + '/' + actID + '/article_' + articleID + '/paragraph_' + paragraphID + '"></span>');
					$(this).parents('div[typeof="'+ host +'vocabulary#article"]').prepend('<span property="eli:changes" resource="' + host + type_document[0] + '/' + actID + '/article_' + articleID + '"></span>')
					$('div[typeof="'+ host +'vocabulary#amendment"]').prepend('<span property="eli:changes" resource="' + host + type_document[0] + '/' + actID + '"></span>')
				} else {
					$(this).before('<span property="eli:changes" resource="' + host + type_document[0] + '/' + actID + '/article_' + articleID + '"></span>');
					$('div[typeof="'+ host +'vocabulary#amendment"]').prepend('<span property="eli:changes" resource="' + host + type_document[0] + '/' + actID + '"></span>')
				}
			} else {
				$(this).before('<span property="eli:changes" resource="' + host + type_document[0] + '/' + actID + '"></span>');
			}
		}
	});
	//Remove any duplicate changes elements
	$('span[property="eli:changes"]').each(function() {
	    var txt = $(this).attr("resource");
	    if (seen[txt]) {
	        $(this).remove();
	    } else {
	        seen[txt] = true;
	    }
	});
	/*=================*/
	/* GENERATE OUTPUT */
	/*=================*/
    //Save the file
	output = fileName.split('.');
	fs.writeFile(outputPath + "/" + output[0] + ".html", unescape($.html()), function (err) {
        if (err) {
			return console.log(err);
        }
		console.log("The file was saved!");
	});
});