/**
 * @file
 * Plugin to support responsive images with the Picture module and
 * the CKEditor module in Backdrop CMS.
 */
(function() {
  CKEDITOR.plugins.add('ckeditor_inline_image_style_ckeditor', {
    // Injects custom CSS into the CKEditor instance.
    onLoad: function() {
      CKEDITOR.addCss(Backdrop.settings.ckeditor_inline_image_style.editorCSS);
    },

    // Initializes the plugin.
    init: function(editor) {
      // Allows the data-image-style attribute on img elements.
      editor.config.extraAllowedContent = 'img[data-image-style]';

      // Setup based on Backdrop settings.
      var features = {};
      if (Backdrop.settings.ckeditor_inline_image_style && Backdrop.settings.ckeditor_inline_image_style.required) {
        features = {
          'imageSize': { 'requiredContent': 'img[data-image-style]' }
        };
      }

      // Enhances functionality based on the presence of 'image2' or 'image' plugins.
      if (CKEDITOR.config.plugins.indexOf('image2') != -1) {
        // Adds CSS for image alignment for the 'image2' plugin.
        CKEDITOR.addCss('span[data-cke-display-name="image"] { display: block; }');
      } else if (CKEDITOR.config.plugins.indexOf('image') != -1) {
        // Disables object resizing for the 'image' plugin.
        CKEDITOR.config.disableObjectResizing = true;
      }

      // Note: No dialog customizations are included in this JavaScript file.
      // Image style selection is assumed to be handled through Backdrop's form system (hook_form_alter).
    }
  });
})();
