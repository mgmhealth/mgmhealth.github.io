(function($){
	$(window).load(function(){
		// path = window.location.pathname;
		path = Drupal.settings.builder.path || window.location.pathname;
		if(path == '/'){
			path = '<front>';
		}
		if(path.match('/previewm/')){
			path = path.replace('/previewm/', '');
		}else{
			path = path.replace('/page/', '');
		}
		if(Drupal.settings.excludedWidgets != undefined && Drupal.settings.excludedWidgets[path] != undefined){
			excluded = Drupal.settings.excludedWidgets[path];
			$.each(excluded, function(index, item){
				item = item.replace(':', '\\:').replace(']', '\\]').replace('[', '\\[');
				$('#' + item).find('.contextual-links').find('li.exclude-me').addClass('excluded');
			})
		}

		if(Drupal.settings.excludedWidgets != undefined && Drupal.settings.excludedWidgets['*'] != undefined){
			excluded = Drupal.settings.excludedWidgets['*'];
			$.each(excluded, function(index, item){
				item = item.replace(':', '\\:').replace(']', '\\]').replace('[', '\\[');
				$('#' + item).find('.contextual-links').find('li.exclude-me').addClass('excluded');
			})
		}
	})
}(jQuery));
