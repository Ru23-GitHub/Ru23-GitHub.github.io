/* Provenance disclosures: the word count in each summary
   ----------------------------------------------------------------------
   Every section's provenance note is a closed <details>, which opens and
   closes without any of this. The one thing script adds is the size of
   what you are about to open, written into the summary.

   It is counted off the live DOM on every load rather than typed into the
   markup, for the same reason the figures in The Source are: a number in
   the HTML is a claim that goes stale the first time someone edits the
   paragraph beside it. If this file does not run, the summaries read
   "Where this comes from" and nothing is broken. */

(function(){
  'use strict';

  var provs = document.querySelectorAll('.prov');
  if (!provs.length) return;

  /* Words, counted the way a person would: whitespace-separated runs that
     contain at least one letter or digit. That drops the stray em dashes
     and lone quote marks that sit between clauses in these paragraphs and
     would otherwise each score as a word. */
  function countWords(el){
    var text = '';
    var kids = el.children;
    for (var i = 0; i < kids.length; i++){
      if (kids[i].tagName === 'SUMMARY') continue;
      text += ' ' + (kids[i].textContent || '');
    }
    var parts = text.split(/\s+/);
    var n = 0;
    for (var j = 0; j < parts.length; j++){
      if (/[\p{L}\p{N}]/u.test(parts[j])) n++;
    }
    return n;
  }

  var total = 0;

  Array.prototype.forEach.call(provs, function(prov){
    var slot = prov.querySelector('[data-prov-n]');
    if (!slot) return;
    var n = countWords(prov);
    if (!n) return;
    total += n;
    /* The separator lives here rather than in the markup so that the
       summary has no dangling punctuation when this file is absent. */
    slot.textContent = '· ' + n + (n === 1 ? ' word' : ' words');
  });

  /* The page-level figure, for the one place that quotes it. Same rule:
     counted, not typed. */
  var tally = document.querySelector('[data-prov-total]');
  if (tally && total) tally.textContent = total.toLocaleString('en-US');
})();
