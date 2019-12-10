(function($) {

  Drupal.behaviors.sbGoogleAnalytics = {
    attach: function() {
      $('#custom-toolbar a.google-analytics-button').click(function(e) {
        e.preventDefault();
        if (!$(this).is('.toolbar-menu-clicked')) {
          $('#custom-toolbar a').addClass('toolbar-menu-clicked');
          Drupal.behaviors.sbGoogleAnalytics.showGoogleAnalyticsDialog();
        }

      })
    },
    showGoogleAnalyticsDialog: function() {

      var form = $('<div class="google-analytics-dialog"></div>'), wpid_old = '';
//      var pagesToTrack = '';

      $.ajax({
        type: 'GET',
        url: '/sb_google_analytics/ajax/form/ga_main',
        success: function(msg) {
          form.append(msg[1].settings.form);
          form.dialog({
            zIndex: 1004,
            resizable: false,
            width: 'auto',
            height: 'auto',
            title: Drupal.t('Google Analytics'),
            modal: true,
            open: function() {
              Drupal.Builder.disable_scroll();

              var helpLink = $('<a />', {'href': '/builder_help/interface/google_analytics'}).text('?');
              Drupal.Builder.addHelpToDialog(helpLink, this);

              wpid_old = $('#edit-wpid').val();
            },
            close: function() {
              Drupal.Builder.enable_scroll();
              $(this).dialog('destroy').remove();
              $('#custom-toolbar a').removeClass('toolbar-menu-clicked');
            }
          });

          // form.find('.form-item-ckeckall input').click(function(){

          // 	that = this;
          // 	form.find('.track-link').each(function(){
          // 		$(this).attr('checked', $(that).attr('checked'));
          // 	});

          // });

          // form.find('.track-link').click(function(){
          // 	if ($('.track-link:unchecked').length == 0) {
          // 		form.find('.form-item-ckeckall input').attr('checked', true);
          // 	}
          // });

          form.find('#google-analytics-save').click(function(e) {
            if (!($(this).hasClass('save-clicked'))) {
              $(this).addClass('save-clicked');

              wpid = $('#edit-wpid').val();

              // nrLinks = $('.track-link:checked').length;
              // form.find('.track-link:checked').each(function(index){

              // 	pagesToTrack += index != nrLinks ? $(this).attr('link-path')+"\r\n" : $(this).attr('link-path');

              // });

              $.ajax({
                type: "POST",
                url: "/sb_google_analytics/ajax/google_analytics_save",
                data: {
                  wpid: wpid
                          // pagesToTrack: pagesToTrack,
                },
                success: function(msg) {
                  if (msg[1].settings.ga_errors == null) {
                    if (wpid_old == '' && wpid == '') {
                      form.find('#edit-wpid').addClass('error');
                      form.find('#google-analytics-save').removeClass('save-clicked');
                      jAlert(Drupal.t('Please fill in your tracking ID.'), Drupal.t('Tracking ID not saved'));
                    }
                    else if (wpid_old != '' && wpid == '') {
                      form.dialog("close");
                      jAlert(Drupal.t('Tracking ID removed successfully.'), Drupal.t('Your changes have been saved'));
                    }
                    else {
                      form.dialog("close");
                      jAlert(Drupal.t('Google is now tracking your website. Please note that there is a 24 to 48 hour delay between when you add the code to your website and when stats become available in Google Analytics.'), Drupal.t('Your settings has been saved!'));
                    }
                  }
                  else {
                    form.find('#google-analytics-save').removeClass('save-clicked');
                    form.find('#edit-wpid').addClass('error');
                    jAlert(msg[1].settings.error_text, Drupal.t('Tracking ID not saved'));
                  }
                  $('#popup_container').addClass('googleanalytics-success');
                }
              });
            }
            e.preventDefault();
            return false;
          });

          Drupal.dialogHeightFix();
          form.find('#cancel-google-analytics').click(function(e) {
            form.dialog("close");
            e.preventDefault();
            return false;
          });
          $('#custom-toolbar a').removeClass('toolbar-menu-clicked');

        }
      });
    }
  }
})(jQuery)
