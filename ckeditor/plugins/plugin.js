/**
 * @file Plugin to support responsive images with the Picture module and
 * the CKEditor module.
 */
(function() {
  console.log('CKEditor plugin file is loading...'); // Log for loading confirmation

  CKEDITOR.plugins.add('ckeditor_inline_image_style', {
    requires: 'image2',
    onLoad: function() {
      console.log('onLoad method called.'); // onLoad logging
      // Ensure Backdrop.settings.ckeditor_inline_image_style.editorCSS is defined
      CKEDITOR.addCss(Backdrop.settings.ckeditor_inline_image_style.editorCSS);
    },

    beforeInit: function (editor) {
      // Override the image2 widget definition to require and handle the
      // additional data-file-id attribute.
      editor.on('widgetDefinition', function (event) {
        var widgetDefinition = event.data;
        if (widgetDefinition.name !== 'image') {
          return;
        }

        // First, convert requiredContent & allowedContent from the string
        // format that image2 uses for both to formats that are better suited
        // for extending, so that both this basic backdropimage plugin and Backdrop
        // modules can easily extend it.
        // @see http://docs.ckeditor.com/#!/api/CKEDITOR.filter.allowedContentRules
        // Mapped from image2's allowedContent. Unlike image2, we don't allow
        // <figure>, <figcaption>, <div> or <p>  in our downcast, so we omit
        // those. For the <img> tag, we list all attributes it lists, but omit
        // the classes, because the listed classes are for alignment, and for
        // alignment we use the data-align attribute.
        widgetDefinition.allowedContent = {
          img: {
            attributes: {
              '!src': true,
              '!alt': true,
              'width': true,
              'height': true
            },
            classes: {}
          }
        };
        // Mapped from image2's requiredContent: "img[src,alt]". This does not
        // use the object format unlike above, but a CKEDITOR.style instance,
        // because requiredContent does not support the object format.
        // @see https://www.drupal.org/node/2585173#comment-10456981
        widgetDefinition.requiredContent = new CKEDITOR.style({
          element: 'img',
          attributes: {
            src: '',
            alt: ''
          }
        });

        // Extend requiredContent & allowedContent.
        // CKEDITOR.style is an immutable object: we cannot modify its
        // definition to extend requiredContent. Hence we get the definition,
        // modify it, and pass it to a new CKEDITOR.style instance.
        var requiredContent = widgetDefinition.requiredContent.getDefinition();
        requiredContent.attributes['data-file-id'] = '';
        requiredContent.attributes['data-style'] = '';
        widgetDefinition.requiredContent = new CKEDITOR.style(requiredContent);
        widgetDefinition.allowedContent.img.attributes['!data-file-id'] = true;
        widgetDefinition.allowedContent.img.attributes['!data-style'] = true;

        // Override downcast(): since we only accept <img> in our upcast method,
        // the element is already correct. We only need to update the element's
        // data-file-id attribute.
        widgetDefinition.downcast = function (element) {
          //element.attributes['data-file-id'] = this.data['data-file-id'];
          if (this.data['data-file-id'] && this.data['data-file-id'] != '') {
            element.attributes['data-file-id'] = this.data['data-file-id'];
          }
          else if (element.attributes['data-file-id']) {
            delete element.attributes['data-file-id'];
          }
          //element.attributes['data-style'] = this.data['data-style'];
          if (this.data['data-style'] && this.data['data-style'] != 'none') {
            element.attributes['data-style'] = this.data['data-style'];
          }
          else if (element.attributes['data-style']) {
            delete element.attributes['data-style'];
          }

          // Clean up empty link attributes.
          if (this.data.link) {
            $.each(this.data.link, function(key, value) {
              if (value === "") {
                delete element.parent.attributes[key];
                delete this;
              }
            });
          }

        };

        // We want to upcast <img> elements to a DOM structure required by the
        // image2 widget; we only accept an <img> tag, and that <img> tag MAY
        // have a data-file-id attribute.
        widgetDefinition.upcast = function (element, data) {
          if (element.name !== 'img') {
            return;
          }
          // Don't initialize on pasted fake objects.
          else if (element.attributes['data-cke-realelement']) {
            return;
          }

          // Parse the data-file-id attribute.
          if (element.attributes['data-file-id']) {
            data['data-file-id'] = element.attributes['data-file-id'];
          }
          else {
            data['data-file-id'] = null;
          }
          if (element.attributes['data-style']) {
            data['data-style'] = element.attributes['data-style'];
          }
          else {
            data['data-style'] = 'none';
          }
          return element;
        };

        // Overrides default implementation. Used to populate the "classes"
        // property of the widget's "data" property, which is used for the
        // "widget styles" functionality
        // (http://docs.ckeditor.com/#!/guide/dev_styles-section-widget-styles).
        // Is applied to whatever the main element of the widget is (<figure> or
        // <img>). The classes in image2_captionedClass are always added due to
        // a bug in CKEditor. In the case of backdropimage, we don't ever want to
        // add that class, because the widget template already contains it.
        // @see http://dev.ckeditor.com/ticket/13888
        // @see https://www.drupal.org/node/2268941
        var originalGetClasses = widgetDefinition.getClasses;
        widgetDefinition.getClasses = function () {
          var classes = originalGetClasses.call(this);
          var captionedClasses = (this.editor.config.image2_captionedClass || '').split(/\s+/);

          if (captionedClasses.length && classes) {
            for (var i = 0; i < captionedClasses.length; i++) {
              if (captionedClasses[i] in classes) {
                delete classes[captionedClasses[i]];
              }
            }
          }

          return classes;
        };

        // Protected; keys of the widget data to be sent to the Backdrop dialog.
        // Keys in the hash are the keys for image2's data, values are the keys
        // that the Backdrop dialog uses.
        widgetDefinition._mapDataToDialog = {
          'src': 'src',
          'alt': 'alt',
          'width': 'width',
          'height': 'height',
          'data-file-id': 'data-file-id',
          'data-style': 'data-style'
        };

        // Protected; transforms widget's data object to the format used by the
        // \Backdrop\editor\Form\EditorImageDialog dialog, keeping only the data
        // listed in widgetDefinition._dataForDialog.
        widgetDefinition._dataToDialogValues = function (data) {
          var dialogValues = {};
          var map = widgetDefinition._mapDataToDialog;
          Object.keys(widgetDefinition._mapDataToDialog).forEach(function (key) {
            dialogValues[map[key]] = data[key];
          });
          return dialogValues;
        };

        // Protected; the inverse of _dataToDialogValues.
        widgetDefinition._dialogValuesToData = function (dialogReturnValues) {
          var data = {};
          var map = widgetDefinition._mapDataToDialog;
          Object.keys(widgetDefinition._mapDataToDialog).forEach(function (key) {
            if (dialogReturnValues.hasOwnProperty(map[key])) {
              data[key] = dialogReturnValues[map[key]];
            }
          });
          return data;
        };

        // Protected; creates Backdrop dialog save callback.
        widgetDefinition._createDialogSaveCallback = function (editor, widget) {
          return function (dialogReturnValues) {
            var firstEdit = !widget.ready;

            // Dialog may have blurred the widget. Re-focus it first.
            if (!firstEdit) {
              widget.focus();
            }

            editor.fire('saveSnapshot');

            // Pass `true` so DocumentFragment will also be returned.
            var container = widget.wrapper.getParent(true);
            var image = widget.parts.image;

            // Set the updated widget data, after the necessary conversions from
            // the dialog's return values.
            // Note: on widget#setData this widget instance might be destroyed.
            var data = widgetDefinition._dialogValuesToData(dialogReturnValues.attributes);
            widget.setData(data);

            // Retrieve the widget once again. It could've been destroyed
            // when shifting state, so might deal with a new instance.
            widget = editor.widgets.getByElement(image);

            // It's first edit, just after widget instance creation, but before it was
            // inserted into DOM. So we need to retrieve the widget wrapper from
            // inside the DocumentFragment which we cached above and finalize other
            // things (like ready event and flag).
            if (firstEdit) {
              editor.widgets.finalizeCreation(container);
            }

            setTimeout(function () {
              // (Re-)focus the widget.
              widget.focus();
              // Save snapshot for undo support.
              editor.fire('saveSnapshot');
            });

            return widget;
          };
        };

        var originalInit = widgetDefinition.init;
        widgetDefinition.init = function () {
          originalInit.call(this);

          // Update data.link object with attributes if the link has been
          // discovered.
          // @see plugins/image2/plugin.js/init() in CKEditor; this is similar.
          if (this.parts.link) {
            this.setData('link', CKEDITOR.plugins.link.parseLinkAttributes(editor, this.parts.link));
          }
        };
      });

      // Add a widget#edit listener to every instance of image2 widget in order
      // to handle its editing with a Backdrop-native dialog.
      // This includes also a case just after the image was created
      // and dialog should be opened for it for the first time.
      editor.widgets.on('instanceCreated', function (event) {
        var widget = event.data;

        if (widget.name !== 'image') {
          return;
        }

        widget.on('edit', function (event) {
          // Cancel edit event to break image2's dialog binding
          // (and also to prevent automatic insertion before opening dialog).
          event.cancel();

          // Open backdropimage dialog.
          editor.execCommand('editbackdropimage', {
            existingValues: widget.definition._dataToDialogValues(widget.data),
            saveCallback: widget.definition._createDialogSaveCallback(editor, widget)
          });
        });
      });

      // Register the "editbackdropimage" command, which essentially just replaces
      // the "image" command's CKEditor dialog with a Backdrop-native dialog.
      editor.addCommand('editbackdropimage', {
        allowedContent: 'img[alt,!src,width,height,!data-file-id,!data-style]',
        requiredContent: 'img[alt,src,width,height,data-file-id,data-style]',
        modes: {wysiwyg: 1},
        canUndo: true,
        exec: function (editor, data) {
          var dialogSettings = {
            title: data.dialogTitle,
            dialogClass: 'editor-image-dialog'
          };
          var url = editor.config.backdrop.imageDialogUrl;
          if (url.indexOf('?token=') < 0) {
            url += '/' + editor.config.backdrop.format;
          }
          Backdrop.ckeditor.openDialog(editor, url, data.existingValues, data.saveCallback, dialogSettings);
        }
      });

      // Register the toolbar button.
      if (editor.ui.addButton) {
        editor.ui.addButton('BackdropImage', {
          label: Backdrop.t('Image'),
          // Note that we use the original image2 command!
          command: 'image',
          icon: this.path + '/image.png'
        });
      }
    },

    init: function (editor) {
    },

    afterInit: function (editor) {
      linkCommandIntegrator(editor);
    }

  });

  /**
   * Integrates the backdropimage widget with the backdroplink plugin.
   *
   * Makes images linkable.
   *
   * @param {CKEDITOR.editor} editor
   *   A CKEditor instance.
   */
  function linkCommandIntegrator(editor) {
    // Nothing to integrate with if the backdroplink plugin is not loaded.
    if (!editor.plugins.backdroplink) {
      return;
    }

    // Override default behaviour of 'backdropunlink' command.
    editor.getCommand('backdropunlink').on('exec', function (evt) {
      var widget = getFocusedWidget(editor);

      // Override 'backdropunlink' only when link truly belongs to the widget. If
      // wrapped inline widget in a link, let default unlink work.
      // @see https://dev.ckeditor.com/ticket/11814
      if (!widget || !widget.parts.link) {
        return;
      }

      widget.setData('link', null);

      // Selection (which is fake) may not change if unlinked image in focused
      // widget, i.e. if captioned image. Let's refresh command state manually
      // here.
      this.refresh(editor, editor.elementPath());

      evt.cancel();
    });

    // Override default refresh of 'backdropunlink' command.
    editor.getCommand('backdropunlink').on('refresh', function (evt) {
      var widget = getFocusedWidget(editor);

      if (!widget) {
        return;
      }

      // Note that widget may be wrapped in a link, which
      // does not belong to that widget (#11814).
      this.setState(widget.data.link || widget.wrapper.getAscendant('a') ?
        CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED);

      evt.cancel();
    });
  }

  /**
   * Gets the focused widget, if of the type specific for this plugin.
   *
   * @param {CKEDITOR.editor} editor
   *   A CKEditor instance.
   *
   * @return {?CKEDITOR.plugins.widget}
   *   The focused image2 widget instance, or null.
   */
  function getFocusedWidget(editor) {
    var widget = editor.widgets.focused;

    if (widget && widget.name === 'image') {
      return widget;
    }

    return null;
  }

  // Expose an API for other plugins to interact with backdropimage widgets.
  CKEDITOR.plugins.backdropimage = {
    getFocusedWidget: getFocusedWidget
  };

})(jQuery, Backdrop, CKEDITOR);
