// Generated by CoffeeScript 1.4.0
(function() {
  var $, bindAffiliationSelector, bindBusFields, bindCantinaSelector, bindFavoriteBusLines, bindSuggestions, disableOnlineSpecificFeatures, displayOnPageNotification, enableOnlineSpecificFeatures, fadeInCanvas, getDirections, getFavoriteLines, loadBus, ls, pageFlipCursorBlinking, resizeBackgroundImage, revertInfoscreen, saveBus, slideFavoriteBusLines, testCoffeeSubscription, testDesktopNotification, toggleInfoscreen,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = jQuery;

  ls = localStorage;

  resizeBackgroundImage = function() {
    if (1550 < $(window).width()) {
      return $('#background').attr("style", "background:url('img/background-large.png') center center no-repeat;");
    } else if (1200 < $(window).height()) {
      return $('#background').attr("style", "background:url('img/background-large-vertical.png') center center no-repeat;");
    } else {
      return $('#background').attr("style", "background:url('img/background-medium.png') center center no-repeat;");
    }
  };

  displayOnPageNotification = function() {
    $("#notification").fadeIn(200);
    return setTimeout((function() {
      return $("#notification").fadeOut(200);
    }), 800);
  };

  pageFlipCursorBlinking = function() {
    return $(".pageflipcursor").animate({
      opacity: 0
    }, "fast", "swing", function() {
      return $(this).animate({
        opacity: 1
      }, "fast", "swing");
    });
  };

  testDesktopNotification = function() {
    return Browser.createNotification('notification.html');
  };

  testCoffeeSubscription = function() {
    return Browser.createNotification('subscription.html');
  };

  bindAffiliationSelector = function() {
    var chosenAffiliation, cssSelector;
    cssSelector = '#affiliationName';
    chosenAffiliation = ls['affiliationName'];
    $(cssSelector + '[value=' + chosenAffiliation + ']').prop('selected', 'selected');
    return $(cssSelector).change(function() {
      var oldAffiliation;
      chosenAffiliation = $(this).val();
      oldAffiliation = ls[selector];
      if (oldAffiliation === 'online') {
        disableOnlineSpecificFeatures();
      } else if (chosenAffiliation === 'online') {
        enableOnlineSpecificFeatures();
      }
      ls[selector] = chosenAffiliation;
      return Browser.getBackgroundProcess().updateNews();
    });
  };

  disableOnlineSpecificFeatures = function() {
    ls['showOffice'] = 'false';
    ls['coffeeSubscription'] = 'false';
    return ls['useInfoscreen'] = 'false';
  };

  enableOnlineSpecificFeatures = function() {};

  bindCantinaSelector = function(selector) {
    $('#' + selector).val(ls[selector]);
    return $('#' + selector).change(function() {
      return ls[selector] = $(this).prop('value');
    });
  };

  bindBusFields = function(busField) {
    var cssSelector, direction, fadeTime, stop;
    cssSelector = '#' + busField;
    if (DEBUG) {
      console.log('Binding bus fields for ' + cssSelector);
    }
    fadeTime = 50;
    stop = $(cssSelector + ' input');
    direction = $(cssSelector + ' select');
    loadBus(busField);
    $(stop).focus(function() {
      if (DEBUG) {
        console.log('focus - clear field and show saved value as placeholder');
      }
      ls.busStopClickedAway = ls[busField + '_name'];
      $(stop).val('');
      return $(stop).attr('placeholder', ls.busStopClickedAway);
    });
    $(stop).focusout(function() {
      var correctStop, partialStop, suggestions;
      partialStop = $(stop).val();
      suggestions = Stops.partialNameToPotentialNames(partialStop);
      if (partialStop === '' || suggestions.length === 0) {
        if (DEBUG) {
          console.log('focusout - empty field or invalid input, return to last saved value');
        }
        if (ls.busStopClickedAway !== null) {
          $(stop).val(ls.busStopClickedAway);
        }
        return $('#bus_suggestions').html('');
      } else if (suggestions.length === 1) {
        if (DEBUG) {
          console.log('focusout - 1 suggestion, save it');
        }
        correctStop = suggestions[0];
        $(stop).val(correctStop);
        $('#bus_suggestions').html('');
        getDirections(busField, correctStop);
        getFavoriteLines(busField);
        return saveBus(busField);
      } else if (suggestions.length > 1) {
        if (DEBUG) {
          console.log('focusout - several suggestions, remove them');
        }
        return setTimeout((function() {
          return $('#bus_suggestions .suggestion').fadeOut(function() {
            return $('#bus_suggestions').html('');
          });
        }), 5000);
      } else {
        if (DEBUG) {
          return console.log('focusout - nothing to do');
        }
      }
    });
    $(stop).keyup(function(event) {
      var correctStop, i, nameStart, possibleStop, realStopName, suggestion, suggestions, _ref, _ref1, _text;
      if ((_ref = event.keyCode, __indexOf.call([37, 38, 39, 40], _ref) >= 0) || (_ref1 = event.keyCode, __indexOf.call([17, 18], _ref1) >= 0) || event.keyCode === 91) {
        if (DEBUG) {
          return console.log('keyup - arrow key or function key, do nothing');
        }
      } else if (event.keyCode === 13) {
        if (DEBUG) {
          console.log('keyup - enter, checking input');
        }
        possibleStop = $(stop).val();
        suggestions = Stops.nameToIds(possibleStop);
        if (suggestions.length !== 0) {
          realStopName = Stops.idToName(suggestions[0]);
          $(stop).val(realStopName);
          $('#bus_suggestions').html('');
          suggestion = $('<div class="correct">' + realStopName + '</div>').hide();
          $('#bus_suggestions').append(suggestion);
          $(suggestion).fadeIn();
          setTimeout((function() {
            $('#bus_suggestions .correct').fadeOut(fadeTime);
            return setTimeout((function() {
              return $('#bus_suggestions').html('');
            }), 300);
          }), 1200);
          getDirections(busField, realStopName);
          getFavoriteLines(busField);
          return saveBus(busField);
        }
      } else {
        if (DEBUG) {
          console.log('keyup - getting suggestions');
        }
        ls.busInFocus = $(stop).parent().attr('id');
        nameStart = $(stop).val();
        if (nameStart.length > 0) {
          suggestions = Stops.partialNameToPotentialNames(nameStart);
          $('#bus_suggestions').html('');
          for (i in suggestions) {
            _text = suggestions[i];
            suggestion = $('<div class="suggestion">' + _text + '</div>').hide();
            $('#bus_suggestions').append(suggestion);
            $(suggestion).fadeIn();
          }
          if (suggestions.length === 1) {
            correctStop = suggestions[0];
            $(stop).val(correctStop);
            $(stop).blur();
            $('#bus_suggestions').html('');
            suggestion = $('<div class="correct">' + correctStop + '</div>').hide();
            $('#bus_suggestions').append(suggestion);
            $(suggestion).fadeIn();
            setTimeout((function() {
              $('#bus_suggestions .correct').fadeOut(fadeTime);
              return setTimeout((function() {
                return $('#bus_suggestions').html('');
              }), 300);
            }), 1200);
            getDirections(busField, correctStop);
            getFavoriteLines(busField);
            saveBus(busField);
          }
        } else {
          $('#bus_suggestions .suggestion').fadeOut(fadeTime, function() {
            return $('#bus_suggestions').html('');
          });
        }
        return bindSuggestions();
      }
    });
    $(direction).change(function() {
      getFavoriteLines(busField);
      return saveBus(busField);
    });
    return bindFavoriteBusLines(busField);
  };

  bindFavoriteBusLines = function(busField) {
    var cssSelector;
    cssSelector = '#' + busField;
    return $(cssSelector + ' .lines .line').click(function() {
      if ($(this).hasClass('active')) {
        $(this).attr('class', 'inactive');
      } else if ($(this).hasClass('inactive')) {
        $(this).attr('class', 'active');
      } else {
        console.log('ERROR: favorite bus line <span> with neither .active nor .inactive');
      }
      return saveBus(busField);
    });
  };

  getDirections = function(busField, correctStop) {
    var allDirections, cssSelector, direction, i, stopName, _i, _len, _results;
    cssSelector = '#' + busField;
    stopName = $(cssSelector + ' input');
    direction = $(cssSelector + ' select');
    allDirections = Stops.nameToDirections(correctStop);
    $(direction).html('');
    _results = [];
    for (_i = 0, _len = allDirections.length; _i < _len; _i++) {
      i = allDirections[_i];
      _results.push($(direction).append('<option>' + i + '</option>'));
    }
    return _results;
  };

  getFavoriteLines = function(busField) {
    var busStopId, cssSelector, direction, stopName;
    cssSelector = '#' + busField;
    if (-1 !== busField.indexOf('first')) {
      $(cssSelector + ' .lines').html('<div style="text-align:center;"><img class="loading_left" src="img/loading-atb.gif" /></div>');
    } else if (-1 !== busField.indexOf('second')) {
      $(cssSelector + ' .lines').html('<div style="text-align:center;"><img class="loading_right" src="img/loading-atb.gif" /></div>');
    }
    $('#bus_box .lines').slideDown();
    $('#bus_box #arrow_down').fadeOut();
    stopName = $(cssSelector + ' input').val();
    direction = $(cssSelector + ' select').val();
    busStopId = Stops.nameAndDirectionToId(stopName, direction);
    return Bus.getLines(busStopId, function(json) {
      var arrayOfLines, counter, errorMessage, item, line, _i, _j, _len, _len1, _ref;
      console.log(json);
      errorMessage = null;
      if (typeof json === 'undefined') {
        errorMessage = 'Oops, frakoblet';
      }
      if (typeof json === 'string') {
        errorMessage = json;
      }
      if (typeof json[0] !== 'undefined') {
        errorMessage = 'Feil: ' + json[0];
      }
      if (errorMessage !== null) {
        $(cssSelector + ' .lines').html('<span class="error">' + errorMessage + '</span>');
        clearTimeout($('#bus_box').data('timeoutId'));
        setTimeout((function() {
          $(cssSelector + ' .lines').html('<span class="retry">Prøve igjen?</span>');
          $(cssSelector + ' .lines .retry').click(function() {
            return getFavoriteLines(busField);
          });
          return setTimeout((function() {
            return slideFavoriteBusLines();
          }), 1500);
        }), 2200);
      } else {
        arrayOfLines = [];
        _ref = json.next;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          if (-1 === arrayOfLines.indexOf(Number(item.line))) {
            arrayOfLines.push(Number(item.line));
          }
        }
        arrayOfLines = arrayOfLines.sort(function(a, b) {
          return a - b;
        });
        $(cssSelector + ' .lines').html('<table border="0" cellpadding="0" cellspacing="0"><tr>');
        counter = 0;
        for (_j = 0, _len1 = arrayOfLines.length; _j < _len1; _j++) {
          line = arrayOfLines[_j];
          if (counter % 4 === 0) {
            $(cssSelector + ' .lines table').append('</tr><tr>');
          }
          $(cssSelector + ' .lines table tr:last').append('<td class="line active">' + line + '</td>');
          counter = counter + 1;
        }
        $(cssSelector + ' .lines').append('</tr></table>');
        saveBus(busField);
        bindFavoriteBusLines(busField);
      }
      return setTimeout((function() {
        if (!$('#bus_box').hasClass('hover')) {
          $('#bus_box .lines').slideUp();
          return $('#bus_box #arrow_down').fadeIn();
        }
      }), 2500);
    });
  };

  saveBus = function(busField) {
    var activeLines, busStopId, cssSelector, direction, inactiveLines, stopName;
    cssSelector = '#' + busField;
    stopName = $(cssSelector + ' input').val();
    direction = $(cssSelector + ' select').val();
    busStopId = Stops.nameAndDirectionToId(stopName, direction);
    activeLines = [];
    $(cssSelector + ' .lines .active').each(function() {
      return activeLines.push(Number($(this).text()));
    });
    inactiveLines = [];
    $(cssSelector + ' .lines .inactive').each(function() {
      return inactiveLines.push(Number($(this).text()));
    });
    ls[busField] = busStopId;
    ls[busField + '_name'] = stopName;
    ls[busField + '_direction'] = direction;
    ls[busField + '_active_lines'] = JSON.stringify(activeLines);
    ls[busField + '_inactive_lines'] = JSON.stringify(inactiveLines);
    if (DEBUG) {
      console.log('saved activeLines for ' + busField, '"', activeLines, '"');
    }
    if (DEBUG) {
      console.log('saved inactiveLines ' + busField, '"', inactiveLines, '"');
    }
    if (DEBUG) {
      console.log('saved http://api.visuweb.no/bybussen/1.0/Departure/Realtime/' + busStopId + '/f6975f3c1a3d838dc69724b9445b3466');
    }
    return displayOnPageNotification();
  };

  loadBus = function(busField) {
    var activeLines, counter, cssSelector, direction, i, inactiveLines, keys, line, lines, status, stopName, _i, _j, _k, _len, _len1, _len2;
    cssSelector = '#' + busField;
    stopName = ls[busField + '_name'];
    direction = ls[busField + '_direction'];
    activeLines = ls[busField + '_active_lines'];
    inactiveLines = ls[busField + '_inactive_lines'];
    if (stopName !== void 0 && direction !== void 0) {
      $(cssSelector + ' input').val(stopName);
      $(cssSelector + ' select').val(direction);
      if (DEBUG) {
        console.log('loaded "' + stopName + '" to "' + busField + '"');
      }
    }
    if (activeLines !== void 0 && inactiveLines !== void 0) {
      if (activeLines === '' && inactiveLines === '') {
        return getFavoriteLines(busField);
      } else {
        activeLines = JSON.parse(activeLines);
        inactiveLines = JSON.parse(inactiveLines);
        lines = {};
        for (_i = 0, _len = activeLines.length; _i < _len; _i++) {
          line = activeLines[_i];
          lines[line] = true;
        }
        for (_j = 0, _len1 = inactiveLines.length; _j < _len1; _j++) {
          line = inactiveLines[_j];
          lines[line] = false;
        }
        keys = [];
        for (i in lines) {
          keys.push(i);
        }
        keys = keys.sort(function(a, b) {
          return a - b;
        });
        $(cssSelector + ' .lines').html('<table border="0" cellpadding="0" cellspacing="0"><tr>');
        counter = 0;
        for (_k = 0, _len2 = keys.length; _k < _len2; _k++) {
          i = keys[_k];
          if (counter % 4 === 0) {
            $(cssSelector + ' .lines table').append('</tr><tr>');
          }
          status = lines[i] === true ? 'active' : 'inactive';
          $(cssSelector + ' .lines table tr:last').append('<td class="line ' + status + '">' + i + '</td>');
          counter = counter + 1;
        }
        return $(cssSelector + ' .lines').append('</tr></table>');
      }
    }
  };

  slideFavoriteBusLines = function() {
    setTimeout((function() {
      if (!$('#bus_box').hasClass('hover')) {
        $('#bus_box .lines').slideUp();
        return $('#bus_box #arrow_down').fadeIn();
      }
    }), 1500);
    $('#bus_box').mouseenter(function() {
      clearTimeout($(this).data('timeoutId'));
      $('#bus_box .lines').slideDown();
      return $('#bus_box #arrow_down').fadeOut();
    });
    return $('#bus_box').mouseleave(function() {
      var timeoutId;
      timeoutId = setTimeout((function() {
        if ($('#bus_box .lines img').length === 0) {
          $('#bus_box .lines').slideUp();
          return $('#bus_box #arrow_down').fadeIn();
        }
      }), 500);
      return $('#bus_box').data('timeoutId', timeoutId);
    });
  };

  bindSuggestions = function() {
    return $('.suggestion').click(function() {
      var text;
      if (ls.busInFocus !== void 0) {
        text = $(this).text();
        $('#' + ls.busInFocus + ' input').val(text);
        getDirections(ls.busInFocus, text);
        getFavoriteLines(ls.busInFocus);
        saveBus(ls.busInFocus);
        return $('#bus_suggestions .suggestion').fadeOut(50, function() {
          return $('#bus_suggestions').html('');
        });
      }
    });
  };

  toggleInfoscreen = function(activate, force) {
    var id, speed;
    speed = 400;
    id = 'useInfoscreen';
    if (activate) {
      $('#' + id).attr('checked', false);
      $('#logo_subtext').fadeOut();
      return $('#container #left').animate({
        'width': '0pt'
      }, speed, function() {
        $('#container #left').hide();
        return $('#infoscreen_slider').slideUp(speed, function() {
          return $('#infoscreen_preview').fadeIn(speed, function() {
            $('#logo_subtext').html('infoscreen&nbsp;&nbsp;&nbsp;&nbsp;');
            return $('#logo_subtext').fadeIn(function() {
              $('header #logo_subtext').animate({
                'margin-left': '265pt'
              }, speed);
              $('header #logo').animate({
                'margin-left': '75pt'
              }, speed);
              $('#container #right').animate({
                'margin-left': '180pt'
              }, speed);
              $('header').animate({
                'top': '40%'
              }, speed);
              return $('#container').animate({
                'top': '40%'
              }, speed, function() {
                if (force || confirm('Sikker på at du vil skru på Online Infoscreen?\n\n- Krever full-HD skjerm som står på høykant\n- Popup-knappen åpner Infoskjerm i stedet\n- Infoskjermen skjuler musepekeren\n- Infoskjermen åpnes hver gang ' + BROWSER + ' starter\n- Infoskjermen åpnes nå!')) {
                  ls[id] = 'true';
                  $('#' + id).prop('checked', true);
                  Browser.setIcon('img/icon-default.png');
                  Browser.setTitle('Online Infoscreen');
                  Browser.setBadgeText('');
                  ls.newsLimit = 8;
                  Browser.getBackgroundProcess().updateNews();
                  if (!force) {
                    return Browser.openBackgroundTab('infoscreen.html');
                  }
                } else {
                  return revertInfoscreen();
                }
              });
            });
          });
        });
      });
    } else {
      ls[id] = 'false';
      Browser.getBackgroundProcess().updateOfficeAndMeetings(true);
      ls.newsLimit = 4;
      return revertInfoscreen();
    }
  };

  revertInfoscreen = function() {
    var speed;
    speed = 300;
    return $('#logo_subtext').fadeOut(speed, function() {
      $('#container').animate({
        'top': '50%'
      }, speed);
      $('header').animate({
        'top': '50%'
      }, speed);
      $('#container #right').animate({
        'margin-left': '0'
      }, speed);
      $('header #logo_subtext').animate({
        'margin-left': '215pt'
      }, speed);
      return $('header #logo').animate({
        'margin-left': '25pt'
      }, speed, function() {
        return $('#infoscreen_preview').fadeOut(speed, function() {
          return $('#infoscreen_slider').slideDown(speed, function() {
            $('#container #left').show();
            return $('#container #left').animate({
              'width': '54%'
            }, speed, function() {
              $('#logo_subtext').html('notifier options');
              return $('#logo_subtext').fadeIn();
            });
          });
        });
      });
    });
  };

  fadeInCanvas = function() {
    webGLStart();
    return $('#LessonCanvas').animate({
      opacity: 1
    }, 1300, 'swing', function() {
      return setTimeout((function() {
        return $('#LessonCanvas').animate({
          opacity: 0
        }, 1300, 'swing');
      }), 200);
    });
  };

  $(function() {
    var text;
    if (DEBUG) {
      $('#debug_links').show();
      $('button.debug').click(function() {
        return Browser.openTab($(this).attr('data'));
      });
    }
    $.ajaxSetup({
      timeout: AJAX_TIMEOUT
    });
    $('input:checkbox').each(function(index, element) {
      if (ls[element.id] === 'true') {
        return element.checked = true;
      }
    });
    if (ls.useInfoscreen === 'true') {
      setTimeout((function() {
        return toggleInfoscreen(true, true);
      }), 300);
    }
    $(window).bind("resize", resizeBackgroundImage);
    resizeBackgroundImage();
    if (OPERATING_SYSTEM === 'Windows') {
      $('#pagefliptext').attr("style", "bottom:9px;");
      $('#pagefliplink').attr("style", "bottom:9px;");
    }
    setInterval((function() {
      return pageFlipCursorBlinking();
    }), 600);
    setTimeout((function() {
      return $('#plusonebutton').fadeIn(150);
    }), 1100);
    bindAffiliationSelector();
    bindCantinaSelector('left_cantina');
    bindCantinaSelector('right_cantina');
    bindBusFields('first_bus');
    bindBusFields('second_bus');
    slideFavoriteBusLines();
    Stops.load(function(result) {
      if (DEBUG) {
        return console.log('Loading bus lists:', result);
      }
    });
    if (BROWSER === 'Opera') {
      $('input#showNotifications').prop("disabled", "disabled");
      $('input#showNotifications').prop("checked", "false");
      text = 'Varsle om nyheter';
      $('label[for=showNotifications] span').html('<del>' + text + '</del> <b>Vent til Opera 12.50</b>');
      $('input#coffeeSubscription').prop("disabled", "disabled");
      $('input#coffeeSubscription').prop("checked", "false");
      text = $('label[for=coffeeSubscription] span').text();
      text = text.trim();
      $('label[for=coffeeSubscription] span').html('<del>' + text + '</del> <b>Vent til Opera 12.50</b>');
    }
    if (BROWSER === 'Opera') {
      $('#logo_subtext').css('margin-top', '7pt');
      $('#notification').css('top', '14.5pt');
    }
    $('#bus_box').hover(function() {
      return $(this).addClass('hover');
    }, function() {
      return $(this).removeClass('hover');
    });
    return $('input:checkbox').click(function() {
      if (this.id === 'useInfoscreen') {
        return toggleInfoscreen(this.checked);
      } else {
        ls[this.id] = this.checked;
        if (this.id === 'showOffice' && this.checked === true) {
          Browser.getBackgroundProcess().updateOfficeAndMeetings(true);
        }
        if (this.id === 'showOffice' && this.checked === false) {
          Browser.setIcon('img/icon-default.png');
          Browser.setTitle(EXTENSION_NAME);
        }
        if (this.id === 'showNotifications' && this.checked === true) {
          testDesktopNotification();
        }
        if (this.id === 'coffeeSubscription' && this.checked === true) {
          testCoffeeSubscription();
        }
        return displayOnPageNotification();
      }
    });
  });

}).call(this);
