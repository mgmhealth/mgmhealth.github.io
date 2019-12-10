(function($){
  $(document).ready(function(){
  	var ua =  navigator.userAgent;
  	if (ua.indexOf('Safari') != -1 && ua.indexOf('Chrome') == -1) {$('body').addClass('safari');}
  	if($.browser.msie){
	  	$('body').addClass('ie');
	  	$(window).click(function(e){
	  		if(($(e.target).hasClass('drag-place-text') && $(e.target).closest('div').hasClass('qq-upload-button')) || $(e.target).hasClass('qq-upload-button')){
	  			$('.qq-upload-button input').click();
	  		}
	  	})
	  }
    if ($('#top-navigation').find('.block-widgets-navigator').length <= 0) {
      $('#top-navigation').addClass('empty');
      $('body').addClass('nomenu');
    }
  });
}(jQuery));
