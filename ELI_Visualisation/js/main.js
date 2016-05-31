/*
  Javascript functionalities

  Copyright 2016 European Union
  Author: Jens Scheerlinck (PwC EU Services)

  Licensed under the EUPL, Version 1.1 or - as soon they
  will be approved by the European Commission - subsequent
  versions of the EUPL (the "Licence");
  You may not use this work except in compliance with the
  Licence.
  You may obtain a copy of the Licence at:
  http://ec.europa.eu/idabc/eupl

  Unless required by applicable law or agreed to in
  writing, software distributed under the Licence is
  distributed on an "AS IS" basis,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
  express or implied.
  See the Licence for the specific language governing
  permissions and limitations under the Licence.
*/

var labels = [
  ['lang', 'Interface language', 'Lingua dell\'interfaccia', 'γλώσσα διεπαφής'],
  ['index-acts', 'List of acts per theme', 'Elenco degli atti per tema', 'Κατάλογος των πράξεων ανά θέμα'],
  ['index-links', 'Other links', 'Altri link', 'Άλλοι σύνδεσμοι'],
  ['display-timeline', 'Changes over time', 'I cambiamenti nel corso del tempo', 'Αλλαγές με την πάροδο του χρόνου'],
  ['display-title', 'Title', 'Titolo', 'τίτλος'],
  ['display-type', 'Type of Document', 'Tipo di documento', 'Είδος Εγγράφου'],
  ['display-date', 'Document Date', 'Data del documento', 'Ημερομηνία του εγγράφου'],
  ['display-publisher', 'Publisher', 'Editore', 'Εκδότης'],
  ['display-structure', 'Document structure', 'Struttura del documento', 'δομή του εγγράφου'],
  ['display-contents', 'Contents', 'Contenuto', 'Περιεχόμενα'],
  ['display-ispartof', 'Is part of', 'È parte di', 'Είναι μέρος του']
]

jQuery(document).ready(function($){
  //Set default language to English and get current language
  var lang;
  var lang_cookie = Cookies.get('lang');
  if(!lang_cookie){
    Cookies.set('lang', 'en');
    lang = 1;
  } else {
    if(lang_cookie == 'en'){ lang = 1; $("#lang_en").addClass("lng-active"); }
    if(lang_cookie == 'it'){ lang = 2; $("#lang_it").addClass("lng-active"); }
    if(lang_cookie == 'gr'){ lang = 3; $("#lang_gr").addClass("lng-active"); }
  }
  //Language toggle
  $(".lng").click(function(){
    Cookies.remove('lang');
    lang_id = $(this).attr("id");
    if(lang_id == "lang_en"){
      Cookies.set('lang', 'en');
    } else if(lang_id == "lang_it") {
      Cookies.set('lang', 'it');
    } else if(lang_id == "lang_gr") {
      Cookies.set('lang', 'gr');
    }
    location.reload();
  });

  //Populate label fields
  $.each(labels, function( index, label ){
    $("#"+label[0]).text(label[lang]);
  });
  /*Accordion for document structure*/
  $("#accordion").treemenu({delay:500}).openActive();
  $("#links").treemenu({delay:500}).openActive();
});