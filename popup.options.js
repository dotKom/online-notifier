popup.options = {

  loadAll: function() {
    this.loadBigOptionValues();
    this.loadCoffeeOptionValues();
    this.loadCantinaOptionValues();
  },

  bindAll: function() {
    this.bindBigOptions();
    this.bindCoffeeOptions();
    this.bindCantinaOptions();
  },

  //
  // Big options
  //

  loadBigOptionValues: function () {
    var showCantina = ('true' === ls.showCantina);
    $('input#showCantina').prop('checked', showCantina);
    var showBus = ('true' === ls.showBus);
    $('input#showBus').prop('checked', showBus);
  },

  bindBigOptions: function () {
    $('input#showCantina').click(function() {
      // Save
      ls[this.name] = this.checked;
      // Animate
      if (this.checked === true) {
        $('#cantinas').slideDown();
      }
      else {
        $('#cantinas').slideUp();
      }
      // Track
      Analytics.trackEvent('toggleCantinas', this.checked);
    });
    $('input#showBus').click(function() {
      // Save
      ls[this.name] = this.checked;
      // Animate
      if (this.checked === true) {
        $('#bus').slideDown();
      }
      else {
        $('#bus').slideUp();
      }
      // Track
      Analytics.trackEvent('toggleBus', this.checked);
    });
  },

  //
  // Coffee
  //

  loadCoffeeOptionValues: function() {
    var checked = ls.coffeeSubscription;
    $('input#coffeeSubscription').prop('checked', checked);
  },

  bindCoffeeOptions: function() {
    var self = this;
    $('input#coffeeSubscription').click(function() {
      // Save
      ls[this.name] = this.checked;
      // Demo
      if (this.checked === true) {
        ls.activelySetCoffee = 'true';
        Coffee.showNotification();
      }
      else {
        // Note: activelySetCoffee is a reminder about what concious choice the user has made.
        // Don't override that choice with defaults later.
        ls.activelySetCoffee = 'true';
      }
      // Track
      Analytics.trackEvent('clickCoffeeOption', this.checked);
    });
  },

  //
  // Cantinas
  //

  loadCantinaOptionValues: function() {
    // Dropdowns
    $('#cantinas .first .options select').val(ls.cantina1);
    $('#cantinas .second .options select').val(ls.cantina2);
  },

  bindCantinaOptions: function() {
    
    var bindOption = function(selector, storageKey) {
      var cantina = '#cantinas ' + selector + ' ';

      // Content
      var title = cantina + '.title';
      var hoursBox = cantina + '.hours';
      var dinnerBox = cantina + '.dinnerBox';

      // Options
      var selectCantina = cantina + 'select';
      // var showLunch = cantina + 'input#showLunch';////////////////
      // var showDinner = cantina + 'input#showDinner';////////////////

      // Handle change
      $(selectCantina).change(function () {
        // Save
        ls[storageKey] = this.value; // ls.cantina1, ls.cantina2
        // Set new title
        var name = Cantina.names[this.value];
        $(title).text(name);
        // Add loading bar
        $(hoursBox).html('');
        $(dinnerBox).html('<img class="loadingLeft" src="img/loading.gif" />');
        // Prepare for connection error
        window._cantinaOptionTimeout_ = setTimeout(function() {
          $(hoursBox).html('');
          $(dinnerBox).html(Cantina.msgConnectionError);
        }, 6000);
        // Load
        Browser.getBackgroundProcess().updateCantinas(function () {
          clearTimeout(window._cantinaOptionTimeout_);
          popup.update.cantinas();
        });
        // Track
        Analytics.trackEvent('clickCantinaOption', name);
      });
    }
    // Hit it
    bindOption('.first', 'cantina1');
    bindOption('.second', 'cantina2');
  },

  //
  // News
  //

  testDesktopNotification: function() {
    News.showNotification();
  },

  bindNews: function() {

  },

};
