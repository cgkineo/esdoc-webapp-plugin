$(function() {

  var originalQuerySelector = document.querySelector;
  document.querySelector = function filterQuerySelector(selector) {
    if (!selector || selector.slice(0,6) === "#path-") return;
    return originalQuerySelector.call(document, selector);
  };

  var WebApp = function() {
    this._$window = $(window);
    this._$content = $(".content");
    this._base = this.getBase();
    this.setUpEventListeners();
    this.onHashChange();
  };
  WebApp.prototype = {

    _$window: null,
    _$html: $('html'),
    _$content: null,
    _base: null,
    _highlightHash: null,
    _allowedURI: /(^class\/|^file\/|^typedef\/|^test-file\/|^index.html|^identifiers.html|^source.html|^test.html|^$)/,

    getBase: function() {
      var base = $('base')[0];
      return base.href.replace(/\#.*/, '').replace(/(index.html|identifiers.html|source.html|test.html)$/, '');
    },

    setUpEventListeners: function() {
      document.body.addEventListener('click', this.onClick.bind(this));
      window.addEventListener('hashchange', this.onHashChange.bind(this));
    },

    onClick: function(event) {
      var $clicked =  $(event.target);
      $clicked = $clicked.add($clicked.parents()).filter('a');
      if (!$clicked.is('a')) {
        return;
      }
      event.preventDefault();
      var href = $clicked.attr('href');
      var isHashOnly = (href.slice(0,1) === "#");
      if (this._currentHREF && isHashOnly) {
        var currentPathNoHash = this._currentHREF.replace(/\#.*/,'');
        href = currentPathNoHash+href;
      } else {
        href = $clicked[0].href;
      }

      this.navigateTo(href);
    },

    navigateTo: function(href) {
      if (location.href === href && /\#/.test(href)) return;
      var isExternal = (href.slice(0, this._base.length) !== this._base);
      if (isExternal) return location.href = href;
      var path = this.getPath(href);
      var isAllowed = this._allowedURI.test(path);
      if (!isAllowed) return location.href = href;
      location.hash = this.makePathCode(path);
    },

    getPath: function(href) {
      return href.slice(this._base.length);
    },

    makePathCode: function(path) {
      return "path-"+btoa(path).replace(/=/g, '');
    },

    onHashChange: function() {

      var hash = location.hash;
      var isNotPathStyle = (hash.slice(0,1) !== "#" || hash.slice(0,6) !== "#path-");
      // redirect to hash style
      if (isNotPathStyle) return this.navigateTo(location.href);

      var href = this._base+atob(hash.slice(6));
      this.loadPathContent(href, function() {
        this.triggerReload();
        this.reloadScripts();
        this.reloadPrettyPrint(this._highlightHash);
        if (!this._highlightHash) {
          this._$window.scrollTop(0);
          return;
        }
        this.gotoHash(this._highlightHash);
        this._highlightHash = null;
      }.bind(this));

    },

    loadPathContent: function(href, callback) {
      this._currentHREF = href;
      this._highlightHash = this.getHash(href);
      this._$html.toggleClass('loading', true);
      $.get(href, function(html) {
        var $newContent = $(html).filter(".content");
        this._$content.replaceWith($newContent);
        this._$content = $newContent;
        callback();
        this._$html.toggleClass('loading', false);
      }.bind(this));
    },

    getHash: function(uri) {
      return this.getParsed(uri).hash;
    },

    getParsed: function(uri) {
      var a = document.createElement('a');
      a.href = uri;
      return a;
    },

    triggerReload: function() {
      $(window).trigger("reload");
    },

    reloadScripts: function() {
      var scripts = $('body > script[src="script/test-summary.js"]').remove();
      $('body').append(scripts);
    },

    reloadPrettyPrint: function(hash) {
      hash = hash || "";
      prettyPrint();
      var lines = document.querySelectorAll('.prettyprint.linenums li[class^="L"]');
      for (var i = 0; i < lines.length; i++) {
        lines[i].id = 'lineNumber' + (i + 1);
      }

      var matched = hash.match(/errorLines=([\d,]+)/);
      if (matched) {
        var lines = matched[1].split(',');
        for (var i = 0; i < lines.length; i++) {
          var id = '#lineNumber' + lines[i];
          var el = document.querySelector(id);
          el.classList.add('error-line');
        }
        return;
      }

      if (hash) {
        // ``[ ] . ' " @`` are not valid in DOM id. so must escape these.
        var id = hash.replace(/([\[\].'"@$])/g, '\\$1');
        var line = document.querySelector(id);
        if (line) line.classList.add('active');
      }

    },

    gotoHash: function(hash) {
      try {
        $.scrollTo(hash);
      } catch (e) {
        return;
      }
      window.scrollBy(0, -55);
      var el = document.querySelector('.inner-link-active');
      if (el) el.classList.remove('inner-link-active');

      // ``[ ] . ' " @`` are not valid in DOM id. so must escape these.
      var id = hash.replace(/([\[\].'"@$])/g, '\\$1');
      var el = document.querySelector(id);
      if (el) el.classList.add('inner-link-active');
    },

  };

  new WebApp();

});
