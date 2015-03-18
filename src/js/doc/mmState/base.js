'use strict';

define("doc.mmState.base", ['jquery'], function ($) {
	return avalon.define({
		$id: "doc.mmState.base",
		onChange: function () {
			console.log(avalon.vmodels['doc.mmState.base']);
		},
		onAfterLoad: function () {

		},
		$skipArray: ['onChange', 'onAfterLoad'],
	});
});