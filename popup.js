"use strict";

//
// Mainloop
//

var mainLoop = function(options) {
  console.log("\n#" + mainLoop.iteration);

  // Force update all
  if (options && options.forceUpdate === true) {
    popup.update.all();
  }
  // Regular update intervals
  else {
    if (ls.showCantina === 'true')
      if (mainLoop.iteration % UPDATE_CANTINAS_INTERVAL === 0)
        popup.update.cantinas();
    if (ls.showBus === 'true')
      if (mainLoop.iteration % UPDATE_BUS_INTERVAL === 0)
        popup.update.bus();
    if (ls.showAffiliation1 === 'true')
      if (mainLoop.iteration % UPDATE_NEWS_INTERVAL === 0)
        popup.update.affiliationNews(1);
    if (ls.showAffiliation2 === 'true')
      if (mainLoop.iteration % UPDATE_NEWS_INTERVAL === 0)
        popup.update.affiliationNews(2);
    // Only if hardware
    if (Affiliation.org[ls.affiliationKey1].hw) {
      if (ls.showStatus === 'true') {
        if (mainLoop.iteration % UPDATE_AFFILIATION_INTERVAL === 0) {
          Browser.getBackgroundProcess().updateAffiliation(function() {
            popup.update.meeting();
            popup.update.servant();
            popup.update.coffee();
            // popup.update.status(); // TODO: No status info in popup yet
          });
        }
      }
    }
  }

  // No reason to count to infinity
  if (10000 < mainLoop.iteration)
    mainLoop.iteration = 0;
  else
    mainLoop.iteration++;
}
mainLoop.iteration = 0;
mainLoop.intervalId = null;

//
// Tiny Screen Check
// (self executing)
//

(function tinyScreenCheck() {
  // Netbook or MacBook Air? 800x600 won't do.
  // If this is a tiny computer screen, reduce popup height
  if (window.screen.availHeight < 700) {
    var shorter = window.screen.availHeight - 100;
    // shorter is available screenspace minus the height
    // of the browser taskbar, rounded up well to be sure
    $('body').css('height', shorter + 'px');
  }
}());

//
// Show And Hide Elements
// (self executing)
//

(function showAndHideElements() {
  // Show stuff that the user hasn't explicitly removed yet
  if (ls.closedSpecialNews !== $('#specialNews a').attr('href')) $('#specialNews').show();
  // Hide stuff the user can't or doesn't want to see
  if (ls.showStatus !== 'true') $('#todays').hide();
  if (ls.showCantina !== 'true') $('#cantinas').hide();
  if (ls.showBus !== 'true') $('#bus').hide();

  // If only one affiliation is to be shown remove the second news column
  // Also, some serious statistics
  if (ls.showAffiliation2 !== 'true') {
    $('#news #right').hide();
    $('#news #left').attr('id', 'full');
    // Who uses single affiliations?
    Analytics.trackEvent('loadSingleAffiliation', ls.affiliationKey1);
    // What is the prefered primary affiliation?
    Analytics.trackEvent('loadAffiliation1', ls.affiliationKey1);
  }
  else {
    // What kind of double affiliations are used?
    Analytics.trackEvent('loadDoubleAffiliation', ls.affiliationKey1 + ' - ' + ls.affiliationKey2);
    // What is the prefered primary affiliation?
    Analytics.trackEvent('loadAffiliation1', ls.affiliationKey1);
    // What is the prefered secondary affiliation?
    Analytics.trackEvent('loadAffiliation2', ls.affiliationKey2);
  }
}());

//
// Apply Affiliation Settings
// (self executing)
//

(function applyAffiliationSettings() {

  // Applying affiliation graphics
  var key = ls.affiliationKey1;
  var logo = Affiliation.org[key].logo;
  var icon = Affiliation.org[key].icon;
  var placeholder = Affiliation.org[key].placeholder;
  $('#logo').prop('src', logo);
  $('link[rel="shortcut icon"]').prop('href', icon);
  $('#news .post img').prop('src', placeholder);

  // Hide Chatter button if not applicable
  if (Affiliation.org[ls.affiliationKey1].slack) {
    $('#chatterButton').show();
  }

  // Apply the affiliation's own name for it's office
  if (Affiliation.org[ls.affiliationKey1].hw) {
    if (Affiliation.org[ls.affiliationKey1].hw.office) {
      $('#todays #schedule .title').text(Affiliation.org[ls.affiliationKey1].hw.office);
    }
  }
}());

//
// Add CHANGELOG.md to div#tips
// (self executing)
//

(function addChangeLog() {
  Ajaxer.getPlainText({
    url: "CHANGELOG.md",
    success: function(data) {
      var converter = new Markdown.Converter();
      var html = converter.makeHtml(data);
      $("div#changelog").html(html);
      // Rebind tips links
      popup.event.bindTipsLinks();
    },
    error: function(e) {
      console.error('Could not include CHANGELOG.md because:', e);
    },
  });
}());

//
// Text measuring for title dropdowns and change handlers
//

var getTitleWidth = function (title) {
  var width = $('#titleMeasure').text(title).width();
  $('#titleMeasure').text('');
  return width * 1.1 + 30; // With buffer
}

var adjustCantinaTitleWidth = function(title, element) {
  var wrapper = element + ' .dropdownWrapper';
  var dropdown = element + ' .dropdownWrapper .titleDropdown';
  var cantinaName = Cantina.names[title];
  var width = getTitleWidth(cantinaName);
  $(wrapper).width(width);
  $(dropdown).width(width - 23);
}
adjustCantinaTitleWidth(ls.cantina1, '#cantinas .first');
adjustCantinaTitleWidth(ls.cantina2, '#cantinas .second');

var cantinaChangeHandler = function(which, cantina) {
  var titleDropdown = '#cantinas ' + which + ' .titleDropdown';
  var hoursBox = '#cantinas ' + which + ' .hours';
  var dinnerBox = '#cantinas ' + which + ' #dinnerbox';
  $(titleDropdown).change(function () {
    // Save
    ls[cantina] = this.value;
    // Measure
    adjustCantinaTitleWidth(ls[cantina], '#cantinas ' + which);
    // Add loading bar
    $(hoursBox).html('');
    $(dinnerBox).html('<img class="loadingLeft" src="img/loading.gif" />');
    window.cantinaTimeout = setTimeout(function() {
      $(hoursBox).html('');
      $(dinnerBox).html(Cantina.msgConnectionError);
    }, 6000);
    // Apply
    Browser.getBackgroundProcess().popup.update.cantinas(function () {
      clearTimeout(window.cantinaTimeout);
      popup.update.cantinas();
    });
  });
}
cantinaChangeHandler('.first', 'cantina1');
cantinaChangeHandler('.second', 'cantina2');

//
// Document ready function
//

$(document).ready(function() {

  // Hook up all event handlers
  popup.event.bindAll();

  // Track popularity of the chosen palette, the palette
  // itself is loaded a lot earlier for perceived speed
  Analytics.trackEvent('loadPalette', ls.affiliationPalette);

  // Set the cursor to focus on the question field
  // (e.g. Chrome on Windows doesn't do this automatically so I blatantly blame Windows)
  $('#oracle #question').focus();
  // Repeat for good measure (the browser may sometimes blur the question-field)
  setTimeout(function() {$('#oracle #question').focus();}, 400);

  // Enter main loop, keeping everything up-to-date
  var stayUpdated = function(now) {
    console.info(ONLINE_MESSAGE);
    var loopTimeout = (DEBUG ? PAGE_LOOP_DEBUG : PAGE_LOOP);
    // Schedule for repetition ...
    mainLoop.intervalId = setInterval( function() {
      mainLoop();
    }, loopTimeout);
    // ... and run once right now (just wait 2 secs to avoid network-change errors)
    var timeout = (now ? 0 : 2000);
    setTimeout( function() {
      mainLoop({forceUpdate: true});
    }, timeout);
  }
  // When offline mainloop is stopped to decrease power consumption
  window.addEventListener('online', stayUpdated);
  window.addEventListener('offline', function() {
    console.warn(OFFLINE_MESSAGE);
    clearInterval(mainLoop.intervalId);
    popup.update.bus();
  });
  // Go
  if (navigator.onLine)
    stayUpdated({forceUpdate: true});
  else
    mainLoop();

});
