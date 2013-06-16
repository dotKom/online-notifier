// Generated by CoffeeScript 1.4.0
(function() {
  var $, busLoading, clickDinnerLink, createBusDataRequest, displayItems, findUpdatedPosts, insertBusInfo, iteration, listDinners, ls, mainLoop, newsLimit, updateBus, updateCantinas, updateCoffee, updateHours, updateMeetings, updateNews, updateOffice, updateServant,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = jQuery;

  ls = localStorage;

  iteration = 0;

  newsLimit = 4;

  window.IS_MOBILE = 1;

  mainLoop = function() {
    if (DEBUG) {
      console.log("\n#" + iteration);
    }
    if (iteration % UPDATE_OFFICE_INTERVAL === 0 && ls.showOffice === 'true') {
      updateOffice();
    }
    if (iteration % UPDATE_SERVANT_INTERVAL === 0 && ls.showOffice === 'true') {
      updateServant();
    }
    if (iteration % UPDATE_MEETINGS_INTERVAL === 0 && ls.showOffice === 'true') {
      updateMeetings();
    }
    if (iteration % UPDATE_COFFEE_INTERVAL === 0 && ls.showOffice === 'true') {
      updateCoffee();
    }
    if (iteration % UPDATE_CANTINAS_INTERVAL === 0 && ls.showCantina === 'true') {
      updateCantinas();
    }
    if (iteration % UPDATE_HOURS_INTERVAL === 0 && ls.showCantina === 'true') {
      updateHours();
    }
    if (iteration % UPDATE_BUS_INTERVAL === 0 && ls.showBus === 'true') {
      updateBus();
    }
    if (iteration % UPDATE_NEWS_INTERVAL === 0) {
      updateNews();
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
        $('#office #status').html(title);
        $('#office #status').attr('class', status);
        $('#office #subtext').html(message);
        ls.currentStatus = status;
        return ls.currentStatusMessage = message;
      }
    });
  };

  updateServant = function() {
    if (DEBUG) {
      console.log('updateServant');
    }
    return Servant.get(function(servant) {
      return $('#todays #schedule #servant').html('- ' + servant);
    });
  };

  updateMeetings = function() {
    if (DEBUG) {
      console.log('updateMeetings');
    }
    return Meetings.get(function(meetings) {
      meetings = meetings.replace(/\n/g, '<br />');
      return $('#todays #schedule #meetings').html(meetings);
    });
  };

  updateCoffee = function() {
    if (DEBUG) {
      console.log('updateCoffee');
    }
    return Coffee.get(true, function(pots, age) {
      $('#todays #coffee #pots').html('- ' + pots);
      return $('#todays #coffee #age').html(age);
    });
  };

  updateCantinas = function() {
    if (DEBUG) {
      console.log('updateCantinas');
    }
    Cantina.get(ls.leftCantina, function(menu) {
      var cantinaName;
      cantinaName = Cantina.names[ls.leftCantina];
      $('#cantinas #left .title').html(cantinaName);
      return $('#cantinas #left #dinnerbox').html(listDinners(menu));
    });
    return Cantina.get(ls.rightCantina, function(menu) {
      var cantinaName;
      cantinaName = Cantina.names[ls.rightCantina];
      $('#cantinas #right .title').html(cantinaName);
      return $('#cantinas #right #dinnerbox').html(listDinners(menu));
    });
  };

  listDinners = function(menu) {
    var dinner, dinnerlist, _i, _len;
    dinnerlist = '';
    if (typeof menu === 'string') {
      ls.noDinnerInfo = 'true';
      dinnerlist += '<li>' + menu + '</li>';
    } else {
      ls.noDinnerInfo = 'false';
      for (_i = 0, _len = menu.length; _i < _len; _i++) {
        dinner = menu[_i];
        if (dinner.price !== null) {
          if (!isNaN(dinner.price)) {
            dinner.price = dinner.price + ',-';
          } else {
            dinner.price = dinner.price + ' -';
          }
          dinnerlist += '<li id="' + dinner.index + '">' + dinner.price + ' ' + dinner.text + '</li>';
        } else {
          dinnerlist += '<li class="message" id="' + dinner.index + '">"' + dinner.text + '"</li>';
        }
      }
    }
    return dinnerlist;
  };

  clickDinnerLink = function(cssSelector) {
    return $(cssSelector).click(function() {
      Browser.openTab(Cantina.url);
      return window.close();
    });
  };

  updateHours = function() {
    if (DEBUG) {
      console.log('updateHours');
    }
    Hours.get(ls.leftCantina, function(hours) {
      return $('#cantinas #left .hours').html(hours);
    });
    return Hours.get(ls.rightCantina, function(hours) {
      return $('#cantinas #right .hours').html(hours);
    });
  };

  updateBus = function() {
    if (DEBUG) {
      console.log('updateBus');
    }
    if (!navigator.onLine) {
      $('#bus #firstBus .name').html(ls.firstBusName);
      $('#bus #secondBus .name').html(ls.secondBusName);
      $('#bus #firstBus .first .line').html('<div class="error">Frakoblet fra api.visuweb.no</div>');
      return $('#bus #secondBus .first .line').html('<div class="error">Frakoblet fra api.visuweb.no</div>');
    } else {
      createBusDataRequest('firstBus', '#firstBus');
      return createBusDataRequest('secondBus', '#secondBus');
    }
  };

  createBusDataRequest = function(bus, cssIdentificator) {
    var activeLines;
    activeLines = ls[bus + 'ActiveLines'];
    activeLines = JSON.parse(activeLines);
    return Bus.get(ls[bus], activeLines, function(lines) {
      return insertBusInfo(lines, ls[bus + 'Name'], cssIdentificator);
    });
  };

  insertBusInfo = function(lines, stopName, cssIdentificator) {
    var busStop, i, spans, _results;
    busStop = '#bus ' + cssIdentificator;
    spans = ['first', 'second', 'third'];
    $(busStop + ' .name').html(stopName);
    for (i in spans) {
      $(busStop + ' .' + spans[i] + ' .line').html('');
      $(busStop + ' .' + spans[i] + ' .time').html('');
    }
    if (typeof lines === 'string') {
      return $(busStop + ' .first .line').html('<div class="error">' + lines + '</div>');
    } else {
      if (lines['departures'].length === 0) {
        return $(busStop + ' .first .line').html('<div class="error">....zzzZZZzzz....</div>');
      } else {
        _results = [];
        for (i in spans) {
          $(busStop + ' .' + spans[i] + ' .line').append(lines['destination'][i]);
          _results.push($(busStop + ' .' + spans[i] + ' .time').append(lines['departures'][i]));
        }
        return _results;
      }
    }
  };

  updateNews = function() {
    var affiliation, affiliationKey1, getNewsAmount;
    if (DEBUG) {
      console.log('updateNews');
    }
    affiliationKey1 = ls['affiliationKey1'];
    affiliation = Affiliation.org[affiliationKey1];
    if (affiliation === void 0) {
      if (DEBUG) {
        return console.log('ERROR: chosen affiliation', affiliationKey1, 'is not known');
      }
    } else {
      getNewsAmount = 10;
      return News.get(affiliation, getNewsAmount, function(items) {
        var name;
        if (typeof items === 'string') {
          if (DEBUG) {
            console.log('ERROR:', items);
          }
          name = Affiliation.org[affiliationKey1].name;
          return $('#news').html('<div class="post"><div class="title">Nyheter</div><div class="item">Frakoblet fra ' + name + '</div></div>');
        } else {
          ls.feedItems = JSON.stringify(items);
          News.refreshNewsIdList(items);
          return displayItems(items);
        }
      });
    }
  };

  displayItems = function(items) {
    var altLink, feedKey, index, link, newsList, updatedList, viewedList;
    $('#news').html('');
    feedKey = items[0].feedKey;
    newsList = JSON.parse(ls.newsList);
    viewedList = JSON.parse(ls.viewedNewsList);
    updatedList = findUpdatedPosts(newsList, viewedList);
    viewedList = [];
    $.each(items, function(index, item) {
      var altLink, date, htmlItem, _ref;
      if (index < newsLimit) {
        viewedList.push(item.link);
        htmlItem = '<div class="post"><div class="title">';
        if (index < ls.unreadCount) {
          if (_ref = item.link, __indexOf.call(updatedList.indexOf, _ref) >= 0) {
            htmlItem += '<span class="unread">UPDATED <b>::</b> </span>';
          } else {
            htmlItem += '<span class="unread">NEW <b>::</b> </span>';
          }
        }
        date = altLink = '';
        if (item.date !== null) {
          date = ' den ' + item.date;
        }
        if (item.altLink !== null) {
          altLink = ' name="' + item.altLink + '"';
        }
        htmlItem += item.title + '\
        </div>\
          <div class="item" data="' + item.link + '"' + altLink + '>\
            <img src="' + item.image + '" width="107" />\
            <div class="textwrapper">\
              <div class="author">&ndash; Skrevet av ' + item.creator + date + '</div>\
              ' + item.description + '\
            </div>\
          </div>\
        </div>';
        return $('#news').append(htmlItem);
      }
    });
    ls.viewedNewsList = JSON.stringify(viewedList);
    Browser.setBadgeText('');
    ls.unreadCount = 0;
    $('.item').click(function() {
      var altLink, useAltLink;
      altLink = $(this).attr('name');
      useAltLink = Affiliation.org[ls.affiliationKey1].useAltLink;
      if (altLink !== void 0 && useAltLink === true) {
        Browser.openTab($(this).attr('name'));
      } else {
        Browser.openTab($(this).attr('data'));
      }
      return window.close();
    });
    if (Affiliation.org[feedKey].useAltLink) {
      altLink = $('.item[data="' + link + '"]').attr('name');
      if (altLink !== 'null') {
        $('.item[data="' + link + '"]').attr('data', altLink);
      }
    }
    if (Affiliation.org[feedKey].getImage !== void 0) {
      for (index in viewedList) {
        link = viewedList[index];
        Affiliation.org[feedKey].getImage(link, function(link, image) {
          return $('.item[data="' + link + '"] img').attr('src', image);
        });
      }
    }
    if (Affiliation.org[feedKey].getImages !== void 0) {
      return Affiliation.org[feedKey].getImages(viewedList, function(links, images) {
        var _results;
        _results = [];
        for (index in links) {
          _results.push($('.item[data="' + links[index] + '"] img').attr('src', images[index]));
        }
        return _results;
      });
    }
  };

  findUpdatedPosts = function(newsList, viewedList) {
    var i, j, updatedList;
    updatedList = [];
    for (i in newsList) {
      if (newsList[i] === viewedList[0]) {
        break;
      }
      for (j in viewedList) {
        if (j === 0) {
          continue;
        }
        if (newsList[i] === viewedList[j]) {
          updatedList.push(newsList[i]);
        }
      }
    }
    return updatedList;
  };

  busLoading = function(cssIdentificator) {
    var cssSelector, loading, span, spans, _i, _len, _results;
    if (DEBUG) {
      console.log('busLoading:', cssIdentificator);
    }
    cssSelector = '#' + cssIdentificator;
    loading = cssIdentificator === 'firstBus' ? 'loadingLeft' : 'loadingRight';
    $(cssSelector + ' .name').html('<img class="' + loading + '" src="mimg/loading.gif" />');
    spans = ['first', 'second', 'third', 'fourth'];
    _results = [];
    for (_i = 0, _len = spans.length; _i < _len; _i++) {
      span = spans[_i];
      $(cssSelector + ' .' + span + ' .line').html('');
      _results.push($(cssSelector + ' .' + span + ' .time').html(''));
    }
    return _results;
  };

  $(function() {
    $.ajaxSetup(AJAX_SETUP);
    busLoading('firstBus');
    busLoading('secondBus');
    if (ls.background_image !== void 0) {
      $('body').attr('style', 'background-attachment:fixed;background-image:' + ls.background_image);
    } else {
      $('head').append('<script src="mimg/background_image.js"></script>');
      $('body').attr('style', 'background-attachment:fixed;background-image:' + BACKGROUND_IMAGE);
      ls.background_image = BACKGROUND_IMAGE;
    }
    return mainLoop();
  });

}).call(this);
