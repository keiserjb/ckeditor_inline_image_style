/**
 * @file Plugin to support responsive images with the Picture module and
 * the CKEditor module.
 */
( function(){
  CKEDITOR.plugins.add('ckeditor_inline_image_style_ckeditor',
  {
      onLoad: function() {
        CKEDITOR.addCss(Drupal.settings.ckeditor_inline_image_style.editorCSS);
      },

      init : function(editor)
      {

        // Used later to ensure the required features have been enabled in the
        // Advanced Content Filter.
        features = {};
        if (Drupal.settings.ckeditor_inline_image_style.required) {
          features = {
            'imageSize': { 'requiredContent': 'img[data-image-style]' }
          };
        }

        // If we have image2, enable the more advanced functionality
        if (CKEDITOR.config.plugins.indexOf('image2') != -1) {
          // CKEditor's normal alignment will be removed below, we need to
          // provide replacement classes based on Picture data
          CKEDITOR.addCss('span[data-cke-display-name="image"] { display: block; }');
        }

        // Else, we need check if regular image is installed
        else if (CKEDITOR.config.plugins.indexOf('image') != -1) {
          CKEDITOR.config.disableObjectResizing = true;
        }

        // When opening a dialog, a 'definition' is created for it. For
        // each editor instance the 'dialogDefinition' event is then
        // fired. We can use this event to make customizations to the
        // definition of existing dialogs.
        CKEDITOR.on('dialogDefinition', function(event) {
          // Take the dialog name.
          if ((event.editor != editor)) return;
          var dialogName = event.data.name;
          // The definition holds the structured data that is used to eventually
          // build the dialog and we can use it to customize just about anything.
          // In Drupal terms, it's sort of like CKEditor's version of a Forms API and
          // what we're doing here is a bit like a hook_form_alter.
          var dialogDefinition = event.data.definition;


          if (dialogName == 'image2') {
            var infoTab = dialogDefinition.getContents('info');
            // UpdatePreview is copied from ckeditor image plugin.
            var updatePreview = function(dialog) {
              // Don't load before onShow.
              if (!dialog.originalElement || !dialog.preview) {
                return 1;
              }

              // Read attributes and update imagePreview.
              dialog.commitContent(PREVIEW, dialog.preview);
              return 0;
            };
            // Add the select list for choosing the image width.
            infoTab.add({
              type: 'select',
              id: 'imageSize',
              label: Drupal.settings.ckeditor_inline_image_style.label,
              items: Drupal.settings.ckeditor_inline_image_style.mappings,
              'default': Drupal.settings.ckeditor_inline_image_style.ckeditorDefaultMapping,
              requiredContent: features.imageSize.requiredContent,
              setup: function(widget) {
                mapping = widget.parts.image.getAttribute('data-image-style');
                this.setValue(mapping ? mapping : Drupal.settings.ckeditor_inline_image_style.ckeditorDefaultMapping);
              },
              // Create a custom data-image-style attribute.
              commit: function(widget) {
                widget.parts.image.setAttribute('data-image-style', this.getValue());
              },
              validate: function() {
                if (this.getValue() == 'not_set') {
                  var message = 'Please make a selection from ' + Drupal.settings.ckeditor_inline_image_style.label;
                  alert(message);
                  return false;
                } else {
                  return true;
                }
              }
            }
            );
          }
          // Resources for the following:
          // Download: https://github.com/ckeditor/ckeditor-dev
          // See /plugins/image/dialogs/image.js
          // and refer to http://docs.ckeditor.com/#!/api/CKEDITOR.dialog.definition
          // Visit: file:///[path_to_ckeditor-dev]/plugins/devtools/samples/devtools.html
          // for an excellent way to find machine names for dialog elements.
          else if (dialogName == 'image') {
            dialogDefinition.removeContents('Link');
            var infoTab = dialogDefinition.getContents('info');
            var altText = infoTab.get('txtAlt');
            var IMAGE = 1,
                LINK = 2,
                PREVIEW = 4,
                CLEANUP = 8;
            // UpdatePreview is copied from ckeditor image plugin.
            var updatePreview = function(dialog) {
              // Don't load before onShow.
              if (!dialog.originalElement || !dialog.preview) {
                return 1;
              }

              // Read attributes and update imagePreview.
              dialog.commitContent(PREVIEW, dialog.preview);
              return 0;
            };
            // Add the select list for choosing the image width.
            infoTab.add({
              type: 'select',
              id: 'imageSize',
              label: Drupal.settings.ckeditor_inline_image_style.label,
              items: Drupal.settings.ckeditor_inline_image_style.mappings,
              'default': Drupal.settings.ckeditor_inline_image_style.ckeditorDefaultMapping,
              onChange: function() {
                var dialog = this.getDialog();
                var element = dialog.originalElement;
                element.setAttribute('data-image-style', this.getValue());
                updatePreview(this.getDialog());
              },
              setup: function(type, element) {
                if (type == IMAGE) {
                  var value = element.getAttribute('data-image-style');
                  this.setValue(value);
                }
              },
              // Create a custom data-image-style attribute.
              commit: function(type, element) {
                if (type == IMAGE) {
                  if (this.getValue() || this.isChanged()) {
                    element.setAttribute('data-image-style', this.getValue());
                  }
                } else if (type == PREVIEW) {
                  element.setAttribute('data-image-style', this.getValue());
                } else if (type == CLEANUP) {
                  element.setAttribute('data-image-style', '');
                }
              },
              validate: function() {
                if (Drupal.settings.ckeditor_inline_image_style.required) {
                  if (this.getValue() == 'not_set') {
                    var message = 'Please make a selection from ' + Drupal.settings.ckeditor_inline_image_style.label;
                    alert(message);
                    return false;
                  }
                }
                return true;
              }
            },
              // Position before preview.
              'htmlPreview'
            );

            // Put a title attribute field on the main 'info' tab.
            infoTab.add( {
              type: 'text',
              id: 'txtTitle',
              label: 'The title attribute is used as a tooltip when the mouse hovers over the image.',
              onChange: function() {
                updatePreview(this.getDialog());
              },
              setup: function(type, element) {
                if (type == IMAGE)
                  this.setValue(element.getAttribute('title'));
              },
              commit: function(type, element) {
                if (type == IMAGE) {
                  if (this.getValue() || this.isChanged())
                    element.setAttribute('title', this.getValue());
                } else if (type == PREVIEW) {
                  element.setAttribute('title', this.getValue());
                } else if (type == CLEANUP) {
                  element.removeAttribute('title');
                }
              }
            },
              // Position before the imageSize select box.
              'htmlPreview'
            );

            // Improve the alt field label. Copied from Drupal's image field.
            altText.label = 'The alt attribute may be used by search engines, and screen readers.';

            // Remove a bunch of extraneous fields. These properties will be set in
            // the theme or module CSS.
            infoTab.remove('basic');
          }
        });
      }
  });
})();
