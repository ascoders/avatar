'use strict';

define("auth", ['jquery'], function ($) {
	return avalon.define({
		$id: "auth",
		onEnter: function (state) {
			post('/api/check/auth', {
				id: state.query.id,
				expire: state.query.expire,
				type: state.query.type,
				extend: state.query.extend,
				sign: state.query.sign,
			}, null, '', function (data) {
				//更新用户信息
				data.image = userImage(data.image);
				avalon.vmodels.global.my = data;
				avalon.vmodels.global.myLogin = true;
				avalon.vmodels.auth.todo(state.query.type, state.query.extend);
			}, function () { // 跳转回首页
				avalon.router.navigate("/");
			});
		},
		onAfterLoad: function () {

		},
		todo: function (type, extend) {
			switch (type) {
			case 'email': // 修改用户email
				avalon.router.navigate("/user/account/email");
				break;
			case 'createAccount': // 注册用户
				avalon.router.navigate("/");
				break;
			}
		},
		$skipArray: ['onEnter', 'onAfterLoad', 'todo'],
	});
});