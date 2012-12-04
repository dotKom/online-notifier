// Generated by CoffeeScript 1.3.3
(function() {
  var $, insertBusInfo, iteration, ls, mainLoop, updateBus, updateCantinas, updateNews, updateOffice;

  $ = jQuery;

  ls = localStorage;

  iteration = 0;

  mainLoop = function() {
    if (DEBUG) {
      console.log("\n#" + iteration);
    }
    if (iteration % UPDATE_OFFICE_INTERVAL === 0) {
      updateOffice();
    }
    if (iteration % UPDATE_NEWS_INTERVAL === 0) {
      updateNews();
    }
    if (iteration % UPDATE_BUS_INTERVAL === 0) {
      updateBus();
    }
    if (iteration % UPDATE_CANTINAS_INTERVAL === 0) {
      updateCantinas();
    }
    if (10000 < iteration) {
      iteration = 0;
    } else {
      iteration++;
    }
    return setTimeout((function() {
      return mainLoop();
    }), PAGE_LOOP);
  };

  updateOffice = function() {
    if (DEBUG) {
      console.log('updateOffice');
    }
    return Office.get(function(status, title, message) {
      if (ls.currentStatus !== status || ls.currentStatusMessage !== message) {
        $('#office img').attr('src', 'img/status-' + status + '.png');
        $('#office #subtext').html(message);
        ls.currentStatus = status;
        return ls.currentStatusMessage = message;
      }
    });
  };

  updateNews = function() {
    var displayStories;
    if (DEBUG) {
      console.log('updateNews');
    }
    fetchFeed(function() {
      var response;
      response = ls.lastResponseData;
      if (response !== null) {
        return displayStories(response);
      } else {
        return console.log('ERROR: response was null');
      }
    });
    return displayStories = function(xmlstring) {
      var $xml, idsOfLastViewed, index, items, value, xmldoc, _guid, _mostRecent, _results, _text;
      xmldoc = $.parseXML(xmlstring);
      $xml = $(xmldoc);
      items = $xml.find("item");
      _guid = $(items[0]).find("guid");
      _text = $(_guid).text();
      _mostRecent = _text.split('/')[4];
      if (ls.mostRecentRead === _mostRecent) {
        return;
      }
      ls.mostRecentRead = _mostRecent;
      $('#news').html('');
      idsOfLastViewed = [];
      items.each(function(index, element) {
        var item, limit, post;
        limit = ls.noDinnerInfo === 'true' ? 4 : 3;
        if (index < limit) {
          post = parsePost(element);
          idsOfLastViewed.push(post.id);
          item = '<div class="post"><span class="read"></span>';
          item += '\
            <span class="title">' + post.title + '</span>\
            <div class="item">\
              <img id="' + post.id + '" src="' + post.image + '" width="107" />\
              <div class="textwrapper">\
                <div class="emphasized">- Av ' + post.creator + ', skrevet ' + post.date + '</div>\
                ' + post.description + '\
              </div>\
            </div>\
          </div>';
          return $('#news').append(item);
        }
      });
      _results = [];
      for (index in idsOfLastViewed) {
        value = idsOfLastViewed[index];
        _results.push(getImageUrlForId(value, function(id, image) {
          return $('#' + id).attr('src', image);
        }));
      }
      return _results;
    };
  };

  updateBus = function() {
    var amountOfLines, first_stop_name, second_stop_name;
    if (DEBUG) {
      console.log('updateBus');
    }
    if (!navigator.onLine) {
      $('#bus #left .name').html(ls.first_bus_name);
      $('#bus #right .name').html(ls.second_bus_name);
      $('#bus #left .first .line').html('Frakoblet');
      return $('#bus #right .first .line').html('Frakoblet');
    } else {
      first_stop_name = ls.first_bus_name;
      second_stop_name = ls.second_bus_name;
      amountOfLines = 4;
      Bus.getAnyLines(ls.first_bus, amountOfLines, function(lines) {
        return insertBusInfo(lines, first_stop_name, '#left');
      });
      return Bus.getAnyLines(ls.second_bus, amountOfLines, function(lines) {
        return insertBusInfo(lines, second_stop_name, '#right');
      });
    }
  };

  insertBusInfo = function(lines, stopName, cssIdentificator) {
    var counter, i, spans, _results;
    console.log('cssIdentificator');
    if (typeof lines === 'string') {
      $('#bus ' + cssIdentificator + ' .name').html(stopName);
      return $('#bus ' + cssIdentificator + ' .first .line').html(lines);
    } else {
      $('#bus ' + cssIdentificator + ' .name').html(stopName);
      spans = ['.first', '.second', '.third', '.fourth', '.fifth'];
      counter = 0;
      if (lines['departures'].length === 0) {
        return $('#bus ' + cssIdentificator + ' ' + spans[counter] + ' .line').html('<i>....zzzZZZzzz....</i>');
      } else {
        _results = [];
        for (i in lines['departures']) {
          $('#bus ' + cssIdentificator + ' ' + spans[counter] + ' .line').html(lines['destination'][i] + ' ');
          $('#bus ' + cssIdentificator + ' ' + spans[counter] + ' .time').html(lines['departures'][i]);
          _results.push(counter++);
        }
        return _results;
      }
    }
  };

  updateCantinas = function() {
    var hangaren_rss, listDinners, realfag_rss;
    if (DEBUG) {
      console.log('updateCantinas');
    }
    hangaren_rss = 'http://sit.no/rss.ap?thisId=36444&ma=on&ti=on&on=on&to=on&fr=on';
    realfag_rss = 'http://sit.no/rss.ap?thisId=36447&ma=on&ti=on&on=on&to=on&fr=on';
    Cantina.get(hangaren_rss, function(menu) {
      return $('#cantinas #hangaren #dinnerbox').html(listDinners(menu));
    });
    Cantina.get(realfag_rss, function(menu) {
      return $('#cantinas #realfag #dinnerbox').html(listDinners(menu));
    });
    return listDinners = function(menu) {
      var dinner, dinnerlist, price, _i, _len;
      dinnerlist = '';
      if (typeof menu === 'string') {
        ls.noDinnerInfo = 'true';
        dinnerlist += '<li class="dinnerlist">' + menu + '</li>';
      } else {
        ls.noDinnerInfo = 'false';
        for (_i = 0, _len = menu.length; _i < _len; _i++) {
          dinner = menu[_i];
          if (dinner.price !== null) {
            price = dinner.price + ',- ';
          } else {
            price = '';
          }
          dinnerlist += '<li class="dinnerlist">' + price + dinner.text + '</li>';
        }
      }
      return dinnerlist;
    };
  };

  $(function() {
    ls.removeItem('mostRecentRead');
    ls.removeItem('currentStatus');
    ls.removeItem('currentStatusMessage');
    if (OPERATING_SYSTEM === 'Windows') {
      $('#pagefliptext').attr("style", "bottom:9px;");
      $('#pagefliplink').attr("style", "bottom:9px;");
    }
    setInterval((function() {
      return $(".pageflipcursor").animate({
        opacity: 0
      }, "fast", "swing", function() {
        return $(this).animate({
          opacity: 1
        }, "fast", "swing");
      });
    }), 600);
    setInterval((function() {
      var linebreaks, num, random;
      random = Math.ceil(Math.random() * 25);
      linebreaks = ((function() {
        var _i, _results;
        _results = [];
        for (num = _i = 0; 0 <= random ? _i <= random : _i >= random; num = 0 <= random ? ++_i : --_i) {
          _results.push('<br />');
        }
        return _results;
      })()).join(' ');
      $('#overlay').html(linebreaks + 'preventing image burn-in...');
      $('#overlay').css('opacity', 1);
      return setTimeout((function() {
        return $('#overlay').css('opacity', 0);
      }), 3500);
    }), 1800000);
    setInterval((function() {
      return document.location.reload();
    }), 86400000);
    return mainLoop();
  });

}).call(this);
