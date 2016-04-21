/******************************/
/***LOAD MODULES***************/
/******************************/

var fs = require('fs');
var mammoth = require('mammoth');
var cheerio = require('cheerio');
var extendCheerio = require('./wrapAll.js')

/******************************/
/***DEFINE VARIABLES***********/
/******************************/

var filePath = 'doc';
var outputPath = 'html';
var input = fs.readdirSync(filePath);
var output = '';

var chapter = 'h1';
var article = 'h3';
var paragraph = 'p';


/******************************/
/***CREATE HTML + RDFa*********/
/******************************/

input.forEach(function(fileName){
	mammoth.convertToHtml({path: filePath+"/"+fileName})
	    .then(function(result){
	        var html = result.value; // The generated HTML
	        html = '<html><head></head><body>'+html+'</body></html>';
	        var messages = result.messages; // Any messages, such as warnings during conversion

	        $ = cheerio.load(html, {
				normalizeWhitespace: true
				});
        		extendCheerio($);

        		//Define variables
        		var count;
				var chapter_link;

				//Add namespaces to document

				$('body').contents().wrapAll('<div xmlns:eli="http://data.europa.eu/eli/ontology#">');

				//Add RDFa attributes

				/* Legislation level */

				$(paragraph).first().attr({
					about: 'THE ACT',
					property: 'eli:title'
				});

				/* Chapter level */

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

				h1s = $(chapter).get().length;
				for(i = 0; i < h1s; i++){
					count = i + 1;
					$(chapter).eq(i).attr({
						id: 'chapter'+count,
						about: 'CHAPTER'+count,
						property: 'eli:is_part_of',
						resource: 'THE ACT'
					});
				}

				/* Article level */

				var h3s = $(article).get().length;
				for(i = 0; i < h3s; i++){
					count = i + 1;
					$(article).eq(i).attr({
						id: 'article'+count,
						about: 'ARTICLE'+count,
						property: 'eli:title'
					});
					chapter_link = $(article).eq(i).prevAll(chapter).first().attr('id');
					$(article).eq(i).wrap('<div about="ARTICLE'+count+'" property="eli:is_part_of" resource="'+chapter_link+'">')
				}

				var articlesInChapter;
				for(i = 0; i < h1s; i++){
					count = i + 1;
					articlesInChapter = $(chapter).eq(i).nextUntil(chapter, 'div[property="eli:is_part_of"]');									
				}
					
				/* Paragraph level */

				//Save the file
				output = fileName.split('.');
				fs.writeFile(outputPath+"/"+output[0]+".html", unescape($.html()), function(err) {
				    if(err) {
				        return console.log(err);
				    }
				    console.log("The file was saved!");
				}); 

	    })
	    .done();
});