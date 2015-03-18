'use strict';

define("doc", ['jquery', 'jquery.tree'], function ($) {
	return avalon.define({
		$id: "doc",
		menu: {
			'mmRouter': {
				name: '路由',
				child: {
					'base': '基础',
				},
			},
			'mmState': {
				name: '状态机',
				child: {
					'base': '基础',
				},
			}
		},
		rendered: function () { //文档树渲染完毕
			//所有表树状结构渲染
			$("#doc #tree").hide().treeview().show();
		},
		onChange: function (state) {

		},
		onAfterLoad: function () {

		},
		$skipArray: ['onChange', 'onAfterLoad'],
	});
});