(function($) {
  // Responsive
  Drupal.responsiveMode = {
    // responsiveWidth: null,

    responsive: function(element) {
      // Unconfigured state
      $(element).removeClass('unconfigured-widget-block');
      if($(element).has('.unconfigured-widget').length > 0 && !$(element).is('.block-widgets-content-splitter')) {
        $(element).addClass('unconfigured-widget-block');
      }

      // Responsive state
      $(element).find('div[data-responsive]').each(function() {
        var responsiveWidth = $(this).attr('data-responsive');
        var block = $(this).closest('.block-widgets');

        if(block.width() <= responsiveWidth) {
          if($(this).hasClass('contextual-links-wrapper')){
            block.addClass('responsive-toolbar');
          } else {
            block.addClass('responsive');
          }
        }
        else {
          block.removeClass('responsive');
          block.removeClass('responsive-toolbar');
        }
      });
      // $('body').trigger('sbResize');
    }
  }

  $(window).load(function() {
    $('.block-widgets').each(function() {
      if($(this).is('.static-widget'))
        return;

      Drupal.responsiveMode.responsive(this);
    });
  });
})(jQuery);
