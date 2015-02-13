'use strict';

define("checkOauth", ['jquery', 'frontia'], function ($, frontia) {
	console.log(frontia);
	return avalon.define({
		$id: "checkOauth",
		img: '',
		nickname: '',
		onChange: function () {
			// API key 从应用信息页面获取
			var AK = 'RqeMWD9G1m8agmxfj6ngCKRG';

			// 初始化 frontia
			frontia.init(AK);

			// 设置登录成功后的回调
			frontia.social.setLoginCallback({
				success: function (user) {
					post('/api/check/hasOauth', {
						id: user.getId(),
						token: user.getAccessToken(),
						type: user.getMediaType(),
						expire: user.getExpiresIn()
					}, '', '', function (data) {
						if (data == -1) { // 用户不存在
							//获取用户详细信息
							$.ajax({
								url: 'https://openapi.baidu.com/social/api/2.0/user/info',
								type: 'POST',
								dataType: 'jsonp',
								jsonp: "callback",
								data: {
									access_token: user.getAccessToken()
								},
							}).done(function (result) {
								avalon.vmodels.checkOauth.img = result.headurl;
								avalon.vmodels.checkOauth.nickname = result.username;
							});
						} else { //账号已存在，自动登陆
							data.image = userImage(data.image);
							avalon.vmodels.global.my = data;
							avalon.vmodels.global.myLogin = true;
							// 跳回上个页面
							avalon.router.navigate(avalon.router.getLastPath());
						}
					});
				},
				error: function (error) {
					showAlert("验证失败", false);
					location.href = "/";
				}
			});
		},
		onAfterLoad: function () {

		},
		submit: function () {
			if (avalon.vmodels.checkOauth.nickname.length < 3 || avalon.vmodels.checkOauth.nickname.length > 20) {
				notice('昵称长度为3-20', 'red');
				return false;
			}

			post('/api/check/oauthRegister', {
				id: user.getId(),
				token: user.getAccessToken(),
				nickname: result.username,
				nowname: $("#j-nickname").val(),
				image: result.headurl,
				type: user.getMediaType(),
				expire: user.getExpiresIn(),
			}, '注册成功', '', function (data) {
				data.image = userImage(data.image);
				avalon.vmodels.global.my = data;
				avalon.vmodels.global.myLogin = true;

				// 跳回上个页面
				avalon.router.navigate(avalon.router.getLastPath());
			});
		},
		$skipArray: ['onChange', 'onAfterLoad'],
	});
});