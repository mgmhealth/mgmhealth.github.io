(function($){
  $(document).ready(function(){
    $('.block-widgets-contact-form input[type=text] , .block-widgets-contact-form textarea').val("");

    if (!$('body').hasClass('site-builder')){
      $('h1, h2, h3, h4, h5, h6').each(function(){
        if ($(this).html() == '') {
           $(this).hide();
        }
      });
    }
  });


  $.navigator({
    ready : function(navigator) {
      // if(navigator.is('#top-navigation ul.navigator, .sidebar .block-widgets-navigator ul' )){
        navigator.find('li.has-children > a').each(function(index, item){
          if ($(this).find('.base-arrowspan').length == 0) {
            $(this).append($('<span/>').addClass('base-arrowspan'));
          }
        })
      // }
    }
  })
}(jQuery))
