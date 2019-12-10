(function($) {

  Drupal.behaviors.sbWMTools = {
    attach: function() {
      $('#custom-toolbar a.wmtools-button').click(function(e) {
        e.preventDefault();
        if (!$(this).is('.toolbar-menu-clicked')) {
          $('#custom-toolbar a').addClass('toolbar-menu-clicked');
          Drupal.behaviors.sbWMTools.showWebmasterToolsDialog();
        }

      })
    },
    showWebmasterToolsDialog: function() {
      var form = $('<div class="webmaster-tools-dialog"></div>'), tag_old = '';

      $.ajax({
        type: 'GET',
        url: '/sb_wmtools/ajax/form/main',
        success: function(msg) {
          form.append(msg[1].settings.form);
          form.dialog({
            zIndex: 1004,
            resizable: false,
            width: 'auto',
            height: 'auto',
            title: Drupal.t('Google Webmaster Tools'),
            modal: true,
            open: function() {
              Drupal.Builder.disable_scroll();
              Drupal.Builder.addHelpToDialog($('<a />', {'href': '/builder_help/interface/webmaster_tools', 'text': '?'}), this);
              tag_old = $('#edit-tag').val();
            },
            close: function() {
              Drupal.Builder.enable_scroll();
              $(this).dialog('destroy').remove();
              $('#custom-toolbar a').removeClass('toolbar-menu-clicked');
            }
          });

          form.find('#wmtools-save').click(function(e) {
            var tag = $('#edit-tag').val(), content = '', name = '';
            if (!($(this).hasClass('save-clicked'))) {
              $(this).addClass('save-clicked');


              if ((tag.match(/content=['"]([^'"]+)['"]/g) && tag.match(/name=['"]([^'"]+)['"]/g)) || (tag_old != '' && tag == '')) {
                if (tag.match(/content=['"]([^'"]+)['"]/g) && tag.match(/name=['"]([^'"]+)['"]/g)) {
                  content = tag.match(/content=['"]([^'"]+)['"]/i)[1];
                  name = tag.match(/name=['"]([^'"]+)['"]/i)[1];
                }

                $.ajax({
                  type: "POST",
                  url: "/sb_wmtools/ajax/wmtools_save",
                  data: {
                    tag: {
                      name: name,
                      content: content
                    }
                  },
                  success: function(msg) {
                    form.dialog("close");

                    if (tag_old != '' && tag == '') {
                      jAlert(Drupal.t('Meta tag removed successfully.'), Drupal.t('Your changes have been saved'));
                    }
                    else {
                      jAlert(Drupal.t("The meta tag has been added to your home page. Please make sure to Publish your site. After Publishing, go back to Google Webmaster Tools and click the Verify button."), Drupal.t('Your settings has been saved!'));
                      $('#popup_ok').bind('click', function() {
                        window.location.href = Drupal.settings.builder.basePath;
                      });
                    }
                    $('#popup_container').find('#popup_panel input').attr('value', Drupal.t('OK'));
                    $('#popup_container').addClass('googleanalytics-success');
                  }
                });
              }
              else {
                if (tag == '') {
                  jAlert(Drupal.t("Please fill in your meta tag."), Drupal.t('Meta tag not saved'));
                }
                else {
                  jAlert(Drupal.t("This meta tag is incorrect. Please make sure that you've copied and pasted the entire meta tag."), Drupal.t('Meta tag not saved'));
                }
                $(this).removeClass('save-clicked');
                form.find('#edit-tag').addClass('error');
                $('#popup_container').find('#popup_panel input').attr('value', Drupal.t('OK'));
                $('#popup_container').addClass('googleanalytics-success');
              }
            }

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
