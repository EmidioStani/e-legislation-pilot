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

//Set multilingual content for labels
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
  ['display-ispartof', 'Is part of', 'È parte di', 'Είναι μέρος του'],
  ['administrative-law-civil-servants', 'Administrative law, civil servants', 'Administrative law, civil servants', 'Διοικητική νομοθεσία - δημόσιοι υπάλληλοι'],
  ['agricultural-law-water-resources', 'Agricultural law, water resources', 'Agricultural law, water resources', 'Γεωργική νομοθεσία-υδάτινοι πόροι'],
  ['airforce-civil-aviation', 'Airforce, civil aviation', 'Airforce, civil aviation', 'Πολεμική αεροπορία - πολιτική αεροπορία'],
  ['anonymous-companies-limited-liability-companies-stock-markets-banks', 'Anonymous companies, limited liability companies, stock markets, banks', 'Anonymous companies, limited liability companies, stock markets, banks', 'Ανώνυμες εταιρείες - επε - χρηματιστήρια - τράπεζες'],
  ['civil-law', 'Civil law', 'Civil law', 'Αστική νομοθεσία'],
  ['civil-procedure', 'Civil procedure', 'Civil procedure', 'Πολιτική δικονομία'],
  ['commercial-law', 'Commercial law', 'Commercial law', 'Εμπορική νομοθεσία'],
  ['constitutional-law', 'Constitutional law', 'Constitutional law', 'Συνταγματική νομοθεσία'],
  ['court-of-audit-public-servants-pensions', 'Court of audit, public servants pensions', 'Court of audit, public servants pensions', 'Ελεγκτικό συνέδριο - συντάξεις δημοσίου'],
  ['criminal-law', 'Criminal law', 'Criminal law', 'Ποινική νομοθεσία'],
  ['criminal-procedure', 'Criminal procedure', 'Criminal procedure', 'Ποινική δικονομία'],
  ['currency-public-property', 'Currency, public property', 'Currency, public property', 'Νόμισμα - περιουσία δημοσίου'],
  ['customs-law', 'Customs law', 'Customs law', 'Τελωνιακή νομοθεσία'],
  ['diplomatic-law-international-organizations', 'Diplomatic law, international organizations', 'Diplomatic law, international organizations', 'Διπλωματική νομοθεσία - διεθνείς οργανισμοί'],
  ['direct-taxation', 'Direct taxation', 'Direct taxation', 'Άμεση φορολογία'],
  ['ecclesiastical-law', 'Ecclesiastical law', 'Ecclesiastical law', 'Εκκλησιαστική νομοθεσία'],
  ['educational-law-sport', 'Educational law, sport', 'Educational law, sport', 'Εκπαιδευτική νομοθεσία - αθλητισμός'],
  ['financial-management-environment', 'Financial management, environment', 'Financial management, environment', 'Οικονομική διοίκηση - περιβάλλον'],
  ['health-law-hospitals-doctors', 'Health law, hospitals, doctors', 'Health law, hospitals, doctors', 'Υγειονομική νομοθεσία - νοσοκομεία - ιατροί'],
  ['indirect-taxation', 'Indirect taxation', 'Indirect taxation', 'Έμμεση φορολογία'],
  ['industrial-law-development-law-fishing', 'Industrial law, development law, fishing', 'Industrial law, development law, fishing', 'Βιομηχανική νομοθεσία-αναπτυξιακή νομοθεσία- αλιεία'],
  ['justice-administration', 'Justice administration', 'Justice administration', 'Διοίκηση δικαιοσύνης'],
  ['labour-law', 'Labour law', 'Labour law', 'Εργατική νομοθεσία'],
  ['legal-entities-of-public-law-pension-funds', 'Legal entities of public law, pension funds', 'Legal entities of public law, pension funds', 'Νομικά πρόσωπα δημοσίου δικαίου - ασφαλιστικά ταμεία'],
  ['marketplace-law', 'Marketplace law', 'Marketplace law', 'Αγορανομική νομοθεσία'],
  ['merchant-shipping', 'Merchant shipping', 'Merchant shipping', 'Εμπορική ναυτηλία'],
  ['municipalities-and-communities-prefecture-self-administration', 'Municipalities and communities, prefecture self administration', 'Municipalities and communities, prefecture self administration', 'Δήμοι και κοινότητες - νομαρχιακή αυτοδιοίκηση'],
  ['national-defence-land-army', 'National defence, land army', 'National defence, land army', 'Εθνική άμυνα - στρατός ξηράς'],
  ['navy', 'Navy', 'Navy', 'Πολεμικό ναυτικό'],
  ['police-law-fire-department', 'Police law, fire department', 'Police law, fire department', 'Αστυνομική νομοθεσία - πυροσβεστικό σώμα'],
  ['port-law', 'Port law', 'Port law', 'Λιμενική νομοθεσία'],
  ['post-telecommunications', 'Post, telecommunications', 'Post, telecommunications', 'Ταχυδρομεία - τηλεπικοινωνίες'],
  ['press-media-tourism', 'Press, media, tourism', 'Press, media, tourism', 'Τύπος - ΜΜΕ - τουρισμός'],
  ['public-accounting-kede', 'Public accounting, K.E.D.E.', 'Public accounting, K.E.D.E.', 'Δημόσιο λογιστικό - Κ.Ε.Δ.Ε.'],
  ['public-works-engineers-urban-planning', 'Public works, engineers, urban planning', 'Public works, engineers, urban planning', 'Δημόσια έργα - μηχανικοί - πολεοδομία'],
  ['rural-law-forests-animal-farming', 'Rural law, forests, animal farming', 'Rural law, forests, animal farming', 'Αγροτική νομοθεσία-δάση-κτηνοτριφία'],
  ['science-and-arts-universities-antiquities', 'Science and arts, universities, antiquities', 'Science and arts, universities, antiquities', 'Επιστήμες και τέχνες - Α.Ε.Ι. - αρχαιότητες'],
  ['social-welfare', 'Social welfare', 'Social welfare', 'Κοινωνική πρόνοια'],
  ['transportation', 'Transportation', 'Transportation', 'Συγκοινωνίες'],
  ['worker-association-chambers-cooperatives', 'Worker association, chambers, cooperatives', 'Worker association, chambers, cooperatives', 'Σωματεία/επιμελητήρια/συνεταιρισμοί']
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