(function($){
	$(document).ready(function(){
		// $(window).resize(function(event) {
		// 	$('.main-navigation .block-widgets-navigator ul.depth-0').css('left', '0');
		// });
		$('.mobile-preview-menu-item').click(function(e){
			e.preventDefault();
			e.stopPropagation();
			$('.mobile-preview-menu-item').addClass('active');	
			$.cookie('mobile-preview', true);
			$('.preview-menu-item a').focus().click();
		})
	})
}(jQuery));