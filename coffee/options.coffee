# Notify Coffeescript that jQuery is here
$ = jQuery
ls = localStorage

resizeBackgroundImage = ->
  if 1550 < $(window).width()
    $('#background').attr "style", "background:url('img/background-large.png') center center no-repeat;"
  else if 1200 < $(window).height()
    $('#background').attr "style", "background:url('img/background-large-vertical.png') center center no-repeat;"
  else
    $('#background').attr "style", "background:url('img/background-medium.png') center center no-repeat;"

displayOnPageNotification = ->
  $("#notification").fadeIn 200
  setTimeout ( ->
    $("#notification").fadeOut 200
  ), 800

pageFlipCursorBlinking = ->
  $(".pageflipcursor").animate opacity: 0, "fast", "swing", ->
    $(@).animate opacity: 1, "fast", "swing",

updateOfficeStatus = ->
  Office.get (status, title, message) ->
    chrome.browserAction.setIcon {path: 'img/icon-'+status+'.png'}
    ls.currentStatus = status
    Office.getTodaysEvents (meetingPlan) ->
      meetingPlan = $.trim meetingPlan
      today = '### Nå\n' + title + ": " + message + "\n\n### Resten av dagen\n" + meetingPlan
      chrome.browserAction.setTitle {title: today}
      ls.currentStatusMessage = message

testDesktopNotification = ->
  notification = webkitNotifications.createHTMLNotification('notification.html')
  notification.show()

bindBusFields = (busField) ->
  cssSelector = '#' + busField
  if DEBUG then console.log 'Binding bus fields for ' + cssSelector
  fadeTime = 50

  stop = $(cssSelector + ' input')
  direction = $(cssSelector + ' select')
  lines = $(cssSelector + ' .lines .line') # array of spans with bus lines

  # Load users saved buses
  loadBus busField

  $(stop).focus ->
    
    # Clear stop field on click
    if DEBUG then console.log 'focus - clear field and show saved value as placeholder'
    ls.busStopClickedAway = ls[busField+'_name']
    $(stop).val ''
    $(stop).attr 'placeholder', ls.busStopClickedAway

  $(stop).focusout ->
    
    # Lost focus, suggestions on busstops?
    partialStop = $(stop).val()
    suggestions = Bus.getPotentialStops partialStop

    # No input, revert to the busstop that was clicked away
    if partialStop is '' or suggestions.length is 0
      if DEBUG then console.log 'focusout - empty field or invalid input, return to last saved value'
      if ls.busStopClickedAway isnt null
        $(stop).val ls.busStopClickedAway
      $('#bus_suggestions').html ''
    # 1 suggestion, go for it!
    else if suggestions.length is 1
      if DEBUG then console.log 'focusout - 1 suggestion, save it'
      correctStop = suggestions[0]
      $(stop).val correctStop
      $('#bus_suggestions').html ''
      getDirections busField, correctStop
      getLines busField
      saveBus busField
    # Several suggestions, allow the user to see them and click them for a short while
    else if suggestions.length > 1
      if DEBUG then console.log 'focusout - several suggestions, remove them'
      setTimeout ( ->
        $('#bus_suggestions .suggestion').fadeOut ->
          $('#bus_suggestions').html ''
      ), 5000
      # # Check if any of them match the partial stop exactly
      # partialStop = partialStop.toLowerCase()
      # foundOne = false
      # for i of suggestions
      #   possibleStop = suggestions[i].toLowerCase()
      #   if possibleStop is partialStop
      #     correctStop = suggestions[i]
      #     $(stop).val correctStop
      #     $('#bus_suggestions').html ''
      #     getDirections busField, correctStop
      #     getLines busField
      #     saveBus busField
      #     foundOne = true
      # if foundOne is false
      #   if ls.busStopClickedAway isnt null
      #     $(stop).val ls.busStopClickedAway
      #   $('#bus_suggestions').html ''
    else
      if DEBUG then console.log 'focusout - nothing to do'

  $(stop).keyup (event) ->

    # Do nothing if arrow key or function key is pressed
    if event.keyCode in [37..40] or event.keyCode in [17..18] or event.keyCode is 91
      if DEBUG then console.log 'keyup - arrow key or function key, do nothing'

    # If Enter is clicked, check it and save it
    else if event.keyCode is 13
      if DEBUG then console.log 'keyup - enter, checking input'
      possibleStop = $(stop).val()
      suggestions = Bus.getStopIds possibleStop
      if suggestions.length isnt 0
        realStopName = Bus.getStopName suggestions[0]
        $(stop).val realStopName
        # then empty the suggestion list
        $('#bus_suggestions').html ''
        # then show only the correct stop for a little over a second
        suggestion = $('<div class="correct">' + realStopName + '</div>').hide()
        $('#bus_suggestions').append suggestion
        $(suggestion).fadeIn()
        setTimeout ( ->
          $('#bus_suggestions .correct').fadeOut fadeTime
          setTimeout ( ->
            $('#bus_suggestions').html ''
          ), 300
        ), 1200
        # and of course, save and get directions
        getDirections busField, realStopName
        getLines busField
        saveBus busField

    # If anything else is clicked, get suggestions
    else
      if DEBUG then console.log 'keyup - getting suggestions'
      # Save the id of the bus field in focus
      ls.busInFocus = $(stop).parent().attr 'id'
      # Find the partial name
      nameStart = $(stop).val()

      if nameStart.length > 0
        # Suggestions
        suggestions = Bus.getPotentialStops nameStart
        $('#bus_suggestions').html ''
        for i of suggestions
          _text = suggestions[i]
          # # Highlight matched characters
          # for char, index in nameStart
          #   _text = _text.replace char, '<span class="matched_character">'+char+'</span>'
          suggestion = $('<div class="suggestion">' + _text + '</div>').hide()

          $('#bus_suggestions').append suggestion
          $(suggestion).fadeIn()

        # Only one suggestion? Inject it
        if suggestions.length is 1
          correctStop = suggestions[0]
          $(stop).val correctStop
          $(stop).blur()
          $('#bus_suggestions').html ''
          suggestion = $('<div class="correct">' + correctStop + '</div>').hide()
          $('#bus_suggestions').append suggestion
          $(suggestion).fadeIn()
          setTimeout ( ->
            $('#bus_suggestions .correct').fadeOut fadeTime
            setTimeout ( ->
              $('#bus_suggestions').html ''
            ), 300
          ), 1200
          getDirections busField, correctStop
          getLines busField
          saveBus busField
      # All characters removed, remove suggestions
      else
        $('#bus_suggestions .suggestion').fadeOut fadeTime, ->
          $('#bus_suggestions').html ''  
      # After inserting new results, rebind suggestions, making them clickable
      bindSuggestions()

  $(direction).change ->

    # Save bus line if user changes the direction field
    saveBus busField

  $(lines).click ->

    # WAT is dis
    console.log this ################################################################

getDirections = (busField, correctStop) ->
  cssSelector = '#' + busField
  stopName = $(cssSelector + ' input')
  direction = $(cssSelector + ' select')
  # Get and inject possible directions for correct stop
  allDirections = Bus.getDirections correctStop
  $(direction).html ''
  for i in allDirections
    $(direction).append '<option>' + i + '</option>'

getLines = (busField) ->
  cssSelector = '#' + busField
  # Loading gif
  if busField.contains? 'first'
    $(cssSelector + ' .lines').html '<img class="loading_left" src="img/loading.gif" />'
  else if busField.contains? 'second'
    $(cssSelector + ' .lines').html '<img class="loading_right" src="img/loading.gif" />'
  # Get stopname, direction, stopid
  stopName = $(cssSelector + ' input').val()
  direction = $(cssSelector + ' select').val()
  busStopId = Bus.getStop stopName, direction
  # Get and inject possible lines for correct stop
  busStopId = Bus.getStop stopName, direction
  lines = Bus.getStopLines busStopId, (json) ->
    # Is result an error message?
    if typeof json is 'string'
      console.log 'appending error msg'
      $(cssSelector + ' .lines').html '<span class="error">'+line+'</span>&nbsp;&nbsp;'
    else
      # Remove duplicate lines
      arrayOfLines = []
      for item in json.lines
        if -1 is arrayOfLines.indexOf String(item.line)
          arrayOfLines.push item.line
      # Sort lines
      arrayOfLines = arrayOfLines.sort()
      arrayOfLines = arrayOfLines.reverse()
      # Add lines to bus stop
      $(cssSelector + ' .lines').html ''
      for line in arrayOfLines
        $(cssSelector + ' .lines').append '<span class="active">'+line+'</span>&nbsp;&nbsp;'

saveBus = (busField) ->
  cssSelector = '#' + busField
  # Get stopname, direction, stopid
  stopName = $(cssSelector + ' input').val()
  direction = $(cssSelector + ' select').val()
  busStopId = Bus.getStop stopName, direction
  # Get active/inactive lines
  activeLines = []
  $(cssSelector + ' .lines .active').each ->
    activeLines.push $(this).text()
  inactiveLines = []
  $(cssSelector + ' .lines .inactive').each ->
    inactiveLines.push $(this).text()
  # Save all to localStorage
  ls[busField] = busStopId
  ls[busField + '_name'] = stopName
  ls[busField + '_direction'] = direction
  ls[busField + '_active_lines'] = activeLines
  ls[busField + '_inactive_lines'] = inactiveLines
  if DEBUG then console.log 'saving activeLines for '+busField, '"', activeLines, '"' ######################################
  if DEBUG then console.log 'saving inactiveLines '+busField, '"', inactiveLines, '"' ######################################
  displayOnPageNotification()
  if DEBUG then console.log 'saved http://api.visuweb.no/bybussen/1.0/Departure/Realtime/' + busStopId + '/f6975f3c1a3d838dc69724b9445b3466'

loadBus = (busField) ->
  cssSelector = '#' + busField
  stopName = ls[busField + '_name']
  direction = ls[busField + '_direction']
  activeLines = ls[busField + '_active_lines']
  inactiveLines = ls[busField + '_inactive_lines']
  console.log 'lol "' + activeLines+'"'
  console.log 'rofl "' + inactiveLines+'"'
  
  if stopName isnt undefined and direction isnt undefined
    $(cssSelector + ' input').val stopName
    $(cssSelector + ' select').val direction
    if DEBUG then console.log 'loaded "' + stopName + '" to "' + busField + '"'
  
  if activeLines isnt undefined and inactiveLines isnt undefined
    if activeLines isnt '' and inactiveLines isnt ''

      activeLines = JSON.parse activeLines # stringified array
      inactiveLines = JSON.parse inactiveLines # stringified array
      console.log 'lmao "' + activeLines + '"'
      console.log 'durr "' + inactiveLines + '"'
      # Sort lines
      lines = {}
      for line in activeLines
        lines[line] = true
      for line in inactiveLines
        lines[line] = false
      console.log 'all lines for '+ cssSelector+ lines

      # Add lines to bus stop
      # $(cssSelector + ' .lines').html ''
      # for line in arrayOfLines
      #   $(cssSelector + ' .lines').append '<span class="active">'+line+'</span>&nbsp;&nbsp;'


bindSuggestions = ->
  $('.suggestion').click ->
    if ls.busInFocus isnt undefined
      text = $(this).text()
      $('#' + ls.busInFocus + ' input').val text
      getDirections ls.busInFocus, text
      getLines ls.busInFocus
      saveBus ls.busInFocus
      $('#bus_suggestions .suggestion').fadeOut 50, ->
        $('#bus_suggestions').html ''

toggleInfoscreen = (activate, force) -> # Welcome to callback hell, - be glad it's well commented
  speed = 400
  id = 'useInfoscreen'
  if activate
    $('#'+id).attr 'checked', false
    # Remove subtext
    $('#logo_subtext').fadeOut()
    # Animate away all other options
    $('#container #left').animate {'width':'0pt'}, speed, ->
      $('#container #left').hide()
      $('#infoscreen_slider').slideUp speed, ->
        # Animate in the infoscreen preview
        $('#infoscreen_preview').fadeIn speed, ->
          # New logo subtext
          $('#logo_subtext').html 'infoscreen&nbsp;&nbsp;&nbsp;&nbsp;'
          $('#logo_subtext').fadeIn ->
            # Move logo and subtext a little to the right
            $('header #logo_subtext').animate {'margin-left':'265pt'}, speed
            $('header #logo').animate {'margin-left':'75pt'}, speed
            # Move infoscreen preview to the circa middle of the screen
            $('#container #right').animate {'margin-left':'180pt'}, speed
            # Move all content a bit up
            $('header').animate {'top':'40%'}, speed
            $('#container').animate {'top':'40%'}, speed, ->
              if force or confirm 'Sikker på at du vil skru på Online Infoscreen?\n\n- Krever full-HD skjerm som står på høykant\n- Popup-knappen åpner Infoskjerm i stedet\n- Infoskjermen skjuler musepekeren\n- Infoskjermen åpnes hver gang Chrome starter\n- Infoskjermen åpnes nå!'
                # Enable, and check the checkbox
                ls[id] = 'true'
                $('#'+id).attr 'checked', true
                # Reset icon, icon title and icon badge
                chrome.browserAction.setIcon {path: 'img/icon-default.png'}
                chrome.browserAction.setTitle {title: 'Online Infoscreen'}
                chrome.browserAction.setBadgeText {text: ''}
                # Create Infoscreen in a new tab
                if not force then chrome.tabs.create {url: chrome.extension.getURL("infoscreen.html"), selected: false}
              else
                revertInfoscreen()
  else
    # Disable
    ls[id] = 'false'
    # # Close any open Infoscreen tabs
    # closeInfoscreenTabs()
    # Refresh office status
    updateOfficeStatus()
    # Animations
    revertInfoscreen()

revertInfoscreen = ->
  speed = 300
  # Remove subtext
  $('#logo_subtext').fadeOut speed, ->
    # Move all content back down
    $('#container').animate {'top':'50%'}, speed
    $('header').animate {'top':'50%'}, speed
    # Move infoscreen preview back in place (to the left)
    $('#container #right').animate {'margin-left':'0'}, speed
    # Move logo and subtext back in place (to the left)
    $('header #logo_subtext').animate {'margin-left':'215pt'}, speed
    $('header #logo').animate {'margin-left':'25pt'}, speed, ->
      # Animate in the infoscreen preview
      $('#infoscreen_preview').fadeOut speed, ->
        # Slide more options back open
        $('#infoscreen_slider').slideDown speed, ->
          # Show the rest of the options again
          $('#container #left').show()
          # Animate in the rest of the options
          $('#container #left').animate {'width':'54%'}, speed, ->
            # Back to old logo subtext
            $('#logo_subtext').html 'notifier options'
            $('#logo_subtext').fadeIn()


# COMMENTED OUT: This requires 'tabs' permission, which isn't cool.
# closeInfoscreenTabs = ->
#   chrome.windows.getAll
#     populate: true,
#     (window_list) ->
#       list = []
#       for win of window_list
#         tabs = window_list[win].tabs
#         for tab of tabs
#           tab = tabs[tab]
#           titleIndex = tab.title.indexOf "Infoscreen"
#           urlIndex = tab.url.indexOf "infoscreen.html"
#           if titleIndex >= 0
#             if urlIndex >= 0
#               chrome.tabs.remove tab.id

fadeInCanvas = ->
  webGLStart()
  $('#LessonCanvas').animate
    opacity:1,
    1300,
    'swing',
    ->
      setTimeout ( ->
        $('#LessonCanvas').animate
          opacity:0,
          1300,
          'swing'
      ), 200

# Document ready, go!
$ ->
  if DEBUG then less.watch() # not needed when using CodeKit
  if DEBUG then $('#debug_links').show()

  # Restore checks to boxes from localStorage
  $('input:checkbox').each (index, element) ->
    if ls[element.id] is 'true'
      element.checked = true

  # If useInfoscreen is on, slide away the rest of the options and switch the logo subtext
  if ls.useInfoscreen is 'true'
    setTimeout ( ->
      toggleInfoscreen true, true
    ), 300

  # Bind the windows resize function
  $(window).bind "resize", resizeBackgroundImage
  resizeBackgroundImage() # Run once in case the window is quite big
  
  # Minor esthetical adjustments for OS version
  if OPERATING_SYSTEM is 'Windows'
    $('#pagefliptext').attr "style", "bottom:9px;"
    $('#pagefliplink').attr "style", "bottom:9px;"

  # Blinking cursor at pageflip
  setInterval ( ->
    pageFlipCursorBlinking()
  ), 600

  # Fade in the +1 button when (probably) ready
  setTimeout ( ->
    $('#plusonebutton').fadeIn 150
  ), 1100

  # Bind a click function to the on-page notification for the canvas
  # $('#notification').click ->
  #   fadeInCanvas()

  # Give user suggestions for autocomplete of bus stops
  bindBusFields 'first_bus'
  bindBusFields 'second_bus'

  # Bind the infoscreen option to an avgrund.js modal dialog
  # $('#useInfoscreen').avgrund
  #   width: 540,
  #   height: 330,
  #   holderClass: 'custom',
  #   showClose: true,
  #   showCloseText: 'Avbryt',
  #   enableStackAnimation: true,
  #   onBlurContainer: '#avgrund',
  #   template: '
  #     <img class="avgrund_image" src="/img/options-infoscreen-preview.png" />
  #     <div class="avgrund_content">
  #       <b>Sikker på at du vil skru på infoskjerm?</b>
  #       <ul style="text-align:left;">
  #         <li>Popupknappen vil åpne infoskjerm</li>
  #         <li>Infoskjerm åpnes i fullscreen ved oppstart</li>
  #         <li>Infoskjermen vil åpnes nå!</li>
  #       </ul>
  #       <a href="#" class="button yesbutton" onclick="">Skru på infoskjerm</a>
  #       <a href="#" class="button nobutton">Avbryt</a>
  #     </div>'

  # Catch new clicks
  $('input:checkbox').click ->
    
    # Special case for 'useInfoscreen'
    if this.id is 'useInfoscreen'
      toggleInfoscreen this.checked

    # All the other checkboxes (not Infoscreen)
    else
      ls[this.id] = this.checked;
      
      if this.id is 'showOffice' and this.checked is false
        chrome.browserAction.setIcon {path: 'img/icon-default.png'}
        chrome.browserAction.setTitle {title: EXTENSION_NAME}
      else if this.id is 'showOffice' and this.checked is true
        updateOfficeStatus()
      
      if this.id is 'showNotifications' and this.checked is true
        testDesktopNotification()

      displayOnPageNotification()