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
//var args = process.argv.slice(2);
//var filePath = args[0];
//var outputPath = args[1];
//var host = args[2];
var filePath = 'html';
var outputPath = 'rdfa';
var host = 'http://localhost:8890/e-legislation';
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
        chapter_link,
        chapterID,
        articleID,
        paragraphID,
        h1s,
        h3s,
        full_title,
        title,
        type_document,
        identifier,
        year,
        eli_base,
        date_document,
        chapter_text,
        i,
        text,
        actID,
        j,
        k,
        paragraphCount,
        pcount,
        output,
        wrap_base,
        paragraph_attributes,
        wrap_chapter,
        chapter_attributes,
        article_parent,
        paragraph_wrap,
        paragraph_attr,
        paragraphs,
        this_paragraph,
        article_wrap,
        article_attributes,
        this_parent,
        article_number,
        chapter_number,
        eli_count;

	h1s = $(chapter).get().length;
	h3s = $(article).get().length;

	//Add namespaces to document
    $('body').contents().wrapAll('<div prefix="eli: http://data.europa.eu/eli/ontology# dct: http://purl.org/dc/terms/ law: http://openlaw.e-themis.gov.gr/eli/vocabulary#">');

	/*=========*/
	/*Act level*/
	/*=========*/
	//Deconstruct first paragraph into title, type of document, identifier and year
	full_title = $(paragraph).first().text();
	full_title = full_title.split(' - ');
	title = full_title[0];
	if (full_title[1] !== null) {
		full_title = full_title[1].split(' ');
		type_document = full_title[0];
		if (full_title[1] !== null) {
			full_title = full_title[1].split('/');
			identifier = full_title[0];
			year = full_title[1];
		}
	}
	//Setup the base ELI uri for this LegalResource
	eli_base = host + type_document + "/" + identifier + "/" + year;

	//Find the document date
	$(paragraph).first().nextUntil(article).each(function (index, elem) {
		if ($(this).text().match(/\d{2}\/\d{2}\/\d{4}/)) {
			$(this).addClass('document_date');
			date_document = $(this).text().match(/\d{2}\/\d{2}\/\d{4}/);
			date_document = date_document.toString().split('/');
			date_document = date_document[2] + "-" + date_document[1] + "-" + date_document[0];
			return false;
		}
	});

	//Find the description of the document between the title and the document datae
	$(paragraph).first().nextUntil('p[class="document_date"]').wrapAll('<div about="' + eli_base + '" property="eli:description">');

	//Add eli attributes to the act
    wrap_base = $('<div about="' + eli_base + '" typeof="' + host + 'vocabulary#act">');
	$(paragraph).first().wrap(wrap_base);

    paragraph_attributes = '<span property="eli:title" content="' + title + '"></span>';
	paragraph_attributes += '<span property="eli:type_document" content="' + type_document + '"></span>';
	paragraph_attributes += '<span property="eli:id_local" content="' + identifier + '"></span>';
	paragraph_attributes += '<span property="eli:publisher" content="http://www.et.gr/"></span>';
	paragraph_attributes += '<span property="eli:language" content="http://publications.europa.eu/resource/authority/language/ELL"></span>';
	paragraph_attributes += '<span property="law:has_subject_division" resource="http://openlaw.e-themis.gov.gr/eli/vocabulary#Civil_law"></span>';
	paragraph_attributes += '<span property="eli:date_document" content="' + date_document + '" datatype="http://www.w3.org/2001/XMLSchema#date"></span>';
    wrap_base.append(paragraph_attributes);

	/*=============*/
	/*Chapter level*/
	/*=============*/
	//Normalize Word structure (two H1s as siblings instead of <br/>)
	for (i = 0; i < h1s; i += 1) {
		if ($(chapter).eq(i).next().is(chapter)) {
			chapter_text = $(chapter).eq(i + 1).text();
			$(chapter).eq(i).append("<br/>" + chapter_text);
			$(chapter).eq(i + 1).remove();
		}
	}
	//Convert first H1 into H2 -> this is not a chapter but a description
	text = $(chapter).first().text();
	$(chapter).first().wrap('<h2></h2>');
	$('h2').first().html(text);
	//Add eli:is_part_of attributes to link chapters to the act
	h1s = $(chapter).get().length;
    chapter_attributes = '<span property="eli:date_document" content="' + date_document + '" datatype="http://www.w3.org/2001/XMLSchema#date"></span>';
    chapter_attributes += '<span property="eli:publisher" content="http://www.et.gr/"></span>';
	for (i = 0; i < h1s; i += 1) {
		count = i + 1;
        chapter_number = $(chapter).eq(i);
		chapter_number.attr({
			id: 'chapter' + count,
			about: eli_base + '/chapter_' + count,
			property: 'dct:title'
		});

        wrap_chapter = $('<div about="' + eli_base + '/chapter_' + count + '" property="eli:is_part_of" resource="' + eli_base + '" typeof="' + host + 'vocabulary#chapter">');
        chapter_number.wrap(wrap_chapter);
        wrap_chapter.append(chapter_attributes);
	}

    //Add eli:has_part attributes to establish the link between act and chapters
	$(chapter).each(function (index, elem) {
        this_parent = $(this).parent();
		actID = this_parent.attr('resource');
		chapterID = this_parent.attr('about');
		$('div[about="' + actID + '"]').first().append('<span about="' + actID + '" property="eli:has_part" resource="' + chapterID + '"></span>');
	});

	/*===============*/
	/* Article level */
	/*===============*/
	//Add eli:title attributes to the articles
	//Add eli:is_part_of attributes to link chapters to the act
    article_attributes = '<span property="eli:date_document" content="' + date_document + '" datatype="http://www.w3.org/2001/XMLSchema#date"></span>';
    article_attributes += '<span property="eli:publisher" content="http://www.et.gr/"></span>';
	for (i = 0; i < h3s; i += 1) {
		count = i + 1;
        article_number = $(article).eq(i);
		article_number.attr({
            class: 'article',
            id: eli_base + '/article_' + count,
            property: 'dct:title'
		});

        chapter_link = article_number.prevAll('div[resource="' + eli_base + '"]').first().attr('about');
        article_wrap = $('<div about="' + eli_base + '/article_' + count + '" property="eli:is_part_of" resource="' + chapter_link + '" typeof="' + host + 'vocabulary#article">');
        article_number.wrap(article_wrap);
        article_wrap.append(article_attributes);
	}

    //Add eli:has_part attributes to establish the link between chapters and articles
	$(article).each(function (index, elem) {
        article_parent = $(this).parent();
        chapterID = article_parent.attr('resource');
        articleID = article_parent.attr('about');
        $('div[about="' + chapterID + '"]').append('<span property="eli:has_part" resource="' + articleID + '"></span>');
	});

	/*=================*/
	/* Paragraph level */
    /*=================*/
    function setParagraphAttributes(index, elem) {
        //The following regex matches paragraph that start with either: Άρθρ.X, X. or «X. with X between 0-9
        if (/^[0-9][.].?|^[«][0-9].?|^(Άρθρ)[.][0-9].?|^(΄Αρθρ)[.][0-9].?/.test($(this).text()) === true) {
            j += 1;
            //console.log('/article_' + count + '/paragraph_' + j);
            $(this).attr({
                class: 'paragraph',
                about: eli_base + '/article_' + count + '/paragraph_' + j,
                property: 'eli:is_part_of',
                resource: eli_base + '/article_' + count
            });
        } else {
            paragraphID = $(this).prev().attr('about');
            $(this).attr('about', paragraphID);
        }
	}
    //Identify individual paragraphs and add eli:is_part_of attributes
	for (i = 0; i < h3s; i += 1) {
		count = i + 1;
		j = 0;
        $(article).eq(i).parent().nextUntil(article, paragraph).each(setParagraphAttributes);

        //Normalize Word structure (merge paragraphs)
		//$(article).eq(i).parent().nextUntil(article, paragraph).each(function(index, elem){
		//$(pagragraph+'[about="PARGRAPH1-1"]').wrapAll('<div about="PARAGRAPH1-1">');
	}

    //Add eli:has_part attributes to establish the link between articles and paragraphs
	$(paragraph + '[class="paragraph"]').each(function (index, elem) {
        this_paragraph = $(this);
        articleID = this_paragraph.attr('resource');
		paragraphID = this_paragraph.attr('about');
		$('div[about="' + articleID + '"]').append('<span property="eli:has_part" resource="' + paragraphID + '"></span>');
	});

    //Wrap paragraphs in div
	for (i = 0; i < h3s; i += 1) {
		count = i + 1;
        eli_count = eli_base + '/article_' + count;
		paragraphCount = $(article + '[id="' + eli_count + '"]').siblings('span').get().length;

        paragraph_attr = '<span class="plink" property="eli:is_part_of" resource="' + eli_count + '"></span>';
        paragraph_attr += '<span property="eli:date_document" content="' + date_document + '"  datatype="http://www.w3.org/2001/XMLSchema#date"></span>';
        paragraph_attr += '<span property="eli:publisher" content="http://www.et.gr/"></span>';
		for (j = 0; j < paragraphCount; j += 1) {
			pcount = j + 1;
            paragraph_wrap = $('<div about="' + eli_count + '/paragraph_' + j + '" typeof="' + host + 'vocabulary#paragraph">');
			$(paragraph + '[about="' + eli_count + '/paragraph_' + j + '"]').wrapAll(paragraph_wrap);
			paragraph_wrap.append(paragraph_attr);
		}

	}

    //Strip all attributes from paragraphs (already declared on divs)
    paragraphs = $(paragraph);
	paragraphs.removeAttr('class');
	paragraphs.removeAttr('about');
	paragraphs.removeAttr('property');
	paragraphs.removeAttr('resource');
	$('span[class="plink"]').each(function (index, eleml) {
		$(this).siblings(paragraph).wrapAll('<div property="eli:description"></div>');
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