(function($) {
	$(document).ready(function(){
		if($('#branding .logo img').length == 0) {
	  	$('#branding').addClass('no-logo');
	  }
	});

  Drupal.behaviors.content_manager = {
    attach: function(context, settings) {
      this.initDummyLinks();

      if(typeof Drupal.settings.wizard == 'undefined') {
        var fonts = [], font;
        $('body *').each(function(){
          font = $(this).css('font-family').replace(/'/g, '').replace(/"/g, '');
          if(Drupal.settings.builderFonts != undefined && Drupal.settings.builderFonts.indexOf(font) != -1) {
            fonts.push(font);
          }
        });

        if(fonts.length == 0){
          return;
        }

        fonts = $.unique(fonts);

        var css = '';

        $.ajax({
          url: '/content_manager/ajax/load_fonts',
          data: {
            fonts: fonts
          },
          async: false,
          type: 'POST',
          success: function(msg) {
            if(msg[1].settings.css) {
              css = '<style type="text/css">' + msg[1].settings.css + '</style>';
              $('head title').after(css);
            }
          }
        });
      }
    },

    initDummyLinks : function(){
      var proxy_base = window.location.protocol + '//' +window.location.host + '/proxy_url?url=',
        captcha_src = '';

      $('a:not([rel=colorbox])').each(function(){
        ahref = $(this).attr('href');
        if(typeof ahref != 'undefined'){
          matches = ahref.match('^' + Drupal.settings.baseURL.replace(':', '\\:').replace(/\//g, '\\/'));

          if((matches != null && matches.length > 0) || ahref.indexOf('/') == 0){

            if(typeof Drupal.settings.wizard != 'undefined' &&
              typeof Drupal.settings.wizard.dummy_content_id != 'undefined') {
              ahref = proxy_base + Drupal.settings.baseURL + ahref +'?template=' + Drupal.settings.wizard.dummy_content_id + '&load_all_fonts=1';
            }

            $(this).attr('href', ahref);
          }

        }
      });

      $('iframe').each(function(){
        iframesrc = $(this).attr('src');
        if(typeof iframesrc != 'undefined'){
          matches = iframesrc.match('^' + Drupal.settings.baseURL.replace(':', '\\:').replace(/\//g, '\\/'));

          if((matches != null && matches.length > 0) || iframesrc.indexOf('/') == 0){

            if(typeof Drupal.settings.wizard != 'undefined' &&
              typeof Drupal.settings.wizard.dummy_content_id != 'undefined') {
              iframesrc = proxy_base + Drupal.settings.baseURL + iframesrc +'?template=' + Drupal.settings.wizard.dummy_content_id + '&load_all_fonts=1';
            }

            $(this).attr('src', iframesrc);
          }

        }
      });
    }
  }
}(jQuery));
