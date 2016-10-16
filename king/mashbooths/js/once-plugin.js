// <![CDATA[
    /**
     * jQuery Once Plugin v1.2
     * http://plugins.jquery.com/project/once
     *
     * Dual licensed under the MIT and GPL licenses:
     *   http://www.opensource.org/licenses/mit-license.php
     *   http://www.gnu.org/licenses/gpl.html
     */

    (function ($) {
      var cache = {}, uuid = 0;

      /**
       * Filters elements by whether they have not yet been processed.
       *
       * @param id
       *   (Optional) If this is a string, then it will be used as the CSS class
       *   name that is applied to the elements for determining whether it has
       *   already been processed. The elements will get a class in the form of
       *   "id-processed".
       *
       *   If the id parameter is a function, it will be passed off to the fn
       *   parameter and the id will become a unique identifier, represented as a
       *   number.
       *
       *   When the id is neither a string or a function, it becomes a unique
       *   identifier, depicted as a number. The element's class will then be
       *   represented in the form of "jquery-once-#-processed".
       *
       *   Take note that the id must be valid for usage as an element's class name.
       * @param fn
       *   (Optional) If given, this function will be called for each element that
       *   has not yet been processed. The function's return value follows the same
       *   logic as $.each(). Returning true will continue to the next matched
       *   element in the set, while returning false will entirely break the
       *   iteration.
       */
      $.fn.once = function (id, fn) {
        if (typeof id != 'string') {
          // Generate a numeric ID if the id passed can't be used as a CSS class.
          if (!(id in cache)) {
            cache[id] = ++uuid;
          }
          // When the fn parameter is not passed, we interpret it from the id.
          if (!fn) {
            fn = id;
          }
          id = 'jquery-once-' + cache[id];
        }
        // Remove elements from the set that have already been processed.
        var name = id + '-processed';
        var elements = this.not('.' + name).addClass(name);

        return $.isFunction(fn) ? elements.each(fn) : elements;
      };

      /**
       * Filters elements that have been processed once already.
       *
       * @param id
       *   A required string representing the name of the class which should be used
       *   when filtering the elements. This only filters elements that have already
       *   been processed by the once function. The id should be the same id that
       *   was originally passed to the once() function.
       * @param fn
       *   (Optional) If given, this function will be called for each element that
       *   has not yet been processed. The function's return value follows the same
       *   logic as $.each(). Returning true will continue to the next matched
       *   element in the set, while returning false will entirely break the
       *   iteration.
       */
      $.fn.removeOnce = function (id, fn) {
        var name = id + '-processed';
        var elements = this.filter('.' + name).removeClass(name);

        return $.isFunction(fn) ? elements.each(fn) : elements;
      };
    })(jQuery);
    ;

    var Drupal = Drupal || { 'settings': {}, 'behaviors': {}, 'locale': {} };

    // Allow other JavaScript libraries to use $.
    jQuery.noConflict();

    (function ($) {

    /**
     * Override jQuery.fn.init to guard against XSS attacks.
     *
     * See http://bugs.jquery.com/ticket/9521
     */
    var jquery_init = $.fn.init;
    $.fn.init = function (selector, context, rootjQuery) {
      // If the string contains a "#" before a "<", treat it as invalid HTML.
      if (selector && typeof selector === 'string') {
        var hash_position = selector.indexOf('#');
        if (hash_position >= 0) {
          var bracket_position = selector.indexOf('<');
          if (bracket_position > hash_position) {
            throw 'Syntax error, unrecognized expression: ' + selector;
          }
        }
      }
      return jquery_init.call(this, selector, context, rootjQuery);
    };
    $.fn.init.prototype = jquery_init.prototype;

    /**
     * Attach all registered behaviors to a page element.
     *
     * Behaviors are event-triggered actions that attach to page elements, enhancing
     * default non-JavaScript UIs. Behaviors are registered in the Drupal.behaviors
     * object using the method 'attach' and optionally also 'detach' as follows:
     * @code
     *    Drupal.behaviors.behaviorName = {
     *      attach: function (context, settings) {
     *        ...
     *      },
     *      detach: function (context, settings, trigger) {
     *        ...
     *      }
     *    };
     * @endcode
     *
     * Drupal.attachBehaviors is added below to the jQuery ready event and so
     * runs on initial page load. Developers implementing AHAH/Ajax in their
     * solutions should also call this function after new page content has been
     * loaded, feeding in an element to be processed, in order to attach all
     * behaviors to the new content.
     *
     * Behaviors should use
     * @code
     *   $(selector).once('behavior-name', function () {
     *     ...
     *   });
     * @endcode
     * to ensure the behavior is attached only once to a given element. (Doing so
     * enables the reprocessing of given elements, which may be needed on occasion
     * despite the ability to limit behavior attachment to a particular element.)
     *
     * @param context
     *   An element to attach behaviors to. If none is given, the document element
     *   is used.
     * @param settings
     *   An object containing settings for the current context. If none given, the
     *   global Drupal.settings object is used.
     */
    Drupal.attachBehaviors = function (context, settings) {
      context = context || document;
      settings = settings || Drupal.settings;
      // Execute all of them.
      $.each(Drupal.behaviors, function () {
        if ($.isFunction(this.attach)) {
          this.attach(context, settings);
        }
      });
    };

    /**
     * Detach registered behaviors from a page element.
     *
     * Developers implementing AHAH/Ajax in their solutions should call this
     * function before page content is about to be removed, feeding in an element
     * to be processed, in order to allow special behaviors to detach from the
     * content.
     *
     * Such implementations should look for the class name that was added in their
     * corresponding Drupal.behaviors.behaviorName.attach implementation, i.e.
     * behaviorName-processed, to ensure the behavior is detached only from
     * previously processed elements.
     *
     * @param context
     *   An element to detach behaviors from. If none is given, the document element
     *   is used.
     * @param settings
     *   An object containing settings for the current context. If none given, the
     *   global Drupal.settings object is used.
     * @param trigger
     *   A string containing what's causing the behaviors to be detached. The
     *   possible triggers are:
     *   - unload: (default) The context element is being removed from the DOM.
     *   - move: The element is about to be moved within the DOM (for example,
     *     during a tabledrag row swap). After the move is completed,
     *     Drupal.attachBehaviors() is called, so that the behavior can undo
     *     whatever it did in response to the move. Many behaviors won't need to
     *     do anything simply in response to the element being moved, but because
     *     IFRAME elements reload their "src" when being moved within the DOM,
     *     behaviors bound to IFRAME elements (like WYSIWYG editors) may need to
     *     take some action.
     *   - serialize: When an Ajax form is submitted, this is called with the
     *     form as the context. This provides every behavior within the form an
     *     opportunity to ensure that the field elements have correct content
     *     in them before the form is serialized. The canonical use-case is so
     *     that WYSIWYG editors can update the hidden textarea to which they are
     *     bound.
     *
     * @see Drupal.attachBehaviors
     */
    Drupal.detachBehaviors = function (context, settings, trigger) {
      context = context || document;
      settings = settings || Drupal.settings;
      trigger = trigger || 'unload';
      // Execute all of them.
      $.each(Drupal.behaviors, function () {
        if ($.isFunction(this.detach)) {
          this.detach(context, settings, trigger);
        }
      });
    };

    /**
     * Encode special characters in a plain-text string for display as HTML.
     *
     * @ingroup sanitization
     */
    Drupal.checkPlain = function (str) {
      var character, regex,
          replace = { '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' };
      str = String(str);
      for (character in replace) {
        if (replace.hasOwnProperty(character)) {
          regex = new RegExp(character, 'g');
          str = str.replace(regex, replace[character]);
        }
      }
      return str;
    };

    /**
     * Replace placeholders with sanitized values in a string.
     *
     * @param str
     *   A string with placeholders.
     * @param args
     *   An object of replacements pairs to make. Incidences of any key in this
     *   array are replaced with the corresponding value. Based on the first
     *   character of the key, the value is escaped and/or themed:
     *    - !variable: inserted as is
     *    - @variable: escape plain text to HTML (Drupal.checkPlain)
     *    - %variable: escape text and theme as a placeholder for user-submitted
     *      content (checkPlain + Drupal.theme('placeholder'))
     *
     * @see Drupal.t()
     * @ingroup sanitization
     */
    Drupal.formatString = function(str, args) {
      // Transform arguments before inserting them.
      for (var key in args) {
        switch (key.charAt(0)) {
          // Escaped only.
          case '@':
            args[key] = Drupal.checkPlain(args[key]);
          break;
          // Pass-through.
          case '!':
            break;
          // Escaped and placeholder.
          case '%':
          default:
            args[key] = Drupal.theme('placeholder', args[key]);
            break;
        }
        str = str.replace(key, args[key]);
      }
      return str;
    };

    /**
     * Translate strings to the page language or a given language.
     *
     * See the documentation of the server-side t() function for further details.
     *
     * @param str
     *   A string containing the English string to translate.
     * @param args
     *   An object of replacements pairs to make after translation. Incidences
     *   of any key in this array are replaced with the corresponding value.
     *   See Drupal.formatString().
     *
     * @param options
     *   - 'context' (defaults to the empty context): The context the source string
     *     belongs to.
     *
     * @return
     *   The translated string.
     */
    Drupal.t = function (str, args, options) {
      options = options || {};
      options.context = options.context || '';

      // Fetch the localized version of the string.
      if (Drupal.locale.strings && Drupal.locale.strings[options.context] && Drupal.locale.strings[options.context][str]) {
        str = Drupal.locale.strings[options.context][str];
      }

      if (args) {
        str = Drupal.formatString(str, args);
      }
      return str;
    };

    /**
     * Format a string containing a count of items.
     *
     * This function ensures that the string is pluralized correctly. Since Drupal.t() is
     * called by this function, make sure not to pass already-localized strings to it.
     *
     * See the documentation of the server-side format_plural() function for further details.
     *
     * @param count
     *   The item count to display.
     * @param singular
     *   The string for the singular case. Please make sure it is clear this is
     *   singular, to ease translation (e.g. use "1 new comment" instead of "1 new").
     *   Do not use @count in the singular string.
     * @param plural
     *   The string for the plural case. Please make sure it is clear this is plural,
     *   to ease translation. Use @count in place of the item count, as in "@count
     *   new comments".
     * @param args
     *   An object of replacements pairs to make after translation. Incidences
     *   of any key in this array are replaced with the corresponding value.
     *   See Drupal.formatString().
     *   Note that you do not need to include @count in this array.
     *   This replacement is done automatically for the plural case.
     * @param options
     *   The options to pass to the Drupal.t() function.
     * @return
     *   A translated string.
     */
    Drupal.formatPlural = function (count, singular, plural, args, options) {
      var args = args || {};
      args['@count'] = count;
      // Determine the index of the plural form.
      var index = Drupal.locale.pluralFormula ? Drupal.locale.pluralFormula(args['@count']) : ((args['@count'] == 1) ? 0 : 1);

      if (index == 0) {
        return Drupal.t(singular, args, options);
      }
      else if (index == 1) {
        return Drupal.t(plural, args, options);
      }
      else {
        args['@count[' + index + ']'] = args['@count'];
        delete args['@count'];
        return Drupal.t(plural.replace('@count', '@count[' + index + ']'), args, options);
      }
    };

    /**
     * Returns the passed in URL as an absolute URL.
     *
     * @param url
     *   The URL string to be normalized to an absolute URL.
     *
     * @return
     *   The normalized, absolute URL.
     *
     * @see https://github.com/angular/angular.js/blob/v1.4.4/src/ng/urlUtils.js
     * @see https://grack.com/blog/2009/11/17/absolutizing-url-in-javascript
     * @see https://github.com/jquery/jquery-ui/blob/1.11.4/ui/tabs.js#L53
     */
    Drupal.absoluteUrl = function (url) {
      var urlParsingNode = document.createElement('a');

      // Decode the URL first; this is required by IE <= 6. Decoding non-UTF-8
      // strings may throw an exception.
      try {
        url = decodeURIComponent(url);
      } catch (e) {}

      urlParsingNode.setAttribute('href', url);

      // IE <= 7 normalizes the URL when assigned to the anchor node similar to
      // the other browsers.
      return urlParsingNode.cloneNode(false).href;
    };

    /**
     * Returns true if the URL is within Drupal's base path.
     *
     * @param url
     *   The URL string to be tested.
     *
     * @return
     *   Boolean true if local.
     *
     * @see https://github.com/jquery/jquery-ui/blob/1.11.4/ui/tabs.js#L58
     */
    Drupal.urlIsLocal = function (url) {
      // Always use browser-derived absolute URLs in the comparison, to avoid
      // attempts to break out of the base path using directory traversal.
      var absoluteUrl = Drupal.absoluteUrl(url);
      var protocol = location.protocol;

      // Consider URLs that match this site's base URL but use HTTPS instead of HTTP
      // as local as well.
      if (protocol === 'http:' && absoluteUrl.indexOf('https:') === 0) {
        protocol = 'https:';
      }
      var baseUrl = protocol + '//' + location.host + Drupal.settings.basePath.slice(0, -1);

      // Decoding non-UTF-8 strings may throw an exception.
      try {
        absoluteUrl = decodeURIComponent(absoluteUrl);
      } catch (e) {}
      try {
        baseUrl = decodeURIComponent(baseUrl);
      } catch (e) {}

      // The given URL matches the site's base URL, or has a path under the site's
      // base URL.
      return absoluteUrl === baseUrl || absoluteUrl.indexOf(baseUrl + '/') === 0;
    };

    /**
     * Generate the themed representation of a Drupal object.
     *
     * All requests for themed output must go through this function. It examines
     * the request and routes it to the appropriate theme function. If the current
     * theme does not provide an override function, the generic theme function is
     * called.
     *
     * For example, to retrieve the HTML for text that should be emphasized and
     * displayed as a placeholder inside a sentence, call
     * Drupal.theme('placeholder', text).
     *
     * @param func
     *   The name of the theme function to call.
     * @param ...
     *   Additional arguments to pass along to the theme function.
     * @return
     *   Any data the theme function returns. This could be a plain HTML string,
     *   but also a complex object.
     */
    Drupal.theme = function (func) {
      var args = Array.prototype.slice.apply(arguments, [1]);

      return (Drupal.theme[func] || Drupal.theme.prototype[func]).apply(this, args);
    };

    /**
     * Freeze the current body height (as minimum height). Used to prevent
     * unnecessary upwards scrolling when doing DOM manipulations.
     */
    Drupal.freezeHeight = function () {
      Drupal.unfreezeHeight();
      $('<div id="freeze-height"></div>').css({
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '1px',
        height: $('body').css('height')
      }).appendTo('body');
    };

    /**
     * Unfreeze the body height.
     */
    Drupal.unfreezeHeight = function () {
      $('#freeze-height').remove();
    };

    /**
     * Encodes a Drupal path for use in a URL.
     *
     * For aesthetic reasons slashes are not escaped.
     */
    Drupal.encodePath = function (item, uri) {
      uri = uri || location.href;
      return encodeURIComponent(item).replace(/%2F/g, '/');
    };

    /**
     * Get the text selection in a textarea.
     */
    Drupal.getSelection = function (element) {
      if (typeof element.selectionStart != 'number' && document.selection) {
        // The current selection.
        var range1 = document.selection.createRange();
        var range2 = range1.duplicate();
        // Select all text.
        range2.moveToElementText(element);
        // Now move 'dummy' end point to end point of original range.
        range2.setEndPoint('EndToEnd', range1);
        // Now we can calculate start and end points.
        var start = range2.text.length - range1.text.length;
        var end = start + range1.text.length;
        return { 'start': start, 'end': end };
      }
      return { 'start': element.selectionStart, 'end': element.selectionEnd };
    };

    /**
     * Build an error message from an Ajax response.
     */
    Drupal.ajaxError = function (xmlhttp, uri, customMessage) {
      var statusCode, statusText, pathText, responseText, readyStateText, message;
      if (xmlhttp.status) {
        statusCode = "\n" + Drupal.t("An AJAX HTTP error occurred.") +  "\n" + Drupal.t("HTTP Result Code: !status", {'!status': xmlhttp.status});
      }
      else {
        statusCode = "\n" + Drupal.t("An AJAX HTTP request terminated abnormally.");
      }
      statusCode += "\n" + Drupal.t("Debugging information follows.");
      pathText = "\n" + Drupal.t("Path: !uri", {'!uri': uri} );
      statusText = '';
      // In some cases, when statusCode == 0, xmlhttp.statusText may not be defined.
      // Unfortunately, testing for it with typeof, etc, doesn't seem to catch that
      // and the test causes an exception. So we need to catch the exception here.
      try {
        statusText = "\n" + Drupal.t("StatusText: !statusText", {'!statusText': $.trim(xmlhttp.statusText)});
      }
      catch (e) {}

      responseText = '';
      // Again, we don't have a way to know for sure whether accessing
      // xmlhttp.responseText is going to throw an exception. So we'll catch it.
      try {
        responseText = "\n" + Drupal.t("ResponseText: !responseText", {'!responseText': $.trim(xmlhttp.responseText) } );
      } catch (e) {}

      // Make the responseText more readable by stripping HTML tags and newlines.
      responseText = responseText.replace(/<("[^"]*"|'[^']*'|[^'">])*>/gi,"");
      responseText = responseText.replace(/[\n]+\s+/g,"\n");

      // We don't need readyState except for status == 0.
      readyStateText = xmlhttp.status == 0 ? ("\n" + Drupal.t("ReadyState: !readyState", {'!readyState': xmlhttp.readyState})) : "";

      // Additional message beyond what the xmlhttp object provides.
      customMessage = customMessage ? ("\n" + Drupal.t("CustomMessage: !customMessage", {'!customMessage': customMessage})) : "";

      message = statusCode + pathText + statusText + customMessage + responseText + readyStateText;
      return message;
    };

    // Class indicating that JS is enabled; used for styling purpose.
    $('html').addClass('js');

    // 'js enabled' cookie.
    document.cookie = 'has_js=1; path=/';

    /**
     * Additions to jQuery.support.
     */
    $(function () {
      /**
       * Boolean indicating whether or not position:fixed is supported.
       */
      if (jQuery.support.positionFixed === undefined) {
        var el = $('<div style="position:fixed; top:10px" />').appendTo(document.body);
        jQuery.support.positionFixed = el[0].offsetTop === 10;
        el.remove();
      }
    });

    //Attach all behaviors.
    $(function () {
      Drupal.attachBehaviors(document, Drupal.settings);
    });

    /**
     * The default themes.
     */
    Drupal.theme.prototype = {

      /**
       * Formats text for emphasized display in a placeholder inside a sentence.
       *
       * @param str
       *   The text to format (plain-text).
       * @return
       *   The formatted text (html).
       */
      placeholder: function (str) {
        return '<em class="placeholder">' + Drupal.checkPlain(str) + '</em>';
      }
    };

    })(jQuery);
    (function ($) {
      Drupal.viewsSlideshow = Drupal.viewsSlideshow || {};

      /**
       * Views Slideshow Controls
       */
      Drupal.viewsSlideshowControls = Drupal.viewsSlideshowControls || {};

      /**
       * Implement the play hook for controls.
       */
      Drupal.viewsSlideshowControls.play = function (options) {
        // Route the control call to the correct control type.
        // Need to use try catch so we don't have to check to make sure every part
        // of the object is defined.
        try {
          if (typeof Drupal.settings.viewsSlideshowControls[options.slideshowID].top.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowControls[options.slideshowID].top.type].play == 'function') {
            Drupal[Drupal.settings.viewsSlideshowControls[options.slideshowID].top.type].play(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }

        try {
          if (typeof Drupal.settings.viewsSlideshowControls[options.slideshowID].bottom.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowControls[options.slideshowID].bottom.type].play == 'function') {
            Drupal[Drupal.settings.viewsSlideshowControls[options.slideshowID].bottom.type].play(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }
      };

      /**
       * Implement the pause hook for controls.
       */
      Drupal.viewsSlideshowControls.pause = function (options) {
        // Route the control call to the correct control type.
        // Need to use try catch so we don't have to check to make sure every part
        // of the object is defined.
        try {
          if (typeof Drupal.settings.viewsSlideshowControls[options.slideshowID].top.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowControls[options.slideshowID].top.type].pause == 'function') {
            Drupal[Drupal.settings.viewsSlideshowControls[options.slideshowID].top.type].pause(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }

        try {
          if (typeof Drupal.settings.viewsSlideshowControls[options.slideshowID].bottom.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowControls[options.slideshowID].bottom.type].pause == 'function') {
            Drupal[Drupal.settings.viewsSlideshowControls[options.slideshowID].bottom.type].pause(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }
      };


      /**
       * Views Slideshow Text Controls
       */

      // Add views slieshow api calls for views slideshow text controls.
      Drupal.behaviors.viewsSlideshowControlsText = {
        attach: function (context) {

          // Process previous link
          $('.views_slideshow_controls_text_previous:not(.views-slideshow-controls-text-previous-processed)', context).addClass('views-slideshow-controls-text-previous-processed').each(function() {
            var uniqueID = $(this).attr('id').replace('views_slideshow_controls_text_previous_', '');
            $(this).click(function() {
              Drupal.viewsSlideshow.action({ "action": 'previousSlide', "slideshowID": uniqueID });
              return false;
            });
          });

          // Process next link
          $('.views_slideshow_controls_text_next:not(.views-slideshow-controls-text-next-processed)', context).addClass('views-slideshow-controls-text-next-processed').each(function() {
            var uniqueID = $(this).attr('id').replace('views_slideshow_controls_text_next_', '');
            $(this).click(function() {
              Drupal.viewsSlideshow.action({ "action": 'nextSlide', "slideshowID": uniqueID });
              return false;
            });
          });

          // Process pause link
          $('.views_slideshow_controls_text_pause:not(.views-slideshow-controls-text-pause-processed)', context).addClass('views-slideshow-controls-text-pause-processed').each(function() {
            var uniqueID = $(this).attr('id').replace('views_slideshow_controls_text_pause_', '');
            $(this).click(function() {
              if (Drupal.settings.viewsSlideshow[uniqueID].paused) {
                Drupal.viewsSlideshow.action({ "action": 'play', "slideshowID": uniqueID, "force": true });
              }
              else {
                Drupal.viewsSlideshow.action({ "action": 'pause', "slideshowID": uniqueID, "force": true });
              }
              return false;
            });
          });
        }
      };

      Drupal.viewsSlideshowControlsText = Drupal.viewsSlideshowControlsText || {};

      /**
       * Implement the pause hook for text controls.
       */
      Drupal.viewsSlideshowControlsText.pause = function (options) {
        var pauseText = Drupal.theme.prototype['viewsSlideshowControlsPause'] ? Drupal.theme('viewsSlideshowControlsPause') : '';
        $('#views_slideshow_controls_text_pause_' + options.slideshowID + ' a').text(pauseText);
      };

      /**
       * Implement the play hook for text controls.
       */
      Drupal.viewsSlideshowControlsText.play = function (options) {
        var playText = Drupal.theme.prototype['viewsSlideshowControlsPlay'] ? Drupal.theme('viewsSlideshowControlsPlay') : '';
        $('#views_slideshow_controls_text_pause_' + options.slideshowID + ' a').text(playText);
      };

      // Theme the resume control.
      Drupal.theme.prototype.viewsSlideshowControlsPause = function () {
        return Drupal.t('Resume');
      };

      // Theme the pause control.
      Drupal.theme.prototype.viewsSlideshowControlsPlay = function () {
        return Drupal.t('Pause');
      };

      /**
       * Views Slideshow Pager
       */
      Drupal.viewsSlideshowPager = Drupal.viewsSlideshowPager || {};

      /**
       * Implement the transitionBegin hook for pagers.
       */
      Drupal.viewsSlideshowPager.transitionBegin = function (options) {
        // Route the pager call to the correct pager type.
        // Need to use try catch so we don't have to check to make sure every part
        // of the object is defined.
        try {
          if (typeof Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type].transitionBegin == 'function') {
            Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type].transitionBegin(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }

        try {
          if (typeof Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type].transitionBegin == 'function') {
            Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type].transitionBegin(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }
      };

      /**
       * Implement the goToSlide hook for pagers.
       */
      Drupal.viewsSlideshowPager.goToSlide = function (options) {
        // Route the pager call to the correct pager type.
        // Need to use try catch so we don't have to check to make sure every part
        // of the object is defined.
        try {
          if (typeof Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type].goToSlide == 'function') {
            Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type].goToSlide(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }

        try {
          if (typeof Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type].goToSlide == 'function') {
            Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type].goToSlide(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }
      };

      /**
       * Implement the previousSlide hook for pagers.
       */
      Drupal.viewsSlideshowPager.previousSlide = function (options) {
        // Route the pager call to the correct pager type.
        // Need to use try catch so we don't have to check to make sure every part
        // of the object is defined.
        try {
          if (typeof Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type].previousSlide == 'function') {
            Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type].previousSlide(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }

        try {
          if (typeof Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type].previousSlide == 'function') {
            Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type].previousSlide(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }
      };

      /**
       * Implement the nextSlide hook for pagers.
       */
      Drupal.viewsSlideshowPager.nextSlide = function (options) {
        // Route the pager call to the correct pager type.
        // Need to use try catch so we don't have to check to make sure every part
        // of the object is defined.
        try {
          if (typeof Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type].nextSlide == 'function') {
            Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].top.type].nextSlide(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }

        try {
          if (typeof Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type != "undefined" && typeof Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type].nextSlide == 'function') {
            Drupal[Drupal.settings.viewsSlideshowPager[options.slideshowID].bottom.type].nextSlide(options);
          }
        }
        catch(err) {
          // Don't need to do anything on error.
        }
      };


      /**
       * Views Slideshow Pager Fields
       */

      // Add views slieshow api calls for views slideshow pager fields.
      Drupal.behaviors.viewsSlideshowPagerFields = {
        attach: function (context) {
          // Process pause on hover.
          $('.views_slideshow_pager_field:not(.views-slideshow-pager-field-processed)', context).addClass('views-slideshow-pager-field-processed').each(function() {
            // Parse out the location and unique id from the full id.
            var pagerInfo = $(this).attr('id').split('_');
            var location = pagerInfo[2];
            pagerInfo.splice(0, 3);
            var uniqueID = pagerInfo.join('_');

            // Add the activate and pause on pager hover event to each pager item.
            if (Drupal.settings.viewsSlideshowPagerFields[uniqueID][location].activatePauseOnHover) {
              $(this).children().each(function(index, pagerItem) {
                var mouseIn = function() {
                  Drupal.viewsSlideshow.action({ "action": 'goToSlide', "slideshowID": uniqueID, "slideNum": index });
                  Drupal.viewsSlideshow.action({ "action": 'pause', "slideshowID": uniqueID });
                }

                var mouseOut = function() {
                  Drupal.viewsSlideshow.action({ "action": 'play', "slideshowID": uniqueID });
                }

                if (jQuery.fn.hoverIntent) {
                  $(pagerItem).hoverIntent(mouseIn, mouseOut);
                }
                else {
                  $(pagerItem).hover(mouseIn, mouseOut);
                }

              });
            }
            else {
              $(this).children().each(function(index, pagerItem) {
                $(pagerItem).click(function() {
                  Drupal.viewsSlideshow.action({ "action": 'goToSlide', "slideshowID": uniqueID, "slideNum": index });
                });
              });
            }
          });
        }
      };

      Drupal.viewsSlideshowPagerFields = Drupal.viewsSlideshowPagerFields || {};

      /**
       * Implement the transitionBegin hook for pager fields pager.
       */
      Drupal.viewsSlideshowPagerFields.transitionBegin = function (options) {
        for (pagerLocation in Drupal.settings.viewsSlideshowPager[options.slideshowID]) {
          // Remove active class from pagers
          $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').removeClass('active');

          // Add active class to active pager.
          $('#views_slideshow_pager_field_item_'+ pagerLocation + '_' + options.slideshowID + '_' + options.slideNum).addClass('active');
        }

      };

      /**
       * Implement the goToSlide hook for pager fields pager.
       */
      Drupal.viewsSlideshowPagerFields.goToSlide = function (options) {
        for (pagerLocation in Drupal.settings.viewsSlideshowPager[options.slideshowID]) {
          // Remove active class from pagers
          $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').removeClass('active');

          // Add active class to active pager.
          $('#views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '_' + options.slideNum).addClass('active');
        }
      };

      /**
       * Implement the previousSlide hook for pager fields pager.
       */
      Drupal.viewsSlideshowPagerFields.previousSlide = function (options) {
        for (pagerLocation in Drupal.settings.viewsSlideshowPager[options.slideshowID]) {
          // Get the current active pager.
          var pagerNum = $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"].active').attr('id').replace('views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '_', '');

          // If we are on the first pager then activate the last pager.
          // Otherwise activate the previous pager.
          if (pagerNum == 0) {
            pagerNum = $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').length() - 1;
          }
          else {
            pagerNum--;
          }

          // Remove active class from pagers
          $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').removeClass('active');

          // Add active class to active pager.
          $('#views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '_' + pagerNum).addClass('active');
        }
      };

      /**
       * Implement the nextSlide hook for pager fields pager.
       */
      Drupal.viewsSlideshowPagerFields.nextSlide = function (options) {
        for (pagerLocation in Drupal.settings.viewsSlideshowPager[options.slideshowID]) {
          // Get the current active pager.
          var pagerNum = $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"].active').attr('id').replace('views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '_', '');
          var totalPagers = $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').length();

          // If we are on the last pager then activate the first pager.
          // Otherwise activate the next pager.
          pagerNum++;
          if (pagerNum == totalPagers) {
            pagerNum = 0;
          }

          // Remove active class from pagers
          $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').removeClass('active');

          // Add active class to active pager.
          $('#views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '_' + slideNum).addClass('active');
        }
      };


      /**
       * Views Slideshow Slide Counter
       */

      Drupal.viewsSlideshowSlideCounter = Drupal.viewsSlideshowSlideCounter || {};

      /**
       * Implement the transitionBegin for the slide counter.
       */
      Drupal.viewsSlideshowSlideCounter.transitionBegin = function (options) {
        $('#views_slideshow_slide_counter_' + options.slideshowID + ' .num').text(options.slideNum + 1);
      };

      /**
       * This is used as a router to process actions for the slideshow.
       */
      Drupal.viewsSlideshow.action = function (options) {
        // Set default values for our return status.
        var status = {
          'value': true,
          'text': ''
        }

        // If an action isn't specified return false.
        if (typeof options.action == 'undefined' || options.action == '') {
          status.value = false;
          status.text =  Drupal.t('There was no action specified.');
          return error;
        }

        // If we are using pause or play switch paused state accordingly.
        if (options.action == 'pause') {
          Drupal.settings.viewsSlideshow[options.slideshowID].paused = 1;
          // If the calling method is forcing a pause then mark it as such.
          if (options.force) {
            Drupal.settings.viewsSlideshow[options.slideshowID].pausedForce = 1;
          }
        }
        else if (options.action == 'play') {
          // If the slideshow isn't forced pause or we are forcing a play then play
          // the slideshow.
          // Otherwise return telling the calling method that it was forced paused.
          if (!Drupal.settings.viewsSlideshow[options.slideshowID].pausedForce || options.force) {
            Drupal.settings.viewsSlideshow[options.slideshowID].paused = 0;
            Drupal.settings.viewsSlideshow[options.slideshowID].pausedForce = 0;
          }
          else {
            status.value = false;
            status.text += ' ' + Drupal.t('This slideshow is forced paused.');
            return status;
          }
        }

        // We use a switch statement here mainly just to limit the type of actions
        // that are available.
        switch (options.action) {
          case "goToSlide":
          case "transitionBegin":
          case "transitionEnd":
            // The three methods above require a slide number. Checking if it is
            // defined and it is a number that is an integer.
            if (typeof options.slideNum == 'undefined' || typeof options.slideNum !== 'number' || parseInt(options.slideNum) != (options.slideNum - 0)) {
              status.value = false;
              status.text = Drupal.t('An invalid integer was specified for slideNum.');
            }
          case "pause":
          case "play":
          case "nextSlide":
          case "previousSlide":
            // Grab our list of methods.
            var methods = Drupal.settings.viewsSlideshow[options.slideshowID]['methods'];

            // if the calling method specified methods that shouldn't be called then
            // exclude calling them.
            var excludeMethodsObj = {};
            if (typeof options.excludeMethods !== 'undefined') {
              // We need to turn the excludeMethods array into an object so we can use the in
              // function.
              for (var i=0; i < excludeMethods.length; i++) {
                excludeMethodsObj[excludeMethods[i]] = '';
              }
            }

            // Call every registered method and don't call excluded ones.
            for (i = 0; i < methods[options.action].length; i++) {
              if (Drupal[methods[options.action][i]] != undefined && typeof Drupal[methods[options.action][i]][options.action] == 'function' && !(methods[options.action][i] in excludeMethodsObj)) {
                Drupal[methods[options.action][i]][options.action](options);
              }
            }
            break;

          // If it gets here it's because it's an invalid action.
          default:
            status.value = false;
            status.text = Drupal.t('An invalid action "!action" was specified.', { "!action": options.action });
        }
        return status;
      };
    })(jQuery);
    ;