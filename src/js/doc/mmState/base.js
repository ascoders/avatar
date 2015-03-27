'use strict';

define("doc.mmState.base", ['jquery'], function ($) {
	return avalon.define({
		$id: "doc.mmState.base",
		onEnter: function () {
			console.log(avalon.vmodels['doc.mmState.base']);
		},
		onAfterLoad: function () {

		},
		$skipArray: ['onEnter', 'onAfterLoad'],
	});
});