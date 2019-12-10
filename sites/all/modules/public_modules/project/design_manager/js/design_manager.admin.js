(function($){

  Drupal.behaviors.admin_design_manager = {
    selectors : {
      'paragraph' : {
        '.aloha-title p' : '.aloha-title p',
        '.aloha-title ol' : '.aloha-title ol',
        '.aloha-title ul' : '.aloha-title ul',
        '.aloha-content p' : '.aloha-content p',
        '.aloha-content ol' : '.aloha-content ol',
        '.aloha-content ul' : '.aloha-content ul',
        '.aloha-table-content p' : '.aloha-table-content p',
        '.aloha-table-content ol' : '.aloha-table-content ol',
        '.aloha-table-content ul' : '.aloha-table-content ul',
        '.contact-informations span' : '.contact-informations span',
        '.custom-block-wrapper p' : '.custom-block-wrapper p',
        '.custom-block-wrapper ol' : '.custom-block-wrapper ol',
        '.custom-block-wrapper ul' : '.custom-block-wrapper ul'
      },
      'heading-1' : { 'h1' : 'h1' },
      'heading-2' : { 'h2' : 'h2' },
      'heading-3' : { 'h3' : 'h3' },
      'heading-4' : { 'h4' : 'h4' },
      'heading-5' : { 'h5' : 'h5' },
      'heading-6' : { 'h6' : 'h6' },
      'link-active' : { 'a' : 'a' },
      'link-visited' : { 'a:visited' : 'a:visited' },
      'link-hover' : { 'a:hover' : 'a:hover' }
    },
    regions : {
      'content' : '#main-wrapper #main',
      'footer' : '#footer-wrapper'
    },
    attach: function(settings, context) {

      if(Drupal.settings.design.is_preview && !$("body").is(".design-preview-mode")) {
        $("body").addClass("design-preview-mode");
      }

      //#THEME
      if(Drupal.settings.design.is_preview
        && typeof Drupal.settings.design.global['preview'] != 'undefined'
        && typeof Drupal.settings.design.global['preview']['#theme'] != 'undefined'
        && Drupal.settings.design.global['preview']['#theme'] != null) {
        stance = 'preview';
      }

      // $('ul.themes-list li#theme-' + theme).addClass('active');

      $(".design-theme-item img").click(function(){
          $.ajax({
              type: "POST",
              url: "/design/ajax/theme",
              data: {
                theme : $(this).parent('.design-theme-item').attr("id")
              },
              success: function(msg){
                  window.location = Drupal.settings.builder.path;
              }
          });
      });


      //#LAYOUT
      $("#design-theme-layout li a").click(function(event){
        event.preventDefault();
        if (!($(this).parent().hasClass('active'))) {

          var //previousActive = $('#design-theme-layout li.active a'),
            layout = $(this).attr('class'),
            that = this;

          // $("body").removeClass("layout1 layout2 layout3 layout4");
          // $("body").addClass(layout);

          // $("#design-theme-layout a." + layout).closest('li').addClass('active');
          // Drupal.behaviors.design_manager.init.switchLayout($(that));
          // Drupal.productFixSize();

          Drupal.Builder.disable_scroll();
          jConfirm(Drupal.t("Are you sure you want to change layout?"), Drupal.t("Change layout"), function(r){

            if(r) {
              // Drupal.Builder.enable_scroll();
              Drupal.Builder.showLoading('change-layout');

              Drupal.contentManager.status.saveStart();
              $.ajax({
                type: "POST",
                url: "/design/ajax/layout",
                data: {
                  page: Drupal.settings.builder.path,
                  layout: layout
                },
                success: function() {
                  Drupal.Builder.hideLoading('change-layout');
                  Drupal.contentManager.status.saveEnd();
                  window.location = Drupal.settings.builder.path;
                }
              });
            }
            else {
              Drupal.Builder.enable_scroll();
              // Drupal.behaviors.design_manager.init.switchLayout(previousActive);
            }
          });
        }
      });

      //#SWATCH
      $("#theme-color-swatches li").click(function(){
        var that = this;
        Drupal.Builder.showLoading('swatch-change');
        Drupal.contentManager.status.saveStart();
        $.ajax({
          type: "POST",
          url: "/design/ajax/swatch",
          data: {
            swatch: $(this).attr("class").split(' ')[0]
          },
          success: function(msg){

            var swatch = $(that).attr("class").split(' ')[0],
              classes = $("body").attr("class").split(" ").map(function(item) {
              return item.indexOf("swatch-") === -1 ? item : ("swatch-" + swatch);
            }),

            oldSwatch = $('#theme-color-swatches').find('li.active').attr('class').split(' ')[0];
            screenshot = $('.theme-screenshot').find('img').attr('src'),
            oldScreen = screenshot,
            newScreen = oldScreen.replace(oldSwatch + '.jpg', swatch + '.jpg');

            $('.theme-screenshot').find('img.screenshot').attr('src', newScreen);
            $("#theme-color-swatches").find("li").removeClass('active');
            $(that).addClass('active');
            $("body").attr("class", classes.join(" "));
            Drupal.Builder.hideLoading('swatch-change');
            Drupal.contentManager.status.saveEnd();
          }
        });
      });

      //#CUSTOMIZE BUTTON
      $(".customize-design-button").click(function(){
        $("#designDialog .html-dialog-content:not('.additional-dialog-content')").animate({
          left: "-230px",
        }, 500, function(){});
        $("#designDialog .html-dialog-content.additional-dialog-content").animate({
          left: "0px",
        }, 500, function(){});

        if ($(this).hasClass('customize-bgs-button')) {
          $('.dialog-tab-backgrounds:not(.active)').click();
          $('.dialog-tab-default-style.active').click();
        }
        if ($(this).hasClass('customize-fonts-button')) {
          $('.dialog-tab-backgrounds.active').click();
          $('.dialog-tab-default-style:not(.active)').click();
        }
      });
      $(".breadcrumb-design-tab").click(function(){
        $("#designDialog .html-dialog-content:not('.additional-dialog-content')").animate({
          left: "0px",
        }, 500, function(){});
        $("#designDialog .html-dialog-content.additional-dialog-content").animate({
          left: "230px",
        }, 500, function(){});
      });

      //#DEFAULT STYLE - FONTS
      $("#theme-default-style-regions li.ds-region").click(function(){
        if (!$(this).hasClass('opened')) {
          $(this).addClass('opened');

          var that = this;
          // element = $(this).find("span").attr("class").replace("ds-", "");
          element = 'paragraph';
          region = $(this).attr('id').replace('ds-', '');
          regionName = $(this).find('.text').text();

          $.ajax({
            type: "POST",
            url: "/design/ajax/get_form_default_style",
            data: {
              element: element,
              region: region
            },
            success: function(msg) {
              wrapper = $('<div class="theme-default-style-form-wrapper"></div>');
              wrapper.append(msg[1].settings.form);

              wrapper.dialog({
                position: ['center','center'],
                resizable: false,
                modal: true,
                title: Drupal.t('Customize Fonts') + ' - ' + '<span class="default-style-region-name">' + regionName + '</span>',
                dialogClass: 'theme-default-style-form',
                zIndex: 1007,
                create: function(event, ui){
                  Drupal.Builder.disable_scroll();

                  var helpLink = $('<a />', {'href': '/builder_help/interface/customize_fonts'}).text('?');
                  Drupal.Builder.addHelpToDialog(helpLink, this);

                  activeSwatch = wrapper.find('input[name=active_swatch]').val();

                  oldValues = $.parseJSON(wrapper.find('input[name=original_fonts]').val());
                  themeDefaults = $.parseJSON(wrapper.find('input[name=theme_defaults]').val());

                  wrapper.find('.ds-font-underline').hide();

                  wrapper.find('.default-style-preview').css('font-family', oldValues[element]['font-family']);
                  wrapper.find('.default-style-preview').css('font-size', oldValues[element]['font-size'] + 'px');
                  wrapper.find('.default-style-preview').css('font-weight', oldValues[element]['bold'] == 'true' ? 'bold' : 'normal');
                  wrapper.find('.default-style-preview').css('font-style', oldValues[element]['italic'] == 'true' ? 'italic' : 'normal');
                  if (element != 'paragraph') {
                    wrapper.find('.default-style-preview').css('text-decoration', oldValues[element]['underline'] == 'true' ? 'underline' : 'none');
                  }
                  wrapper.find('.default-style-preview').css('color', oldValues[element]['font-color'][activeSwatch]);

                  wrapper.find('.default-style-element-list .ds-element').click(function(){
                    wrapper.find('.default-style-element-list .ds-element span').removeClass('active');
                    wrapper.find('.default-style-element-list .ds-element').removeClass('active');
                    $(this).find('span').addClass('active');
                    $(this).addClass('active');
                    element = $(this).find("span").attr("class").replace("ds-", "").replace(' active', '');

                    if(element != 'paragraph') {
                      wrapper.find('.ds-font-underline').show();
                    } else {
                      wrapper.find('.ds-font-underline').hide();
                    }

                    wrapper.find('#edit-font-family').val(oldValues[element]['font-family']);
                    wrapper.find('select').selectbox('detach');
                    wrapper.find('select').selectbox({ effect: "fade", speed: 0 });
                    wrapper.find('.form-item-font-family .sbOptions li').each(function(index, item){
                      $(item).find('a').css('font-family', $(item).find('a').text());
                    });
                    wrapper.find('.form-item-font-family .sbSelector').css('font-family', wrapper.find('.form-item-font-family .sbSelector').text());

                    wrapper.find('#edit-font-size').val(oldValues[element]['font-size']);
                    if (oldValues[element]['bold'] == 'true') {
                      wrapper.find('.ds-font-bold').addClass('active');
                    } else {
                      wrapper.find('.ds-font-bold').removeClass('active');
                    }
                    if (oldValues[element]['italic'] == 'true') {
                      wrapper.find('.ds-font-italic').addClass('active');
                    } else {
                      wrapper.find('.ds-font-italic').removeClass('active');
                    }
                    if (oldValues[element]['underline'] == 'true' && element != 'paragraph') {
                      wrapper.find('.ds-font-underline').addClass('active');
                    } else {
                      wrapper.find('.ds-font-underline').removeClass('active');
                    }
                    wrapper.find('#edit-font-color').val(oldValues[element]['font-color'][activeSwatch]);
                    wrapper.find('#edit-font-color').spectrum("set", oldValues[element]['font-color'][activeSwatch]);

                    wrapper.find('.default-style-preview').css('font-family', oldValues[element]['font-family']);
                    wrapper.find('.default-style-preview').css('font-size', oldValues[element]['font-size'] + 'px');
                    wrapper.find('.default-style-preview').css('font-weight', oldValues[element]['bold'] == 'true' ? 'bold' : 'normal');
                    wrapper.find('.default-style-preview').css('font-style', oldValues[element]['italic'] == 'true' ? 'italic' : 'normal');
                    if (element != 'paragraph') {
                      wrapper.find('.default-style-preview').css('text-decoration', oldValues[element]['underline'] == 'true' ? 'underline' : 'none');
                    }
                    wrapper.find('.default-style-preview').css('color', oldValues[element]['font-color'][activeSwatch]);
                  });

                  wrapper.find('select').selectbox({ effect: "fade", speed: 0 });
                  wrapper.find('.form-item-font-family .sbOptions li').each(function(index, item){
                    $(item).find('a').css('font-family', $(item).find('a').text());
                  });
                  wrapper.find('.form-item-font-family .sbSelector').css('font-family', wrapper.find('.form-item-font-family .sbSelector').text());
                  wrapper.find('.form-item-font-family select').change(function(){
                    fontFamily = $(this).val();
                    $(this).closest('.form-item').find('.sbSelector').css('font-family', fontFamily);
                    wrapper.find('.default-style-preview').css('font-family', fontFamily);
                    $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                      $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-family', fontFamily);
                    });
                    oldValues[element]['font-family'] = fontFamily;
                  });

                  wrapper.find('#edit-font-size').keyup(function(){
                    wrapper.find('.default-style-preview').css('font-size', $(this).val() + 'px');
                    fontSizeValue = $(this).val();
                    $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                      $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-size', fontSizeValue + 'px');
                    });
                    oldValues[element]['font-size'] = $(this).val();
                  });

                  wrapper.find('#edit-font-size').blur(function(){
                    if ($(this).val() > 96) {
                      $(this).val(96);
                    }
                    if ($(this).val() < 9) {
                      $(this).val(9);
                    }
                    wrapper.find('.default-style-preview').css('font-size', $(this).val() + 'px');
                    fontSizeValue = $(this).val();
                    $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                      $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-size', fontSizeValue + 'px');
                    });
                    oldValues[element]['font-size'] = $(this).val();
                  });

                  wrapper.find('.ds-font-bold').click(function(){
                    $(this).toggleClass('active');
                    if ($(this).hasClass('active')) {
                      wrapper.find('.default-style-preview').css('font-weight', 'bold');
                      $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                        $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-weight', 'bold');
                      });
                      oldValues[element]['bold'] = 'true';
                    } else {
                      wrapper.find('.default-style-preview').css('font-weight', 'normal');
                      $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                        $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-weight', 'normal');
                      });
                      oldValues[element]['bold'] = 'false';
                    }
                  });
                  wrapper.find('.ds-font-italic').click(function(){
                    $(this).toggleClass('active');
                    if ($(this).hasClass('active')) {
                      wrapper.find('.default-style-preview').css('font-style', 'italic');
                      $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                        $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-style', 'italic');
                      });
                      oldValues[element]['italic'] = 'true';
                    } else {
                      wrapper.find('.default-style-preview').css('font-style', 'normal');
                      $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                        $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-style', 'normal');
                      });
                      oldValues[element]['italic'] = 'false';
                    }
                  });
                  wrapper.find('.ds-font-underline').click(function(){
                    $(this).toggleClass('active');
                    if ($(this).hasClass('active')) {
                      wrapper.find('.default-style-preview').css('text-decoration', 'underline');
                      $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                        $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('text-decoration', 'underline');
                      });
                      oldValues[element]['underline'] = 'true';
                    } else {
                      wrapper.find('.default-style-preview').css('text-decoration', 'none');
                      $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                        $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('text-decoration', 'none');
                      });
                      oldValues[element]['underline'] = 'false';
                    }
                  });

                  wrapper.find('#edit-font-color').spectrum({
                    cancelText: Drupal.t('Cancel'),
                    chooseText: Drupal.t('Choose'),
                    palette: [
                      ["#ffffff", "#cecece", "#c6c6c6", "#9c9c9c", "#636363", "#313131", "#000000"],
                      ["#ffcece", "#ff6363", "#ff0000", "#ce0000", "#9c0000", "#630000", "#310000"],
                      ["#ffce9c", "#ff9c63", "#ff9c00", "#ff6300", "#ce6300", "#9c3100", "#633100"],
                      ["#ffff9c", "#ffff63", "#ffce63", "#ffce31", "#ce9c31", "#9c6331", "#633131"],
                      ["#ffffce", "#ffff31", "#ffff00", "#ffce00", "#9c9c00", "#636300", "#313100"],
                      ["#9cff9c", "#63ff9c", "#31ff31", "#31ce00", "#009c00", "#006300", "#003100"],
                      ["#9cffff", "#31ffff", "#63cece", "#00cece", "#319c9c", "#316363", "#003131"],
                      ["#ceffff", "#63ffff", "#31ceff", "#3163ff", "#3131ff", "#00009c", "#000063"],
                      ["#ceceff", "#9c9cff", "#6363ce", "#6331ff", "#6300ce", "#31319c", "#31009c"],
                      ["#ffceff", "#ff9cff", "#ce63ce", "#ce31ce", "#9c319c", "#633163", "#310031"]
                    ],
                    showInput: true,
                    showInitial: true,
                    showPalette: true,
                    change: function(color) {
                      wrapper.find('#edit-font-color').val(color.toHexString());
                      wrapper.find('.default-style-preview').css('color', color.toHexString());
                      $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                        $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('color', color.toHexString());
                      });
                      oldValues[element]['font-color'][activeSwatch] = color.toHexString();
                    }
                  });

                  wrapper.find('.ds-reset').click(function(e){
                    jConfirm(Drupal.t('Are you sure you want to restore the default style?'), Drupal.t('Restore default style'), function(r){
                      if(r){
                        $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                          $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-family', themeDefaults[element]['font-family']);
                        });
                        oldValues[element]['font-family'] = themeDefaults[element]['font-family'];

                        $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                          $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-size', themeDefaults[element]['font-size'] + 'px');
                        });
                        oldValues[element]['font-size'] = themeDefaults[element]['font-size'];

                        $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                          $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('color', themeDefaults[element]['font-color'][activeSwatch]);
                        });
                        oldValues[element]['font-color'][activeSwatch] = themeDefaults[element]['font-color'][activeSwatch];

                        if (themeDefaults[element]['bold'] == 'true') {
                          $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                            $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-weight', 'bold');
                          });
                          oldValues[element]['bold'] = 'true';
                        } else {
                          $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                            $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-weight', 'normal');
                          });
                          oldValues[element]['bold'] = 'false';
                        }

                        if (themeDefaults[element]['italic'] == 'true') {
                          $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                            $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-style', 'italic');
                          });
                          oldValues[element]['italic'] = 'true';
                        } else {
                          $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                            $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-style', 'normal');
                          });
                          oldValues[element]['italic'] = 'false';
                        }

                        if (themeDefaults[element]['underline'] == 'true') {
                          $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                            $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('text-decoration', 'underline');
                          });
                          oldValues[element]['underline'] = 'true';
                        } else {
                          $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
                            $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('text-decoration', 'none');
                          });
                          oldValues[element]['underline'] = 'false';
                        }

                        wrapper.find('#edit-font-family').val(oldValues[element]['font-family']);
                        wrapper.find('select').selectbox('detach');
                        wrapper.find('select').selectbox({ effect: "fade", speed: 0 });
                        wrapper.find('.form-item-font-family .sbOptions li').each(function(index, item){
                          $(item).find('a').css('font-family', $(item).find('a').text());
                        });

                        wrapper.find('#edit-font-size').val(oldValues[element]['font-size']);
                        if (oldValues[element]['bold'] == 'true') {
                          wrapper.find('.ds-font-bold').addClass('active');
                        } else {
                          wrapper.find('.ds-font-bold').removeClass('active');
                        }
                        if (oldValues[element]['italic'] == 'true') {
                          wrapper.find('.ds-font-italic').addClass('active');
                        } else {
                          wrapper.find('.ds-font-italic').removeClass('active');
                        }
                        if (oldValues[element]['underline'] == 'true' && element != 'paragraph') {
                          wrapper.find('.ds-font-underline').addClass('active');
                        } else {
                          wrapper.find('.ds-font-underline').removeClass('active');
                        }
                        wrapper.find('#edit-font-color').val(oldValues[element]['font-color'][activeSwatch]);
                        wrapper.find('#edit-font-color').spectrum("set", oldValues[element]['font-color'][activeSwatch]);

                        wrapper.find('.default-style-preview').css('font-family', oldValues[element]['font-family']);
                        wrapper.find('.default-style-preview').css('font-size', oldValues[element]['font-size'] + 'px');
                        wrapper.find('.default-style-preview').css('font-weight', oldValues[element]['bold'] == 'true' ? 'bold' : 'normal');
                        wrapper.find('.default-style-preview').css('font-style', oldValues[element]['italic'] == 'true' ? 'italic' : 'normal');
                        if (element != 'paragraph') {
                          wrapper.find('.default-style-preview').css('text-decoration', oldValues[element]['underline'] == 'true' ? 'underline' : 'none');
                        }
                        wrapper.find('.default-style-preview').css('color', oldValues[element]['font-color'][activeSwatch]);


                      }
                    });
                  });

                  wrapper.find('#edit-submit').click(function(e){
                    e.stopPropagation();
                    e.preventDefault();

                    Drupal.contentManager.status.saveStart();

                    $.ajax({
                      type: "POST",
                      url: "/design/ajax/save_default_style",
                      data: {
                        region: region,
                        settings: oldValues
                      },
                      success: function(msg) {
                        Drupal.contentManager.status.saveEnd();
                        Drupal.Builder.enable_scroll();

                        $('link').each(function(){
                          linkAttr = $(this).attr('href');
                          if (linkAttr.indexOf('?') > -1) {
                              linkAttr = linkAttr.substring(0, linkAttr.indexOf('?'));
                            }
                          $(this).attr('href', linkAttr + '?v=' + $.now());
                        });

                        Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'paragraph');
                        Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-1');
                        Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-2');
                        Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-3');
                        Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-4');
                        Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-5');
                        Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-6');
                        Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'link-active');
                        Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'link-visited');
                        Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'link-hover');
                      }
                    });

                    $('#theme-default-style-regions li.ds-region').removeClass('opened');
                    $(this).dialog('destroy');
                    $('.theme-default-style-form-wrapper').remove();
                  });

                  $('.theme-default-style-form .dialog-cancel-button, .theme-default-style-form .ui-dialog-titlebar-close').click(function(e){
                    $('#theme-default-style-regions li.ds-region').removeClass('opened');
                    wrapper.dialog('destroy').remove();
                    Drupal.Builder.enable_scroll();
                    Drupal.behaviors.admin_design_manager.removeInlineStyles(region, element);
                    return false;
                  });
                },
                close: function(event, ui){
                  $('#theme-default-style-regions li.ds-region').removeClass('opened');
                  $(this).dialog('destroy');
                  $('.theme-default-style-form-wrapper').remove();
                  Drupal.Builder.enable_scroll();
                  Drupal.behaviors.admin_design_manager.removeInlineStyles(region, element);
                }
              });
            }
          });
        }
      });

      $("#theme-default-style-regions li.ds-reset-all").click(function(){
        jConfirm(Drupal.t('Are you sure you want to restore the default style?'), Drupal.t('Restore default style'), function(r){
          if(r){
            Drupal.contentManager.status.saveStart();

            $.ajax({
              type: "POST",
              url: "/design/ajax/reset_default_style",
              data: {
                element: 'all'
              },
              success: function(msg) {
                Drupal.contentManager.status.saveEnd();

                // Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'paragraph');
                // Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-1');
                // Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-2');
                // Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-3');
                // Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-4');
                // Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-5');
                // Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'heading-6');
                // Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'link-active');
                // Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'link-visited');
                // Drupal.behaviors.admin_design_manager.removeInlineStyles(region, 'link-hover');

                $('link').each(function(){
                  linkAttr = $(this).attr('href');
                  if (linkAttr.indexOf('?') > -1) {
                      linkAttr = linkAttr.substring(0, linkAttr.indexOf('?'));
                    }
                  $(this).attr('href', linkAttr + '?v=' + $.now());
                });
              }
            });
          }
        });
      });

      //#DEFAULT STYLE - BACKGROUNDS
      var selector;
      $('#theme-backgrounds-regions .bg-region').live('mouseenter', function(){
        selector = $(this).attr('selector');
        $(selector).append($('<div/>').addClass('cover-div'));
        $(selector).css('outline', '2px solid white');
        // $(selector).css('opacity', '0.2');
        if ($(selector).css('position') == 'static') {
          $(selector).css('position', 'relative');
        }
      }).live('mouseleave', function(){
        selector = $(this).attr('selector');
        $(selector).find('.cover-div').remove();
        $(selector).css('outline', 'none');
        // $(selector).css('opacity', '');
        $(selector).css('position', '');
      });
      $("#theme-backgrounds-regions .bg-region").click(function(){
        if (!$(this).hasClass('opened')) {
          $(this).addClass('opened');

          region = $("#theme-backgrounds-regions li.bg-region.opened").attr('id').replace('bg-', '');
          regionSelector = $("#theme-backgrounds-regions li.bg-region.opened").attr('selector');
          dialogTitle = $(this).attr('dialogtitle');

          $.ajax({
            type: "POST",
            url: "/design/ajax/get_form_backgrounds",
            data: {
              region: region
            },
            success: function(msg) {
              wrapper = $('<div class="theme-backgrounds-form-wrapper"></div>');
              wrapper.append(msg[1].settings.form);

              wrapper.dialog({
                position: ['center','center'],
                resizable: false,
                modal: true,
                title: dialogTitle,
                dialogClass: 'theme-backgrounds-form',
                zIndex: 1007,
                create: function(event, ui){
                  Drupal.Builder.disable_scroll();

                  var helpLink = $('<a />', {'href': '/builder_help/interface/customize_backgrounds'}).text('?');
                  Drupal.Builder.addHelpToDialog(helpLink, this);

                  if (wrapper.find('.position-wrapper span.active').length == 0) {
                    wrapper.find('.position-wrapper span#bg-pos-top-left').addClass('active');
                  }

                  $('select[name=scaling]').selectbox({ effect: "fade", speed: 0 });

                  bgValues = {
                    img : wrapper.find('input[name=path]').val(),
                    imgScaling : wrapper.find('select[name=scaling]').val(),
                    imgFixed : wrapper.find('input[name=fixed]:checked').length > 0 ? 1 : 0,
                    bgColor : wrapper.find('#edit-color').val(),
                    imgPosition : wrapper.find('.position-wrapper .active').attr('id').replace('bg-pos-', '').replace('-', ' ')
                  }

                  patternBg = $('#bg-image').attr('src').match(/\/pattern\//gi);
                  if (patternBg) {
                    wrapper.find('.sbOptions a').closest('li').hide();
                    wrapper.find('.sbOptions a[href="#tile"]').closest('li').show();
                  } else {
                    wrapper.find('.sbOptions a').closest('li').show();
                  }

                  if (wrapper.find('input[name=content_padding]').length > 0) {
                    bgValues.imgContentPadding = wrapper.find('input[name=content_padding]:checked').length > 0 ? 1 : 0;
                  } else {
                    bgValues.imgContentPadding = 'nopadding';
                  }

                  upload = Drupal.fileUploadManager.init( {
                    element : wrapper.find('.ajax-bg-image-upload')[0],
                    // action : '/html_elements/ajax/file_upload/-1',
                    sizeLimit : 5242880,
                    allowedExtensions: ['jpg','jpeg','png','gif'],
                    multiple : false,
                    template : Drupal.settings.html_elements.templates['image_upload'],
                    params : {
                      folder : 'uploads'
                    },

                    onSubmit : function(id, fileName) {
                      Drupal.fileUploadManager.fileProgress.show(id, fileName);
                    },

                    onComplete : function(id, fileName, responseJSON) {
                      Drupal.fileUploadManager.fileProgress.hide(id, fileName);
                      if(responseJSON.success){
                        src = Drupal.settings.builder.publicUploadUrl + '/' + responseJSON.filename;
                        wrapper.find('#bg-image').attr('src', src.replace('uploads', 'styles/gallery_thumbnail/public/uploads'));
                        $('input[name=path]').val(src);

                        wrapper.find('.ajax-bg-image-upload').hide();
                        wrapper.find('#bg-uploaded-image').show();

                        bgValues.img = src;
                        Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);
                      }
                    },

                    onProgress : function(id, fileName, loaded, total) {
                      Drupal.fileUploadManager.fileProgress.progress(id, fileName, loaded, total);
                    }
                  });

                  wrapper.find('#bg-uploaded-image-change, .ajax-bg-image-upload').click(function(e){
                    e.preventDefault();

                    Drupal.uploadedFilesDialog({
                      type : 'image',
                      target : $('.ui-dialog'),
                      cls : 'uploaded-images-dialog customize-backgrounds-uploaded-images-dialog',
                      fileTypes : [
                        fileType.PNG,
                        fileType.JPG,
                        fileType.JPEG,
                        fileType.GIF
                      ],
                      multiple : false,
                      folder : 'uploads',
                      stock: true,
                      pattern: true,

                      createActions : function(dialog){
                      },

                      uploadCompleteActions : function(dialog, newFile, id, fileName, response){
                        this.loadActions(dialog);
                      },

                      loadActions : function(dialog){
                        $('.customize-backgrounds-uploaded-images-dialog .stock-images .add-stock-image')
                          .unbind('click')
                          .die('click')
                          .live('click', function() {
                          var imageSrc = $(this).closest('.stock-images').find('.view-image').attr('href'),
                            imageTitle = $(this).closest('.stock-images').find('.stock-image-title').text();
                          instance = this;

                          // Save image local
                          $.ajax({
                            type : 'POST',
                            url : '/stock_images_client/save_image_local',
                            data : {
                              url: imageSrc,
                              title: imageTitle
                            },
                            success : function(msg){
                              if(msg[1].settings.success == 1) {
                                src = $(instance).closest('.stock-images').find('.image').css('background-image').replace('url(', '').replace(')', '').replace(/"/g, '').replace(/'/g, '');
                                Drupal.uploadedFile = Drupal.getLocalFilePath(src);
                                Drupal.uploadedFileType = 'image';
                                wrapper.find('#bg-image').attr('src', src);
                                $('input[name=path]').val(src.replace('styles/gallery_thumbnail/storage/', 'styles/sb_xlarge/storage/'));

                                patternBg = src.match(/\/pattern\//gi);
                                if (patternBg) {
                                  wrapper.find('#edit-scaling').val('tile');
                                  wrapper.find('select').selectbox('detach');
                                  wrapper.find('select').selectbox({ effect: "fade", speed: 0 });
                                  wrapper.find('.sbOptions a').closest('li').hide();
                                  wrapper.find('.sbOptions a[href="#tile"]').closest('li').show();
                                  bgValues.imgScaling = 'tile';
                                } else {
                                  wrapper.find('.sbOptions a').closest('li').show();
                                }

                                bgValues.img = src.replace('styles/gallery_thumbnail/storage/', 'styles/sb_xlarge/storage/');

                                wrapper.find('.ajax-bg-image-upload').hide();
                                wrapper.find('#bg-uploaded-image').show();
                                Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);
                                dialog.dialog('close');
                              }
                              else if(msg[1].settings.success == -1) {
                                alert(Drupal.t('Already added'));
                              }
                              else if(msg[1].settings.success == -2) {
                                alert(Drupal.t('error'));
                              }
                            }
                          });
                        });

                        $('.customize-backgrounds-uploaded-images-dialog .add-uploaded-image').die('click').live('click', function(){
                          src = $(this).closest('.uploaded-image').find('.image').css('background-image').replace('url(', '').replace(')', '').replace(/"/g, '').replace(/'/g, '');
                          if (src.indexOf('?') > 0) {
                            src = src.substring(0, src.indexOf('?'));
                          }
                          wrapper.find('#bg-image').attr('src', src);
                          $('input[name=path]').val(src.replace('styles/gallery_thumbnail/public/', 'styles/sb_xlarge/public/').replace('styles/gallery_thumbnail/storage/', 'styles/sb_xlarge/storage/'));

                          wrapper.find('.ajax-bg-image-upload').hide();
                          wrapper.find('#bg-uploaded-image').show();

                          patternBg = src.match(/\/pattern\//gi);
                          if (patternBg) {
                            wrapper.find('#edit-scaling').val('tile');
                            wrapper.find('select').selectbox('detach');
                            wrapper.find('select').selectbox({ effect: "fade", speed: 0 });
                            wrapper.find('.sbOptions a').closest('li').hide();
                            wrapper.find('.sbOptions a[href="#tile"]').closest('li').show();
                            bgValues.imgScaling = 'tile';
                          } else {
                            wrapper.find('.sbOptions a').closest('li').show();
                          }

                          bgValues.img = src.replace('styles/gallery_thumbnail/public/', 'styles/sb_xlarge/public/').replace('styles/gallery_thumbnail/storage/', 'styles/sb_xlarge/storage/');
                          Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);

                          dialog.dialog('close');
                        });

                        $('.delete-uploaded-image').die('click').live('click', function(){
                          var item = $(this);
                          var image = $(item).closest('.uploaded-image')
                          var src = image.find('.image').css('background-image').replace('url(', '').replace(')', '').replace(/"/g, '').replace(/'/g, '');
                          var used = false;
                          var deleteConfirmText = Drupal.t('Are you sure you want to delete this picture?');

                          $.ajax({
                            type : 'POST',
                            url : '/image_collection/ajax/image_is_used',
                            async : false,
                            data : {
                              src : src
                            },
                            success : function(msg){
                              if(msg[1].settings.success && msg[1].settings.used) {
                                deleteConfirmText = Drupal.t('This picture is used by one of your widgets. Do you want to remove this picture from all widgets?');
                              }
                            },
                          });

                          jConfirm(deleteConfirmText, Drupal.t('Picture Remove Confirmation'), function(r){
                            if(r){
                              image = item.closest('.uploaded-image');
                              src = image.find('.image').css('background-image').replace('url(', '').replace(')', '').replace(/"/g, '').replace(/'/g, '');
                              if (src.indexOf('?') > -1) {
                                src = src.substring(0, src.indexOf('?'));
                              }
                              realSrc = src;

                              deletedSrc = src.substr(src.lastIndexOf('/') + 1);

                              $.ajax({
                                type : 'POST',
                                url : '/image_collection/ajax/delete',
                                data : {
                                  src : Drupal.getLocalFilePath(src),
                                  path : Drupal.settings.builder.path
                                  },
                                success : function(msg){
                                  if(msg[1].settings.success){
                                    $.each(msg[1].settings.updated, function(index, value){
                                      Drupal.Builder.ajaxHandlers.getBlock(value.module,value.delta);
                                    });
                                    image.remove();

                                    $('.uploaded-image-content .uploaded-image.last').removeClass('last');
                                    $('.uploaded-image-content .uploaded-image').each(function(index) {
                                      if(index > 0 && (index + 1) % 6 == 0) {
                                        $(this).addClass('last');
                                      }
                                    });

                                    $('#theme-backgrounds-regions li').each(function(key, value){
                                      selector = $(this).attr('selector');
                                      if ($(selector).css('background-image').indexOf(deletedSrc) > -1) {
                                        $(selector).css('background-image', 'none');
                                      }
                                    });

                                    inputValue = $('input[name=path]').val();
                                    inputValue = inputValue.substr(inputValue.lastIndexOf('/') + 1);
                                    if (inputValue.indexOf('?') > -1) {
                                      inputValue = inputValue.substring(0, inputValue.indexOf('?'));
                                    }
                                    if (inputValue == deletedSrc) {
                                      $('input[name=path]').val('');

                                      wrapper.find('.sbOptions a').closest('li').show();

                                      wrapper.find('.ajax-bg-image-upload').show();
                                      wrapper.find('#bg-uploaded-image').hide();

                                      bgValues.img = 'none';
                                      Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);
                                    }

                                    $('link').each(function(){
                                      linkAttr = $(this).attr('href');
                                      if (linkAttr.indexOf('?') > -1) {
                                          linkAttr = linkAttr.substring(0, linkAttr.indexOf('?'));
                                        }
                                      $(this).attr('href', linkAttr + '?v=' + $.now());
                                    });

                                    if(msg[1].settings.banner_changed){
                                      Drupal.settings.design.global = {};
                                      Drupal.settings.design.global = $.extend(true, {}, msg[1].settings.banner_changed.global);
                                      Drupal.settings.design.page = {};
                                      Drupal.settings.design.page = $.extend(true, {}, msg[1].settings.banner_changed.page);

                                      Drupal.behaviors.dynamic_banner.attach();
                                      if(typeof Drupal.behaviors.bannerSlideshow != 'undefined'){
                                        Drupal.behaviors.bannerSlideshow.reset();
                                        Drupal.behaviors.bannerSlideshow.attach();
                                      }
                                    }
                                  }

                                }
                              });
                            }
                          });
                        });

                        $('.uploaded-image-content .uploaded-image').each(function(index) {
                          $(this).find('a.view-image').colorbox({
                            maxHeight: $(window).height() - 50
                          });
                          if(index > 0 && (index + 1) % 6 == 0) {
                            $(this).addClass('last');
                          }
                        });

                        $('.uploaded-files-ok').unbind('click').click(function() {
                          dialog.dialog('close');
                        });
                      },

                      closeActions :function(event, ui){
                      }
                    });
                  });

                  wrapper.find('#bg-uploaded-image-remove').click(function(e){
                    $('input[name=path]').val('');

                    wrapper.find('.sbOptions a').closest('li').show();

                    wrapper.find('.ajax-bg-image-upload').show();
                    wrapper.find('#bg-uploaded-image').hide();

                    bgValues.img = 'none';
                    Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);
                  });

                  if ($('input[name=path]').val() != '') {
                    wrapper.find('.ajax-bg-image-upload').hide();
                    wrapper.find('#bg-uploaded-image').show();
                  }

                  wrapper.find('#edit-color').spectrum({
                    cancelText: Drupal.t('Cancel'),
                    chooseText: Drupal.t('Choose'),
                    palette: [
                      ["#ffffff", "#cecece", "#c6c6c6", "#9c9c9c", "#636363", "#313131", "#000000"],
                      ["#ffcece", "#ff6363", "#ff0000", "#ce0000", "#9c0000", "#630000", "#310000"],
                      ["#ffce9c", "#ff9c63", "#ff9c00", "#ff6300", "#ce6300", "#9c3100", "#633100"],
                      ["#ffff9c", "#ffff63", "#ffce63", "#ffce31", "#ce9c31", "#9c6331", "#633131"],
                      ["#ffffce", "#ffff31", "#ffff00", "#ffce00", "#9c9c00", "#636300", "#313100"],
                      ["#9cff9c", "#63ff9c", "#31ff31", "#31ce00", "#009c00", "#006300", "#003100"],
                      ["#9cffff", "#31ffff", "#63cece", "#00cece", "#319c9c", "#316363", "#003131"],
                      ["#ceffff", "#63ffff", "#31ceff", "#3163ff", "#3131ff", "#00009c", "#000063"],
                      ["#ceceff", "#9c9cff", "#6363ce", "#6331ff", "#6300ce", "#31319c", "#31009c"],
                      ["#ffceff", "#ff9cff", "#ce63ce", "#ce31ce", "#9c319c", "#633163", "#310031"]
                    ],
                    showAlpha: true,
                    showInput: true,
                    showInitial: true,
                    showPalette: true,
                    change: function(color) {
                      wrapper.find('#edit-color').val(color.toRgbString());
                      bgValues.bgColor = color.toRgbString();
                      Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);
                    }
                  });

                  wrapper.find('input[name=content_padding]').change(function(){
                    if ($(this).is(':checked')) {
                      bgValues.imgContentPadding = 1;
                      Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);
                    } else {
                      bgValues.imgContentPadding = 0;
                      Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);
                    }
                  });

                  wrapper.find('input[name=fixed]').change(function(){
                    if ($(this).is(':checked')) {
                      bgValues.imgFixed = 'fixed';
                      Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);
                    } else {
                      bgValues.imgFixed = 'scroll';
                      Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);
                    }
                  });

                  wrapper.find('select[name=scaling]').change(function(){
                    bgValues.imgScaling = $(this).val();
                    Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);
                  });

                  wrapper.find('.position-wrapper span').click(function(){
                    wrapper.find('.position-wrapper span').removeClass('active');
                    $(this).addClass('active');
                    bgValues.imgPosition = $(this).attr('id').replace('bg-pos-', '').replace('-', ' ');
                    Drupal.behaviors.admin_design_manager.backgroundPreview(regionSelector, bgValues);
                  });

                  wrapper.find('.bg-reset').click(function(e){
                    jConfirm(Drupal.t('Are you sure you want to restore the default style?'), Drupal.t('Restore default style'), function(r){
                      if(r){
                        Drupal.contentManager.status.saveStart();

                        $.ajax({
                          type: "POST",
                          url: "/design/ajax/reset_default_style",
                          data: {
                            element: 'background',
                            region: region
                          },
                          success: function(msg) {
                            Drupal.contentManager.status.saveEnd();

                            $('link').each(function(){
                              linkAttr = $(this).attr('href');
                              if (linkAttr.indexOf('?') > -1) {
                                  linkAttr = linkAttr.substring(0, linkAttr.indexOf('?'));
                                }
                              $(this).attr('href', linkAttr + '?v=' + $.now());
                            });
                          }
                        });

                        $('#theme-backgrounds-regions li.bg-region').removeClass('opened');
                        $(this).dialog('destroy');
                        Drupal.Builder.enable_scroll();
                        $('.theme-backgrounds-form-wrapper').remove();
                      }
                    });

                  });

                  wrapper.find('#edit-submit').click(function(e){
                    e.stopPropagation();
                    e.preventDefault();

                    Drupal.contentManager.status.saveStart();

                    settings = {
                      img : wrapper.find('input[name=path]').val(),
                      imgScaling : wrapper.find('select[name=scaling]').val(),
                      imgContentPadding : wrapper.find('input[name=content_padding]:checked').length > 0 ? 1 : 0,
                      imgFixed : wrapper.find('input[name=fixed]:checked').length > 0 ? 1 : 0,
                      bgColor : wrapper.find('#edit-color').val(),
                      imgPosition : wrapper.find('.position-wrapper .active').attr('id').replace('bg-pos-', '').replace('-', ' ')
                    }
                    $.ajax({
                      type: "POST",
                      url: "/design/ajax/save_backgrounds",
                      data: {
                        region: region.replace('bg-', ''),
                        settings: settings
                      },
                      success: function(msg) {
                        Drupal.contentManager.status.saveEnd();
                        Drupal.Builder.enable_scroll();

                        $('link').each(function(){
                          linkAttr = $(this).attr('href');
                          if (linkAttr.indexOf('?') > -1) {
                              linkAttr = linkAttr.substring(0, linkAttr.indexOf('?'));
                            }
                          $(this).attr('href', linkAttr + '?v=' + $.now());
                        });

                        Drupal.behaviors.admin_design_manager.removeInlineStyles(regionSelector, false, true);
                      }
                    });

                    $('#theme-backgrounds-regions li.bg-region').removeClass('opened');
                    $(this).dialog('destroy');
                    $('.theme-backgrounds-form-wrapper').remove();
                  });

                  $('.theme-backgrounds-form .dialog-cancel-button, .theme-backgrounds-form .ui-dialog-titlebar-close').click(function(e){
                    $('#theme-backgrounds-regions li.bg-region').removeClass('opened');
                    wrapper.dialog('destroy').remove();
                    Drupal.Builder.enable_scroll();
                    Drupal.behaviors.admin_design_manager.removeInlineStyles(regionSelector, false, true);
                    return false;
                  });
                },
                close: function(event, ui){
                  $('#theme-backgrounds-regions li.bg-region').removeClass('opened');
                  $(this).dialog('destroy');
                  $('.theme-backgrounds-form-wrapper').remove();
                  Drupal.Builder.enable_scroll();
                  Drupal.behaviors.admin_design_manager.removeInlineStyles(regionSelector, false, true);
                }
              });
            }
          });
        }
      });
      $("#theme-backgrounds li.bg-reset-all").click(function(){
        jConfirm(Drupal.t('Are you sure you want to restore the default background?'), Drupal.t('Restore default background'), function(r){
          if(r){
            Drupal.contentManager.status.saveStart();

            $.ajax({
              type: "POST",
              url: "/design/ajax/reset_default_style",
              data: {
                element: 'background-all'
              },
              success: function(msg) {
                Drupal.contentManager.status.saveEnd();

                $('link').each(function(){
                  linkAttr = $(this).attr('href');
                  if (linkAttr.indexOf('?') > -1) {
                      linkAttr = linkAttr.substring(0, linkAttr.indexOf('?'));
                    }
                  $(this).attr('href', linkAttr + '?v=' + $.now());
                });
              }
            });
          }
        });
      });
    },
    removeInlineStyles: function(region, element, background) {
      if (element != false) {
        $.each(Drupal.behaviors.admin_design_manager.selectors[element], function(index, value){
          $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-family', '');
          $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-size', '');
          $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('color', '');
          $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('text-decoration', '');
          $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-style', '');
          $(Drupal.behaviors.admin_design_manager.regions[region] + ' ' + value).css('font-weight', '');
        });
      }

      if (background == true) {
        $(region).css('background-image', '');
        $(region).css('background-size', '');
        $(region).css('background-repeat', '');
        $(region).css('background-attachment', '');
        $(region).css('background-color', '');
        $(region).css('background-position', '');

        $(region).css('padding', '');
      }
    },
    backgroundPreview: function(regionSelector, settings) {
      $(regionSelector).css('background-image', 'url("' + settings.img + '")');

      switch(settings.imgContentPadding) {
        case 1:
          $(regionSelector).css('padding', 25);
          $(regionSelector).css('box-sizing', 'border-box');
          break;
        case 0:
          $(regionSelector).css('padding', 0);
          break;
      }

      $(regionSelector).css('background-attachment', settings.imgFixed);
      $(regionSelector).css('background-color', settings.bgColor);
      $(regionSelector).css('background-position', settings.imgPosition);

      switch(settings.imgScaling) {
        case 'full':
          $(regionSelector).css('background-size', 'cover');
          $(regionSelector).css('background-repeat', 'no-repeat');
          break;
        case 'fit':
          $(regionSelector).css('background-size', 'contain');
          $(regionSelector).css('background-repeat', 'no-repeat');
          break;
        case 'tile':
          $(regionSelector).css('background-size', 'initial');
          $(regionSelector).css('background-repeat', 'repeat');
          break;
        case 'vertically':
          $(regionSelector).css('background-size', 'initial');
          $(regionSelector).css('background-repeat', 'repeat-y');
          break;
        case 'horizontally':
          $(regionSelector).css('background-size', 'initial');
          $(regionSelector).css('background-repeat', 'repeat-x');
          break;
        case 'normal':
          $(regionSelector).css('background-size', 'auto');
          $(regionSelector).css('background-repeat', 'no-repeat');
          break;
      }
    }
  }
}(jQuery));

