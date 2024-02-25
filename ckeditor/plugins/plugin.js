/**
 * @file Plugin to support responsive images with the Picture module and
 * the CKEditor module.
 */
( function(){
  CKEDITOR.plugins.add('ckeditor_inline_image_style_ckeditor', {

    onLoad: function() {
      CKEDITOR.addCss(Backdrop.settings.ckeditor_inline_image_style.editorCSS);

    },
    beforeInit : function(editor) {
      features = {
        'imageSize': { 'requiredContent': 'img[data-image-style]' }
      };
      CKEDITOR.addCss('span[data-cke-display-name="image"] { display: block; }');
      CKEDITOR.config.disableObjectResizing = true;
    }
  });

})(jQuery, Backdrop, CKEDITOR);
