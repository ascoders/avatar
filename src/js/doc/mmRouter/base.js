'use strict';

define("doc.mmRouter.base", ['jquery'], function ($) {
	return avalon.define({
		$id: "doc.mmRouter.base",
		onEnter: function () {
			console.log(avalon.vmodels['doc.mmRouter.base']);
		},
		onAfterLoad: function () {

		},
		$skipArray: ['onEnter', 'onAfterLoad'],
	});
});