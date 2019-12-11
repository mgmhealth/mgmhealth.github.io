(function($) {

  Drupal.behaviors.FacebookPostWidget = {

    fbEvents: function(wrapper){

      if(typeof FB == 'undefined'){

        if($('#fb-root').length == 0){
          $('body').prepend('<div id="fb-root"></div>');
        }

        var apiKey = '';
        if(typeof Drupal.settings.facebook != "undefined" && typeof Drupal.settings.facebook.apiKey != "undefined"){
          apiKey = Drupal.settings.facebook.apiKey;
        }
        window.fbAsyncInit = function() {
          FB.init({
            appId: apiKey,
            status: true,
            xfbml: true
          });
        };

        (function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0], lang = $('html').attr('xml:lang');
          if (d.getElementById(id)) return;
          lang += '_' + lang.toUpperCase();
          js = d.createElement(s); js.id = id;
          js.src = "//connect.facebook.net/"+ lang +"/all.js";
          fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
      }
      else{
        if(typeof(wrapper) === 'undefined'){
          wrapper = 'page';
        }
        FB.XFBML.parse(document.getElementById(wrapper));
      }
    }
  }
})(jQuery);
;
(function($) {
  var refreshed = false;

  Drupal.behaviors.facebook_comments = {
    fbEvents: function(bid){
      //fb width bug...
      var $region = $('#' + bid).closest('.region'), ms = 50, width, id, csRegions, margin;
      width = $region.width();

      if(width < 75){
        ms = 500;
      }
      
      setTimeout(function(){
        margin = parseInt($('#' + bid).css('margin-right')) + parseInt($('#' + bid).css('margin-left'));
          if(margin > 0){
            width = $region.width() - margin;
          }else{
            width = $region.width();
          }
          if(width){
            if($region.hasClass('cs-region')){
              if(margin <= 10){
                width -= 10;
              }
            }
            $('#' + bid).find('.fb-comments').attr('data-width', width);
          }          
        //call FB API & parse
        if(typeof FB == 'undefined'){

          if($('#fb-root').length == 0){
            $('body').prepend('<div id="fb-root"></div>');
          }

          var apiKey = '';
          if(typeof Drupal.settings.facebook != "undefined" && typeof Drupal.settings.facebook.apiKey != "undefined"){
            apiKey = Drupal.settings.facebook.apiKey;
          }
          window.fbAsyncInit = function() {
            FB.init({
              appId: apiKey,
              status: true,
              xfbml: true
            });

          };
          (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0], lang = $('html').attr('xml:lang');
            if (d.getElementById(id)) return;
            lang += '_' + lang.toUpperCase();
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/"+ lang +"/all.js";
            fjs.parentNode.insertBefore(js, fjs);
          }(document, 'script', 'facebook-jssdk'));
        }
        else{
          FB.XFBML.parse(document.getElementById(bid.replace('\\:', ':')));
        }
        if($region.hasClass('cs-region')){
          csRegions = $region.closest('.block').find('.cs-region').not('.dynamic');
          csRegions.bind("resizestart", function( event, ui ){
            csRegions.find('.block-widgets-facebook-comments').removeClass('updated');
          })
          csRegions.bind("resizestop", function( event, ui ){
            $region.closest('.block').find('.cs-region').addClass('dynamic');
            $region.closest('.block').find('.block-widgets-facebook-comments').each(function(index, item){
              id = $(item).attr('id');
              id = id.replace(':', '\\:');
              if(!$(item).hasClass('updated')){
              $(item).addClass('updated');
                Drupal.behaviors.facebook_comments.fbEvents(id);
              }
            })
          })
        }
      }, ms);
    },

    widgetSorted: function($wrapper){
      this.fbEvents($wrapper.attr('id').replace(':', '\\:'));
    },
    onWidgetConfigSaved: function(delta, settings){
      if(refreshed == false){
        refreshed = true;
        $.ajax({
          type : 'POST',
          url : 'https://graph.facebook.com/',
          data : {
            id: settings.widget_settings.content.url,
            scrape: 'true'
          },
          success: function(msg){
            if(settings.widget_settings.content.url !== msg.url || settings.widget_settings.content.fb_admin_id !== msg.admins[0].id){
              Drupal.Builder.ajaxHandlers.getBlock('facebook_comments', delta);
            }
          }
        });
      }else{
        refreshed = false;
      }
    }
  }
})(jQuery);
;
(function($) {
	//TODO: Add configurable gmap to config form;
	Drupal.behaviors.gmap = {
		list : {},
		attach : function(settings, context) {
			var delta = '', gmaps = $('div[id^=google-maps-]');
			if(gmaps.length != 0) {
				Drupal.behaviors.gmap.initGmap(gmaps);
			}
		},

		initGmap : function(gmapObjects) {
			var options = {};

			$.each(gmapObjects, function(){
				delta = $(this).attr('id').replace('google-maps-', '');
				Drupal.behaviors.gmap.buildMap(delta);
			});

		},

		buildMap: function(delta) {
      var block = $('#block-widgets-gmap\\:' + delta),
      required = ['latitude', 'longitude', 'maptype', 'zoom'],
      validOptions = true;

      $.each(required, function(i, option){
        if (block.find('input[name='+ option +']').length == 0) {
          validOptions = false;
          return false;
        }
      });

      if (validOptions) {
        optGroup = {
          latitude : block.find('input[name=latitude]').attr('value'),
          longitude : block.find('input[name=longitude]').attr('value'),
          mapTypeId : block.find('input[name=maptype]').attr('value'),
          zoom : parseInt(block.find('input[name=zoom]').attr('value'))
        };
        initializeGmap(delta, optGroup);

      } else {
  			var settings;

  			$.ajax({
  				type : "POST",
  				url : "/gmap/ajax/get_options",
  				data : {delta: delta},
  				success : function(msg) {
  					settings = msg[1].settings.data;
  					optGroup = {
  						latitude : settings.latitude,
  						longitude : settings.longitude,
              mapTypeId : settings.maptype,
  						zoom : parseInt(settings['gmap-zoom']) || 17
  					};
  					initializeGmap(delta, optGroup);
  				}
  			});
  			return settings;
      }
		},

		updateSettings: function(postData, log) {
      if(log){
        Drupal.contentManager.status.saveStart();
      }
      postData.page = Drupal.settings.builder.path;

      if(typeof Drupal.behaviors.undo != 'undefined'){
        Drupal.behaviors.undo.updateList('config');
      }

      postData.log = log;

      $.ajax({
        type : "POST",
        url : "/gmap/ajax/set_options",
        data: postData,
        success : function(){
          if(log){
            Drupal.contentManager.status.saveEnd();
          }
        }
			});
		},

    center : function(delta){
      var item = Drupal.behaviors.gmap[delta],
          myLatlng = myLatlng = new google.maps.LatLng(item.marker.position.lat(), item.marker.position.lng());

      google.maps.event.trigger(item.map, 'resize');
      item.map.setCenter(myLatlng);
    }

    // sort : function(item){
    //   var gResize = item.find('.gmap-wrapper');
    //   if(gResize.length > 0){
    //     var
    //       delta = gResize.attr('id').replace('google-maps-',''),
    //       region = gResize.closest('.region'),
    //       mWidth = region.width() - Drupal.getResizableMargin(gResize) - Drupal.getResizableMargin(gResize.closest('.content')) - Drupal.getResizableMargin(gResize.closest('.block'));

    //     gResize.css('width',mWidth);

    //     var postData = {
    //       width : gResize.width(),
    //       height : gResize.height(),
    //       delta: delta
    //     };
    //     Drupal.behaviors.gmap.updateSettings(postData);

    //     var myLatlng = new google.maps.LatLng(Drupal.behaviors.gmap[delta].marker.position.lat(), Drupal.behaviors.gmap[delta].marker.position.lng());

    //     google.maps.event.trigger(Drupal.behaviors.gmap[delta].map, 'resize');
    //     Drupal.behaviors.gmap[delta].map.setCenter(myLatlng);
    //   }
    // }
	}

  function initializeGmap(delta, options) {
		var canvas_id = 'google-maps-' + delta,
				t,
	    	myLatlng = new google.maps.LatLng(options.latitude, options.longitude),
        type = options.mapTypeId || google.maps.MapTypeId.ROADMAP;

    options = $.extend(options, {
      scrollwheel: false,
    	center: myLatlng,
    	mapTypeId: type
    });

    Drupal.behaviors.gmap[delta] = {};

    try {
      Drupal.behaviors.gmap[delta].map = new google.maps.Map(document.getElementById(canvas_id), options);
      if(Drupal.Builder ){
        $('#'+canvas_id).resizable('destroy');
        $('#'+canvas_id).resizable({
          minHeight : 150,
          minWidth : 150,
          maxHeight : 400,
          handles : 'se',
          create: function(){
            if(typeof this.style == 'undefined' || typeof this.style.width == 'undefined' || this.style.width == 'auto'){
              Drupal.calculateWrapper($(this));
            }

            $(this).resizable('option', 'save', 'saveGmap');
            Drupal.calculateResizable($(this).closest('.gr-wrapper'));

            var
              w = $(this).width(),
              h = $(this).height();

            $(this).resizable('option', 'AR', h/w);
            Drupal.originalWidths[$(this).parent().attr('id')] = $(this).parent().width();
						// var region = $(this).closest('.region'),
						// 	mWidth = region.width() - Drupal.getResizableMargin($(this)) - Drupal.getResizableMargin($(this).closest('.content')) - Drupal.getResizableMargin($(this).closest('.block'));

						// $(this).resizable("option", "maxWidth", mWidth);
					},

          resize: function(event, ui){
            Drupal.calculateWrapper($(this));
          },

					stop: function(event, ui){
            Drupal.saveGmap($(this).closest('.block'), true, ui);
					}
				});
    	}
    } catch(e) {}

    Drupal.behaviors.gmap[delta].marker = new google.maps.Marker({
        position : myLatlng,
        map : Drupal.behaviors.gmap[delta].map,
        draggable : false
    });

    // if(Drupal.Builder){
	   //  google.maps.event.addListener(
	   //  	Drupal.behaviors.gmap[delta].map,
	   //  	'zoom_changed',
	   //  	function(){
	   //  		var delta = $(this.j).attr('id').replace('google-maps-','');
	   //  		clearTimeout(t);
	   //  		t = setTimeout(function(){
		  //   		var postData = {
    // 					zoom : Drupal.behaviors.gmap[delta].map.getZoom(),
	   //      		delta: delta
	   //      	};

			 //      Drupal.behaviors.gmap[delta].map.setCenter(myLatlng);
	   //      	Drupal.behaviors.gmap.updateSettings(postData, true);
	   //  		}, 500);
	   //  	}
	   //  );

	   //  google.maps.event.addListener(
    //     Drupal.behaviors.gmap[delta].marker,
    //     'dragend',
    //     function(e) {
    //     	var delta = $(this.map.j).attr('id').replace('google-maps-','');
    //     	clearTimeout(t);
    //     	t = setTimeout(function(){
	   //      	var postData = {
		  //       		lat: Drupal.behaviors.gmap[delta].marker.position.lat(),
		  //       		lng: Drupal.behaviors.gmap[delta].marker.position.lng(),
		  //       		delta: delta
		  //       	};
		  //       myLatlng = new google.maps.LatLng(postData.lat, postData.lng);
		  //       Drupal.behaviors.gmap[delta].map.setCenter(myLatlng);
	   //      	Drupal.behaviors.gmap.updateSettings(postData, true);
	   //      }, 500);
    //     }
	   //  );
    // }
  }
  Drupal.saveGmap = function(block, log, ui){
    if(typeof log == 'undefined'){
      log = true;
    }
    var
      $that = block.find('.gmap-wrapper');

    if($that.length ==0){
      return;
    }
    var
      w = $that.width(),
      h = $that.height()
      delta = $that.attr('id').replace('google-maps-','');

    $that.resizable('option', 'AR', h/w);
    if(typeof ui == 'undefined' || ui.originalSize.width != $that.width() || ui.originalSize.height != $that.height()){
      var postData = {
        width : $that.closest('.gr-wrapper')[0].style.width,
        height : $that.height(),
        delta: delta
      };

      Drupal.behaviors.gmap.updateSettings(postData, log);
    }

    myLatlng = new google.maps.LatLng(Drupal.behaviors.gmap[delta].marker.position.lat(), Drupal.behaviors.gmap[delta].marker.position.lng());
    google.maps.event.trigger(Drupal.behaviors.gmap[delta].map, 'resize');
    Drupal.originalWidths[$that.parent().attr('id')] = $that.parent().width();
    Drupal.behaviors.gmap[delta].map.setCenter(myLatlng);
  }
})(jQuery);
;
(function($) {

  Drupal.behaviors.g_post = {

    googleEvents: function(wrapper){
      //set default language
      window.___gcfg = {
        lang: $('html').attr('xml:lang')
      };

      if(typeof gapi == 'undefined' || typeof gapi.post == 'undefined'){
        (function() {
          var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
          po.src = 'https://apis.google.com/js/plusone.js';
          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
        })();
      }
      else{
        if(typeof(wrapper) === 'undefined'){
          wrapper = 'body';
        }
        gapi.post.go(wrapper);
      }
    }

  };
})(jQuery);
;
(function($) {
  Drupal.behaviors.button = {
    attach: function(context, settings) {
      this.attachOrderEvents();
      this.fixPhoneLinks();
    },

    attachAll: function(){
      this.attachOrderEvents();
      this.attachAligner();
    },

    attachOrderEvents: function() {
      $('.wbutton-link.order-button').each(function() {
        var selector = '#' + $(this).attr('id'),
            id = $(this).attr('href').replace('/order/', '');
        Drupal.behaviors.product_visitor.initOrderOnButtonWidget(selector, id);
      });
    },

    attachAligner: function(){
      Drupal.widgetTools({
        widgetName: 'button',
        clickActions: function(block, delta, selected) {
          var $btnBlock = $(block).find('.wbutton-link'),
            btnClass = $btnBlock.attr('class').replace(/\s?widget-align-\S+/, '') + ' ' + selected;

          $btnBlock.attr('class', btnClass);

          $.ajax({
            type: 'POST',
            url: '/button/ajax/save_alignment',
            data: {alignment: selected, delta: delta}
          });
        }
      });
    },

    fixPhoneLinks: function() {
      var currentHref, fixedHref;
      $('a.phone-number').each(function() {
        currentHref = $(this).attr('href');
        fixedHref = Drupal.behaviors.phoneUrl.replaceURL(currentHref.replace('tel:', ''));
        $(this).attr('href', fixedHref);
      });
    },

  };
})(jQuery);
;
(function($) {

  Drupal.behaviors.g_badge = {

    googleEvents: function(wrapper){
      //set default language
      window.___gcfg = {
        lang: $('html').attr('xml:lang')
      };

      if(typeof gapi == 'undefined' || typeof gapi.page == 'undefined'){
        (function() {
          var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
          po.src = 'https://apis.google.com/js/plusone.js';
          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
        })();
      }
      else{
        if(typeof(wrapper) === 'undefined'){
          wrapper = 'body';
        }
        gapi.page.go(wrapper);
        gapi.community.go(wrapper);
        gapi.person.go(wrapper);
      }
    }

  };
})(jQuery);
;
(function ($) {
	//TODO: Validation
	//TODO: More complex settings for contact form
	Drupal.behaviors.contact_form = {

		forms : {},
		validating : false,

		attach: function(){
			var cf = this;
			var formId = '';




			$.validator.addMethod("cf-email", function(value, element){
					var validMail = false;
					if($(element).closest('form').attr('id') != 'widgets-config-form'){
						var form = cf.forms[$(element).closest('form').attr('id')];
						var id = form.delta
						if(isValidEmailAddress(value)){
							validMail = true;
						}
					}else{
						if(isValidEmailAddress(value)){ validMail = true; }
					}

					return validMail;
			});

			$.validator.addMethod("cf-captcha", function(value,element){
				var isValid = false;
				if(!cf.validating && !cf.refreshing){
					var form = cf.forms[$(element).closest('form').attr('id')];
					cf.validating = true;
					$.ajax({
						type : 'POST',
						url : Drupal.settings.baseURL + '/contact_form/ajax/captcha_validate',
						async : false,
						data : {
							stamp : form.captcha.stamp,
							captcha : value,
							page : Drupal.settings.design.page_id,
							id : form.delta
						},
						success : function(msg){
							cf.validating = false;
							if(msg[1].settings.valid){
								form.captcha.obj.hide();
								isValid = true;
							} else {
								form.captcha.refresh();
							}
						}
					});
				}
				return isValid;
			});

			$('.block-widgets-contact-form > .content > form:not(.cf-initialized)').each(function(){
				formId = $(this).attr('id');
				// if(typeof cf.forms[formId] == 'undefined'){
				cf.forms[formId] = cf.initForm($(this));
				// }
			});
		},

		initForm: function(form){
			if($('body').hasClass('form-label-inside')){
				if ($.browser.ie && parseInt($.browser.version) < 10) {
					form.find('input[type=text]').attr('autocomplete', 'off');
				}
			} else {
				form.find('input[type=text], textarea').removeAttr('placeholder');
			}
			var
				cf = this,
				delta = form.find('input[name="form_id"]').val().replace('contact_form_','');
				formObj = {
					form : form,
					delta : delta,
					captcha : false,
					email : true,
					phone : true,
					init : function(){
						var
							fObj = this,
							rules = {},
							messages = {};

						form.find('.form-item').each(function(){
							var id = $(this).find('input,textarea').attr('id');
							$(this).find('label').attr('for', id);
						});

						if(fObj.captcha){
							rules['ct_f_email_' + delta] = { 'cf-email' : true };
							rules['ct_f_captcha_' + delta] = { required : true, 'cf-captcha' : true};
						}

						if(fObj.email){
							rules['ct_f_email_' + delta] = { 'cf-email' : true };
						}

						messages['ct_f_name_' + delta] = {required : Drupal.t('Please enter your name')};
						messages['ct_f_email_' + delta] = {required : Drupal.t('Please enter a valid email address') , 'cf-email' : Drupal.t('Please enter a valid email address')};
						messages['ct_f_phone_' + delta] = {required : Drupal.t('Please enter your phone number')};
						messages['ct_f_message_' + delta] = {required : Drupal.t('Please enter your message')};
						messages['ct_f_captcha_' + delta] = {required : Drupal.t('Please enter the words above.'), 'cf-captcha' : Drupal.t('Invalid Captcha. Please try again')};
						messages['ct_f_privacy_' + delta] = {required : Drupal.t('You must agree to the Privacy Policy')};

						fObj.form.validate({
							rules : rules,
							messages : messages,
							onkeyup: false,
							onclick: false,
							onfocusout: false,
							onfocus: false,
							errorPlacement: function(error, element) {
								element.closest('.form-item').append(error);
							}
						});

						fObj.form.submit(function(e){
							e.preventDefault();
							// fObj.submitted = true;
							// if(fObj.form.valid()){
								fObj.form.find('.message.success').remove();
								var inputs = fObj.form.find('input[class^=contact-form], textarea[class^=contact-form]'),
									postData = {};

								$.each(inputs, function(index, input){
									postData[$(input).attr('id')] = $(input).val();
								});
								postData['delta'] = fObj.delta;

								$.ajax({
									type: "POST",
									url: "/contact_form/ajax/submit",
									data: postData,
									success: function(msg) {
										if (msg[1].settings.message.success_type == 'thank_you_page') {
											window.location.href = '/thank-you/' + msg[1].settings.message.page_list;
											return false;
										}

										// success_text = msg[1].settings.message.message_success.length !=0 ? msg[1].settings.message.message_success : Drupal.t('Your message has been sent successfully!')
										// var
										// 	success = $('<div/>')
										// 							.addClass('message success')
										// 							// .text(msg[1].settings.message.message_success)
										// 							.text(success_text)
										// 							.hide();

										$(form).find('input[type=text], textarea').val('').blur();

										if(typeof fObj.captcha.obj != 'undefined'){
											fObj.captcha.obj.show();
											fObj.captcha.refresh();
										} else {

										}

										var closeBtn = $('<span/>').addClass('contact-form-dialog-close'),
											msgContent = $('<iframe/>').attr('id', 'contact-form-success-message').addClass('contact-form-dialog-text').attr('src', Drupal.settings.baseURL + '/contact_form/' + delta + '/success'),
						        	formOverlayContent = $('<div/>').addClass('contact-form-dialog-content').append(closeBtn),
											okBtn = $('<span>' + Drupal.t('Ok') + '</>').addClass('contact-form-dialog-ok'),
						        	formOverlay = $('<div/>').addClass('contact-form-dialog-overlay');

						        // msgContent.append(success.text());
						        formOverlayContent.append(msgContent).append(okBtn);

         						formOverlay.append(formOverlayContent);

										$('body').append(formOverlay);

										okBtn.click(function(){
											formObj.closeOverlay(fObj);
										});
										closeBtn.click(function(){
											formObj.closeOverlay(fObj);
					          });

					          iResizeInterval = setTimeout(function(){
					          	$('#contact-form-success-message').contents().find('body').css('overflow', 'hidden');
									    iframeHTML = $('#contact-form-success-message').contents().find('body .success-text');
										  iframeSize = {width: 0, height: 0 };
										  iframeSize.width = iframeHTML.outerWidth(true);
										  iframeSize.height = iframeHTML.outerHeight(true) + 5;
										  $('#contact-form-success-message').css('height', iframeSize.height + 'px');
										  $('#contact-form-success-message').css('width', '100%');
							      }, 1000);


									}
								});
						});

						fObj.form.find('.c-f-ajax-submit-btn').click(function(e){
							var btn = $(this);

							btn.attr('disabled', 'disabled')
							e.preventDefault();
							e.stopPropagation();
							// if(isValidEmailAddress(fObj.form.find('.cf-email').val()) === false){
							// 	fObj.form.find('.cf-email').addClass('error');
							// 	return fObj.form.validate();
							// }
							window.setTimeout(function() {
								if(form.valid()){
									form.submit();
								}
								if(!form.captcha || form.captcha.valid){
  								btn.removeAttr('disabled');
								}
							}, 200);
						});
					},

					closeOverlay : function(fObj) {
					  $('.contact-form-dialog-overlay').remove();
						fObj.form.find('.c-f-ajax-submit-btn').removeAttr('disabled');
					}

				};

			if((c = form.find('.c-f-captcha-wrapper')).length > 0){
				formObj.captcha = {
					delta : delta,
					obj : c,
					input : c.find('input.cf-captcha'),
					valid : false,
					stamp : 0,
					init : function(){
						var captcha = this;

						this.obj.find('.new-captcha-button').click(function(){
							captcha.refresh();
						});
						$('#captcha-image-' + captcha.delta).bind('load', captcha, function(e){
							e.data.refreshClicked = false;
							e.data.obj.removeClass('refreshing');
							$('#c-f-ajax-submit-'+ e.data.delta).removeAttr('disabled');
						});

						this.refresh();
					},
					refresh : function(){
						var
							captcha = this,
							oldStamp = captcha.stamp,
							img;
						captcha.stamp = new Date().getTime();

						captcha.obj.addClass('refreshing');
						$('#c-f-ajax-submit-'+ captcha.delta).attr('disabled', 'disabled');
						$('#captcha-image-' + captcha.delta).attr('src' , Drupal.settings.baseURL + '/contact_form/ajax/captcha?stamp=' + captcha.stamp +'&old=' + oldStamp + '&id=' + captcha.delta + '&page=' + Drupal.settings.design.page_id );
					}
				}
				formObj.captcha.init();
			}



			formObj.init();
			formObj.form.addClass('cf-initialized');
			return formObj;
		}
	};

	function isValidEmailAddress(emailAddress) {
      var pattern = new RegExp(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/);
      return pattern.test(emailAddress);
  };

}(jQuery));
;
(function($) {

  Drupal.behaviors.FacebookLikeboxWidget = {

    fbEvents: function(wrapper){

      if(typeof FB == 'undefined'){

        if($('#fb-root').length == 0){
          $('body').prepend('<div id="fb-root"></div>');
        }

        var apiKey = '';
        if(typeof Drupal.settings.facebook != "undefined" && typeof Drupal.settings.facebook.apiKey != "undefined"){
          apiKey = Drupal.settings.facebook.apiKey;
        }
        window.fbAsyncInit = function() {
          FB.init({
            appId: apiKey,
            status: true,
            xfbml: true
          });
        };

        (function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0], lang = $('html').attr('xml:lang');
          if (d.getElementById(id)) return;
          lang += '_' + lang.toUpperCase();
          js = d.createElement(s); js.id = id;
          js.src = "//connect.facebook.net/"+ lang +"/all.js";
          fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
      }
      else {
        if(typeof(wrapper) === 'undefined'){
          wrapper = 'page';
        }
        FB.XFBML.parse(document.getElementById(wrapper));
      }
    }
  }
})(jQuery);
;
(function($) {
	$(document).ready(function(){
		Drupal.content_splitter.setWidths();
	});


	Drupal.content_splitter = {
		_globals : {
			splitterObjects : {}
		},

		_defaults: {
			maxRegions: 5,
			minRegions: 2,
			minWidth: 50,
			maxWidth: null
		},

		setWidths: function() {
			var
				selector = '',
				delta = 0,
				splitterObject = {},
				count = 0,
				regions = {},
				defaultWidth = 0,
				previousWidth = 0,
				add,
				notNull;

			if(typeof Drupal.settings.content_splitter != 'undefined') {
				$.each(Drupal.settings.content_splitter, function(id, region_settings) {
					delta = id.replace(/splitter_/g, '');
					selector = '#block-widgets-content_splitter\\:' + delta;

					splitterObject = $(selector);
					if(!splitterObject.hasClass('initialized')){
						regions = splitterObject.find('> .content > ul.content-splitter > li.cs-region');
						count = regions.length;
						defaultWidth = 100 / count;

					    if(typeof region_settings[count-1] == 'undefined') {
					    	return;
					    }

						if(splitterObject.length != 0) {
							currentWidth = 0;
							notNull = 0
							$.each(region_settings, function(i, v){
								if(v.width !== null) {
									currentWidth += parseFloat(v.width);
									notNull++;
								}
							});
							if(currentWidth > 100 || notNull == region_settings.length){
								region_settings[count-1].width = null;
								add = false;
							} else {
								add = (100 - currentWidth) > 0.0001 || region_settings[count-1].width == null;
							}
							beforeLastWidth = 0;
							$.each(regions, function(i) {
								if(i == count-1){
									region_settings[i].width = 100 - beforeLastWidth;
								} else {
									if(add){
										if(region_settings[i].width !== null ){
											region_settings[i].width = parseFloat(region_settings[i].width);
										}
										region_settings[i].width += (region_settings[i].width == null ? defaultWidth : (100 - currentWidth - defaultWidth)/(count-1));
									}
									beforeLastWidth += parseFloat(region_settings[i].width);
								}
								$(this).css('width', region_settings[i].width + '%');
							});

						}
						splitterObject.addClass('initialized');
					}
				});
			}

		},

		getMinWidth: function(region){
			var minWidth = 0, w, ul;

			region.children().each(function(){
				w = 0;
				if($(this).is('.block-widgets-content-splitter')){
					ul = $(this).find('> .content > ul.content-splitter');
					ul.children().each(function(){
						w += Drupal.content_splitter.getMinWidth($(this));
					});
				} else {
					w = parseInt($(this).css('min-width')) + parseInt($(this).css('margin-left')) + parseInt($(this).css('margin-right'));
				}
				if(w > minWidth)
					minWidth = w;
			});

			return Math.max(minWidth, this._defaults.minWidth);
		},

		fixHeights: function(items, force){
			if(!$('body').hasClass('mobile')){
				var height, csRegions;

				if(typeof items == 'undefined'){
					items = $('.block-widgets-content-splitter');
				}

				if(typeof force == 'undefined'){
					force = false;
				}

				items.each(function(){
					if($(this).find('> .content > ul.content-splitter > li.cs-region > .block-widgets-content-splitter').length == 0 || force){
						height = 0;
						csRegions = $(this).find('> .content > ul.content-splitter > li.cs-region');

						csRegions.each(function(){
							$(this).css('min-height', '');
							if($(this).height() > height) {
								height = $(this).height();
							}
						});

						csRegions.css({
								minHeight : height
							});

						if(!force){
							Drupal.content_splitter.fixHeights($(this).parents('.block-widgets-content-splitter'), true);
						}
					}
				});
			}
		}
	}
}(jQuery));
;
;
(function($){

	$(document).ready(function(){

		if(!$('body').hasClass('site-builder'))
			Drupal.behaviors.image_collection.attach();

        var div, idiv, iframe;
        // $('.gallery-image-text-description').dotdotdot({
        //    ellipsis  : '... ',
        //     wrap    : 'letter',
        //     after   : null,
        //     watch   : true,
        //     tolerance : 0,
        //     callback  : function( isTruncated, orgContent ) {
        //       $(this).dotdotdot({
        //         height: $(this).closest('.gallery-image-text-container').height() - 30,
        //       });
        //     },

        //     lastCharacter : {
        //       remove    : [ ' ', ',', ';', '.', '!', '?' ]
        //     }
        //   });
        $(window).resize(function(){
            if($('.pixlr-overlay-background').length > 0){
                    div = $('.pixlr-overlay-background');
                    idiv = $('.pixlr-overlay-iframe-container');
                    iframe = idiv.find('iframe');

                idiv.css({
                    'height' : parseInt(div.outerHeight() * 0.8) + 'px',
                    'width' : parseInt(div.outerWidth() * 0.8) + 'px',
                    'margin' : parseInt(div.outerHeight() * 0.1) + 'px ' + parseInt(div.outerWidth() * 0.1) + 'px'
                });
                iframe.css({
                    width : idiv.innerWidth(),
                    height : idiv.innerHeight()
                });
            }
        });
	});

	Drupal.behaviors.image_collection = {
    slideshowMinWidth : 200,
		attach : function(context, settings) {
			$(".gallery:not(.gallery-layout-slider)").each(function(){
          $(this).find("a:not(.link)").colorbox({
            rel: $(this).closest(".gallery").attr("id"),
            maxHeight: $(window).height() - 50
          });

      });

      $(".gallery-layout-slider").each(function(){
        var
          that = this,
          nrImages = $(this).find("ul.gallery-layout-list li").length,
          delta = $(this).attr('id').replace('gallery-', ''),
          images = $(this).find("ul.gallery-layout-list li"),
          nrPages = 0,
          imgA = $(this).find(".gallery-layout-image a"),
          sliderHeight, fimg,
          margin
          imgPerPage = 16;

        ua = navigator.userAgent;
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || Drupal.settings.preview == true){
          $(this).find('.gallery-layout-image').remove();
          $(this).find('.gallery-layout-list').width('100%');
          $(this).find("ul.gallery-layout-list li").addClass('mobile');
          $(this).find("ul.gallery-layout-list li.mobile").each(function(){
            if ($(this).find('a').length == 0) {
              $(this).append($('<a/>').attr('href', $(this).css('background-image').replace('url(', '').replace(')', '').replace('sb_small', 'colorbox')).css('display', 'block').height('100%'));
            }
          });

          $(this).find("ul.gallery-layout-list li a").colorbox({
            maxHeight: $(window).height() - 50,
            // height: "95%",
            rel: 'mobileGroup',
            scalePhotos: true
          });
        }

        $(this).find("ul.gallery-layout-list a").colorbox({
          maxHeight: $(window).height() - 50,
          // height: "95%",
          scalePhotos: true
        });

        $(this).find('.gallery-layout-page-pager-wrapper').text('');
        if ($(this).find('.gallery-image-page').length <= 0) {
          for(var i = 0; i < images.length; i += imgPerPage) {
            nrPages++;
            images.slice(i, i + imgPerPage).attr('page-id', i);
            $(this).find('.gallery-layout-page-pager-wrapper').append($('<span/>').addClass('number').attr('page-id', i).attr('page-index', nrPages).text(nrPages))
          }
        }

        imgA.click(function(e){
          $(that).find('ul.gallery-layout-list li[img-id=' + $(this).attr('img-id') + '] a').click()
          return false;
        });

        $(this).find('.gallery-layout-page-pager-wrapper').prepend($('<span/>').addClass('dots dots-first').text('...')).append($('<span/>').addClass('dots dots-last').text('...'));

        images.removeClass('shown');
        $('ul.gallery-layout-list li[page-id=0]').addClass('shown');
        Drupal.behaviors.image_collection.updatePager($(this).find('.gallery-layout-page-pager-wrapper'), 0, nrPages, imgPerPage);

        $(this).find(".gallery-layout-arrow").removeClass('disabled');
        $(this).find(".gallery-layout-image .gallery-layout-image-arrow-left").addClass('disabled');
        $(this).find(".gallery-layout-list .gallery-layout-page-arrow-first").addClass('disabled');
        $(this).find(".gallery-layout-list .gallery-layout-page-arrow-left").addClass('disabled');
        if (nrImages - 1 == 0) {
          $(this).find(".gallery-layout-image .gallery-layout-image-arrow-right").addClass('disabled');
        }
        if (nrPages - 1 == 0) {
          $(this).find(".gallery-layout-list .gallery-layout-page-arrow-right").addClass('disabled');
          $(this).find(".gallery-layout-list .gallery-layout-page-arrow-last").addClass('disabled');
        }

        images.each(function(e){
          $(this).height($(this).width());
        });

        fimg = images.first();
        margin = parseInt(fimg.outerHeight(true)) - parseInt(fimg.height());

        sliderHeight = parseInt(fimg.outerHeight(true)) * 4;

        if (nrImages > 12) {
          $(this).find("ul.gallery-layout-list").height($(this).find("ul.gallery-layout-list").height());
          imgA.height($(this).find("ul.gallery-layout-list").height() - margin - 2);
        } else {
          $(this).find("ul.gallery-layout-list").height(sliderHeight);
          imgA.height(sliderHeight - margin);
        }

        $(this).find("ul.gallery-layout-list li:not(.mobile)").die('click').live('click', function(e){
          imageID = $(this).attr('img-id');

          imgA
            .attr('href', $(this).css('background-image').replace('url(', '').replace(')', '').replace(/"/g, '').replace('sb_small', 'colorbox'))
            .css('background-image', 'url(' + $(this).css('background-image').replace('url(', '').replace(')', '').replace(/"/g, '').replace('sb_small', 'sb_large') + ')')
            .attr('img-id', imageID);

          $(that).find('.gallery-layout-image-number-current').text(parseInt(imageID) + 1);

          if (imageID == 0) {
            $(that).find(".gallery-layout-image .gallery-layout-image-arrow-left").addClass('disabled');
          } else {
            $(that).find(".gallery-layout-image .gallery-layout-image-arrow-left").removeClass('disabled');
          }
          if (imageID == nrImages - 1) {
            $(that).find(".gallery-layout-image .gallery-layout-image-arrow-right").addClass('disabled');
          } else {
            $(that).find(".gallery-layout-image .gallery-layout-image-arrow-right").removeClass('disabled');
          }
        }).first().click();

        $(this).find(".gallery-layout-image .gallery-layout-image-arrow-left:not(.disabled)").die('click').live('click', function(e){
          imageID = imgA.attr('img-id');
          newID = parseInt(imageID) - 1;

          if (newID >= 0) {

            if($(that).find('.gallery-image-' + newID + '.shown').length > 0){
              $(that).find('.gallery-image-' + newID + '.shown').click();
            } else {
              $(that).find(".gallery-layout-list .gallery-layout-page-arrow-left").click();
            }

            $(that).find(".gallery-layout-image .gallery-layout-image-arrow-right").removeClass('disabled');
          }
        });

        $(this).find(".gallery-layout-image .gallery-layout-image-arrow-right:not(.disabled)").die('click').live('click', function(e){
          imageID = imgA.attr('img-id');
          newID = parseInt(imageID) + 1;
          if (newID < nrImages) {
            if($(that).find('.gallery-image-' + newID + '.shown').length > 0){
              $(that).find('.gallery-image-' + newID + '.shown').click();

            } else {
              $(that).find(".gallery-layout-list .gallery-layout-page-arrow-right").click();
            }

            $(that).find(".gallery-layout-image .gallery-layout-image-arrow-left").removeClass('disabled');

            if (newID == nrImages - 1) {
              $(this).addClass('disabled');
            }
          }
        });

        $(this).find(".gallery-layout-list .gallery-layout-page-arrow-first:not(.disabled)").die('click').live('click', function(e){
          newID = 0;

          if($(that).find('li[page-id=' + newID + ']').length > 0){
            $(that).find('li.shown').removeClass('shown');
            $(that).find('li[page-id=' + newID + ']').addClass('shown');

            images.each(function(e){
              $(this).height($(this).width());
            });

            clickID = newID + imgPerPage - 1;
            $(that).find('.gallery-layout-list .gallery-image-' + clickID).click();
            Drupal.behaviors.image_collection.updatePager($(that).find('.gallery-layout-page-pager-wrapper'), newID, nrPages, imgPerPage);

            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-first").addClass('disabled');
            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-left").addClass('disabled');
            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-right").removeClass('disabled');
            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-last").removeClass('disabled');
          }
        });

        $(this).find(".gallery-layout-list .gallery-layout-page-arrow-left:not(.disabled)").die('click').live('click', function(e){
          pageID = $(that).find('li.shown').first().attr('page-id');
          newID = parseInt(pageID) - imgPerPage;

          if($(that).find('li[page-id=' + newID + ']').length > 0){
            $(that).find('li.shown').removeClass('shown');
            $(that).find('li[page-id=' + newID + ']').addClass('shown');

            images.each(function(e){
              $(this).height($(this).width());
            });

            clickID = newID + imgPerPage - 1;
            $(that).find('.gallery-layout-list .gallery-image-' + clickID).click();
            Drupal.behaviors.image_collection.updatePager($(that).find('.gallery-layout-page-pager-wrapper'), newID, nrPages, imgPerPage);

            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-right").removeClass('disabled');
            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-last").removeClass('disabled');
            if (newID == 0) {
              $(this).addClass('disabled');
              $(that).find(".gallery-layout-list .gallery-layout-page-arrow-first").addClass('disabled');
            }
          }
        });

        $(this).find(".gallery-layout-list .gallery-layout-page-arrow-right:not(.disabled)").die('click').live('click', function(e){
          pageID = $(that).find('li.shown').first().attr('page-id');
          newID = parseInt(pageID) + imgPerPage;

          if($(that).find('li[page-id=' + newID + ']').length > 0){
            $(that).find('li.shown').removeClass('shown');
            $(that).find('li[page-id=' + newID + ']').addClass('shown');

            images.each(function(e){
              $(this).height($(this).width());
            });

            clickID = newID;
            $(that).find('.gallery-layout-list .gallery-image-' + clickID).click();
            Drupal.behaviors.image_collection.updatePager($(that).find('.gallery-layout-page-pager-wrapper'), newID, nrPages, imgPerPage);

            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-first").removeClass('disabled');
            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-left").removeClass('disabled');
            if (newID == (nrPages - 1) * imgPerPage) {
              $(this).addClass('disabled');
              $(that).find(".gallery-layout-list .gallery-layout-page-arrow-last").addClass('disabled');
            }
          }
        });

        $(this).find(".gallery-layout-list .gallery-layout-page-arrow-last:not(.disabled)").die('click').live('click', function(e){
          newID = (nrPages - 1) * imgPerPage;

          if($(that).find('li[page-id=' + newID + ']').length > 0){
            $(that).find('li.shown').removeClass('shown');
            $(that).find('li[page-id=' + newID + ']').addClass('shown');

            images.each(function(e){
              $(this).height($(this).width());
            });

            clickID = newID;
            $(that).find('.gallery-layout-list .gallery-image-' + clickID).click();
            Drupal.behaviors.image_collection.updatePager($(that).find('.gallery-layout-page-pager-wrapper'), newID, nrPages, imgPerPage);

            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-first").removeClass('disabled');
            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-left").removeClass('disabled');
            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-right").addClass('disabled');
            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-last").addClass('disabled');
          }
        });

        $(this).find('.gallery-layout-page-pager-wrapper span.number').die('click').live('click', function(e){
          newID = $(this).attr('page-id');

          if($(that).find('li[page-id=' + newID + ']').length > 0){
            $(that).find('li.shown').removeClass('shown');
            $(that).find('li[page-id=' + newID + ']').addClass('shown');

            images.each(function(e){
              $(this).height($(this).width());
            });

            clickID = newID;
            $(that).find('.gallery-layout-list .gallery-image-' + clickID).click();
            Drupal.behaviors.image_collection.updatePager($(that).find('.gallery-layout-page-pager-wrapper'), newID, nrPages, imgPerPage);

            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-right").removeClass('disabled');
            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-last").removeClass('disabled');
            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-first").removeClass('disabled');
            $(that).find(".gallery-layout-list .gallery-layout-page-arrow-left").removeClass('disabled');

            if (newID == 0) {
              $(that).find(".gallery-layout-list .gallery-layout-page-arrow-first").addClass('disabled');
              $(that).find(".gallery-layout-list .gallery-layout-page-arrow-left").addClass('disabled');
            }
            if (newID == (nrPages - 1) * imgPerPage) {
              $(that).find(".gallery-layout-list .gallery-layout-page-arrow-right").addClass('disabled');
              $(that).find(".gallery-layout-list .gallery-layout-page-arrow-last").addClass('disabled');
            }
          }
        });

      });

      var maxTitle, maxDescription, region, ms = 50, regionWidth, maxRowHeight;
      $('.gallery-table.gallery-visible').each(function(){
        var that = this;
        region = $(this).closest('.region');
        regionWidth = region.width();

        if(regionWidth < 75){
          ms = 500;
        }

        setTimeout(function(){
          maxTitle = 0;
          // maxDescription = 0;
          maxRowHeight = 0;
          $(that).find('.gallery-image-text-container').each(function(){
            if (maxRowHeight < $(this).height()) {
              maxRowHeight = $(this).height();
            }
          });

          $(that).find('.gallery-image-text-title').each(function(){
            if (maxTitle < $(this).height()) {
              maxTitle = $(this).height();
            }
          });
          // $(that).find('.gallery-image-text-description').each(function(){
          //   if (maxDescription < $(this).height()) {
          //     maxDescription = $(this).height();
          //   }
          // });

          $(that).find('.gallery-image-text-container').each(function(){
            $(this).find('.gallery-image-text-title').height(maxTitle);
            $(this).find('.gallery-image-text-description').height(maxRowHeight - maxTitle - $(this).find('.gallery-table-padding').outerHeight(true));
          });
        }, ms);
      });

			// window.setTimeout(function(){
			$(".slideshow:not(.slideshow-layout-new)").each(function(){
        Drupal.behaviors.image_collection.initSlideshow($(this));
      });

      $(".slideshow.slideshow-layout-new").each(function(){
        if (!$(this).hasClass('processed')) {
          that = this;
          $(this).addClass('processed');
          $(this).height($(this).width() / 4 / 1.75);
          $(this).find('.slide-0').addClass('active-1');
          $(this).find('.slide-1').addClass('active-2');
          $(this).find('.slide-2').addClass('active-3');
          $(this).find('.slide-3').addClass('active-4');
          $(this).find('.slide-4').addClass('active-5');

          current = 5;
          lastSlide = $(this).find('.slide').length - 1;

          $(this).find('.slide-' + lastSlide).addClass('active-0');

          if ($(this).hasClass('arrows-enabled')) {
            var direction = $('<div/>').addClass('directionNav').addClass($(this).attr('id'));
            direction.append('<a class="preNav">' + Drupal.t('Prev') + '</a><a class="nextNav">' + Drupal.t('Next') + '</a>');
            $(this).before(direction);

            $(this).parent().find('.preNav').click(function(e){
              clearInterval(t);
              console.log(current);
              if (current < 0) {
                current = lastSlide;
              }

              $(that).find('.slide').addClass('reverse');

              $(that).find('.slide').removeClass('active-5');
              $(that).find('.active-4').removeClass('active-4').addClass('active-5');
              $(that).find('.active-3').removeClass('active-3').addClass('active-4');
              $(that).find('.active-2').removeClass('active-2').addClass('active-3');
              $(that).find('.active-1').removeClass('active-1').addClass('active-2');

              $prev = $(that).find('.active-0').prev();
              if ($prev.length == 0) {
                $prev = $(that).find('.slide-' + lastSlide);
              }

              $(that).find('.active-0').removeClass('active-0').addClass('active-1');
              $prev.addClass('active-0');

              current--;

              t = setInterval(function(){
                if (current > lastSlide) {
                  current = 0;
                }
                $(that).find('.slide').removeClass('reverse');
                Drupal.behaviors.image_collection.slideSlideshowLayout2(current, that);
                current++;
              }, 3000);
            });

            $(this).parent().find('.nextNav').click(function(e){
              clearInterval(t);
              console.log(current);

              if (current > lastSlide) {
                current = 0;
              }

              $(that).find('.slide').removeClass('reverse');

              $(that).find('.slide').removeClass('active-0');
              $(that).find('.active-1').removeClass('active-1').addClass('active-0');
              $(that).find('.active-2').removeClass('active-2').addClass('active-1');
              $(that).find('.active-3').removeClass('active-3').addClass('active-2');
              $(that).find('.active-4').removeClass('active-4').addClass('active-3');
              $(that).find('.active-5').removeClass('active-5').addClass('active-4');
              $(that).find('.slide-' + current).addClass('active-5');

              current++;

              t = setInterval(function(){
                if (current > lastSlide) {
                  current = 0;
                }
                $(that).find('.slide').removeClass('reverse');
                Drupal.behaviors.image_collection.slideSlideshowLayout2(current, that);
                current++;
              }, 3000);
            });
          }

          t = setInterval(function(){
            if (current > lastSlide) {
              current = 0;
            }
            $(that).find('.slide').removeClass('reverse');
            Drupal.behaviors.image_collection.slideSlideshowLayout2(current, that);
            current++;
          }, 3000);
        }
      });

			// }, 50);

      //call pic resize function in admin mode
      if(typeof Drupal.behaviors.builder == 'object'){
        window.setTimeout(function(){
          //TODO find better method than timeout
          Drupal.behaviors.image_collection.blockRefresh($('body'));
        }, 70);
      }
		},

    updatePager : function(pager, current, nrPages, imgPerPage) {
      pager.find('.current').removeClass('current');
      pager.find('span[page-id=' + current + ']').addClass('current');
      currentPageIndex = parseInt(pager.find('.current').attr('page-index'));

      pager.find('span').addClass('invisible');
      pager.find('.current').removeClass('invisible');

      switch(currentPageIndex) {
        case 1:
          pager.find('span[page-index=' + (currentPageIndex + 1) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex + 2) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex + 3) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex + 4) + ']').removeClass('invisible');
          break;

        case 2:
          pager.find('span[page-index=' + (currentPageIndex - 1) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex + 1) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex + 2) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex + 3) + ']').removeClass('invisible');
          break;

        case nrPages - 1:
          pager.find('span[page-index=' + (currentPageIndex - 3) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex - 2) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex - 1) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex + 1) + ']').removeClass('invisible');
          break;

        case nrPages:
          pager.find('span[page-index=' + (currentPageIndex - 4) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex - 3) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex - 2) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex - 1) + ']').removeClass('invisible');
          break;

        default:
          pager.find('span[page-index=' + (currentPageIndex - 2) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex - 1) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex + 1) + ']').removeClass('invisible');
          pager.find('span[page-index=' + (currentPageIndex + 2) + ']').removeClass('invisible');
          break;
      }

      if (pager.find('span[page-index=1]').hasClass('invisible')) {
        pager.find('.dots-first').removeClass('invisible');
      }

      if (pager.find('span[page-index=' + nrPages + ']').hasClass('invisible')) {
        pager.find('.dots-last').removeClass('invisible');
      }
    },

    correctGalleryHeight : function(gallery) {
      var fimg = gallery.find("ul.gallery-layout-list li").first(),
          margin = parseInt(fimg.outerHeight(true)) - parseInt(fimg.height()),
          sliderHeight = parseInt(fimg.outerHeight(true)) * 4,
          nrImages = gallery.find("ul.gallery-layout-list li").length,
          imgA = gallery.find(".gallery-layout-image a");

      gallery.find("ul.gallery-layout-list").height('auto');
      imgA.height('auto');

      if (nrImages > 12) {
        gallery.find("ul.gallery-layout-list").height(gallery.find("ul.gallery-layout-list").height());
        imgA.height(gallery.find("ul.gallery-layout-list").height() - margin - 2);
      } else {
        gallery.find("ul.gallery-layout-list").height(sliderHeight);
        imgA.height(sliderHeight - margin);
      }
    },

    initSlideshow : function(item) {
      if(item.closest('.block-widgets-content-splitter:not(.initialized)').length > 0){
        setTimeout(function() {
          Drupal.behaviors.image_collection.initSlideshow(item);
        }, 10);
        return false;
      }

      delta = item.attr('id').replace('slideshow-','');
      widget_settings = Drupal.settings.widget_settings['image_collection[slideshow]'][delta];
      item.customSlider({
        'effect' : widget_settings.settings.effect,
        'layout' : widget_settings.settings.layout,
        'speed' : widget_settings.settings.speed,
        'delay' : widget_settings.settings.delay,
        'image_shape' : widget_settings.settings.image_shape
      });

      if(typeof Drupal.behaviors.builder == 'object'){
        var ar;
        $('#slideshow-' + delta).resizable({
          minWidth: Drupal.behaviors.image_collection.slideshowMinWidth,
          handles : 'se',
          aspectRatio : true,
          create : function(){
          },

          start : function(event, ui) {
            ar = $(this).height() / $(this).width();

            if ($(this).hasClass('slideshow-layout-4') || $(this).hasClass('slideshow-layout-5')) {
              $(this).resizable('option', 'maxWidth', $(this).closest('.block').width() - parseInt($(this).css('margin-right')));
              $(this).resizable('option', 'maxHeight', ($(this).closest('.block').width() - parseInt($(this).css('margin-right'))) * ar);
              $(this).resizable('option', 'minWidth', Drupal.behaviors.image_collection.slideshowMinWidth - parseInt($(this).css('margin-right')));
              $(this).resizable('option', 'minHeight', (Drupal.behaviors.image_collection.slideshowMinWidth - parseInt($(this).css('margin-right'))) * ar);
            } else {
              $(this).resizable('option', 'maxWidth', $(this).closest('.block').width());
              $(this).resizable('option', 'maxHeight', $(this).closest('.block').width() * ar);
              $(this).resizable('option', 'minHeight', Drupal.behaviors.image_collection.slideshowMinWidth * ar);
            }


          },

          resize : function(event, ui){
          },

          stop : function(event, ui){
            $(this).css('width', $(this).width()*100 / $(this).closest('.block').width() + '%');
            if($(this).hasClass('slideshow-layout-5') || $(this).hasClass('slideshow-layout-4')){
              $(this).find('.controlNav').css('top', 0);
            }
            $(this).find('.controlNav').css('left', 0);
            Drupal.contentManager.status.saveStart();
            $.ajax({
              type : 'POST',
              url : '/image_collection/ajax/save_slideshow_width',
              data : {
                delta: $(this).attr('id').replace('slideshow-', ''),
                width: $(this).width()*100 / $(this).closest('.block').width(),
                page: Drupal.settings.builder.path
              },
              success : function(msg){
                Drupal.contentManager.status.saveEnd();
                Drupal.behaviors.image_collection.blockRefresh($('body'));
              }
            });
          }
        });

      }

    },

    blockRefresh : function(parent, keepPerc){
      //automatically change picture sizes in gallery
      if(!keepPerc && parent[0].nodeName != "BODY"){
        return;
      }

      var galleries = parent.find('.gallery, .slideshow');
      if(galleries.length == 0){
        return;
      }

      var gallery, images, src, sizeDiv, size, vProp, size_name, delta;
      $(galleries).each(function(){
        gallery = $(this);
        delta = gallery.attr('id').replace('gallery-','').replace('slideshow-','');

        if (gallery.hasClass('gallery')) {
          images = gallery.find('a');
          sizeDiv = gallery.find('.gallery-table-padding:first');

          size = {
            w : sizeDiv.width(),
            h : sizeDiv.height()
          };

          if (gallery.find('table').hasClass('gallery-cover')) {
            needSave = false;
            size_name = {};
            images.each(function(index, value){

              originalSrc = $(this).css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, "");
              Drupal.behaviors.image_collection.checkWhichImageStyleFitsCover($(this), size);
              newSrc = $(this).css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, "")
              if (originalSrc != newSrc) {
                needSave = true;
              }

              if (newSrc.indexOf('sb_small') > -1) {
                size_name[index] = 'sb_small';
              } else {
                if (newSrc.indexOf('sb_medium') > -1) {
                  size_name[index] = 'sb_medium';
                } else {
                  size_name[index] = 'sb_large';
                }
              }
            });

            //save pic size to db
            if(needSave){
              $.ajax({
                type : 'POST',
                url : '/image_collection/ajax/save_pic_size',
                data : {size: size_name, delta: delta}
              });
            }
          }

          if (gallery.find('table').hasClass('gallery-contain')) {
            needSave = false;
            size_name = {};
            images.each(function(index, value){

              originalSrc = $(this).css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, "");
              Drupal.behaviors.image_collection.checkWhichImageStyleFitsContain($(this), size);
              newSrc = $(this).css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, "")
              if (originalSrc != newSrc) {
                needSave = true;
              }

              if (newSrc.indexOf('sb_small') > -1) {
                size_name[index] = 'sb_small';
              } else {
                if (newSrc.indexOf('sb_medium') > -1) {
                  size_name[index] = 'sb_medium';
                } else {
                  size_name[index] = 'sb_large';
                }
              }
            });

            //save pic size to db
            if(needSave){
              $.ajax({
                type : 'POST',
                url : '/image_collection/ajax/save_pic_size',
                data : {size: size_name, delta: delta}
              });
            }
          }
        } else {
          images = gallery.find('.slide div');
          sizeDiv = gallery.find('.slide div:first');

          size = {
            w : sizeDiv.width(),
            h : sizeDiv.height()
          };

          if(size.w <= 256) {
            size_name = 'sb_small';
          } else  if (size.w <= 512) {
            size_name = 'sb_medium';
          } else {
            size_name = 'sb_large';
          }

          needSave = false;

          images.each(function(index, value){
            originalSrc = $(this).css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, "");
            if(originalSrc.indexOf('/' + size_name) == -1){
              newSrc = originalSrc.replace(/styles\/(sb_small|sb_medium|sb_large)/g, 'styles/' + size_name);
              $(this).css('background-image', 'url("' + newSrc + '")');
              needSave = true;
            }
          });

          if(needSave){
            $.ajax({
              type : 'POST',
              url : '/image_collection/ajax/save_pic_size',
              data : {size: size_name, delta: delta}
            });
          }
        }

      });
    },

    // checks which image style needs to be used in the cell, if the background-size is 'cover'
    checkWhichImageStyleFitsCover : function(img, cellSize) {
      imgSrc = img.css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, "");

      backgroundImageSmall = new Image();
      imgSrc = imgSrc.replace(/styles\/sb_[a-z]+/, 'styles/sb_small');
      backgroundImageSmall.src = imgSrc;

      // the lower value needs to fit the cell
      if (backgroundImageSmall.width >= cellSize.w && backgroundImageSmall.height >= cellSize.h) {
        img.css('background-image','url(' + imgSrc + ')');
      } else {
        backgroundImageMedium = new Image();
        imgSrc = imgSrc.replace(/styles\/sb_[a-z]+/, 'styles/sb_medium');
        backgroundImageMedium.src = imgSrc;

        if (backgroundImageMedium.width >= cellSize.w && backgroundImageMedium.height >= cellSize.h) {
          img.css('background-image','url(' + imgSrc + ')');
        } else {
          imgSrc = imgSrc.replace(/styles\/sb_[a-z]+/, 'styles/sb_large');
          img.css('background-image','url(' + imgSrc + ')');
        }
      }
    },

    // checks which image style needs to be used in the cell, if the background-size is 'contain'
    checkWhichImageStyleFitsContain : function(img, cellSize) {
      imgSrc = img.css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, "");

      backgroundImageSmall = new Image();
      imgSrc = imgSrc.replace(/styles\/sb_[a-z]+/, 'styles/sb_small');
      backgroundImageSmall.src = imgSrc;

      // only the larger value needs to fit in the cell
      if (backgroundImageSmall.width > backgroundImageSmall.height) {

        if (backgroundImageSmall.width >= cellSize.w) {
          img.css('background-image','url(' + imgSrc + ')');
        } else {
          backgroundImageMedium = new Image();
          imgSrc = imgSrc.replace(/styles\/sb_[a-z]+/, 'styles/sb_medium');
          backgroundImageMedium.src = imgSrc;

          if (backgroundImageMedium.width >= cellSize.w) {
            img.css('background-image','url(' + imgSrc + ')');
          } else {
            imgSrc = imgSrc.replace(/styles\/sb_[a-z]+/, 'styles/sb_large');
            img.css('background-image','url(' + imgSrc + ')');
          }
        }

      } else {

        if (backgroundImageSmall.height >= cellSize.h) {
          img.css('background-image','url(' + imgSrc + ')');
        } else {
          backgroundImageMedium = new Image();
          imgSrc = imgSrc.replace(/styles\/sb_[a-z]+/, 'styles/sb_medium');
          backgroundImageMedium.src = imgSrc;

          if (backgroundImageMedium.height >= cellSize.h) {
            img.css('background-image','url(' + imgSrc + ')');
          } else {
            imgSrc = imgSrc.replace(/styles\/sb_[a-z]+/, 'styles/sb_large');
            img.css('background-image','url(' + imgSrc + ')');
          }
        }

      }

    },

    widgetSorted: function(wrapper){

      images = wrapper.find("ul.gallery-layout-list li");
      images.each(function(e){
        $(this).height($(this).width());
      });
      $(wrapper).find('.gallery-layout-slider').height($(wrapper).find('.gallery-layout-slider').width()*50/100);
      $(wrapper).find('.gallery-layout-slider img').css('max-height', ($(wrapper).find('.gallery-layout-slider').width()*50/100)-40);

      wrapper.find('.gallery-image-text-title').height('');
      wrapper.find('.gallery-image-text-description').height('');

      var
        maxTitle = 0,
        maxDescription = 0,
        maxRowHeight = 0;

      wrapper.find('.gallery-image-text-container').each(function(){
        if (maxRowHeight < $(this).height()) {
          maxRowHeight = $(this).height();
        }
      });
      // setTimeout(function(){
      wrapper.find('.gallery-image-text-title').each(function(){
        if (maxTitle < $(this).height()) {
          maxTitle = $(this).height();
        }
      });
      // wrapper.find('.gallery-image-text-description').each(function(){
      //   if (maxDescription < $(this).height()) {
      //     maxDescription = $(this).height();
      //   }
      // });

      if (wrapper.find('.gallery-table.gallery-visible').length > 0) {
        wrapper.find('.gallery-image-text-container').each(function(){
          $(this).find('.gallery-image-text-title').height(maxTitle);
          $(this).find('.gallery-image-text-description').height(maxRowHeight - maxTitle - $(this).find('.gallery-table-padding').outerHeight(true));
        });
      }
      // }, ms);
    },

    slideSlideshowLayout2: function(current, slideshow){
      $(slideshow).find('.slide').removeClass('active-0');
      $(slideshow).find('.active-1').removeClass('active-1').addClass('active-0');
      $(slideshow).find('.active-2').removeClass('active-2').addClass('active-1');
      $(slideshow).find('.active-3').removeClass('active-3').addClass('active-2');
      $(slideshow).find('.active-4').removeClass('active-4').addClass('active-3');
      $(slideshow).find('.active-5').removeClass('active-5').addClass('active-4');
      $(slideshow).find('.slide-' + current).addClass('active-5');
    }

	}

  $(window).load(function(){
      var delta, widget_settings;
      $(".slideshow:not(.slideshow-layout-new)").each(function(){
          delta = $(this).attr('id').replace('slideshow-','');
          widget_settings = Drupal.settings.widget_settings['image_collection[slideshow]'][delta];
          $(this).customSlider({
              'effect' : widget_settings.settings.effect,
              'layout' : widget_settings.settings.layout,
              'speed' : widget_settings.settings.speed,
              'delay' : widget_settings.settings.delay,
              'image_shape' : widget_settings.settings.image_shape
          });
      });
  });

  $(window).resize(function() {
    $(".gallery-layout-slider").each(function(){
      images = $(this).find("ul.gallery-layout-list li");
      images.each(function(e){
        $(this).height($(this).width());
      });

      Drupal.behaviors.image_collection.correctGalleryHeight($(this));
    });
  });

	Drupal.getMousePos = function(e){
		this.pos = {
			x:0,
			y:0
		};
		if (!e) var e = window.event;
		if (e.pageX || e.pageY)	{
			this.pos.x = e.pageX;
			this.pos.y = e.pageY;
		}
		else if (e.clientX || e.clientY){
			this.pos.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			this.pos.y = e.clientY + document.body.scrollTop	+ document.documentElement.scrollTop;
		}
		return this.pos;
	};

	Drupal.pixlr = function() {
	    /*
     * IE only, size the size is only used when needed
     */
    function windowSize() {
        var w = 0,
            h = 0;
        if (document.documentElement.clientWidth !== 0) {
            w = document.documentElement.clientWidth;
            h = document.documentElement.clientHeight;
        } else {
            w = document.body.clientWidth;
            h = document.body.clientHeight;
        }
        return {
            width: w,
            height: h
        };
    }

    function extend(object, extender) {
        for (var attr in extender) {
            if (extender.hasOwnProperty(attr)) {
                object[attr] = extender[attr] || object[attr];
            }
        }
        return object;
    }

    function buildUrl(opt) {
        var url = 'http://pixlr.com/' + opt.service + '/?s=c', attr;
        for (attr in opt) {
            if (opt.hasOwnProperty(attr) && attr !== 'service') {
                url += "&" + attr + "=" + escape(opt[attr]);
            }
        }
        return url;
    }
    var bo = {
        ie: window.ActiveXObject,
        ie6: window.ActiveXObject && (document.implementation !== null) && (document.implementation.hasFeature !== null) && (window.XMLHttpRequest === null),
        quirks: document.compatMode === 'BackCompat' },
        port = (location.port.length == 0 ) ? '' : ':' + location.port,
        return_obj = {
            settings: {
                // credentials: false,
                referrer: 'MyCylex',
                method: 'GET',
                exit: location.protocol + "//" + location.host + port + '/pixlr/close',
                target: location.protocol + "//" + location.host + port + '/pixlr/save',
                redirect: location.href,
                // loc: "",
                // launch_url: "http://pixlr.com/express/",
                locktitle: true,
                quality: 100,
                locktype: 'png',
                locktarget: true,
                service: 'express',
                wmode: 'opaque',
            },
            overlay: {
                show: function (options) {
                    Drupal.Builder.disable_scroll();
                    if(options.callback){
                        Drupal.pixlr.callback = options.callback;
                    }
                    var opt = extend(return_obj.settings, options || {}),
                        iframe = $('<iframe/>'),
                        div = Drupal.pixlr.overlay.div = $('<div/>').addClass('pixlr-overlay-background'),
                        idiv = Drupal.pixlr.overlay.idiv = $('<div/>').addClass('pixlr-overlay-iframe-container'),
                        closeDiv = Drupal.pixlr.overlay.closeDiv = $('<span/>').addClass('pixlr-overlay-close');
                        // delete opt.callback;
                    $('body')
                        .append(div)
                        .append(idiv);

                    idiv.css({
                        'height' : parseInt(div.outerHeight() * 0.8) + 'px',
                        'width' : parseInt(div.outerWidth() * 0.8) + 'px',
                        'margin' : parseInt(div.outerHeight() * 0.1) + 'px ' + parseInt(div.outerWidth() * 0.1) + 'px'
                    });
                    iframe.css({
                      width : idiv.innerWidth(),
                      height : idiv.innerHeight()
                    });


                    closeDiv.click(function(){
                      Drupal.pixlr.overlay.hide();
                    });

                    iframe.attr('src', buildUrl(opt));

                    $(idiv)
                      .append(iframe)
                      .append(closeDiv);

                },
                hide: function (oSrc, sbSrc) {
                    if ($('.ui-dialog').length < 1) {
                      Drupal.Builder.enable_scroll();
                    }
                    if (Drupal.pixlr.overlay.idiv && Drupal.pixlr.overlay.div) {
                        Drupal.pixlr.overlay.idiv.remove();
                        Drupal.pixlr.overlay.div.remove();
                    }
                    if (typeof oSrc != 'undefined') {
                        Drupal.pixlr.callback(oSrc, sbSrc);
                    }
                    // var opt = extend(return_obj.settings, options || {});
                    // console.log(opt);
                }
            },
            url: function(options) {
                return buildUrl(extend(return_obj.settings, options || {}));
            },
            edit: function (options) {
                var opt = extend(return_obj.settings, options || {});
                location.href = buildUrl(opt);
            }
        };
    return return_obj;
	}();
})(jQuery);
;
(function($) {
  Drupal.behaviors.paypal_widget = {
    attach: function(context, settings) {
      this.attachEvents();
      if (settings != undefined && settings.module != undefined && settings.delta != undefined) {
        Drupal.behaviors.widgets.correctSpacing(settings.module, settings.delta);
      }
    },

    attachEvents: function() {
      $('.block-widgets-paypal-widget').each(function(){
        $(this).find('.pp-btn-wrap').unbind('click').click(function(){
          $(this).closest('form').submit();
          return false;
        });
      });
    }
  }
})(jQuery);
;

var iResizeInterval;

(function($){
  Drupal.behaviors.html_embedder = {
    attach: function() {
      var id = '';
      iResizeInterval = setInterval(function(){
        iframes = $('.block-widgets-html-embedder');
        $.each(iframes, function(){
          iframe = $(this).find('iframe');
          id = iframe.attr('id');

          iResize(id);
        });
      }, 500);
    }
  }
}(jQuery));

function htmlEmbedderIframeSizeFix(id) {
  iResize(id);
}

function iResize(iframeID) {
  try {
    iframeHTML = jQuery('#' + iframeID).contents().find('body');
  } catch(exception) {
    if(exception.code == 18) {
      clearInterval(iResizeInterval);
    }
  }
  iframeSize = {width: 0, height: 0 };

  iframeSize.width = iframeHTML.outerWidth(true);
  iframeSize.height = iframeHTML.outerHeight(true) + 5;

  jQuery('#' + iframeID).css('height', iframeSize.height + 'px');
  jQuery('#' + iframeID).css('width', '100%');
  Drupal.content_splitter.fixHeights();
}
;
(function($){

  var Slider = function(element, options){
    var that = this;
    this.loaded = false;
    this.settings = $.extend({}, $.fn.customSlider.defaults, options);
    this.settings.delay = parseInt(this.settings.delay);
    this.settings.speed = parseInt(this.settings.speed);
    this.settings.layout = parseInt(this.settings.layout);
    this.settings.image_shape = this.settings.image_shape;
    this.slider = $(element);

    this.init = function (){
      if($(element).closest('.content').width() < 20){
        setTimeout(function(){
          that.init();
        },10);
        return false;
      }

      this.loaded = true;
      // var that = this;

      this.vars = {
        width: $(element).closest('.content').width(),
        height: 0,
        currentSlide: 0,
        currentImage: '',
        totalSlides: $(element).find('div.slide').length,
        sliding: false,
        paused: false,
        stop: false,
        effects : ['slideLeft', 'slideRight', 'slideUp', 'slideDown', 'fade'],
        t:0,
        minWidth: Drupal.behaviors.image_collection.slideshowMinWidth,
        maxWidth: that.slider.closest('.block').width()
      };

      // this.slider.css('position','relative');
      // that.slider.css('height', that.vars.height + 'px');
      // this.slider.addClass('mySlider');

      this.buildLayout();

      that.vars.t = setTimeout(function(){ that.autoSlide() }, that.settings.delay);
      this.refresh();
    }

    this.buildLayout = function(){
      // var that = this;
      this.slideContainer = $('<div>').addClass('slideContainer').prependTo(this.slider);
      this.slider.find('div.slide').appendTo(this.slideContainer);

      switch(this.settings.layout){
        case 0:
          var direction = $('<div/>').addClass('directionNav');
          direction.append('<a class="preNav">' + Drupal.t('Prev') + '</a><a class="nextNav">' + Drupal.t('Next') + '</a>');

          direction.find('a.preNav').click(function(){
            that.sliderDo('prev');
          });

          direction.find('a.nextNav').click(function(){
            that.sliderDo('next');
          });

          that.slider.append(direction);
          break;
        default:
          var nav = $('<div/>').addClass('controlNav'),
            control = $('<div/>').addClass('control-wrapper'),
            img, thumb, anchor;

          that.slider.find('div.slide').each(function(index, values){
            // img = $(this).find('img');
            img = $(this).children('.slide-inner-1');
            thumb = img.attr('rel');
            anchor = $('<a class="thumb thumb-' + index + (index == 0 ? ' active' : '') +'"></a>');

            if(that.settings.layout == 2) {
              anchor.append(index + 1);
            } else {
              anchor.append('<img src="' + thumb + '"/>');
            }

            anchor.click(function(){
              if(!that.vars.sliding && index != that.vars.currentSlide)
                that.sliderDo(index);
            });

            nav.append(anchor);
            control.append(nav);
            that.slider.append(control);
          });

          that.attachPager({
            nav : nav,
            control : control
          });
          break;
      }

      that.slider.closest('.block').addClass('slide-layout-' + that.settings.layout);

      // that.slider.find('div.slide-inner-2').css({
      //   'left' : (-that.vars.width / 2) + 'px'
      // });

      // that.setSliderHeight();
    }

/*    that.setSliderHeight = function(){
      console.log('setSliderHeight');
      var img;
      that.slider.find('div.slide').each(function(){
        img = $(this).find('img');

        img.css({
          'width': that.vars.width + 'px',
          'height' : 'auto'
        });

        if(img.height() > that.vars.height){
          that.vars.height = img.height();
          that.slider.css('height', that.vars.height + 'px');
          that.slider.find('div.slide-inner-2').css({
            'top' : (-that.vars.height / 2) + 'px'
          });
          that.slider.find('.directionNav a').css({
            'top' : (that.vars.height / 2) + 'px'
          })
        }
      });

      if(that.vars.height < 10){
        setTimeout(function(){
          that.setSliderHeight();
        }, 10);
      } else if(!that.slider.hasClass('initialized')){
        that.slider.addClass('initialized');
      }
    }*/

    this.attachPager = function(options){
      // var that = this,
         var mouseX, margin;
      this.pager = {
        nav : options.nav || null,
        control : options.control || null,
        scrolling : false,
        twoColumn : false,
        length : that.slider.find('a.thumb').length,
        itemWidth : that.slider.find('a.thumb').first().outerWidth(true),
        itemHeight : that.slider.find('a.thumb').first().outerHeight(true),
        scroll : {
          direction : [1,2,3].indexOf(that.settings.layout) > -1 ? 'horizontal' : 'vertical',
          horizontal : function(to){
            if(!that.pager.scrolling) {
              if(typeof to == 'string'){
                to = to.replace('last', that.pager.length - 1).replace('first', 0);
              }

              var target = - to * that.pager.itemWidth,
                left = parseInt(that.pager.nav.css('left'))
              if(left - that.pager.control.width() > target - that.pager.itemWidth || target > left){
                target = Math.max(target,  - (that.pager.nav.width() - that.pager.control.width()));
                var duration = (target > left ? target - left :left - target) * 3;
                that.pager.scrolling = true;
                that.pager.nav.stop(true,true).animate({
                  left : target + 'px'
                }, duration, function(){
                  that.pager.scrolling = false;
                });
              }
            }
          },
          vertical : function(to){
            if(!that.pager.scrolling) {
              if(typeof to == 'string'){
                to = to.replace('last', that.pager.length - 1).replace('first', 0);
              }

              if(that.pager.twoColumn) {
                to = Math.ceil(to / 2);
              }

              var target = - to * that.pager.itemHeight;

              var top = parseInt(that.pager.nav.css('top'))
              if(top - that.pager.control.height() > target - that.pager.itemWidth || target > top){
                target = Math.max(target,  - (that.pager.nav.height() - that.pager.control.height()));
                var duration = (target > top ? target - top : top - target) * 3;
                that.pager.scrolling = true;
                that.pager.nav.stop(true,true).animate({
                  top : target + 'px'
                }, duration, function(){
                  that.pager.scrolling = false;
                });
              }
            }
          },
          stop : function(){
            if(typeof that.pager.nav != 'undefined') {
              that.pager.nav.stop();
            }
            that.pager.scrolling = false;
          },
          to : function(to){
            if(typeof that.pager.nav != 'undefined' && !that.pager.scrolling)
              that.pager.scroll[this.direction](to);
          }
        }
      };

      if([1,2,3].indexOf(that.settings.layout) > -1){
        that.pager.nav.css({
          width : that.pager.length * that.pager.itemWidth
        });
        that.pager.control.mousemove(function(e){
          if(that.pager.control.width() < that.pager.nav.width()) {
            mouseX = e.pageX - that.pager.control.offset().left ;
            if(mouseX < that.pager.control.width() * 0.2){
              that.pager.scroll.to('first');
            } else if(mouseX > that.pager.control.width() * 0.8){
              that.pager.scroll.to('last');
            } else {
              that.pager.scroll.stop();
            }
          }
        });
      } else {
        that.pager.twoColumn = that.settings.layout == 5;
        margin = parseInt(that.pager.nav.css('margin-top')) + parseInt(that.pager.nav.css('margin-bottom'));
        that.pager.nav.css({
          height : (margin + parseInt((that.pager.length * that.pager.itemHeight + 1) / (that.pager.twoColumn ? 2 : 1))) + 'px'
        });

        that.pager.control.mousemove(function(e){
          if(that.pager.control.height() < that.pager.nav.height()) {
            mouseY = e.pageY - that.pager.control.offset().top ;
            if(mouseY < that.pager.control.height() * 0.2){
              that.pager.scroll.to('first');
            } else if(mouseY > that.pager.control.height() * 0.8){
              that.pager.scroll.to('last');
            } else {
              that.pager.scroll.stop();
            }
          }
        });
      }
    }

    this.autoSlide = function(){
      if(!this.vars.stop) {
        this.sliderDo('next');
      }
    }

    this.sliderDo = function(target){
      // var that = this;
      var id;

      if(typeof Drupal != 'undefined' && typeof Drupal.animationsPaused != 'undefined' && Drupal.animationsPaused){
        clearTimeout(that.vars.t);
        that.vars.t = setTimeout(function(){ that.autoSlide() }, that.settings.delay);
        return false;
      }
      if(!that.vars || that.vars.stop) return false;
      if(typeof target == 'undefined') {
        return;
      } else {
        if(target == 'prev') {
          id = (that.vars.totalSlides + that.vars.currentSlide - 1) % that.vars.totalSlides;
          slideTo(id);
        } else if(target == 'next') {
          id = (that.vars.currentSlide + 1) % that.vars.totalSlides;
          slideTo(id);
        } else {
          slideTo(target);
        }
      }
      function slideTo(id){
        if(!that.vars.sliding) {
          that.vars.sliding = true;

          var
            current = that.slider.find('.slide-' + that.vars.currentSlide),
            next = that.slider.find('.slide-' + id),
            prop = 'opacity',
            currentPropValue = 0,
            nextPropValue = 1,
            currentCss = {
              'top' : '0%',
              'left' : '0%',
              'z-index' : 100,
              'display' : 'block',
              'opacity' : 1
            },
            nextCss = {
              'top' : '0%',
              'left' : '0%',
              'z-index' : 100,
              'display' : 'block',
              'opacity' : 1
            },
            currentAnimation = {}
            nextAnimation = {},
            effect = that.settings.effect;

          if(effect == 'random') {
            effectId = Math.floor(Math.random() * that.vars.effects.length)
            effect = that.vars.effects[effectId];
          }

          switch(effect){
            case 'fade':
              currentCss['z-index'] = 99;
              nextCss['z-index'] = 100;
              nextCss['opacity'] = 0;
              break;
            case 'slideLeft':
              nextCss['left'] = '100%';
              prop = 'left';
              currentPropValue = '-100%';
              nextPropValue = '0%';
              break;
            case 'slideRight':
              nextCss['left'] = '-100%';

              prop = 'left';
              currentPropValue = '100%';
              nextPropValue = '0%';
              break;
            case 'slideUp':
              nextCss['top'] = '100%';

              prop = 'top';
              currentPropValue = '-100%';
              nextPropValue = '0%';
              break;
            case 'slideDown':
              nextCss['top'] = '-100%';

              prop = 'top';
              currentPropValue = '100%';
              nextPropValue = '0%';
              break;
          }

          current.css(currentCss);
          next.css(nextCss);

          currentAnimation[prop] = currentPropValue;
          nextAnimation[prop] = nextPropValue;

          that.slider.find('a.thumb.active').removeClass('active');
          that.slider.find('a.thumb-' + id).addClass('active');

          if(typeof that.pager != 'undefined'){
            that.pager.scroll.to(parseInt(id));
          }

          current.stop(true,true).animate(currentAnimation, that.settings.speed, function(){
            $(this).css({
              'opacity':'0'
            });
          });

          next.stop(true,true).animate(nextAnimation, that.settings.speed, function(){
            that.vars.sliding = false;
            that.vars.currentSlide = id;
            clearTimeout(that.vars.t);
            that.vars.t = setTimeout(function(){ that.autoSlide() }, that.settings.delay);
          });
        }
      }
    }

    this.refresh = function(){
      if(!this.loaded){
        return;
      }

      if (that.slider.hasClass('slideshow-layout-4') || that.slider.hasClass('slideshow-layout-5')) {
        that.vars.minWidth = Drupal.behaviors.image_collection.slideshowMinWidth - parseInt(that.slider.css('margin-right'));
        that.vars.maxWidth = that.slider.closest('.block').width() - parseInt(that.slider.css('margin-right'));
      } else {
        that.vars.minWidth = Drupal.behaviors.image_collection.slideshowMinWidth;
        that.vars.maxWidth = that.slider.closest('.block').width();
      }

      that.slider.css('min-width', that.vars.minWidth + 'px');
      that.slider.css('max-width', that.vars.maxWidth + 'px');

      that.vars.width = that.slider.width();

      switch(this.settings.image_shape){
        case 'square':
          that.vars.height = that.vars.width;
          break;
        default:
          that.vars.height = that.vars.width / 1.75;
      }

      that.slider.css('height', that.vars.height + 'px');


/*      var that = this;
      if(!this.loaded){
        return;
      }
      that.vars.width = that.slider.closest('.content').width() - parseInt(that.slider.css('margin-right')),
      that.vars.height = 0;

      that.slider.find('div.slide-inner-2').css({
        'left' : (-that.vars.width / 2) + 'px'
      });

      var img;

      that.slider.find('div.slide').each(function(){
        img = $(this).find('img');

        img.css({
          'width': that.vars.width + 'px',
          'height' : 'auto'
        });

        if(img.height() > that.vars.height){
          that.vars.height = img.height();
          that.slider.css('height', that.vars.height + 'px');
          that.slider.find('div.slide-inner-2').css({
            'top' : (-that.vars.height / 2) + 'px'
          });
          that.slider.find('.directionNav a').css({
            'top' : (that.vars.height / 2) + 'px'
          });
        }

        if(that.vars.height != 0){

        }
      });*/
    }

    // this.imageCount = this.slider.find('img').length;
    // this.imagesLoaded = 0;
    // this.imagesVerified = 0;

    // this.slider.find('img').each(function(){
    //   $.ajax({
    //     type : 'POST',
    //     url : '/image_collection/ajax/check_image_exists',
    //     data: { url : $(this).attr('src') },
    //     context : this,
    //     success : function(msg){
    //       console.log(msg);
    //       that.imagesVerified++;
    //       that.checkImages();
    //     },
    //     error : function(){
    //       $(this).closest('.slide').remove();
    //       this.imageCount --;
    //       that.checkImages();
    //     }
    //   });
    // });

/*    this.checkImages = function(){
      var that = this, retry = false;
      this.slider.find('img:not(.imgloaded)').each(function(index,item){
        if(!this.complete){
          if($.browser.msie){
            retry = true;
          } else {
            $(this).bind('load',function(){
              $(this).addClass('imgloaded');
              that.imagesLoaded ++;
              if(that.imagesLoaded == that.imageCount){
                that.init();
              }
            });
          }
        } else {
          $(this).addClass('imgloaded');
          that.imagesLoaded ++;
          if(that.imagesLoaded == that.imageCount){
            that.init();
          }
        }
      });

      if(retry){
        setTimeout(function(){
          that.checkImages();
        },10);
      }
    }
    this.checkImages();*/
    that.init(); //modified
  };

  $.fn.customSlider = function(options) {
    var element,
      slider;
    return this.each(function(key, value){
      element = $(this);
      if (element.data('slider')) {
        if(options == 'refresh'){
          slider = element.data('slider');
          slider.refresh();
        }
        return element.data('slider');
      }

      if(typeof options == 'object' || !options){
        // Pass options to plugin constructor
        slider = new Slider(this, options);
        // Store plugin object in this element's data
        element.data('slider', slider);
      }
    });
  };

  $.fn.customSlider.defaults = {
    effect: 'fade',
    layout: 0,
    speed: 500,
    delay: 3000
  };

  // $.fn._reverse = [].reverse;

}(jQuery))
;
(function ($) {
	Drupal.behaviors.navigator = {
		init : function(){
			$('ul.navigator').navigator();

			if($('#navigation-page-select').length > 0) {
				$('#navigation-page-select').selectbox({ effect: "fade", speed: 0 });
			}

			var sbSelector = '#sbHolder_' + $('#navigation-page-select').attr('sb') + ' .sbOptions a';
			$(sbSelector).each(function(){
				if($(this).attr('href').replace('#/', '') != '') {
					$(this).attr('title', $(this).attr('href').replace('#/', ''));
				}
			});

			var
				link,
			currentPath = window.location.href.replace(Drupal.settings.baseURL, '').replace('preview/', 'page/');

			$('#navigation-page-select').change(function(){
				window.location.href = $(this).val();
			});
			var active = false;
			$('.region-menu .block-widgets-navigator .item-list ul li').each(function() {
				link = $(this).find('a');
				if(typeof link.attr('href') != 'undefined' && link.attr('href').replace(Drupal.settings.baseURL, '').replace('preview/', 'page/') == currentPath) {
					$(this).addClass('active');
					active = true;
				}
			});
			if (!active) {
				$('.region-menu .block-widgets-navigator .item-list ul li').each(function() {
					link = $(this).find('a');
					if(typeof link.attr('href') != 'undefined' && link.attr('href').replace(Drupal.settings.baseURL, '').replace('preview/', '') == currentPath.replace('page/', '')) {
						$(this).addClass('active');
					}
				});
			}

		},

		sort : function(item) {
			$.navigator.ready(item.find('.navigator'));
		},

		attach: function(context, settings){

			if(!Drupal.settings.baseURL) {
				var reg = /https?\:\/\/[^\/]+/;
				Drupal.settings.baseURL = window.location.href.match(reg)[0];
			}

			Drupal.behaviors.navigator.init();
			$(window).load(function() {
				Drupal.behaviors.navigator.init();
			});
		}
	}
}(jQuery));
;
(function($) {
	Drupal.Navigator = function(element, options){
		var menu = $(element),
			parentNum;

		menu.addClass('depth-0');

		menu.find('ul').each(function(){
			parentNum = $(this).parents('ul').length
			$(this).addClass('depth-' + parentNum);
			if(parentNum > 1)
				$(this).addClass('sub-depth-2');

		});

		var
			itemFloat, dim, that, listPos, itemList, listWidth, ul, left, pos;

		menu.find('li').filter(function(){
			return $(this).find(' > div.item-list > ul').length > 0;
		}).each(function(){
			$(this).addClass('has-children');
			$(this).find(' > a').addClass('first-child');

			itemFloat = $(this).css('float');
			$(this).mouseover(function(e){
				that = this;

				$(this).parents('.navigator .item-list').show()
				$(this).closest('li').addClass('hovered');
				dim = {
					// width : $(that).closest('.item-list').outerWidth(true),
					width : $(that).outerWidth(),
					height : $(that).height()
				}

				listPos = $(this).offset().left + $(this).width();

				itemList = $(this).children('div.item-list');
				ul = itemList.find(' > ul');
				listWidth = itemList.outerWidth(true);

				if($(this).css('float') == 'left' && $(this).closest('ul').hasClass('depth-0')){
					if((listPos + listWidth) > $('body').width()){
						$(this).children('div.item-list').css({
							left : '',
							right : '0px',
							top : dim.height + 'px'
						}).show();
					} else {
						$(this).children('div.item-list').css({
							left : '0px',
							right : '',
							top : dim.height + 'px'
						}).show();
					}
				} else {
					left = (listPos + listWidth) > $('body').width() || $(this).closest('ul').hasClass('growleft');
					pos =  left ? - listWidth : dim.width;

					if(left) {
						if (listPos - listWidth - listWidth < 0) {
							ul.removeClass('growleft');
							itemList.css({
								left : dim.width + 'px',
								top : '0px'
							}).show();
						} else {
							ul.addClass('growleft');
							itemList.css({
								left : pos + 'px',
								top : '0px'
							}).show();
						}
					} else {
						ul.removeClass('growleft');
						itemList.css({
							left : dim.width + 'px',
							top : '0px'
						}).show();
					}

					// itemList.css({
					// 	left : pos + 'px',
					// 	top : '0px'
					// }).show();
				}
			}).mouseout(function(){
				$(this).find('div.item-list').hide();
				$(this).parents('.navigator ul').not(menu).parent().hide();
				$(this).parents('ul').find('li').removeClass('hovered');
			});
		});

		var lastElementIndex, regionH, menuH, fontSize, fontFamily, regionW, menuW, moreLink;

		//Menu overflow
		//only in navigation section

		$.navigator.preProcess(menu);
		// console.log(menu.closest('.navigation'));

		if(menu.closest('.navigation').length > 0 && menu.closest('.navigation').find('.processed').length == 0 &&
			 $('#top-navigation').hasClass('all-loaded') ) {
			// if ( !(menu.closest('.navigation').is('#top-navigation')) || menu.closest('.navigation').hasClass('all-loaded')) {

			lastElementIndex = -1,
				i = 0;

			if(menu.closest('.navigation').is('.horizontal')) {
				regionH = menu.closest('.content').innerHeight(), fontSize,
						menuH = 0;

				menu.children('li').each(function(index) {
					fontSize = $(this).find('a').css('font-size');
					fontFamily = $(this).find('a').css('font-family');

					if(menuH + $(this).outerHeight(true) > regionH) {
						menu.append('<li class="last more-links"><a style="font-size: ' + fontSize + '; font-family: ' + fontFamily + '">' + Drupal.t('More') + '</a></li>');

						//if(menuW + $(this).outerWidth(true) + $(menu).children('.more-links').outerWidth(true) + 5 >= regionW) {
						if(menuH + $(menu).children('.more-links').outerHeight(true) >= regionH) {
							lastElementIndex = index - 1;
						} else {
							lastElementIndex = index;
						}

						$(menu).children('.more-links').append('<div class="item-list"><ul class="depth-1" style="left: 0px; top: 50px;"></ul></div>');

						menu.children('li').not('.more-links').each(function(index) {
							if(index >= lastElementIndex) {
								$(menu).children('.more-links').find('ul').eq(0).append($(this).remove());
							}
						});

						$(menu).children('.more-links').find('ul').children('li:first').addClass('first');

						return false;
					}
					else {
						menuH += parseInt($(this).outerHeight(true));
					}
				});
			} else {
				regionW = menu.closest('.content').innerWidth() - (menu.outerWidth(true) - menu.width());
				menuW = 0;
				moreLink = {};
				moreLinkChildren = {};


				if($('.more-links').length != 0) {
					moreLinkChildren = $('.more-links').find('ul.depth-1 > li');

					$('.more-links').remove();

					moreLinkChildren.each(function(){
						menu.append($(this));
					});

				}

				menu.children("li:not('.more-links')").each(function(index) {
					fontSize = $(this).find('a').css('font-size');
					fontFamily = $(this).find('a').css('font-family');
					$(this).addClass('menu-item-' + index);

					if(menuW + $(this).outerWidth(true) > regionW) {

						moreLink = $('<li class="last more-links"><a style="font-size: ' + fontSize + '; font-family: ' + fontFamily + '">' + Drupal.t('More') + '</a></li>');
						menu.append(moreLink);
						//if(menuW + $(this).outerWidth(true) + $(menu).children('.more-links').outerWidth(true) + 5 >= regionW) {
						if(menuW + $(menu).children('.more-links').outerWidth(true) >= regionW) {
							if ($(menu).children('.more-links').outerWidth(true) > $(this).prev().outerWidth(true)) {
								lastElementIndex = index - 2;
							} else {
								lastElementIndex = index - 1;
							}
						}
						else {
							lastElementIndex = index;
						}

						$(menu).children('.more-links').append('<div class="item-list"><ul class="depth-1" style="left: 0px; top: 50px;"></ul></div>');

						menu.children('li').not('.more-links').each(function(index) {
							if(index >= lastElementIndex) {
								$(menu).children('.more-links').find('ul').eq(0).append($(this).remove());
							}
						});

						$(menu).children('.more-links').find('ul').children('li:first').addClass('first');

						return false;
					} else {
						menuW += parseInt($(this).outerWidth(true));
					}
				});
			}

			menu.find('li.more-links').add('li.more-links li').filter(function(){
				return $(this).find(' > div.item-list > ul').length > 0;
			}).each(function(){
				$(this).addClass('has-children');
				$(this).find(' > a').addClass('first-child');

				itemFloat = $(this).css('float');
				$(this).mouseover(function(e){
					that = this;

					$(this).parents('.navigator .item-list').show()
					$(this).closest('li').addClass('hovered');

					dim = {
						width : $(that).outerWidth(),
						height : $(that).outerHeight()
					}

					listPos = $(this).offset().left + $(this).width();

					itemList = $(this).children('div.item-list');
					ul = itemList.find(' > ul');
					listWidth = itemList.outerWidth(true);

					if(itemFloat == 'left' && $(this).closest('ul').hasClass('depth-0')){
						if((listPos + listWidth) > $('body').width()){
							$(this).children('div.item-list').css({
								left : '',
								right : '0px',
								top : dim.height + 'px'
							}).show();
						} else {
							$(this).children('div.item-list').css({
								left : '0px',
								right : '',
								top : dim.height + 'px'
							}).show();
						}
					} else {
						left = (listPos + listWidth) > $('body').width() || $(this).closest('ul').hasClass('growleft');
						pos =  left ? - listWidth : dim.width;

						if(left) {
							if (listPos - listWidth - listWidth < 0) {
								ul.removeClass('growleft');
								ul.parent().css({
									left : dim.width + 'px',
									top : '0px'
								}).show();
							} else {
								ul.addClass('growleft');
								ul.parent().css({
									left : pos + 'px',
									top : '0px'
								}).show();
							}
						} else {
							ul.removeClass('growleft');
							ul.parent().css({
								left : dim.width + 'px',
								top : '0px'
							}).show();
						}

						// ul.parent().css({
						// 	left : pos + 'px',
						// 	top : '0px'
						// }).show();
					}
				}).mouseout(function(){
					$(this).find('div.item-list').hide();
					$(this).parents('.navigator ul').not(menu).parent().hide();
					$(this).parents('ul').find('li').removeClass('hovered');
				});
			});
		}

		menu.addClass('processed');
		//------------------------------------------

		$.navigator.ready(menu);
	}

	$.fn.navigator = function() {
		var element, navigator;
    return this.each(function(key, value){
        element = $(this);
        if (element.data('navigator')) return element.data('navigator');

        navigator = new Drupal.Navigator(this);
        element.data('navigator', navigator);
    });
	};

	$.navigator = function(settings){
		if(typeof settings != 'undefined' && typeof settings.ready != 'undefined'){
			if(typeof $.navigator.readyCallbacks == 'undefined'){
				$.navigator.readyCallbacks = [];
			}
			$.navigator.readyCallbacks.push(settings.ready);
		}

		if(typeof settings != 'undefined' && typeof settings.preProcess != 'undefined'){
			if(typeof $.navigator.preCallbacks == 'undefined'){
				$.navigator.preCallbacks = [];
			}
			$.navigator.preCallbacks.push(settings.preProcess);
		}
	}

	$.navigator.ready = function(nav){
		if(typeof $.navigator.readyCallbacks != 'undefined'){
			$.each($.navigator.readyCallbacks, function(index, callback){
				callback(nav);
			});
		}
	};

	$.navigator.preProcess = function(nav){
		if(typeof $.navigator.preCallbacks != 'undefined'){
			$.each($.navigator.preCallbacks, function(index, callback){
				callback(nav);
			});
		}
	};

	$.fn._reverse = [].reverse;

	$(window).bind("load", function() {
    navi = $('#top-navigation ul.navigator');
    $('#top-navigation').addClass('all-loaded');
    navi.removeClass('processed');
    Drupal.Navigator(navi);
	});
}(jQuery));
;
(function($){
  Drupal.behaviors.product_visitor = {
    attach: function(){
      var
        productWidget = this,
        params;

      Drupal.behaviors.product_visitor.textLength();
      $('.block-widgets-product .product-order > a').live('click', function(e){
        if(!$(this).hasClass('clicked')){
          $(this).addClass('clicked')
          params = $(this).closest('.block').attr('id').split(':');
        }
        e.preventDefault();
        e.stopPropagation();
        productWidget.showOrderOverlay(params[1]);
      });

      Drupal.behaviors.product_visitor.initCBox();
    },

    initCBox: function(){
      $('.block-widgets-product .product-image-cbox').colorbox({
        maxHeight: $(window).height() - 50,
        // rel: 'product-images'
      });
    },

    initOrderOnButtonWidget: function(selector, id) {
      var
        productWidget = this;

      $(selector).die('click');
      $(selector).live('click', function(e){
        if(!$(this).hasClass('clicked')){
          $(this).addClass('clicked')
        }
        e.preventDefault();
        e.stopPropagation();
        productWidget.showOrderOverlay(id);
      });
    },
    isValidEmailAddress : function(emailAddress) {
      var pattern = new RegExp(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/);
      return pattern.test(emailAddress);
    },
    showOrderOverlay: function(delta){
      var
        productWidget = this,
        closeBtn = $('<span/>').addClass('commerce-order-dialog-close'),
        formOverlayContent = $('<div/>').addClass('commerce-order-dialog-content').append(closeBtn),
        formOverlay = $('<div/>').addClass('commerce-order-dialog-overlay');
        $.validator.addMethod('email', function(value, element){
          var validMail = false;
          if(Drupal.behaviors.product_visitor.isValidEmailAddress(value)){
            validMail = true;
          }
          return validMail;
        });
      $.ajax({
        type : 'GET',
        url : '/product/ajax/order/' + delta,
        success : function(msg) {

          formOverlayContent.append(msg[1].settings.form);
          formOverlay.append(formOverlayContent);

          $('body').append(formOverlay);

          form = formOverlay.find('form');
          // if ($('#preview-container-wrapper').length > 0)  {
            $('body').css('overflow-y', 'hidden');
          // }


          form.ajaxForm({
            url: "/system/ajax",
            type: "POST",
            success: function(a,b,c){
              productWidget.closeOverlay();
              // alert(Drupal.t('Email sent'));


              var closeBtn = $('<span/>').addClass('product-order-success-dialog-close'),
                  okBtn = $('<span>' + Drupal.t('Ok') + '</>').addClass('product-order-success-dialog-ok'),
                  msgContent = $('<span/>').addClass('product-order-success-dialog-text'),
                  formOverlayContent = $('<div/>').addClass('product-order-success-dialog-content').append(closeBtn),
                  formOverlay = $('<div/>').addClass('product-order-success-dialog-overlay');

              msgContent.append(Drupal.t('Email sent'));
              formOverlayContent.append(msgContent).append(okBtn);
              formOverlay.append(formOverlayContent);
              $('body').append(formOverlay);

              okBtn.click(function(){
                formOverlay.remove();
              });
              closeBtn.click(function(){
                formOverlay.remove();
              });
            }
          }).validate({
            rules : {
              'order[full_name]' :{
                required : true
              },
              'order[mail]' : {
                email : true,
                required : true
              },
              'order[quantity]' : {
                number : true,
                required : true,
                min : 1
              }
            },
            messages : {
              'order[full_name]' : {
                required : Drupal.t('Please enter your full name')
              },
              'order[mail]' : {
                required : Drupal.t('Please enter an email address'),
                email : Drupal.t('Please enter a valid email address')
              },
              'order[quantity]' : {
                required : Drupal.t('Please enter a quantity'),
                number : Drupal.t('Please enter a number'),
                min : Drupal.t('Please enter a number greater than or equal to 1')
              }
            },
            onkeyup: false,
            onclick: false,
            onfocusout: false,
            onfocus: false
          });

          form.find('input.form-submit').click(function(e){
            e.preventDefault();
            e.stopPropagation();
            if(!$(this).hasClass('clicked')){
              if(form.valid()){
                $(this).addClass('clicked');
                form.submit();
              }
            }
            return false;
          });

          closeBtn.click(function(){
            productWidget.closeOverlay();
          });

          maxHeight = $(window).height() - 40;
          formOverlayContent.css({'max-height' : maxHeight + 'px', 'overflow-y':'auto', 'box-sizing':'border-box'});
        }
      });

    },
    textLength : function(){
      if($(".p-description p.multiline").length > 0) {
        if(!$.browser.msie || ($.browser.msie && $.browser.version > 8)){
          $(".p-description p.multiline").dotdotdot({
            /*  The HTML to add as ellipsis. */
            ellipsis  : '... ',
            wrap    : 'letter',
            after   : null,
            watch   : true,
            height    : 159,
            tolerance : 0,
            callback  : function( isTruncated, orgContent ) {},

            lastCharacter : {
              remove    : [ ' ', ',', ';', '.', '!', '?' ]
            }
          });
          $(".product-order a").dotdotdot({
            /*  The HTML to add as ellipsis. */
            ellipsis  : '... ',
            wrap    : 'letter',
            after   : null,
            watch   : true,
            height    : 90,
            tolerance : 0,
            callback  : function( isTruncated, orgContent ) {},

            lastCharacter : {
              remove    : [ ' ', ',', ';', '.', '!', '?' ]
            }
          });
        }
      }
    },
    closeOverlay : function(){
      $('.commerce-order-dialog-overlay').remove();
      $('.block-widgets-product a.clicked').removeClass('clicked');
      // if ($('#preview-container-wrapper').length == 0)  {
        $('body').css('overflow-y', 'visible');
      // }
    }
  }

  $(window).load(function() {
    Drupal.productFixSize();
  });

  $(window).resize(function() {
    maxHeight = $(window).height() - 40;
    $('.commerce-order-dialog-content').css({'max-height' : maxHeight + 'px', 'overflow-y':'auto', 'box-sizing':'border-box'});
  });

  Drupal.productResizeInit = function(item){
    if(item.closest('.block:not(.block-widgets-product)').is('.block-widgets-content-splitter:not(.initialized)')){
      setTimeout(function(){
        Drupal.productResizeInit(item);
      },10);
      return false;
    }

    var
      box = item.closest('.main-product-wrapper'),
      mWidth = box.width() - 10;

    var
      maxWidth = Math.min(200, mWidth),
      maxHeight = 150,
      save = false;
    img = item.find('img');
    if(!img[0].complete) {
      img.load(function(){
        if($(this).height() == 0){
          setTimeout(function(){
            Drupal.productResizeInit(item);
          }, 10);
          return;
        }
        // if($(this).width() < 50){
        //   img.css({
        //     width : 50,
        //     height : 'auto'
        //   });
        // }

        var h = $(this).height(),
            w = $(this).width(),
            ar = h/w;

        if (maxWidth * ar > maxHeight){
          maxWidth = Math.floor(maxHeight / ar);
          save=true;
        }

        if(h > maxHeight){
          h = maxHeight;
          w = Math.floor(h / ar);
        }

        item.resizable('option','AR', ar);
        item.resizable("option", 'maxWidth', maxWidth);
        item.resizable("option", 'maxHeight', maxHeight);
        Drupal.originalWidths[item.attr('id')] = w;
        item.css('height', h + 'px');
        item.css('width', w + 'px');
        if(save){
          Drupal.saveProduct(item.closest('.block'));
        }
      });
    } else {
      Drupal.responsiveMode.responsive(item.closest('.block'));
      if(item.height() == 0){
        item.css('height', 'auto');
      }
      var h = img.height(),
          w = img.width(),
          ar = h/w;

      if (maxWidth * ar > maxHeight){
        maxWidth = Math.floor(maxHeight / ar);
        save = true;
      }

      if(h > maxHeight){
        h = maxHeight;
        w = Math.floor(h / ar);
      }

      item.resizable('option','AR', ar);
      item.resizable("option", 'maxWidth', maxWidth);
      item.resizable("option", 'maxHeight', maxHeight);
      Drupal.originalWidths[item.attr('id')] = w;
      item.css('height', h + 'px');
      item.css('width', w + 'px');
      if(save){
        Drupal.saveProduct(item.closest('.block'));
      }
    }
  }

  Drupal.productFixSize = function() {
    var h;
    $('.block-widgets-product').each(function() {
      h = $(this).find('.product-image-wrapper .product-image').height();
      $(this).find('.product-image-wrapper').css('height', h);
    });
  }
}(jQuery));
;
/*
 *	jQuery dotdotdot 1.5.6
 *
 *	Copyright (c) 2013 Fred Heusschen
 *	www.frebsite.nl
 *
 *	Plugin website:
 *	dotdotdot.frebsite.nl
 *
 *	Dual licensed under the MIT and GPL licenses.
 *	http://en.wikipedia.org/wiki/MIT_License
 *	http://en.wikipedia.org/wiki/GNU_General_Public_License
 */


(function( $ )
{
	if ( $.fn.dotdotdot )
	{
		return;
	}

	$.fn.dotdotdot = function( o )
	{
		if ( this.length == 0 )
		{
			debug( true, 'No element found for "' + this.selector + '".' );
			return this;
		}
		if ( this.length > 1 )
		{
			return this.each(
				function()
				{
					$(this).dotdotdot( o );
				}
			);
		}


		var $dot = this;

		if ( $dot.data( 'dotdotdot' ) )
		{
			$dot.trigger( 'destroy.dot' );
		}

		$dot.bind_events = function()
		{
			$dot.bind(
				'update.dot',
				function( e, c )
				{
					e.preventDefault();
					e.stopPropagation();

					opts.maxHeight = ( typeof opts.height == 'number' )
						? opts.height
						: getTrueInnerHeight( $dot );

					opts.maxHeight += opts.tolerance;

					if ( typeof c != 'undefined' )
					{
						if ( typeof c == 'string' || c instanceof HTMLElement )
						{
					 		c = $('<div />').append( c ).contents();
						}
						if ( c instanceof $ )
						{
							orgContent = c;
						}
					}

					$inr = $dot.wrapInner( '<div class="dotdotdot" />' ).children();
					$inr.empty()
						.append( orgContent.clone( true ) )
						.css({
							'height'	: 'auto',
							'width'		: 'auto',
							'border'	: 'none',
							'padding'	: 0,
							'margin'	: 0
						});

					var after = false,
						trunc = false;

					if ( conf.afterElement )
					{
						after = conf.afterElement.clone( true );
						conf.afterElement.remove();
					}
					if ( test( $inr, opts ) )
					{
						if ( opts.wrap == 'children' )
						{
							trunc = children( $inr, opts, after );
						}
						else
						{
							trunc = ellipsis( $inr, $dot, $inr, opts, after );
						}
					}
					$inr.replaceWith( $inr.contents() );
					$inr = null;

					if ( $.isFunction( opts.callback ) )
					{
						opts.callback.call( $dot[ 0 ], trunc, orgContent );
					}

					conf.isTruncated = trunc;
					return trunc;
				}

			).bind(
				'isTruncated.dot',
				function( e, fn )
				{
					e.preventDefault();
					e.stopPropagation();

					if ( typeof fn == 'function' )
					{
						fn.call( $dot[ 0 ], conf.isTruncated );
					}
					return conf.isTruncated;
				}

			).bind(
				'originalContent.dot',
				function( e, fn )
				{
					e.preventDefault();
					e.stopPropagation();

					if ( typeof fn == 'function' )
					{
						fn.call( $dot[ 0 ], orgContent );
					}
					return orgContent;
				}

			).bind(
				'destroy.dot',
				function( e )
				{
					e.preventDefault();
					e.stopPropagation();

					$dot.unwatch()
						.unbind_events()
						.empty()
						.append( orgContent )
						.data( 'dotdotdot', false );
				}
			);
			return $dot;
		};	//	/bind_events

		$dot.unbind_events = function()
		{
			$dot.unbind('.dot');
			return $dot;
		};	//	/unbind_events

		$dot.watch = function()
		{
			$dot.unwatch();
			if ( opts.watch == 'window' )
			{
				var $window = $(window),
					_wWidth = $window.width(),
					_wHeight = $window.height();

				$window.bind(
					'resize.dot' + conf.dotId,
					function()
					{
						if ( _wWidth != $window.width() || _wHeight != $window.height() || !opts.windowResizeFix )
						{
							_wWidth = $window.width();
							_wHeight = $window.height();

							if ( watchInt )
							{
								clearInterval( watchInt );
							}
							watchInt = setTimeout(
								function()
								{
									$dot.trigger( 'update.dot' );
								}, 10
							);
						}
					}
				);
			}
			else
			{
				watchOrg = getSizes( $dot );
				watchInt = setInterval(
					function()
					{
						var watchNew = getSizes( $dot );
						if ( watchOrg.width  != watchNew.width ||
							 watchOrg.height != watchNew.height )
						{
							$dot.trigger( 'update.dot' );
							watchOrg = getSizes( $dot );
						}
					}, 100
				);
			}
			return $dot;
		};
		$dot.unwatch = function()
		{
			$(window).unbind( 'resize.dot' + conf.dotId );
			if ( watchInt )
			{
				clearInterval( watchInt );
			}
			return $dot;
		};

		var	orgContent	= $dot.contents(),
			opts 		= $.extend( true, {}, $.fn.dotdotdot.defaults, o ),
			conf		= {},
			watchOrg	= {},
			watchInt	= null,
			$inr		= null;

		conf.afterElement	= getElement( opts.after, $dot );
		conf.isTruncated	= false;
		conf.dotId			= dotId++;


		$dot.data( 'dotdotdot', true )
			.bind_events()
			.trigger( 'update.dot' );

		if ( opts.watch )
		{
			$dot.watch();
		}

		return $dot;
	};


	//	public
	$.fn.dotdotdot.defaults = {
		'ellipsis'	: '... ',
		'wrap'		: 'word',
		'lastCharacter': {
			'remove'		: [ ' ', ',', ';', '.', '!', '?' ],
			'noEllipsis'	: []
		},
		'tolerance'	: 0,
		'callback'	: null,
		'after'		: null,
		'height'	: null,
		'watch'		: false,
		'windowResizeFix': true,
		'debug'		: false
	};


	//	private
	var dotId = 1;

	function children( $elem, o, after )
	{
		var $elements 	= $elem.children(),
			isTruncated	= false;

		$elem.empty();

		for ( var a = 0, l = $elements.length; a < l; a++ )
		{
			var $e = $elements.eq( a );
			$elem.append( $e );
			if ( after )
			{
				$elem.append( after );
			}
			if ( test( $elem, o ) )
			{
				$e.remove();
				isTruncated = true;
				break;
			}
			else
			{
				if ( after )
				{
					after.remove();
				}
			}
		}
		return isTruncated;
	}
	function ellipsis( $elem, $d, $i, o, after )
	{
		var $elements 	= $elem.contents(),
			isTruncated	= false;

		$elem.empty();

		var notx = 'table, thead, tbody, tfoot, tr, col, colgroup, object, embed, param, ol, ul, dl, select, optgroup, option, textarea, script, style';
		for ( var a = 0, l = $elements.length; a < l; a++ )
		{

			if ( isTruncated )
			{
				break;
			}

			var e	= $elements[ a ],
				$e	= $(e);

			if ( typeof e == 'undefined' )
			{
				continue;
			}

			$elem.append( $e );
			if ( after )
			{
				$elem[ ( $elem.is( notx ) ) ? 'after' : 'append' ]( after );
			}
			if ( e.nodeType == 3 )
			{
				if ( test( $i, o ) )
				{
					isTruncated = ellipsisElement( $e, $d, $i, o, after );
				}
			}
			else
			{
				isTruncated = ellipsis( $e, $d, $i, o, after );
			}

			if ( !isTruncated )
			{
				if ( after )
				{
					after.remove();
				}
			}
		}
		return isTruncated;
	}
	function ellipsisElement( $e, $d, $i, o, after )
	{
		var isTruncated	= false,
			e = $e[ 0 ];

		if ( typeof e == 'undefined' )
		{
			return false;
		}

		var seporator	= ( o.wrap == 'letter' ) ? '' : ' ',
			textArr		= getTextContent( e ).split( seporator ),
			position 	= -1,
			midPos		= -1,
			startPos	= 0,
			endPos		= textArr.length - 1;

		while ( startPos <= endPos )
		{
			var m = Math.floor( ( startPos + endPos ) / 2 );
			if ( m == midPos )
			{
				break;
			}
			midPos = m;

			setTextContent( e, textArr.slice( 0, midPos + 1 ).join( seporator ) + o.ellipsis );

			if ( !test( $i, o ) )
			{
				position = midPos;
				startPos = midPos;
			}
			else
			{
				endPos = midPos;
			}
		}

		if ( position != -1 && !( textArr.length == 1 && textArr[ 0 ].length == 0 ) )
		{
			var txt = addEllipsis( textArr.slice( 0, position + 1 ).join( seporator ), o );
			isTruncated = true;
			setTextContent( e, txt );
		}
		else
		{
			var $w = $e.parent();
			$e.remove();

			var afterLength = ( after ) ? after.length : 0 ;

			if ( $w.contents().size() > afterLength )
			{
				var $n = $w.contents().eq( -1 - afterLength );
				isTruncated = ellipsisElement( $n, $d, $i, o, after );
			}
			else
			{
				var e = $w.prev().contents().eq( -1 )[ 0 ];

				if ( typeof e != 'undefined' )
				{
					var txt = addEllipsis( getTextContent( e ), o );
					setTextContent( e, txt );
					$w.remove();
					isTruncated = true;
				}

			}
		}

		return isTruncated;
	}
	function test( $i, o )
	{
		return $i.innerHeight() > o.maxHeight;
	}
	function addEllipsis( txt, o )
	{
		while( $.inArray( txt.slice( -1 ), o.lastCharacter.remove ) > -1 )
		{
			txt = txt.slice( 0, -1 );
		}
		if ( $.inArray( txt.slice( -1 ), o.lastCharacter.noEllipsis ) < 0 )
		{
			txt += o.ellipsis;
		}
		return txt;
	}
	function getSizes( $d )
	{
		return {
			'width'	: $d.innerWidth(),
			'height': $d.innerHeight()
		};
	}
	function setTextContent( e, content )
	{
		if ( e.innerText )
		{
			e.innerText = content;
		}
		else if ( e.nodeValue )
		{
			e.nodeValue = content;
		}
		else if (e.textContent)
		{
			e.textContent = content;
		}

	}
	function getTextContent( e )
	{
		if ( e.innerText )
		{
			return e.innerText;
		}
		else if ( e.nodeValue )
		{
			return e.nodeValue;
		}
		else if ( e.textContent )
		{
			return e.textContent;
		}
		else
		{
			return "";
		}
	}
	function getElement( e, $i )
	{
		if ( typeof e == 'undefined' )
		{
			return false;
		}
		if ( !e )
		{
			return false;
		}
		if ( typeof e == 'string' )
		{
			e = $(e, $i);
			return ( e.length )
				? e
				: false;
		}
		if ( typeof e == 'object' )
		{
			return ( typeof e.jquery == 'undefined' )
				? false
				: e;
		}
		return false;
	}
	function getTrueInnerHeight( $el )
	{
		var h = $el.innerHeight(),
			a = [ 'paddingTop', 'paddingBottom' ];

		for ( var z = 0, l = a.length; z < l; z++ ) {
			var m = parseInt( $el.css( a[ z ] ), 10 );
			if ( isNaN( m ) )
			{
				m = 0;
			}
			h -= m;
		}
		return h;
	}
	function debug( d, m )
	{
		if ( !d )
		{
			return false;
		}
		if ( typeof m == 'string' )
		{
			m = 'dotdotdot: ' + m;
		}
		else
		{
			m = [ 'dotdotdot:', m ];
		}

		if ( typeof window.console != 'undefined' )
		{
			if ( typeof window.console.log != 'undefined' )
			{
				window.console.log( m );
			}
		}
		return false;
	}


	//	override jQuery.html
	var _orgHtml = $.fn.html;
    $.fn.html = function( str ) {
		if ( typeof str != 'undefined' )
		{
			if ( this.data( 'dotdotdot' ) )
			{
				if ( typeof str != 'function' )
				{
					return this.trigger( 'update', [ str ] );
				}
			}
			return _orgHtml.call( this, str );
		}
		return _orgHtml.call( this );
    };


	//	override jQuery.text
	var _orgText = $.fn.text;
    $.fn.text = function( str ) {
		if ( typeof str != 'undefined' )
		{
			if ( this.data( 'dotdotdot' ) )
			{
				var temp = $( '<div />' );
				temp.text( str );
				str = temp.html();
				temp.remove();
				return this.trigger( 'update', [ str ] );
			}
			return _orgText.call( this, str );
		}
        return _orgText.call( this );
    };


})( jQuery );
;
(function($) {
  Drupal.behaviors.twitterWidget = {
    tweetEvents: function(delta, user, nrTweets, showBtn){
      var lang = $('html').attr('xml:lang'), $block = $('#block-widgets-twitter\\:' + delta);

      //get tweets
      if($block.hasClass('twi-processed')){
        return;
      }

      $block.addClass('twi-processed');

      $.ajax({
        type : 'POST',
        url : 'http://www.mgmhealth.com/twitter/get_tweets',
        data : {
          user: user,
          nr_tweets: nrTweets
        },
        success : function(msg) {
          if(typeof msg[1].settings == 'undefined'){
            return;
          }

          var out = msg[1].settings.data;
          if(out.length < 250){
            if(typeof Drupal.Builder != 'undefined'){
              out = Drupal.t('Could not retrieve data from Twitter, please try again later / Invalid Twitter user') + '<br />';
              $block.find('.content').append(out);
            }
            return;
          }
          else{
            if(showBtn){
              out += '<a href="https://twitter.com/' + user + '" class="twitter-follow-button" data-show-count="true" data-lang="' + lang + '" data-show-screen-name="false">Follow @' + user + '</a>';
            }
          }

          $block.find('.content').append(out);
          if(showBtn){
            //add events and style for twitter button/follow button
            if(typeof twttr == 'undefined' || typeof twttr.widgets == 'undefined'){
              !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
            }
            else {
              twttr.widgets.load();
            }
          }
        }
      });

    }
  }
})(jQuery);
;
(function($){

}(jQuery))

;
(function($) {

  Drupal.behaviors.SocialShareWidget = {

    fbEvents: function(wrapper){
      if(typeof FB == 'undefined'){

        if($('#fb-root').length == 0){
          $('body').prepend('<div id="fb-root"></div>');
        }

        var apiKey = '';
        if(typeof Drupal.settings.facebook != "undefined" && typeof Drupal.settings.facebook.apiKey != "undefined"){
          apiKey = Drupal.settings.facebook.apiKey;
        }
        window.fbAsyncInit = function() {
          FB.init({
            appId: apiKey,
            status: true,
            xfbml: true
          });
        };

        (function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0], lang = $('html').attr('xml:lang');
          if (d.getElementById(id)) return;
          lang += '_' + lang.toUpperCase();
          js = d.createElement(s); js.id = id;
          js.src = "//connect.facebook.net/"+ lang +"/all.js";
          fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
      }
      else{
        if(typeof wrapper == 'undefined'){
          var wrapper = 'page';
        }
        FB.XFBML.parse(document.getElementById(wrapper));
      }
    },

    twitterEvents: function(){
      if(typeof twttr == 'undefined' || typeof twttr.widgets == 'undefined'){
        !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
      }
      else{
        twttr.widgets.load();
      }
    },

    googleEvents: function(){
      //set default language
      window.___gcfg = {
        lang: $('html').attr('xml:lang')
      };

      if(typeof gapi == 'undefined' || typeof gapi.plusone == 'undefined'){
        (function() {
          var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true; po.src = 'https://apis.google.com/js/plusone.js';
          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
        })();
      }
      else{
        gapi.plusone.go();
      }
    }

  };
})(jQuery);
;
(function($){

}(jQuery));
;
(function($){
	Drupal.behaviors.dynamic_banner = {
		attach: function(context, settings) {
			var
				src = '',
				stance = 'active',
				page_id = Drupal.settings.design.page_id,
				html = '';

			if(Drupal.settings.design.is_preview){
				stance = 'preview';
			} else if(!Drupal.settings.design.is_sitemanager){
				stance = 'published';
			}

			var
				theme = Drupal.settings.design.theme,//typeof Drupal.settings.design.global[stance] != 'undefined' ? Drupal.settings.design.global[stance]['#theme'] : '',
				type = (typeof Drupal.settings.design.page[stance] != 'undefined'
				&& typeof Drupal.settings.design.page[stance]['#banner'] != 'undefined'
				&& Drupal.settings.design.page[stance]['#banner'] != null
				&& typeof Drupal.settings.design.page[stance]['#banner']['type'] != 'undefined') ?
				Drupal.settings.design.page[stance]['#banner']['type'] : 'none';


			if(typeof Drupal.settings.design.page[stance] != 'undefined'
				&& typeof Drupal.settings.design.page[stance]['#banner'] != 'undefined'
				&& Drupal.settings.design.page[stance]['#banner'] != null
				&& typeof Drupal.settings.design.page[stance]['#banner'][type] != 'undefined'){
				bannerSettings = Drupal.settings.design.page[stance]['#banner'][type].settings;
			}

			//Drupal.settings.design.default_banner_settings

			$("#banner-widget div.contextual-links-wrapper .contextual-links").show();

			/*var
				containerHeight = $("#banner-widget").height(),
				contextualHeight = $("#banner-widget div.contextual-links-wrapper").height(),
				top = parseInt((containerHeight - contextualHeight) / 2);*/

			$("#banner-widget div.contextual-links-wrapper .contextual-links").hide();
			//$("#banner-widget .contextual-links-wrapper").css("cssText", "top: 100px !important");

			window.setTimeout(function(){
				$("#banner-widget div.contextual-links-wrapper").css({
					top: ($("#banner-widget").outerHeight() / 2) - ($("#banner-widget div.contextual-links-wrapper ul").height() / 2),
					right: ($("#banner-widget").outerWidth() / 2) - ($("#banner-widget div.contextual-links-wrapper ul").width() / 2)
				});


				$("#banner-widget div.contextual-links-wrapper").css('z-index', '99999999999999');

			}, 2500);

			if(type == 'none' || typeof bannerSettings == 'undefined' || typeof bannerSettings.items == 'undefined' || bannerSettings.items.length == 0) {
				// $("#banner-widget div.contextual-links-wrapper").css("cssText", "top: 0px !important");
				$('body').addClass('nobanner');
				return false;
			} else {

			}

			if(type =='slideshow' || $('#banner-widget > .content').length == 0){
				return false;
			}

			src = (typeof bannerSettings != 'undefined'
				&& typeof bannerSettings.items != 'undefined'
				&& typeof bannerSettings.items.obj != 'undefined'
				&& typeof bannerSettings.items.obj.src != 'undefined')
				? bannerSettings.items.obj.src : '';

			if(src.length != 0) {
				html = '<img src="' + src + '" class="banner-widget-image"/>';
			}

			// type = (typeof Drupal.settings.design.page[stance] != 'undefined'
			// 	&& typeof Drupal.settings.design.page[stance]['#banner'] != 'undefined'
			// 	&& Drupal.settings.design.page[stance]['#banner'] != null
			// 	&& Drupal.settings.design.page[stance]['#banner']['type'] != null) ? Drupal.settings.design.page[stance]['#banner']['type'] : type;

			switch(type) {
				case 'image':
					$('#banner-widget > .content .banner-widget-image').remove();
					var
						settings = typeof bannerSettings != 'undefined' ? bannerSettings : null;
						// (typeof Drupal.settings.design.page != 'undefined'
						// && typeof Drupal.settings.design.page[stance] != 'undefined'
						// && Drupal.settings.design.page != null
						// && Drupal.settings.design.page[stance]['#banner'] != null
						// && Drupal.settings.design.page[stance]['#banner'].settings != null) ? Drupal.settings.design.page[stance]['#banner'].settings : null;


					if(settings == null || typeof settings == 'undefined' || typeof settings.items == 'undefined') {
						break;
					}
					//$('#banner-widget > .content').html(html);

					//Title
					if(typeof settings.items.title != 'undefined') {
						$('#banner-widget > .content .image-title').text(settings.items.title.text);
						$('#banner-widget > .content .image-title').css({
							'width' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.title != 'undefined' && typeof settings.items.title.width != 'undefined') ? parseInt(settings.items.title.width) + 'px' : 'auto',
							'height': (settings != null && typeof settings.items != 'undefined' && typeof settings.items.title != 'undefined' && settings.items.title.height != undefined) ? parseInt(settings.items.title.height) + 'px' : 'auto',
							'top' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.title != 'undefined' && settings.items.title.top != undefined) ? parseInt(settings.items.title.top) + 'px' : '0px',
							'left' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.title != 'undefined' && settings.items.title.left != undefined) ? parseInt(settings.items.title.left) + 'px' : '0px',
							'color' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.title != 'undefined' && settings.items.title.color != undefined) ? settings.items.title.color : '',
							'background-color' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.title != 'undefined' && settings.items.title.bgcolor != undefined) ? settings.items.title.bgcolor : '',
							'font-size' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.title != 'undefined' && settings.items.title.fontSize != undefined) ? settings.items.title.fontSize  + 'px' : '',
							'z-index': '10',
							'position' : 'absolute'
						});
					}

					//Description
					if(typeof settings.items.description != 'undefined') {
						$('#banner-widget > .content .image-description').text(settings.items.description.text);
						$('#banner-widget > .content .image-description').css({
							'width' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.description != 'undefined' && typeof settings.items.description.width != 'undefined') ? parseInt(settings.items.description.width) + 'px' : 'auto',
							'height': (settings != null && typeof settings.items != 'undefined' && typeof settings.items.description != 'undefined' && settings.items.description.height != undefined) ? parseInt(settings.items.description.height) + 'px' : 'auto',
							'top' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.description != 'undefined' && settings.items.description.top != undefined) ? parseInt(settings.items.description.top) + 'px' : '0px',
							'left' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.description != 'undefined' && settings.items.description.left != undefined) ? parseInt(settings.items.description.left) + 'px' : '0px',
							'color' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.description != 'undefined' && settings.items.description.color != undefined) ? settings.items.description.color : '#FFF',
							'background-color' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.description != 'undefined' && settings.items.description.bgcolor != undefined) ? settings.items.description.bgcolor : '#000',
							'font-size' : (settings != null && typeof settings.items != 'undefined' && typeof settings.items.description != 'undefined' && settings.items.description.fontSize != undefined) ? settings.items.description.fontSize + 'px' : '',
							'z-index': '8',
							'position' : 'absolute'
						});
					}

					//Image
					var
						bannerContainer = $('#banner-widget > .content'),
						containerOffset = bannerContainer.offset(),
						bannerImage = $('<img/>').addClass('banner-widget-image').appendTo(bannerContainer.find('.banner-image-wrapper')),
						imgCSS = {
							'z-index': '5',
							'position' : 'absolute',
							width : bannerContainer.width(),
							height : 'auto'
						},
						src = '';

					if(Drupal.settings.design.default_banner_settings['min-width'] == 'FULL' && Drupal.settings.design.default_banner_settings['max-width'] == 'FULL'){
						if(typeof settings.items.obj != 'undefined') {
							if(typeof settings.items.obj[theme] != 'undefined' && typeof settings.items.obj[theme].croppedSrc != 'undefined' ){
								src = settings.items.obj[theme].croppedSrc;
								if (stance == 'active') {
								  src += '?no_cache_id=' + new Date().getTime();
								} if(stance == 'published' && typeof Drupal.settings.content_manager.active_revision != 'undefined'){
		              src += '?r=' + Drupal.settings.content_manager.active_revision;
		            }
							} else if(typeof settings.items.obj.builderSrc != 'undefined'){
								src = settings.items.obj.builderSrc;
							} else {
								if(settings.items.obj.src.indexOf('/files/uploads/') != -1){
									src = settings.items.obj.src.replace('/files/','/files/styles/sb_large/public/');
								} else if(settings.items.obj.src.indexOf('/storage/stock_images/') != -1){
									src = settings.items.obj.src.replace('/storage/','/storage/styles/sb_large/storage/');
								}
							}
						}

						$('.banner-image-wrapper').css({
							width : '100%',
							height : '100%',
							backgroundSize : 'cover',
							backgroundRepeat : 'no-repeat',
							backgroundImage : 'url(' + src + ')',
							backgroundPosition : 'center center'
						});

					} else {
						if(typeof settings.items.obj != 'undefined') {

							if(settings != null && typeof settings.items != 'undefined' && typeof settings.items.obj != 'undefined' && typeof settings.items.obj[theme] != 'undefined' && typeof settings.items.obj[theme].croppedSrc != 'undefined'){
								var imgSrc = settings.items.obj[theme].croppedSrc;
								if (stance == 'active') {
								  imgSrc += '?no_cache_id=' + new Date().getTime();
								} if(stance == 'published' && typeof Drupal.settings.content_manager.active_revision != 'undefined'){
		              imgSrc += '?r=' + Drupal.settings.content_manager.active_revision;
		            }
								bannerImage.attr('src', imgSrc);
							} else {
								if(typeof settings.items.obj.builderSrc != 'undefined'){
									bannerImage.attr('src', settings.items.obj.builderSrc);
								} else {
									if(settings.items.obj.src.indexOf('/files/uploads/') != -1){
										bannerImage.attr('src', settings.items.obj.src.replace('/files/','/files/styles/sb_large/public/'));
									} else if(settings.items.obj.src.indexOf('/storage/stock_images/') != -1){
										bannerImage.attr('src', settings.items.obj.src.replace('/storage/','/storage/styles/sb_large/storage/'));
									}
								}

								if((settings != null && typeof settings.items != 'undefined' && typeof settings.items.obj != 'undefined' && typeof settings.items.obj[theme] != 'undefined' && settings.items.obj[theme].height == 'auto') || typeof settings.items.obj[theme] == 'undefined'){
									bannerImage.css('height', '');
									bannerImage.css(imgCSS);
									if(bannerImage.height() == 0 || !bannerImage[0].complete) {
										bannerImage.load(function(){
											if(bannerImage.height() < bannerContainer.height()) {
												imgCSS.height = bannerContainer.height();
												imgCSS.width = 'auto';
												bannerImage.css(imgCSS);
												imgCSS.top = 0 + 'px';
												imgCSS.left = (bannerContainer.width() - bannerImage.width()) /2 + 'px';
												imgCSS.height = bannerImage.height();
												imgCSS.width = bannerImage.width();
											} else {
												imgCSS.left = 0 + 'px';
												imgCSS.top = (bannerContainer.height() - bannerImage.height()) /2 + 'px';
												imgCSS.height = bannerImage.height();
												imgCSS.width = bannerImage.width();
											}
											bannerImage.css(imgCSS);
										});
									} else {
										if(bannerImage.height() < bannerContainer.height()) {
											imgCSS.height = bannerContainer.height();
											imgCSS.width = 'auto';
											bannerImage.css(imgCSS);
											imgCSS.top = 0 + 'px';
											imgCSS.left = (bannerContainer.width() - bannerImage.width()) /2 + 'px';
											imgCSS.height = bannerImage.height();
											imgCSS.width = bannerImage.width();
										} else {
											imgCSS.left = 0 + 'px';
											imgCSS.top = (bannerContainer.height() - bannerImage.height()) /2 + 'px';
											imgCSS.height = bannerImage.height();
											imgCSS.width = bannerImage.width();
										}
										bannerImage.css(imgCSS);
									}
								} else {
									imgCSS.width = settings.items.obj[theme].width + 'px';
									imgCSS.height = settings.items.obj[theme].height + 'px';
									imgCSS.top = settings.items.obj[theme].top + 'px';
									imgCSS.left = settings.items.obj[theme].left + 'px';
									bannerImage.css(imgCSS);
								}
							}
						}

						if($('body').hasClass('site-builder')) {
							// var
							// 	edit = $('#banner-widget ul.contextual-links').find('li.edit-image');
								// resize = $('#banner-widget ul.contextual-links').find('li.resize-image');
							$('#banner-widget').css('width',bannerSettings.width);
							// if(edit.length == 0 && src.length != 0) {
							// 	$('#banner-widget ul.contextual-links').append('<li class="edit-image"><a></a></li>');

							// 	edit = $('#banner-widget ul.contextual-links').find('li.edit-image');
							// 	edit.click(function(){
							// 		var
							// 			img = $('#banner-widget .banner-widget-image'),
							// 			src = img.attr('src');

							// 		var currentBanner = Drupal.settings.design.page.active['#banner'];

							// 		Drupal.pixlr.overlay.show({
							// 			image: src,
							// 			callback : function(src){
							// 				src = src.replace('styles/sitebuilder/public/','');
							// 				img.attr('src', src);
							// 				currentBanner.settings.items.obj.src = src;
							// 				$.ajax({
							// 					type: "POST",
							// 					url: "/design/ajax/banner",
							// 					data: {
							// 						type : 'image',
							// 						settings : currentBanner.settings,
							// 						page : Drupal.settings.builder.path,
							// 						all : false
							// 					},
							// 					success: function(msg){
							// 						window.location = Drupal.settings.builder.path;
							// 					}
							// 				});
							// 			}
							// 		});

							// 	});
							// }

						}
					}
					break;
				case 'flash':
					var flashObj = bannerSettings.items.obj;
					var flashCss = {
						position : 'absolute',
						display: 'block'
					};

					if(typeof flashObj[theme] == 'undefined' || (Drupal.settings.design.default_banner_settings['min-width'] == 'FULL' && Drupal.settings.design.default_banner_settings['max-width'] == 'FULL')) {
						// console.log(bannerSettings.size._default);
						flashCss.width = '100%';
						flashCss.height = '100%';
						flashCss.top = '0px';
						flashCss.left = '0px';
					} else {
						flashCss.width = parseInt(flashObj[theme].width) + 'px';
						flashCss.height = parseInt(flashObj[theme].height) + 'px';
						flashCss.top = parseInt(flashObj[theme].top) + 'px';
						flashCss.left = parseInt(flashObj[theme].left) + 'px';
					}

					var
						params = '<param name="quality" value="high"><param name="play" value="true"><param name="loop" value="true"><param name="wmode" value="opaque"><param name="allowFullScreen" value="true"><param name="flashvars" value="">',
						flashFile = '<embed src="' + src + '" quality="high" pluginspage="http:www.macromedia.com/go/getflashplayer" play="true" loop="true" wmode="opaque" allowfullscreen="true" flashvars="" type="application/x-shockwave-flash" align="middle" height="100%" width="100%">',
						object = $('<object>'+ params + flashFile + '</object>');

					object.css(flashCss);

					$('#banner-widget > .content').html(object);
					break;

				case 'slideshow':
					break;
			}
		}
	}
}(jQuery));
;
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
;
(function($){
  Drupal.calculateWrapper = function(resizable){
    var dr = resizable.parent(),
        parentWidth = dr.parent().width(),
        perc = resizable.outerWidth(true) * 100 / parentWidth;

    // console.log(dr[0].style.width);
    // if(typeof dr[0].style == 'undefined' || typeof dr[0].style.width == 'undefined' || dr[0].style.width.match('%') == null || dr[0].style.width == 'auto' || parentWidth == 0){
    //   console.log('nonono');
    //   return;
    // }

    if(perc > 100){
      perc = 100;
      dr.css('width', perc + '%');
      Drupal.calculateResizable(dr);
    } else {
      dr.css('width', perc + '%');
    }

    if(resizable.hasClass('drag_resize') && resizable.find('img').length > 0){
      Drupal.checkPreset(resizable.find('img'));
    }

    if(resizable.hasClass('flash-resize') && !resizable.hasClass('active')){
      var
        ar = resizable.resizable('option','AR'),
        w = resizable.width(),
        h = resizable.height(),
        war = w*ar;

      if(h != war){
        resizable.css('height', war);
        resizable.find('object').attr('height', war);
        resizable.find('embed').attr('height', war);
      }
    }

    if(typeof dr[0].style != 'undefined' && typeof dr[0].style.height != 'undefined' && dr[0].style.height.match('px') != null){
      dr.css('height','');
    }
  }

  Drupal.calculateResizable = function(wrapper){
    var
      parentWidth = wrapper.parent().width(),
      sbresize = wrapper.find('>.sb-resizable');



    if(parentWidth == 0){
      return;
    }

    if(typeof wrapper[0].style != 'undefined' && typeof wrapper[0].style.width != 'undefined' && wrapper[0].style.width.match('px') != null){
      sbresize.css('width', wrapper[0].style.width);
      if(typeof wrapper[0].style.height != 'undefined' && wrapper[0].style.height.length > 0){
        sbresize.css('height', wrapper[0].style.height);
      }

      Drupal.calculateWrapper(sbresize);
    }

    var
      perc = parseFloat(wrapper[0].style.width), img = wrapper.find('img'), imageWidth = 0 ,actualPerc = 0, tout = 0;

    if(typeof wrapper[0].style == 'undefined' || typeof wrapper[0].style.width == 'undefined' || wrapper[0].style.width.match('%') == null || wrapper[0].style.width == 'auto') {
      if(wrapper.closest('.region').hasClass('region-sidebar-first') || wrapper.closest('.region').hasClass('region-sidebar-second')){
        perc = 100;
      } else {
        if(wrapper.hasClass('dr-wrapper') && !wrapper.closest('.block').hasClass('block-widgets-html-elements-picture')){
          perc = 50;
        } else {
          perc = 100;
        }
      }
      if(img.closest('div').hasClass('sb-resizable')){
        tout = 100;
        $(img).bind('load', function(){
          img.css('visibility', 'hidden');
          img.css('width', 'auto');
          imageWidth = (img.width() < 35) ? 35 : img.width();
          img.css('width', '100%');

          actualPerc = (imageWidth * 100) / wrapper.closest('.region').width();
          imgPerc = (wrapper.outerWidth(true) * 100)/wrapper.closest('.region').width();
          perc = (perc < actualPerc) ? perc : actualPerc;
          img.css('visibility', 'visible');
          wrapper.css('width', perc + '%');
          if(wrapper.width() > 50){
            wrapper.find('.drag_resize').removeClass('icon');
          }
        })
      }
    }

    var
      margin = sbresize.outerWidth(true) - sbresize.width(),
      px = (perc * parentWidth / 100) -  margin;

    if(sbresize.hasClass('youtube-container')){
      sbresize.css({
        width: px,
        height: px * 3/4
      });
    } else if(sbresize.hasClass('flash-resize')){
      if(sbresize.hasClass('ui-resizable')){
        var ar = sbresize.resizable('option','AR'),
            war = px * ar;
        sbresize.css({
          width: px,
          height: war
        });
        sbresize.find('object').attr('width', px);
        sbresize.find('embed').attr('width', px);

        sbresize.find('object').attr('height', war);
        sbresize.find('embed').attr('height', war);
      } else {
        sbresize.css({
          width: px
        });
        sbresize.find('object').attr('width', px);
        sbresize.find('embed').attr('width', px);
      }
    } else if(sbresize.hasClass('gmap-wrapper')){
      sbresize.css({
        width: px
      });
    } else {
      if(tout > 0){
        img.load(function(){
          px = (perc * parentWidth / 100) -  margin;
          sbresize.css({
            width: px,
            height: 'auto'
          });
        });
      }else{
        px = (perc * parentWidth / 100) -  margin;
          sbresize.css({
            width: px,
            height: 'auto'
          });
      }
      setTimeout(function(){
        if(sbresize.hasClass('drag_resize')){
          Drupal.checkPreset(sbresize.find('img'));
        }
      }, tout);
    }

    if(typeof wrapper[0].style != 'undefined' && typeof wrapper[0].style.height != 'undefined' && wrapper[0].style.height.match('px') != null){
      wrapper.css('height','');
    }
  }

  Drupal.checkPreset = function(img){
    var
      imgVars = {
        w : img.width(),
        h : img.height()
      },
      vProp = imgVars.w < imgVars.h ?  'h' : 'w',
      style = 'sb_small',
      src= img.attr('src');

    if(imgVars[vProp] > 256 && imgVars[vProp] < 512){
      style = 'sb_medium';
    } else if(imgVars[vProp] > 512) {
      style = 'sb_large';
    }

    if(src.indexOf('styles/' + style) == -1){
      src = src
        .replace('styles/sitebuilder','styles/' + style)
        .replace('styles/sb_small','styles/' + style)
        .replace('styles/sb_medium','styles/' + style)
        .replace('styles/sb_large','styles/' + style);

      img.attr('src', src);
    }
  }

  $(document).ready(function(){
    // $('.block[id^=block-widgets-html_elements]').each(function(){
    //  if($(this).attr('id').indexOf('[picture]') == -1 && $(this).attr('id').indexOf('[flash]') == -1){
    //    $(this).css('float','none');
    //  }
    // });

    $('a.image-link-ref[rel=colorbox]').colorbox({
      maxHeight: $(window).height() - 50,
      rel: 'nofollow'
    });

    var delta;
    //init jPlayer
    $('.jp-jplayer').each(function() {
      delta = $(this).attr('id').replace('jquery_jplayer_', '');
      Drupal.initJPlayer(delta);
    });

    // var $dragResize = $('.drag_resize');
    // if($dragResize.outerWidth(true) > $dragResize.closest('.region').width()) {

    //   var newWidth = $dragResize.closest('.region').width();
    //   newWidth -= parseInt($dragResize.css('padding-left').replace('px','')) + parseInt($dragResize.css('padding-right').replace('px',''));
    //   newWidth -= parseInt($dragResize.css('border-left').replace('px','')) + parseInt($dragResize.css('border-right').replace('px',''));
    //   $dragResize.css({'width':newWidth + 'px', 'height':'auto'});

    // }

    // var $youtubeContainer = $('.youtube-container');
    // if($youtubeContainer.outerWidth(true) > $youtubeContainer.closest('.region').width()) {

    //   var newWidth = $youtubeContainer.closest('.region').width();
    //   $youtubeContainer.css({'width':newWidth + 'px', 'height':newWidth * 3/4 + 'px'});

    // }

    $('.drag_resize, .youtube-container, .gmap-wrapper, .flash-resize').each(function(){
      if($(this).closest('.sidebar.hidden').length == 0){
        Drupal.calculateResizable($(this).parent(), false);
      }
    });
  });

  Drupal.initJPlayer = function(delta) {
    var ready = false;
    var ua = navigator.userAgent, src, player;
        var playerType = 'html, flash';
        if(ua.match('Firefox') && !ua.match(/Android/i)){
          playerType = 'flash, html';
        }

    $("#jquery_jplayer_" + delta).jPlayer({
      ready: function (event) {
        Drupal.responsiveMode.responsive($(this).closest('.block'));
        var audio_src = $(this).parent().find('input[name="audio_src"]').val(),
        media = {
          mp3: audio_src
        };
        ready = true;
        $(this).jPlayer("setMedia", media);
        $("#jp_container_" + delta).find('.progress-bar').slider({
          min: 0,
          max: 100,
          value: 0,
          range: 'min',
          slide: function(event, ui) {
            var sliderValue = ui.value;
            $("#jquery_jplayer_" + delta).jPlayer("playHead", sliderValue);
          }
        });

        /*var orientationSB = "horizontal";
        if($("#jp_container_" + delta).closest('.sidebar').length > 0) {
          console.debug('x');
          orientationSB = "vertical";
        }*/

        $("#jp_container_" + delta).find('.volume-bar').slider({
          min: 0,
          max: 105,
          value: 85,
          range: 'min',
          //orientation: orientationSB,
          slide: function(event, ui) {
            var sliderValue = ui.value;

            if(sliderValue > 100) {
              $(this).slider('value', 100);
              $("#jquery_jplayer_" + delta).jPlayer("volume", 1);
              return false;
            }

            $("#jquery_jplayer_" + delta).jPlayer("volume", sliderValue / 100);
          }
        });

        $("#jp_container_" + delta).show();

        //Drupal.resizeJPlayer(delta);
      },
      error: function(event) {
        if(ready && event.jPlayer.error.type === $.jPlayer.error.URL_NOT_SET) {
          $(this).jPlayer("setMedia", media).jPlayer("play");
        }else{
          $("#jp_container_" + delta).html('<div class="jp-no-solution-message"><span>'+Drupal.t('Update Required')+'</span>'+Drupal.t('To play the media you will need to either update your browser to a recent version or update your')+' <a class="download-flash-link" href="http://get.adobe.com/flashplayer/" target="_blank">Flash plugin</a>.</div>');
          $("#jp_container_" + delta).show();        
        }

      },
      timeupdate: function(event) {
        $("#jp_container_" + delta).find('.progress-bar').slider( "value", parseInt(event.jPlayer.status.currentPercentAbsolute) );
      },
      progress: function(event) {
        $("#jp_container_" + delta).find('.progress-bar').find('.ui-slider-handle').addClass('playing');
        $("#jp_container_" + delta).find('.progress-bar').find('.progress').css('width', event.jPlayer.status.seekPercent + '%');
      },
      volumechange: function(event) {
        if(event.jPlayer.options.muted) {
          $("#jp_container_" + delta).find('.volume-bar').slider('value', 0);
        }
        else {
          $("#jp_container_" + delta).find('.volume-bar').slider('value', event.jPlayer.options.volume * 100);
        }
      },
      cssSelectorAncestor: "#jp_container_" + delta,
      solution: playerType,
      swfPath: Drupal.settings.jPlayer_path,
      supplied: "mp3",
      preload: 'none',
      wmode: "window"
    });

      player = $("#jp_container_" + delta).closest('.block');
      src = player.find('input[name="audio_src"]').val();
    if(ua.match(/Android/i)){
      if(parseFloat(ua.slice(ua.indexOf("Android")+8)) < 2.3){
        player.append('<div id="' + player.attr('id') + '" class="block embedded-player android-small" ><a rel="external" class="play-btn" href="' + src + '"></a></div>');
        player.find('.content').remove();
      }
    }
    //     var emb;
    //     emb = '<audio preload="none" data-responsive="200" ><source src="' + src + '" type="audio/mpeg"></audio>';
    //     player.append(emb);
    //     player.find('.content').remove();
    //   }
    // }else{
      // if(Drupal.settings.design.theme.split('_')[0] == 'mobile'){
      //   emb = '<audio preload="none" data-responsive="400" ><source src="' + src + '" type="audio/mpeg"></audio>';
      //   player.append(emb);
      //   player.find('.content').remove();
      // }
    // }
  }

  Drupal.resizeJPlayer = function(delta) {
    //resize middle part
    var gcW = $("#jp_container_" + delta).find('.general-controls').outerWidth(true);
    var vcW = $("#jp_container_" + delta).find('.volume-controls').outerWidth(true);
    var cW  = $("#jp_container_" + delta).width();
    var margins = $("#jp_container_" + delta).find('.jp-time-holder').outerWidth(true) - $("#jp_container_" + delta).find('.jp-time-holder').width();

    $("#jp_container_" + delta).find('.jp-time-holder').css('width', cW - gcW - vcW - margins);
  }

  $(window).load(function(){
    $('.autoplay').jPlayer("play");
    $('body.site-builder').find('.autoplay').closest('.block').find('li.play-me').addClass('auto-play-enabled');
  });
}(jQuery));
;
/*
 * jPlayer Plugin for jQuery JavaScript Library
 * http://www.jplayer.org
 *
 * Copyright (c) 2009 - 2011 Happyworm Ltd
 * Dual licensed under the MIT and GPL licenses.
 *  - http://www.opensource.org/licenses/mit-license.php
 *  - http://www.gnu.org/copyleft/gpl.html
 *
 * Author: Mark J Panaghiston
 * Version: 2.1.0
 * Date: 1st September 2011
 */

(function(b,f){b.fn.jPlayer=function(a){var c=typeof a==="string",d=Array.prototype.slice.call(arguments,1),e=this,a=!c&&d.length?b.extend.apply(null,[!0,a].concat(d)):a;if(c&&a.charAt(0)==="_")return e;c?this.each(function(){var c=b.data(this,"jPlayer"),h=c&&b.isFunction(c[a])?c[a].apply(c,d):c;if(h!==c&&h!==f)return e=h,!1}):this.each(function(){var c=b.data(this,"jPlayer");c?c.option(a||{}):b.data(this,"jPlayer",new b.jPlayer(a,this))});return e};b.jPlayer=function(a,c){if(arguments.length){this.element=
b(c);this.options=b.extend(!0,{},this.options,a);var d=this;this.element.bind("remove.jPlayer",function(){d.destroy()});this._init()}};b.jPlayer.emulateMethods="load play pause";b.jPlayer.emulateStatus="src readyState networkState currentTime duration paused ended playbackRate";b.jPlayer.emulateOptions="muted volume";b.jPlayer.reservedEvent="ready flashreset resize repeat error warning";b.jPlayer.event={ready:"jPlayer_ready",flashreset:"jPlayer_flashreset",resize:"jPlayer_resize",repeat:"jPlayer_repeat",
click:"jPlayer_click",error:"jPlayer_error",warning:"jPlayer_warning",loadstart:"jPlayer_loadstart",progress:"jPlayer_progress",suspend:"jPlayer_suspend",abort:"jPlayer_abort",emptied:"jPlayer_emptied",stalled:"jPlayer_stalled",play:"jPlayer_play",pause:"jPlayer_pause",loadedmetadata:"jPlayer_loadedmetadata",loadeddata:"jPlayer_loadeddata",waiting:"jPlayer_waiting",playing:"jPlayer_playing",canplay:"jPlayer_canplay",canplaythrough:"jPlayer_canplaythrough",seeking:"jPlayer_seeking",seeked:"jPlayer_seeked",
timeupdate:"jPlayer_timeupdate",ended:"jPlayer_ended",ratechange:"jPlayer_ratechange",durationchange:"jPlayer_durationchange",volumechange:"jPlayer_volumechange"};b.jPlayer.htmlEvent="loadstart,abort,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,ratechange".split(",");b.jPlayer.pause=function(){b.each(b.jPlayer.prototype.instances,function(a,b){b.data("jPlayer").status.srcSet&&b.jPlayer("pause")})};b.jPlayer.timeFormat={showHour:!1,showMin:!0,showSec:!0,padHour:!1,padMin:!0,padSec:!0,
sepHour:":",sepMin:":",sepSec:""};b.jPlayer.convertTime=function(a){var c=new Date(a*1E3),d=c.getUTCHours(),a=c.getUTCMinutes(),c=c.getUTCSeconds(),d=b.jPlayer.timeFormat.padHour&&d<10?"0"+d:d,a=b.jPlayer.timeFormat.padMin&&a<10?"0"+a:a,c=b.jPlayer.timeFormat.padSec&&c<10?"0"+c:c;return(b.jPlayer.timeFormat.showHour?d+b.jPlayer.timeFormat.sepHour:"")+(b.jPlayer.timeFormat.showMin?a+b.jPlayer.timeFormat.sepMin:"")+(b.jPlayer.timeFormat.showSec?c+b.jPlayer.timeFormat.sepSec:"")};b.jPlayer.uaBrowser=
function(a){var a=a.toLowerCase(),b=/(opera)(?:.*version)?[ \/]([\w.]+)/,d=/(msie) ([\w.]+)/,e=/(mozilla)(?:.*? rv:([\w.]+))?/,a=/(webkit)[ \/]([\w.]+)/.exec(a)||b.exec(a)||d.exec(a)||a.indexOf("compatible")<0&&e.exec(a)||[];return{browser:a[1]||"",version:a[2]||"0"}};b.jPlayer.uaPlatform=function(a){var b=a.toLowerCase(),d=/(android)/,e=/(mobile)/,a=/(ipad|iphone|ipod|android|blackberry|playbook|windows ce|webos)/.exec(b)||[],b=/(ipad|playbook)/.exec(b)||!e.exec(b)&&d.exec(b)||[];a[1]&&(a[1]=a[1].replace(/\s/g,
"_"));return{platform:a[1]||"",tablet:b[1]||""}};b.jPlayer.browser={};b.jPlayer.platform={};var i=b.jPlayer.uaBrowser(navigator.userAgent);if(i.browser)b.jPlayer.browser[i.browser]=!0,b.jPlayer.browser.version=i.version;i=b.jPlayer.uaPlatform(navigator.userAgent);if(i.platform)b.jPlayer.platform[i.platform]=!0,b.jPlayer.platform.mobile=!i.tablet,b.jPlayer.platform.tablet=!!i.tablet;b.jPlayer.prototype={count:0,version:{script:"2.1.0",needFlash:"2.1.0",flash:"unknown"},options:{swfPath:"js",solution:"html, flash",
supplied:"mp3",preload:"metadata",volume:0.8,muted:!1,wmode:"opaque",backgroundColor:"#000000",cssSelectorAncestor:"#jp_container_1",cssSelector:{videoPlay:".jp-video-play",play:".jp-play",pause:".jp-pause",stop:".jp-stop",seekBar:".jp-seek-bar",playBar:".jp-play-bar",mute:".jp-mute",unmute:".jp-unmute",volumeBar:".jp-volume-bar",volumeBarValue:".jp-volume-bar-value",volumeMax:".jp-volume-max",currentTime:".jp-current-time",duration:".jp-duration",fullScreen:".jp-full-screen",restoreScreen:".jp-restore-screen",
repeat:".jp-repeat",repeatOff:".jp-repeat-off",gui:".jp-gui",noSolution:".jp-no-solution"},fullScreen:!1,autohide:{restored:!1,full:!0,fadeIn:200,fadeOut:600,hold:1E3},loop:!1,repeat:function(a){a.jPlayer.options.loop?b(this).unbind(".jPlayerRepeat").bind(b.jPlayer.event.ended+".jPlayer.jPlayerRepeat",function(){b(this).jPlayer("play")}):b(this).unbind(".jPlayerRepeat")},nativeVideoControls:{},noFullScreen:{msie:/msie [0-6]/,ipad:/ipad.*?os [0-4]/,iphone:/iphone/,ipod:/ipod/,android_pad:/android [0-3](?!.*?mobile)/,
android_phone:/android.*?mobile/,blackberry:/blackberry/,windows_ce:/windows ce/,webos:/webos/},noVolume:{ipad:/ipad/,iphone:/iphone/,ipod:/ipod/,android_pad:/android(?!.*?mobile)/,android_phone:/android.*?mobile/,blackberry:/blackberry/,windows_ce:/windows ce/,webos:/webos/,playbook:/playbook/},verticalVolume:!1,idPrefix:"jp",noConflict:"jQuery",emulateHtml:!1,errorAlerts:!1,warningAlerts:!1},optionsAudio:{size:{width:"0px",height:"0px",cssClass:""},sizeFull:{width:"0px",height:"0px",cssClass:""}},
optionsVideo:{size:{width:"480px",height:"270px",cssClass:"jp-video-270p"},sizeFull:{width:"100%",height:"100%",cssClass:"jp-video-full"}},instances:{},status:{src:"",media:{},paused:!0,format:{},formatType:"",waitForPlay:!0,waitForLoad:!0,srcSet:!1,video:!1,seekPercent:0,currentPercentRelative:0,currentPercentAbsolute:0,currentTime:0,duration:0,readyState:0,networkState:0,playbackRate:1,ended:0},internal:{ready:!1},solution:{html:!0,flash:!0},format:{mp3:{codec:'audio/mpeg; codecs="mp3"',flashCanPlay:!0,
media:"audio"},m4a:{codec:'audio/mp4; codecs="mp4a.40.2"',flashCanPlay:!0,media:"audio"},oga:{codec:'audio/ogg; codecs="vorbis"',flashCanPlay:!1,media:"audio"},wav:{codec:'audio/wav; codecs="1"',flashCanPlay:!1,media:"audio"},webma:{codec:'audio/webm; codecs="vorbis"',flashCanPlay:!1,media:"audio"},fla:{codec:"audio/x-flv",flashCanPlay:!0,media:"audio"},m4v:{codec:'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',flashCanPlay:!0,media:"video"},ogv:{codec:'video/ogg; codecs="theora, vorbis"',flashCanPlay:!1,
media:"video"},webmv:{codec:'video/webm; codecs="vorbis, vp8"',flashCanPlay:!1,media:"video"},flv:{codec:"video/x-flv",flashCanPlay:!0,media:"video"}},_init:function(){var a=this;this.element.empty();this.status=b.extend({},this.status);this.internal=b.extend({},this.internal);this.internal.domNode=this.element.get(0);this.formats=[];this.solutions=[];this.require={};this.htmlElement={};this.html={};this.html.audio={};this.html.video={};this.flash={};this.css={};this.css.cs={};this.css.jq={};this.ancestorJq=
[];this.options.volume=this._limitValue(this.options.volume,0,1);b.each(this.options.supplied.toLowerCase().split(","),function(c,d){var e=d.replace(/^\s+|\s+$/g,"");if(a.format[e]){var f=!1;b.each(a.formats,function(a,b){if(e===b)return f=!0,!1});f||a.formats.push(e)}});b.each(this.options.solution.toLowerCase().split(","),function(c,d){var e=d.replace(/^\s+|\s+$/g,"");if(a.solution[e]){var f=!1;b.each(a.solutions,function(a,b){if(e===b)return f=!0,!1});f||a.solutions.push(e)}});this.internal.instance=
"jp_"+this.count;this.instances[this.internal.instance]=this.element;this.element.attr("id")||this.element.attr("id",this.options.idPrefix+"_jplayer_"+this.count);this.internal.self=b.extend({},{id:this.element.attr("id"),jq:this.element});this.internal.audio=b.extend({},{id:this.options.idPrefix+"_audio_"+this.count,jq:f});this.internal.video=b.extend({},{id:this.options.idPrefix+"_video_"+this.count,jq:f});this.internal.flash=b.extend({},{id:this.options.idPrefix+"_flash_"+this.count,jq:f,swf:this.options.swfPath+
(this.options.swfPath.toLowerCase().slice(-4)!==".swf"?(this.options.swfPath&&this.options.swfPath.slice(-1)!=="/"?"/":"")+"Jplayer.swf":"")});this.internal.poster=b.extend({},{id:this.options.idPrefix+"_poster_"+this.count,jq:f});b.each(b.jPlayer.event,function(b,c){a.options[b]!==f&&(a.element.bind(c+".jPlayer",a.options[b]),a.options[b]=f)});this.require.audio=!1;this.require.video=!1;b.each(this.formats,function(b,c){a.require[a.format[c].media]=!0});this.options=this.require.video?b.extend(!0,
{},this.optionsVideo,this.options):b.extend(!0,{},this.optionsAudio,this.options);this._setSize();this.status.nativeVideoControls=this._uaBlocklist(this.options.nativeVideoControls);this.status.noFullScreen=this._uaBlocklist(this.options.noFullScreen);this.status.noVolume=this._uaBlocklist(this.options.noVolume);this._restrictNativeVideoControls();this.htmlElement.poster=document.createElement("img");this.htmlElement.poster.id=this.internal.poster.id;this.htmlElement.poster.onload=function(){(!a.status.video||
a.status.waitForPlay)&&a.internal.poster.jq.show()};this.element.append(this.htmlElement.poster);this.internal.poster.jq=b("#"+this.internal.poster.id);this.internal.poster.jq.css({width:this.status.width,height:this.status.height});this.internal.poster.jq.hide();this.internal.poster.jq.bind("click.jPlayer",function(){a._trigger(b.jPlayer.event.click)});this.html.audio.available=!1;if(this.require.audio)this.htmlElement.audio=document.createElement("audio"),this.htmlElement.audio.id=this.internal.audio.id,
this.html.audio.available=!!this.htmlElement.audio.canPlayType&&this._testCanPlayType(this.htmlElement.audio);this.html.video.available=!1;if(this.require.video)this.htmlElement.video=document.createElement("video"),this.htmlElement.video.id=this.internal.video.id,this.html.video.available=!!this.htmlElement.video.canPlayType&&this._testCanPlayType(this.htmlElement.video);this.flash.available=this._checkForFlash(10);this.html.canPlay={};this.flash.canPlay={};b.each(this.formats,function(b,c){a.html.canPlay[c]=
a.html[a.format[c].media].available&&""!==a.htmlElement[a.format[c].media].canPlayType(a.format[c].codec);a.flash.canPlay[c]=a.format[c].flashCanPlay&&a.flash.available});this.html.desired=!1;this.flash.desired=!1;b.each(this.solutions,function(c,d){if(c===0)a[d].desired=!0;else{var e=!1,f=!1;b.each(a.formats,function(b,c){a[a.solutions[0]].canPlay[c]&&(a.format[c].media==="video"?f=!0:e=!0)});a[d].desired=a.require.audio&&!e||a.require.video&&!f}});this.html.support={};this.flash.support={};b.each(this.formats,
function(b,c){a.html.support[c]=a.html.canPlay[c]&&a.html.desired;a.flash.support[c]=a.flash.canPlay[c]&&a.flash.desired});this.html.used=!1;this.flash.used=!1;b.each(this.solutions,function(c,d){b.each(a.formats,function(b,c){if(a[d].support[c])return a[d].used=!0,!1})});this._resetActive();this._resetGate();this._cssSelectorAncestor(this.options.cssSelectorAncestor);!this.html.used&&!this.flash.used?(this._error({type:b.jPlayer.error.NO_SOLUTION,context:"{solution:'"+this.options.solution+"', supplied:'"+
this.options.supplied+"'}",message:b.jPlayer.errorMsg.NO_SOLUTION,hint:b.jPlayer.errorHint.NO_SOLUTION}),this.css.jq.noSolution.length&&this.css.jq.noSolution.show()):this.css.jq.noSolution.length&&this.css.jq.noSolution.hide();if(this.flash.used){var c,d="jQuery="+encodeURI(this.options.noConflict)+"&id="+encodeURI(this.internal.self.id)+"&vol="+this.options.volume+"&muted="+this.options.muted;if(b.browser.msie&&Number(b.browser.version)<=8){d=['<param name="movie" value="'+this.internal.flash.swf+
'" />','<param name="FlashVars" value="'+d+'" />','<param name="allowScriptAccess" value="always" />','<param name="bgcolor" value="'+this.options.backgroundColor+'" />','<param name="wmode" value="'+this.options.wmode+'" />'];c=document.createElement('<object id="'+this.internal.flash.id+'" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" width="0" height="0"></object>');for(var e=0;e<d.length;e++)c.appendChild(document.createElement(d[e]))}else e=function(a,b,c){var d=document.createElement("param");
d.setAttribute("name",b);d.setAttribute("value",c);a.appendChild(d)},c=document.createElement("object"),c.setAttribute("id",this.internal.flash.id),c.setAttribute("data",this.internal.flash.swf),c.setAttribute("type","application/x-shockwave-flash"),c.setAttribute("width","1"),c.setAttribute("height","1"),e(c,"flashvars",d),e(c,"allowscriptaccess","always"),e(c,"bgcolor",this.options.backgroundColor),e(c,"wmode",this.options.wmode);this.element.append(c);this.internal.flash.jq=b(c)}if(this.html.used){if(this.html.audio.available)this._addHtmlEventListeners(this.htmlElement.audio,
this.html.audio),this.element.append(this.htmlElement.audio),this.internal.audio.jq=b("#"+this.internal.audio.id);if(this.html.video.available)this._addHtmlEventListeners(this.htmlElement.video,this.html.video),this.element.append(this.htmlElement.video),this.internal.video.jq=b("#"+this.internal.video.id),this.status.nativeVideoControls?this.internal.video.jq.css({width:this.status.width,height:this.status.height}):this.internal.video.jq.css({width:"0px",height:"0px"}),this.internal.video.jq.bind("click.jPlayer",
function(){a._trigger(b.jPlayer.event.click)})}this.options.emulateHtml&&this._emulateHtmlBridge();this.html.used&&!this.flash.used&&setTimeout(function(){a.internal.ready=!0;a.version.flash="n/a";a._trigger(b.jPlayer.event.repeat);a._trigger(b.jPlayer.event.ready)},100);this._updateNativeVideoControls();this._updateInterface();this._updateButtons(!1);this._updateAutohide();this._updateVolume(this.options.volume);this._updateMute(this.options.muted);this.css.jq.videoPlay.length&&this.css.jq.videoPlay.hide();
b.jPlayer.prototype.count++},destroy:function(){this.clearMedia();this._removeUiClass();this.css.jq.currentTime.length&&this.css.jq.currentTime.text("");this.css.jq.duration.length&&this.css.jq.duration.text("");b.each(this.css.jq,function(a,b){b.length&&b.unbind(".jPlayer")});this.internal.poster.jq.unbind(".jPlayer");this.internal.video.jq&&this.internal.video.jq.unbind(".jPlayer");this.options.emulateHtml&&this._destroyHtmlBridge();this.element.removeData("jPlayer");this.element.unbind(".jPlayer");
this.element.empty();delete this.instances[this.internal.instance]},enable:function(){},disable:function(){},_testCanPlayType:function(a){try{return a.canPlayType(this.format.mp3.codec),!0}catch(b){return!1}},_uaBlocklist:function(a){var c=navigator.userAgent.toLowerCase(),d=!1;b.each(a,function(a,b){if(b&&b.test(c))return d=!0,!1});return d},_restrictNativeVideoControls:function(){if(this.require.audio&&this.status.nativeVideoControls)this.status.nativeVideoControls=!1,this.status.noFullScreen=!0},
_updateNativeVideoControls:function(){if(this.html.video.available&&this.html.used)this.htmlElement.video.controls=this.status.nativeVideoControls,this._updateAutohide(),this.status.nativeVideoControls&&this.require.video?(this.internal.poster.jq.hide(),this.internal.video.jq.css({width:this.status.width,height:this.status.height})):this.status.waitForPlay&&this.status.video&&(this.internal.poster.jq.show(),this.internal.video.jq.css({width:"0px",height:"0px"}))},_addHtmlEventListeners:function(a,
c){var d=this;a.preload=this.options.preload;a.muted=this.options.muted;a.volume=this.options.volume;a.addEventListener("progress",function(){c.gate&&(d._getHtmlStatus(a),d._updateInterface(),d._trigger(b.jPlayer.event.progress))},!1);a.addEventListener("timeupdate",function(){c.gate&&(d._getHtmlStatus(a),d._updateInterface(),d._trigger(b.jPlayer.event.timeupdate))},!1);a.addEventListener("durationchange",function(){if(c.gate)d.status.duration=this.duration,d._getHtmlStatus(a),d._updateInterface(),
d._trigger(b.jPlayer.event.durationchange)},!1);a.addEventListener("play",function(){c.gate&&(d._updateButtons(!0),d._html_checkWaitForPlay(),d._trigger(b.jPlayer.event.play))},!1);a.addEventListener("playing",function(){c.gate&&(d._updateButtons(!0),d._seeked(),d._trigger(b.jPlayer.event.playing))},!1);a.addEventListener("pause",function(){c.gate&&(d._updateButtons(!1),d._trigger(b.jPlayer.event.pause))},!1);a.addEventListener("waiting",function(){c.gate&&(d._seeking(),d._trigger(b.jPlayer.event.waiting))},
!1);a.addEventListener("seeking",function(){c.gate&&(d._seeking(),d._trigger(b.jPlayer.event.seeking))},!1);a.addEventListener("seeked",function(){c.gate&&(d._seeked(),d._trigger(b.jPlayer.event.seeked))},!1);a.addEventListener("volumechange",function(){if(c.gate)d.options.volume=a.volume,d.options.muted=a.muted,d._updateMute(),d._updateVolume(),d._trigger(b.jPlayer.event.volumechange)},!1);a.addEventListener("suspend",function(){c.gate&&(d._seeked(),d._trigger(b.jPlayer.event.suspend))},!1);a.addEventListener("ended",
function(){if(c.gate){if(!b.jPlayer.browser.webkit)d.htmlElement.media.currentTime=0;d.htmlElement.media.pause();d._updateButtons(!1);d._getHtmlStatus(a,!0);d._updateInterface();d._trigger(b.jPlayer.event.ended)}},!1);a.addEventListener("error",function(){if(c.gate&&(d._updateButtons(!1),d._seeked(),d.status.srcSet))clearTimeout(d.internal.htmlDlyCmdId),d.status.waitForLoad=!0,d.status.waitForPlay=!0,d.status.video&&!d.status.nativeVideoControls&&d.internal.video.jq.css({width:"0px",height:"0px"}),
d._validString(d.status.media.poster)&&!d.status.nativeVideoControls&&d.internal.poster.jq.show(),d.css.jq.videoPlay.length&&d.css.jq.videoPlay.show(),d._error({type:b.jPlayer.error.URL,context:d.status.src,message:b.jPlayer.errorMsg.URL,hint:b.jPlayer.errorHint.URL})},!1);b.each(b.jPlayer.htmlEvent,function(e,g){a.addEventListener(this,function(){c.gate&&d._trigger(b.jPlayer.event[g])},!1)})},_getHtmlStatus:function(a,b){var d=0,e=0,g=0,f=0;if(a.duration)this.status.duration=a.duration;d=a.currentTime;
e=this.status.duration>0?100*d/this.status.duration:0;typeof a.seekable==="object"&&a.seekable.length>0?(g=this.status.duration>0?100*a.seekable.end(a.seekable.length-1)/this.status.duration:100,f=100*a.currentTime/a.seekable.end(a.seekable.length-1)):(g=100,f=e);b&&(e=f=d=0);this.status.seekPercent=g;this.status.currentPercentRelative=f;this.status.currentPercentAbsolute=e;this.status.currentTime=d;this.status.readyState=a.readyState;this.status.networkState=a.networkState;this.status.playbackRate=
a.playbackRate;this.status.ended=a.ended},_resetStatus:function(){this.status=b.extend({},this.status,b.jPlayer.prototype.status)},_trigger:function(a,c,d){a=b.Event(a);a.jPlayer={};a.jPlayer.version=b.extend({},this.version);a.jPlayer.options=b.extend(!0,{},this.options);a.jPlayer.status=b.extend(!0,{},this.status);a.jPlayer.html=b.extend(!0,{},this.html);a.jPlayer.flash=b.extend(!0,{},this.flash);if(c)a.jPlayer.error=b.extend({},c);if(d)a.jPlayer.warning=b.extend({},d);this.element.trigger(a)},
jPlayerFlashEvent:function(a,c){if(a===b.jPlayer.event.ready)if(this.internal.ready){if(this.flash.gate){if(this.status.srcSet){var d=this.status.currentTime,e=this.status.paused;this.setMedia(this.status.media);d>0&&(e?this.pause(d):this.play(d))}this._trigger(b.jPlayer.event.flashreset)}}else this.internal.ready=!0,this.internal.flash.jq.css({width:"0px",height:"0px"}),this.version.flash=c.version,this.version.needFlash!==this.version.flash&&this._error({type:b.jPlayer.error.VERSION,context:this.version.flash,
message:b.jPlayer.errorMsg.VERSION+this.version.flash,hint:b.jPlayer.errorHint.VERSION}),this._trigger(b.jPlayer.event.repeat),this._trigger(a);if(this.flash.gate)switch(a){case b.jPlayer.event.progress:this._getFlashStatus(c);this._updateInterface();this._trigger(a);break;case b.jPlayer.event.timeupdate:this._getFlashStatus(c);this._updateInterface();this._trigger(a);break;case b.jPlayer.event.play:this._seeked();this._updateButtons(!0);this._trigger(a);break;case b.jPlayer.event.pause:this._updateButtons(!1);
this._trigger(a);break;case b.jPlayer.event.ended:this._updateButtons(!1);this._trigger(a);break;case b.jPlayer.event.click:this._trigger(a);break;case b.jPlayer.event.error:this.status.waitForLoad=!0;this.status.waitForPlay=!0;this.status.video&&this.internal.flash.jq.css({width:"0px",height:"0px"});this._validString(this.status.media.poster)&&this.internal.poster.jq.show();this.css.jq.videoPlay.length&&this.status.video&&this.css.jq.videoPlay.show();this.status.video?this._flash_setVideo(this.status.media):
this._flash_setAudio(this.status.media);this._updateButtons(!1);this._error({type:b.jPlayer.error.URL,context:c.src,message:b.jPlayer.errorMsg.URL,hint:b.jPlayer.errorHint.URL});break;case b.jPlayer.event.seeking:this._seeking();this._trigger(a);break;case b.jPlayer.event.seeked:this._seeked();this._trigger(a);break;case b.jPlayer.event.ready:break;default:this._trigger(a)}return!1},_getFlashStatus:function(a){this.status.seekPercent=a.seekPercent;this.status.currentPercentRelative=a.currentPercentRelative;
this.status.currentPercentAbsolute=a.currentPercentAbsolute;this.status.currentTime=a.currentTime;this.status.duration=a.duration;this.status.readyState=4;this.status.networkState=0;this.status.playbackRate=1;this.status.ended=!1},_updateButtons:function(a){if(a!==f)this.status.paused=!a,this.css.jq.play.length&&this.css.jq.pause.length&&(a?(this.css.jq.play.hide(),this.css.jq.pause.show()):(this.css.jq.play.show(),this.css.jq.pause.hide()));this.css.jq.restoreScreen.length&&this.css.jq.fullScreen.length&&
(this.status.noFullScreen?(this.css.jq.fullScreen.hide(),this.css.jq.restoreScreen.hide()):this.options.fullScreen?(this.css.jq.fullScreen.hide(),this.css.jq.restoreScreen.show()):(this.css.jq.fullScreen.show(),this.css.jq.restoreScreen.hide()));this.css.jq.repeat.length&&this.css.jq.repeatOff.length&&(this.options.loop?(this.css.jq.repeat.hide(),this.css.jq.repeatOff.show()):(this.css.jq.repeat.show(),this.css.jq.repeatOff.hide()))},_updateInterface:function(){this.css.jq.seekBar.length&&this.css.jq.seekBar.width(this.status.seekPercent+
"%");this.css.jq.playBar.length&&this.css.jq.playBar.width(this.status.currentPercentRelative+"%");this.css.jq.currentTime.length&&this.css.jq.currentTime.text(b.jPlayer.convertTime(this.status.currentTime));this.css.jq.duration.length&&this.css.jq.duration.text(b.jPlayer.convertTime(this.status.duration))},_seeking:function(){this.css.jq.seekBar.length&&this.css.jq.seekBar.addClass("jp-seeking-bg")},_seeked:function(){this.css.jq.seekBar.length&&this.css.jq.seekBar.removeClass("jp-seeking-bg")},
_resetGate:function(){this.html.audio.gate=!1;this.html.video.gate=!1;this.flash.gate=!1},_resetActive:function(){this.html.active=!1;this.flash.active=!1},setMedia:function(a){var c=this,d=!1,e=this.status.media.poster!==a.poster;this._resetMedia();this._resetGate();this._resetActive();b.each(this.formats,function(e,f){var i=c.format[f].media==="video";b.each(c.solutions,function(b,e){if(c[e].support[f]&&c._validString(a[f])){var g=e==="html";i?(g?(c.html.video.gate=!0,c._html_setVideo(a),c.html.active=
!0):(c.flash.gate=!0,c._flash_setVideo(a),c.flash.active=!0),c.css.jq.videoPlay.length&&c.css.jq.videoPlay.show(),c.status.video=!0):(g?(c.html.audio.gate=!0,c._html_setAudio(a),c.html.active=!0):(c.flash.gate=!0,c._flash_setAudio(a),c.flash.active=!0),c.css.jq.videoPlay.length&&c.css.jq.videoPlay.hide(),c.status.video=!1);d=!0;return!1}});if(d)return!1});if(d){if((!this.status.nativeVideoControls||!this.html.video.gate)&&this._validString(a.poster))e?this.htmlElement.poster.src=a.poster:this.internal.poster.jq.show();
this.status.srcSet=!0;this.status.media=b.extend({},a);this._updateButtons(!1);this._updateInterface()}else this._error({type:b.jPlayer.error.NO_SUPPORT,context:"{supplied:'"+this.options.supplied+"'}",message:b.jPlayer.errorMsg.NO_SUPPORT,hint:b.jPlayer.errorHint.NO_SUPPORT})},_resetMedia:function(){this._resetStatus();this._updateButtons(!1);this._updateInterface();this._seeked();this.internal.poster.jq.hide();clearTimeout(this.internal.htmlDlyCmdId);this.html.active?this._html_resetMedia():this.flash.active&&
this._flash_resetMedia()},clearMedia:function(){this._resetMedia();this.html.active?this._html_clearMedia():this.flash.active&&this._flash_clearMedia();this._resetGate();this._resetActive()},load:function(){this.status.srcSet?this.html.active?this._html_load():this.flash.active&&this._flash_load():this._urlNotSetError("load")},play:function(a){a=typeof a==="number"?a:NaN;this.status.srcSet?this.html.active?this._html_play(a):this.flash.active&&this._flash_play(a):this._urlNotSetError("play")},videoPlay:function(){this.play()},
pause:function(a){a=typeof a==="number"?a:NaN;this.status.srcSet?this.html.active?this._html_pause(a):this.flash.active&&this._flash_pause(a):this._urlNotSetError("pause")},pauseOthers:function(){var a=this;b.each(this.instances,function(b,d){a.element!==d&&d.data("jPlayer").status.srcSet&&d.jPlayer("pause")})},stop:function(){this.status.srcSet?this.html.active?this._html_pause(0):this.flash.active&&this._flash_pause(0):this._urlNotSetError("stop")},playHead:function(a){a=this._limitValue(a,0,100);
this.status.srcSet?this.html.active?this._html_playHead(a):this.flash.active&&this._flash_playHead(a):this._urlNotSetError("playHead")},_muted:function(a){this.options.muted=a;this.html.used&&this._html_mute(a);this.flash.used&&this._flash_mute(a);!this.html.video.gate&&!this.html.audio.gate&&(this._updateMute(a),this._updateVolume(this.options.volume),this._trigger(b.jPlayer.event.volumechange))},mute:function(a){a=a===f?!0:!!a;this._muted(a)},unmute:function(a){a=a===f?!0:!!a;this._muted(!a)},_updateMute:function(a){if(a===
f)a=this.options.muted;this.css.jq.mute.length&&this.css.jq.unmute.length&&(this.status.noVolume?(this.css.jq.mute.hide(),this.css.jq.unmute.hide()):a?(this.css.jq.mute.hide(),this.css.jq.unmute.show()):(this.css.jq.mute.show(),this.css.jq.unmute.hide()))},volume:function(a){a=this._limitValue(a,0,1);this.options.volume=a;this.html.used&&this._html_volume(a);this.flash.used&&this._flash_volume(a);!this.html.video.gate&&!this.html.audio.gate&&(this._updateVolume(a),this._trigger(b.jPlayer.event.volumechange))},
volumeBar:function(a){if(this.css.jq.volumeBar.length){var b=this.css.jq.volumeBar.offset(),d=a.pageX-b.left,e=this.css.jq.volumeBar.width(),a=this.css.jq.volumeBar.height()-a.pageY+b.top,b=this.css.jq.volumeBar.height();this.options.verticalVolume?this.volume(a/b):this.volume(d/e)}this.options.muted&&this._muted(!1)},volumeBarValue:function(a){this.volumeBar(a)},_updateVolume:function(a){if(a===f)a=this.options.volume;a=this.options.muted?0:a;this.status.noVolume?(this.css.jq.volumeBar.length&&this.css.jq.volumeBar.hide(),
this.css.jq.volumeBarValue.length&&this.css.jq.volumeBarValue.hide(),this.css.jq.volumeMax.length&&this.css.jq.volumeMax.hide()):(this.css.jq.volumeBar.length&&this.css.jq.volumeBar.show(),this.css.jq.volumeBarValue.length&&(this.css.jq.volumeBarValue.show(),this.css.jq.volumeBarValue[this.options.verticalVolume?"height":"width"](a*100+"%")),this.css.jq.volumeMax.length&&this.css.jq.volumeMax.show())},volumeMax:function(){this.volume(1);this.options.muted&&this._muted(!1)},_cssSelectorAncestor:function(a){var c=
this;this.options.cssSelectorAncestor=a;this._removeUiClass();this.ancestorJq=a?b(a):[];a&&this.ancestorJq.length!==1&&this._warning({type:b.jPlayer.warning.CSS_SELECTOR_COUNT,context:a,message:b.jPlayer.warningMsg.CSS_SELECTOR_COUNT+this.ancestorJq.length+" found for cssSelectorAncestor.",hint:b.jPlayer.warningHint.CSS_SELECTOR_COUNT});this._addUiClass();b.each(this.options.cssSelector,function(a,b){c._cssSelector(a,b)})},_cssSelector:function(a,c){var d=this;typeof c==="string"?b.jPlayer.prototype.options.cssSelector[a]?
(this.css.jq[a]&&this.css.jq[a].length&&this.css.jq[a].unbind(".jPlayer"),this.options.cssSelector[a]=c,this.css.cs[a]=this.options.cssSelectorAncestor+" "+c,this.css.jq[a]=c?b(this.css.cs[a]):[],this.css.jq[a].length&&this.css.jq[a].bind("click.jPlayer",function(c){d[a](c);b(this).blur();return!1}),c&&this.css.jq[a].length!==1&&this._warning({type:b.jPlayer.warning.CSS_SELECTOR_COUNT,context:this.css.cs[a],message:b.jPlayer.warningMsg.CSS_SELECTOR_COUNT+this.css.jq[a].length+" found for "+a+" method.",
hint:b.jPlayer.warningHint.CSS_SELECTOR_COUNT})):this._warning({type:b.jPlayer.warning.CSS_SELECTOR_METHOD,context:a,message:b.jPlayer.warningMsg.CSS_SELECTOR_METHOD,hint:b.jPlayer.warningHint.CSS_SELECTOR_METHOD}):this._warning({type:b.jPlayer.warning.CSS_SELECTOR_STRING,context:c,message:b.jPlayer.warningMsg.CSS_SELECTOR_STRING,hint:b.jPlayer.warningHint.CSS_SELECTOR_STRING})},seekBar:function(a){if(this.css.jq.seekBar){var b=this.css.jq.seekBar.offset(),a=a.pageX-b.left,b=this.css.jq.seekBar.width();
this.playHead(100*a/b)}},playBar:function(a){this.seekBar(a)},repeat:function(){this._loop(!0)},repeatOff:function(){this._loop(!1)},_loop:function(a){if(this.options.loop!==a)this.options.loop=a,this._updateButtons(),this._trigger(b.jPlayer.event.repeat)},currentTime:function(){},duration:function(){},gui:function(){},noSolution:function(){},option:function(a,c){var d=a;if(arguments.length===0)return b.extend(!0,{},this.options);if(typeof a==="string"){var e=a.split(".");if(c===f){for(var d=b.extend(!0,
{},this.options),g=0;g<e.length;g++)if(d[e[g]]!==f)d=d[e[g]];else return this._warning({type:b.jPlayer.warning.OPTION_KEY,context:a,message:b.jPlayer.warningMsg.OPTION_KEY,hint:b.jPlayer.warningHint.OPTION_KEY}),f;return d}for(var g=d={},h=0;h<e.length;h++)h<e.length-1?(g[e[h]]={},g=g[e[h]]):g[e[h]]=c}this._setOptions(d);return this},_setOptions:function(a){var c=this;b.each(a,function(a,b){c._setOption(a,b)});return this},_setOption:function(a,c){var d=this;switch(a){case "volume":this.volume(c);
break;case "muted":this._muted(c);break;case "cssSelectorAncestor":this._cssSelectorAncestor(c);break;case "cssSelector":b.each(c,function(a,b){d._cssSelector(a,b)});break;case "fullScreen":this.options[a]!==c&&(this._removeUiClass(),this.options[a]=c,this._refreshSize());break;case "size":!this.options.fullScreen&&this.options[a].cssClass!==c.cssClass&&this._removeUiClass();this.options[a]=b.extend({},this.options[a],c);this._refreshSize();break;case "sizeFull":this.options.fullScreen&&this.options[a].cssClass!==
c.cssClass&&this._removeUiClass();this.options[a]=b.extend({},this.options[a],c);this._refreshSize();break;case "autohide":this.options[a]=b.extend({},this.options[a],c);this._updateAutohide();break;case "loop":this._loop(c);break;case "nativeVideoControls":this.options[a]=b.extend({},this.options[a],c);this.status.nativeVideoControls=this._uaBlocklist(this.options.nativeVideoControls);this._restrictNativeVideoControls();this._updateNativeVideoControls();break;case "noFullScreen":this.options[a]=
b.extend({},this.options[a],c);this.status.nativeVideoControls=this._uaBlocklist(this.options.nativeVideoControls);this.status.noFullScreen=this._uaBlocklist(this.options.noFullScreen);this._restrictNativeVideoControls();this._updateButtons();break;case "noVolume":this.options[a]=b.extend({},this.options[a],c);this.status.noVolume=this._uaBlocklist(this.options.noVolume);this._updateVolume();this._updateMute();break;case "emulateHtml":this.options[a]!==c&&((this.options[a]=c)?this._emulateHtmlBridge():
this._destroyHtmlBridge())}return this},_refreshSize:function(){this._setSize();this._addUiClass();this._updateSize();this._updateButtons();this._updateAutohide();this._trigger(b.jPlayer.event.resize)},_setSize:function(){this.options.fullScreen?(this.status.width=this.options.sizeFull.width,this.status.height=this.options.sizeFull.height,this.status.cssClass=this.options.sizeFull.cssClass):(this.status.width=this.options.size.width,this.status.height=this.options.size.height,this.status.cssClass=
this.options.size.cssClass);this.element.css({width:this.status.width,height:this.status.height})},_addUiClass:function(){this.ancestorJq.length&&this.ancestorJq.addClass(this.status.cssClass)},_removeUiClass:function(){this.ancestorJq.length&&this.ancestorJq.removeClass(this.status.cssClass)},_updateSize:function(){this.internal.poster.jq.css({width:this.status.width,height:this.status.height});!this.status.waitForPlay&&this.html.active&&this.status.video||this.html.video.available&&this.html.used&&
this.status.nativeVideoControls?this.internal.video.jq.css({width:this.status.width,height:this.status.height}):!this.status.waitForPlay&&this.flash.active&&this.status.video&&this.internal.flash.jq.css({width:this.status.width,height:this.status.height})},_updateAutohide:function(){var a=this,b=function(){a.css.jq.gui.fadeIn(a.options.autohide.fadeIn,function(){clearTimeout(a.internal.autohideId);a.internal.autohideId=setTimeout(function(){a.css.jq.gui.fadeOut(a.options.autohide.fadeOut)},a.options.autohide.hold)})};
this.css.jq.gui.length&&(this.css.jq.gui.stop(!0,!0),clearTimeout(this.internal.autohideId),this.element.unbind(".jPlayerAutohide"),this.css.jq.gui.unbind(".jPlayerAutohide"),this.status.nativeVideoControls?this.css.jq.gui.hide():this.options.fullScreen&&this.options.autohide.full||!this.options.fullScreen&&this.options.autohide.restored?(this.element.bind("mousemove.jPlayer.jPlayerAutohide",b),this.css.jq.gui.bind("mousemove.jPlayer.jPlayerAutohide",b),this.css.jq.gui.hide()):this.css.jq.gui.show())},
fullScreen:function(){this._setOption("fullScreen",!0)},restoreScreen:function(){this._setOption("fullScreen",!1)},_html_initMedia:function(){this.htmlElement.media.src=this.status.src;this.options.preload!=="none"&&this._html_load();this._trigger(b.jPlayer.event.timeupdate)},_html_setAudio:function(a){var c=this;b.each(this.formats,function(b,e){if(c.html.support[e]&&a[e])return c.status.src=a[e],c.status.format[e]=!0,c.status.formatType=e,!1});this.htmlElement.media=this.htmlElement.audio;this._html_initMedia()},
_html_setVideo:function(a){var c=this;b.each(this.formats,function(b,e){if(c.html.support[e]&&a[e])return c.status.src=a[e],c.status.format[e]=!0,c.status.formatType=e,!1});if(this.status.nativeVideoControls)this.htmlElement.video.poster=this._validString(a.poster)?a.poster:"";this.htmlElement.media=this.htmlElement.video;this._html_initMedia()},_html_resetMedia:function(){this.htmlElement.media&&(this.htmlElement.media.id===this.internal.video.id&&!this.status.nativeVideoControls&&this.internal.video.jq.css({width:"0px",
height:"0px"}),this.htmlElement.media.pause())},_html_clearMedia:function(){if(this.htmlElement.media)this.htmlElement.media.src="",this.htmlElement.media.load()},_html_load:function(){if(this.status.waitForLoad)this.status.waitForLoad=!1,this.htmlElement.media.load();clearTimeout(this.internal.htmlDlyCmdId)},_html_play:function(a){var b=this;this._html_load();this.htmlElement.media.play();if(!isNaN(a))try{this.htmlElement.media.currentTime=a}catch(d){this.internal.htmlDlyCmdId=setTimeout(function(){b.play(a)},
100);return}this._html_checkWaitForPlay()},_html_pause:function(a){var b=this;a>0?this._html_load():clearTimeout(this.internal.htmlDlyCmdId);this.htmlElement.media.pause();if(!isNaN(a))try{this.htmlElement.media.currentTime=a}catch(d){this.internal.htmlDlyCmdId=setTimeout(function(){b.pause(a)},100);return}a>0&&this._html_checkWaitForPlay()},_html_playHead:function(a){var b=this;this._html_load();try{if(typeof this.htmlElement.media.seekable==="object"&&this.htmlElement.media.seekable.length>0)this.htmlElement.media.currentTime=
a*this.htmlElement.media.seekable.end(this.htmlElement.media.seekable.length-1)/100;else if(this.htmlElement.media.duration>0&&!isNaN(this.htmlElement.media.duration))this.htmlElement.media.currentTime=a*this.htmlElement.media.duration/100;else throw"e";}catch(d){this.internal.htmlDlyCmdId=setTimeout(function(){b.playHead(a)},100);return}this.status.waitForLoad||this._html_checkWaitForPlay()},_html_checkWaitForPlay:function(){if(this.status.waitForPlay)this.status.waitForPlay=!1,this.css.jq.videoPlay.length&&
this.css.jq.videoPlay.hide(),this.status.video&&(this.internal.poster.jq.hide(),this.internal.video.jq.css({width:this.status.width,height:this.status.height}))},_html_volume:function(a){if(this.html.audio.available)this.htmlElement.audio.volume=a;if(this.html.video.available)this.htmlElement.video.volume=a},_html_mute:function(a){if(this.html.audio.available)this.htmlElement.audio.muted=a;if(this.html.video.available)this.htmlElement.video.muted=a},_flash_setAudio:function(a){var c=this;try{if(b.each(this.formats,
function(b,d){if(c.flash.support[d]&&a[d]){switch(d){case "m4a":case "fla":c._getMovie().fl_setAudio_m4a(a[d]);break;case "mp3":c._getMovie().fl_setAudio_mp3(a[d])}c.status.src=a[d];c.status.format[d]=!0;c.status.formatType=d;return!1}}),this.options.preload==="auto")this._flash_load(),this.status.waitForLoad=!1}catch(d){this._flashError(d)}},_flash_setVideo:function(a){var c=this;try{if(b.each(this.formats,function(b,d){if(c.flash.support[d]&&a[d]){switch(d){case "m4v":case "flv":c._getMovie().fl_setVideo_m4v(a[d])}c.status.src=
a[d];c.status.format[d]=!0;c.status.formatType=d;return!1}}),this.options.preload==="auto")this._flash_load(),this.status.waitForLoad=!1}catch(d){this._flashError(d)}},_flash_resetMedia:function(){this.internal.flash.jq.css({width:"0px",height:"0px"});this._flash_pause(NaN)},_flash_clearMedia:function(){try{this._getMovie().fl_clearMedia()}catch(a){this._flashError(a)}},_flash_load:function(){try{this._getMovie().fl_load()}catch(a){this._flashError(a)}this.status.waitForLoad=!1},_flash_play:function(a){try{this._getMovie().fl_play(a)}catch(b){this._flashError(b)}this.status.waitForLoad=
!1;this._flash_checkWaitForPlay()},_flash_pause:function(a){try{this._getMovie().fl_pause(a)}catch(b){this._flashError(b)}if(a>0)this.status.waitForLoad=!1,this._flash_checkWaitForPlay()},_flash_playHead:function(a){try{this._getMovie().fl_play_head(a)}catch(b){this._flashError(b)}this.status.waitForLoad||this._flash_checkWaitForPlay()},_flash_checkWaitForPlay:function(){if(this.status.waitForPlay)this.status.waitForPlay=!1,this.css.jq.videoPlay.length&&this.css.jq.videoPlay.hide(),this.status.video&&
(this.internal.poster.jq.hide(),this.internal.flash.jq.css({width:this.status.width,height:this.status.height}))},_flash_volume:function(a){try{this._getMovie().fl_volume(a)}catch(b){this._flashError(b)}},_flash_mute:function(a){try{this._getMovie().fl_mute(a)}catch(b){this._flashError(b)}},_getMovie:function(){return document[this.internal.flash.id]},_checkForFlash:function(a){var b=!1,d;if(window.ActiveXObject)try{new ActiveXObject("ShockwaveFlash.ShockwaveFlash."+a),b=!0}catch(e){}else navigator.plugins&&
navigator.mimeTypes.length>0&&(d=navigator.plugins["Shockwave Flash"])&&navigator.plugins["Shockwave Flash"].description.replace(/.*\s(\d+\.\d+).*/,"$1")>=a&&(b=!0);return b},_validString:function(a){return a&&typeof a==="string"},_limitValue:function(a,b,d){return a<b?b:a>d?d:a},_urlNotSetError:function(a){this._error({type:b.jPlayer.error.URL_NOT_SET,context:a,message:b.jPlayer.errorMsg.URL_NOT_SET,hint:b.jPlayer.errorHint.URL_NOT_SET})},_flashError:function(a){var c;c=this.internal.ready?"FLASH_DISABLED":
"FLASH";this._error({type:b.jPlayer.error[c],context:this.internal.flash.swf,message:b.jPlayer.errorMsg[c]+a.message,hint:b.jPlayer.errorHint[c]});this.internal.flash.jq.css({width:"1px",height:"1px"})},_error:function(a){this._trigger(b.jPlayer.event.error,a);this.options.errorAlerts&&this._alert("Error!"+(a.message?"\n\n"+a.message:"")+(a.hint?"\n\n"+a.hint:"")+"\n\nContext: "+a.context)},_warning:function(a){this._trigger(b.jPlayer.event.warning,f,a);this.options.warningAlerts&&this._alert("Warning!"+
(a.message?"\n\n"+a.message:"")+(a.hint?"\n\n"+a.hint:"")+"\n\nContext: "+a.context)},_alert:function(a){alert("jPlayer "+this.version.script+" : id='"+this.internal.self.id+"' : "+a)},_emulateHtmlBridge:function(){var a=this;b.each(b.jPlayer.emulateMethods.split(/\s+/g),function(b,d){a.internal.domNode[d]=function(b){a[d](b)}});b.each(b.jPlayer.event,function(c,d){var e=!0;b.each(b.jPlayer.reservedEvent.split(/\s+/g),function(a,b){if(b===c)return e=!1});e&&a.element.bind(d+".jPlayer.jPlayerHtml",
function(){a._emulateHtmlUpdate();var b=document.createEvent("Event");b.initEvent(c,!1,!0);a.internal.domNode.dispatchEvent(b)})})},_emulateHtmlUpdate:function(){var a=this;b.each(b.jPlayer.emulateStatus.split(/\s+/g),function(b,d){a.internal.domNode[d]=a.status[d]});b.each(b.jPlayer.emulateOptions.split(/\s+/g),function(b,d){a.internal.domNode[d]=a.options[d]})},_destroyHtmlBridge:function(){var a=this;this.element.unbind(".jPlayerHtml");b.each((b.jPlayer.emulateMethods+" "+b.jPlayer.emulateStatus+
" "+b.jPlayer.emulateOptions).split(/\s+/g),function(b,d){delete a.internal.domNode[d]})}};b.jPlayer.error={FLASH:"e_flash",FLASH_DISABLED:"e_flash_disabled",NO_SOLUTION:"e_no_solution",NO_SUPPORT:"e_no_support",URL:"e_url",URL_NOT_SET:"e_url_not_set",VERSION:"e_version"};b.jPlayer.errorMsg={FLASH:"jPlayer's Flash fallback is not configured correctly, or a command was issued before the jPlayer Ready event. Details: ",FLASH_DISABLED:"jPlayer's Flash fallback has been disabled by the browser due to the CSS rules you have used. Details: ",
NO_SOLUTION:"No solution can be found by jPlayer in this browser. Neither HTML nor Flash can be used.",NO_SUPPORT:"It is not possible to play any media format provided in setMedia() on this browser using your current options.",URL:"Media URL could not be loaded.",URL_NOT_SET:"Attempt to issue media playback commands, while no media url is set.",VERSION:"jPlayer "+b.jPlayer.prototype.version.script+" needs Jplayer.swf version "+b.jPlayer.prototype.version.needFlash+" but found "};b.jPlayer.errorHint=
{FLASH:"Check your swfPath option and that Jplayer.swf is there.",FLASH_DISABLED:"Check that you have not display:none; the jPlayer entity or any ancestor.",NO_SOLUTION:"Review the jPlayer options: support and supplied.",NO_SUPPORT:"Video or audio formats defined in the supplied option are missing.",URL:"Check media URL is valid.",URL_NOT_SET:"Use setMedia() to set the media URL.",VERSION:"Update jPlayer files."};b.jPlayer.warning={CSS_SELECTOR_COUNT:"e_css_selector_count",CSS_SELECTOR_METHOD:"e_css_selector_method",
CSS_SELECTOR_STRING:"e_css_selector_string",OPTION_KEY:"e_option_key"};b.jPlayer.warningMsg={CSS_SELECTOR_COUNT:"The number of css selectors found did not equal one: ",CSS_SELECTOR_METHOD:"The methodName given in jPlayer('cssSelector') is not a valid jPlayer method.",CSS_SELECTOR_STRING:"The methodCssSelector given in jPlayer('cssSelector') is not a String or is empty.",OPTION_KEY:"The option requested in jPlayer('option') is undefined."};b.jPlayer.warningHint={CSS_SELECTOR_COUNT:"Check your css selector and the ancestor.",
CSS_SELECTOR_METHOD:"Check your method name.",CSS_SELECTOR_STRING:"Check your css selector is a string.",OPTION_KEY:"Check your option name."}})(jQuery);
;

/*!
 * jQuery Form Plugin
 * version: 2.52 (07-DEC-2010)
 * @requires jQuery v1.3.2 or later
 *
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
;(function(b){function q(){if(b.fn.ajaxSubmit.debug){var a="[jquery.form] "+Array.prototype.join.call(arguments,"");if(window.console&&window.console.log)window.console.log(a);else window.opera&&window.opera.postError&&window.opera.postError(a)}}b.fn.ajaxSubmit=function(a){function f(){function t(){var o=i.attr("target"),m=i.attr("action");l.setAttribute("target",u);l.getAttribute("method")!="POST"&&l.setAttribute("method","POST");l.getAttribute("action")!=e.url&&l.setAttribute("action",e.url);e.skipEncodingOverride|| i.attr({encoding:"multipart/form-data",enctype:"multipart/form-data"});e.timeout&&setTimeout(function(){F=true;s()},e.timeout);var v=[];try{if(e.extraData)for(var w in e.extraData)v.push(b('<input type="hidden" name="'+w+'" value="'+e.extraData[w]+'" />').appendTo(l)[0]);r.appendTo("body");r.data("form-plugin-onload",s);l.submit()}finally{l.setAttribute("action",m);o?l.setAttribute("target",o):i.removeAttr("target");b(v).remove()}}function s(){if(!G){r.removeData("form-plugin-onload");var o=true; try{if(F)throw"timeout";p=x.contentWindow?x.contentWindow.document:x.contentDocument?x.contentDocument:x.document;var m=e.dataType=="xml"||p.XMLDocument||b.isXMLDoc(p);q("isXml="+m);if(!m&&window.opera&&(p.body==null||p.body.innerHTML==""))if(--K){q("requeing onLoad callback, DOM not available");setTimeout(s,250);return}G=true;j.responseText=p.documentElement?p.documentElement.innerHTML:null;j.responseXML=p.XMLDocument?p.XMLDocument:p;j.getResponseHeader=function(L){return{"content-type":e.dataType}[L]}; var v=/(json|script)/.test(e.dataType);if(v||e.textarea){var w=p.getElementsByTagName("textarea")[0];if(w)j.responseText=w.value;else if(v){var H=p.getElementsByTagName("pre")[0],I=p.getElementsByTagName("body")[0];if(H)j.responseText=H.textContent;else if(I)j.responseText=I.innerHTML}}else if(e.dataType=="xml"&&!j.responseXML&&j.responseText!=null)j.responseXML=C(j.responseText);J=b.httpData(j,e.dataType)}catch(D){q("error caught:",D);o=false;j.error=D;b.handleError(e,j,"error",D)}if(j.aborted){q("upload aborted"); o=false}if(o){e.success.call(e.context,J,"success",j);y&&b.event.trigger("ajaxSuccess",[j,e])}y&&b.event.trigger("ajaxComplete",[j,e]);y&&!--b.active&&b.event.trigger("ajaxStop");if(e.complete)e.complete.call(e.context,j,o?"success":"error");setTimeout(function(){r.removeData("form-plugin-onload");r.remove();j.responseXML=null},100)}}function C(o,m){if(window.ActiveXObject){m=new ActiveXObject("Microsoft.XMLDOM");m.async="false";m.loadXML(o)}else m=(new DOMParser).parseFromString(o,"text/xml");return m&& m.documentElement&&m.documentElement.tagName!="parsererror"?m:null}var l=i[0];if(b(":input[name=submit],:input[id=submit]",l).length)alert('Error: Form elements must not have name or id of "submit".');else{var e=b.extend(true,{},b.ajaxSettings,a);e.context=e.context||e;var u="jqFormIO"+(new Date).getTime(),E="_"+u;window[E]=function(){var o=r.data("form-plugin-onload");if(o){o();window[E]=undefined;try{delete window[E]}catch(m){}}};var r=b('<iframe id="'+u+'" name="'+u+'" src="'+e.iframeSrc+'" onload="window[\'_\'+this.id]()" />'), x=r[0];r.css({position:"absolute",top:"-1000px",left:"-1000px"});var j={aborted:0,responseText:null,responseXML:null,status:0,statusText:"n/a",getAllResponseHeaders:function(){},getResponseHeader:function(){},setRequestHeader:function(){},abort:function(){this.aborted=1;r.attr("src",e.iframeSrc)}},y=e.global;y&&!b.active++&&b.event.trigger("ajaxStart");y&&b.event.trigger("ajaxSend",[j,e]);if(e.beforeSend&&e.beforeSend.call(e.context,j,e)===false)e.global&&b.active--;else if(!j.aborted){var G=false, F=0,z=l.clk;if(z){var A=z.name;if(A&&!z.disabled){e.extraData=e.extraData||{};e.extraData[A]=z.value;if(z.type=="image"){e.extraData[A+".x"]=l.clk_x;e.extraData[A+".y"]=l.clk_y}}}e.forceSync?t():setTimeout(t,10);var J,p,K=50}}}if(!this.length){q("ajaxSubmit: skipping submit process - no element selected");return this}if(typeof a=="function")a={success:a};var d=this.attr("action");if(d=typeof d==="string"?b.trim(d):"")d=(d.match(/^([^#]+)/)||[])[1];d=d||window.location.href||"";a=b.extend(true,{url:d, type:this.attr("method")||"GET",iframeSrc:/^https/i.test(window.location.href||"")?"javascript:false":"about:blank"},a);d={};this.trigger("form-pre-serialize",[this,a,d]);if(d.veto){q("ajaxSubmit: submit vetoed via form-pre-serialize trigger");return this}if(a.beforeSerialize&&a.beforeSerialize(this,a)===false){q("ajaxSubmit: submit aborted via beforeSerialize callback");return this}var c,h,g=this.formToArray(a.semantic);if(a.data){a.extraData=a.data;for(c in a.data)if(a.data[c]instanceof Array)for(var k in a.data[c])g.push({name:c, value:a.data[c][k]});else{h=a.data[c];h=b.isFunction(h)?h():h;g.push({name:c,value:h})}}if(a.beforeSubmit&&a.beforeSubmit(g,this,a)===false){q("ajaxSubmit: submit aborted via beforeSubmit callback");return this}this.trigger("form-submit-validate",[g,this,a,d]);if(d.veto){q("ajaxSubmit: submit vetoed via form-submit-validate trigger");return this}c=b.param(g);if(a.type.toUpperCase()=="GET"){a.url+=(a.url.indexOf("?")>=0?"&":"?")+c;a.data=null}else a.data=c;var i=this,n=[];a.resetForm&&n.push(function(){i.resetForm()}); a.clearForm&&n.push(function(){i.clearForm()});if(!a.dataType&&a.target){var B=a.success||function(){};n.push(function(t){var s=a.replaceTarget?"replaceWith":"html";b(a.target)[s](t).each(B,arguments)})}else a.success&&n.push(a.success);a.success=function(t,s,C){for(var l=a.context||a,e=0,u=n.length;e<u;e++)n[e].apply(l,[t,s,C||i,i])};c=b("input:file",this).length>0;k=i.attr("enctype")=="multipart/form-data"||i.attr("encoding")=="multipart/form-data";if(a.iframe!==false&&(c||a.iframe||k))a.closeKeepAlive? b.get(a.closeKeepAlive,f):f();else b.ajax(a);this.trigger("form-submit-notify",[this,a]);return this};b.fn.ajaxForm=function(a){if(this.length===0){var f={s:this.selector,c:this.context};if(!b.isReady&&f.s){q("DOM not ready, queuing ajaxForm");b(function(){b(f.s,f.c).ajaxForm(a)});return this}q("terminating; zero elements found by selector"+(b.isReady?"":" (DOM not ready)"));return this}return this.ajaxFormUnbind().bind("submit.form-plugin",function(d){if(!d.isDefaultPrevented()){d.preventDefault(); b(this).ajaxSubmit(a)}}).bind("click.form-plugin",function(d){var c=d.target,h=b(c);if(!h.is(":submit,input:image")){c=h.closest(":submit");if(c.length==0)return;c=c[0]}var g=this;g.clk=c;if(c.type=="image")if(d.offsetX!=undefined){g.clk_x=d.offsetX;g.clk_y=d.offsetY}else if(typeof b.fn.offset=="function"){h=h.offset();g.clk_x=d.pageX-h.left;g.clk_y=d.pageY-h.top}else{g.clk_x=d.pageX-c.offsetLeft;g.clk_y=d.pageY-c.offsetTop}setTimeout(function(){g.clk=g.clk_x=g.clk_y=null},100)})};b.fn.ajaxFormUnbind= function(){return this.unbind("submit.form-plugin click.form-plugin")};b.fn.formToArray=function(a){var f=[];if(this.length===0)return f;var d=this[0],c=a?d.getElementsByTagName("*"):d.elements;if(!c)return f;var h,g,k,i,n,B;h=0;for(n=c.length;h<n;h++){g=c[h];if(k=g.name)if(a&&d.clk&&g.type=="image"){if(!g.disabled&&d.clk==g){f.push({name:k,value:b(g).val()});f.push({name:k+".x",value:d.clk_x},{name:k+".y",value:d.clk_y})}}else if((i=b.fieldValue(g,true))&&i.constructor==Array){g=0;for(B=i.length;g< B;g++)f.push({name:k,value:i[g]})}else i!==null&&typeof i!="undefined"&&f.push({name:k,value:i})}if(!a&&d.clk){a=b(d.clk);c=a[0];if((k=c.name)&&!c.disabled&&c.type=="image"){f.push({name:k,value:a.val()});f.push({name:k+".x",value:d.clk_x},{name:k+".y",value:d.clk_y})}}return f};b.fn.formSerialize=function(a){return b.param(this.formToArray(a))};b.fn.fieldSerialize=function(a){var f=[];this.each(function(){var d=this.name;if(d){var c=b.fieldValue(this,a);if(c&&c.constructor==Array)for(var h=0,g=c.length;h< g;h++)f.push({name:d,value:c[h]});else c!==null&&typeof c!="undefined"&&f.push({name:this.name,value:c})}});return b.param(f)};b.fn.fieldValue=function(a){for(var f=[],d=0,c=this.length;d<c;d++){var h=b.fieldValue(this[d],a);h===null||typeof h=="undefined"||h.constructor==Array&&!h.length||(h.constructor==Array?b.merge(f,h):f.push(h))}return f};b.fieldValue=function(a,f){var d=a.name,c=a.type,h=a.tagName.toLowerCase();if(f===undefined)f=true;if(f&&(!d||a.disabled||c=="reset"||c=="button"||(c=="checkbox"|| c=="radio")&&!a.checked||(c=="submit"||c=="image")&&a.form&&a.form.clk!=a||h=="select"&&a.selectedIndex==-1))return null;if(h=="select"){var g=a.selectedIndex;if(g<0)return null;d=[];h=a.options;var k=(c=c=="select-one")?g+1:h.length;for(g=c?g:0;g<k;g++){var i=h[g];if(i.selected){var n=i.value;n||(n=i.attributes&&i.attributes.value&&!i.attributes.value.specified?i.text:i.value);if(c)return n;d.push(n)}}return d}return b(a).val()};b.fn.clearForm=function(){return this.each(function(){b("input,select,textarea", this).clearFields()})};b.fn.clearFields=b.fn.clearInputs=function(){return this.each(function(){var a=this.type,f=this.tagName.toLowerCase();if(a=="text"||a=="password"||f=="textarea")this.value="";else if(a=="checkbox"||a=="radio")this.checked=false;else if(f=="select")this.selectedIndex=-1})};b.fn.resetForm=function(){return this.each(function(){if(typeof this.reset=="function"||typeof this.reset=="object"&&!this.reset.nodeType)this.reset()})};b.fn.enable=function(a){if(a===undefined)a=true;return this.each(function(){this.disabled= !a})};b.fn.selected=function(a){if(a===undefined)a=true;return this.each(function(){var f=this.type;if(f=="checkbox"||f=="radio")this.checked=a;else if(this.tagName.toLowerCase()=="option"){f=b(this).parent("select");a&&f[0]&&f[0].type=="select-one"&&f.find("option").selected(false);this.selected=a}})}})(jQuery);;
