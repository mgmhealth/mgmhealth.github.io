(function($){
  $(document).ready(function(){
    if ($.browser.ie && parseInt($.browser.version) < 10) {
      $('.block-widgets-contact-form label').live('click', function(){
        next = $(this).next();
        if(next.is('.form-textarea-wrapper')){
          next.find('textarea').focus();
        } else {
          next.focus();
        }
      });

      $('.block-widgets-contact-form input, .block-widgets-contact-form textarea').live('focus', function(){
        $(this).closest('.form-item').addClass('active');

        if(navigator.appName == 'Microsoft Internet Explorer'){
          $(this).closest('.form-item').find('label').hide();
          $(this).closest('.form-item').find('label.error').show();
        }

      }).live('blur', function(){
        if($(this).val().trim().length == 0){
          if(navigator.appName == 'Microsoft Internet Explorer'){
            $(this).closest('.form-item').find('label').show();
          }
          $(this).closest('.form-item').removeClass('active');
        }
      });
    }
  })
}(jQuery));
