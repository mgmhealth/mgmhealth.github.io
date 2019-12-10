(function($) {
	Drupal.behaviors.design_manager = {
			attach: function(settings, context) {
				this.init.theme();
				this.init.layout();
				// this.init.swatch();
				//this.init.cancelsave();
			},

			init : {
				theme: function() {
					//TODO: set defaults -- this should be passed from PHP with drupal_add_js
					var
						stance = 'active',
						theme = 'showtime';

					if(!Drupal.settings.design.is_sitemanager) {
						stance = 'published';
					}

					if(typeof Drupal.settings.design.global[stance] != 'undefined') {
						theme = Drupal.settings.design.global[stance]['#theme'];
					}
				},

				layout: function() {
					var
						badLayout = false,
						stance = 'active',
						page_id = Drupal.settings.design.page_id,
						layout = Drupal.settings.design.default_layout_settings;

					if(!Drupal.settings.design.is_sitemanager) {
						stance = 'published';
					} else {
						if(Drupal.settings.design.is_preview
								&& Drupal.settings.design.page != null
								&& typeof Drupal.settings.design.page['preview'] != 'undefined'
								&& typeof Drupal.settings.design.page['preview']['#layout'] != 'undefined'
								&& Drupal.settings.design.page['preview']['#layout'] != null) {
							stance = 'preview';
						}
					}

					//TODO: Test this only once;
					if(Drupal.settings.design.page != null
						&& typeof Drupal.settings.design.page[stance] != 'undefined'
						&& typeof Drupal.settings.design.page[stance]['#layout'] != 'undefined'
						&& Drupal.settings.design.page[stance]['#layout'] != null) {
						layout = Drupal.settings.design.page[stance]['#layout'];
					}

					switch(layout) {
            case "layout1":
                break;
            case "layout2":
                $("#sidebar-second").addClass("hidden");
                break;
            case "layout3":
                $("#sidebar-first").addClass("hidden");
                break;
            case "layout4":
                $("#sidebar-first, #sidebar-second").addClass("hidden");
                break;
            default:
            	badLayout = true;
            	break;
	        }

          if(!badLayout){
            $('#design-theme-layout a.' + layout).parent().addClass('active');
          }
        },

        switchLayout: function(element) {
          var
            badLayout = false,
            that = element,
            layout = element.attr("class");

          switch(layout){
            case "layout1":
              $("#content, #sidebar-first, #sidebar-second").removeClass("hidden");
              break;
            case "layout2":
              $("#content, #sidebar-first, #sidebar-second").removeClass("hidden");
              $("#sidebar-second").addClass("hidden");
              break;
            case "layout3":
              $("#content, #sidebar-first, #sidebar-second").removeClass("hidden");
              $("#sidebar-first").addClass("hidden");
              break;
            case "layout4":
              $("#content, #sidebar-first, #sidebar-second").removeClass("hidden");
              $("#sidebar-first, #sidebar-second").addClass("hidden");
              break;
            default:
              badLayout = true;
              break;
          }

          if(!badLayout){
            $('#design-theme-layout li').removeClass('active');
            $(that).closest('li').addClass('active');
            $("body").removeClass("layout1 layout2 layout3 layout4").addClass(layout);
            Drupal.Builder.refreshBlockWidths($('body'), true); // todo: check this;
            Drupal.content_splitter.fixHeights();

            $.each(Drupal.behaviors, function(index, obj){
              if(typeof obj.layoutChange == 'function'){
                obj.layoutChange();
              }
            });

          }
        }
			}
	}
  Drupal.behaviors.phoneUrl = {
    attach: function(){
      Drupal.behaviors.phoneUrl.replaceURL();
      var ua = navigator.userAgent, mobile = false;
      if(ua.match(/Android/) || ua.match(/iPhone/)){
        mobile = true;
      }
      if(ua.match(/Mobile/)){
        mobile = true;
      }
      if(mobile == true){
        $('.image-link-ref').each(function(index, item){
          if($(this).attr('href').split('skype:')[0].length == 0){
            $(this).attr('href', $(this).attr('href').replace('skype:', 'tel:').replace('?call', ''));
          }
        })
      }
    },
    replaceURL: function(url){
      var ua = navigator.userAgent, callForm = 'skype:', end = '?call', newUrl = '';
      if(ua.match(/Android/) || ua.match(/iPhone/)){
        callForm = 'tel:';
        end = '';
      }
      if(ua.match(/Mobile/)){
        callForm = 'tel:';
        end = '';
      }
      if(typeof url !== 'undefined' && url.length > 0){
        newUrl = callForm + url + end;
        return newUrl;
      }
      $('a.phone-number').each(function(index, item){
        if(!$(this).attr('href').match(/^(tel:|skype:)/g)){
          $(this).attr('href', callForm + $(this).attr('href') + end);
        }
      });
    }
  }
}(jQuery))
