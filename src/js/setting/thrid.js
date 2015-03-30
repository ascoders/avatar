'use strict';

define("settingThrid", ['jquery'], function ($) {
	var vm = avalon.define({
		$id: "settingThrid",
		thrids: [{
				name: 'qq',
				image: 'fa-qq',
				linkName: 'qqdenglu',
				linked: false
			}, {
				name: '微博',
				image: 'fa-weibo',
				linkName: 'sinaweibo',
				linked: false
			}, {
				name: '腾讯微博',
				image: 'fa-tencent-weibo',
				linkName: 'qqweibo',
				linked: false
			}, {
				name: '百度',
				image: '',
				linkName: 'baidu',
				linked: false
			}] // 第三方列表
	});

	return avalon.controller(function ($ctrl) {
		$ctrl.$onEnter = function (param, rs, rj) {
			avalon.vmodels.setting.type = 'thrid';

			// 查询账号绑定列表
			post('/api/user/oauthList', null, null, '', function (data) {
				if (data == null) {
					return;
				}

				for (var i = 0, j = vm.thrids.$model.length; i < j; i++) {
					for (var m = 0, n = data.length; m < n; m++) {
						if (data[m].t == vm.thrids[i].linkName) {
							vm.thrids[i].linked = true;
						}
					}
				}
			});
		}

		$ctrl.$onRendered = function () {

		}
	});
});