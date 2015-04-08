'use strict';

define("user", ['jquery'], function ($) {
	var vm = avalon.define({
		$id: "user",
		user: {},
		lists: [],
		pagin: '',
		$userId: '', // 当前用户id
		rendered: function () { // 文章渲染完毕
			$('.timeago').timeago();
		},
	});

	return avalon.controller(function ($ctrl) {
		$ctrl.$onEnter = function (param, rs, rj) {

			var setUserInfo = function (info) {
				vm.user = info;

				avalon.nextTick(function () {
					$('.timeago').timeago();
				});
			}

			// 如果不是同一个用户，则清空发帖列表
			if (param.id !== vm.$userId) {
				vm.lists.clear()
			}
			vm.$userId = param.id

			// 获取用户信息
			if (avalon.vmodels.global.temp.users[param.id]) { //优先使用缓存
				setUserInfo(avalon.vmodels.global.temp.users[param.id]);
			} else {
				post('/api/user/user', {
					id: param.id,
				}, null, '获取用户信息失败', function (data) {
					//保存进缓存
					avalon.vmodels.global.temp.users[param.id] = data;
					setUserInfo(data);
				});
			}

			mmState.query.from = mmState.query.from || 0;
			mmState.query.number = mmState.query.mumber || 10;

			// 获取用户文章
			var postParams = {
				id: param.id,
				from: mmState.query.from,
				number: mmState.query.number,
			};

			post('/api/user/getArticles', postParams, null, '获取信息失败：', function (data) {
				vm.lists = data.lists;

				//生成分页
				vm.pagin = createPagin(mmState.query.from, mmState.query.number, data.count);
			});
		}

		$ctrl.$onRendered = function () {

		}
	});
});