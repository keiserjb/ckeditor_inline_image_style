<?php

/**
 * @file
 * CKEditor inline image style.
 */

/**
 * Chooses which image styles are available in the CKEditor image dialog.
 */
function ckeditor_inline_image_style_admin_settings() {
  $form = array();
  $image_styles = image_styles();
  $ckeditor_mappings = variable_get('ckeditor_inline_image_style_ckeditor_mappings', array_keys(image_styles()));

  $options = array();
  foreach ($image_styles as $image_style) {
    $options[$image_style['name']] = $image_style['label'];
  }
  $form['ckeditor_inline_image_style_ckeditor_mappings'] = array(
    '#title' => t('Select the image styles that are available inside CKEditor'),
    '#type' => 'checkboxes',
    '#options' => $options,
    '#default_value' => $ckeditor_mappings,
  );

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => 'Save',
  );

  return $form;
}

/**
 * Submit handler.
 */
function ckeditor_inline_image_style_admin_settings_submit($form, &$form_state) {
  variable_set('ckeditor_inline_image_style_ckeditor_mappings', $form_state['values']['ckeditor_inline_image_style_ckeditor_mappings']);
}
