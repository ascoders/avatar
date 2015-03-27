'use strict';

define("oauth", ['jquery'], function ($) {
	var vm = avalon.define({
		$id: "oauth",
		info: '验证请求中..',
	});

	return avalon.controller(function ($ctrl) {
		$ctrl.$onEnter = function (param, rs, rj) {
			if (mmState.query.code != undefined) { // github验证
				//获取token
				post('/api/check/getToken', {
					code: mmState.query.code,
					state: mmState.query.state,
				}, null, '', function (data) {
					avalon.vmodels.oauth.info = '验证成功，正在从github获取信息..';
					//获取access_token
					var access_token = data.match(/access_token=([^&]+)/)[1];

					//请求github获取用户信息
					$.get('https://api.github.com/user?access_token=' + access_token, function (_data) {
						avalon.vmodels.oauth.info = '信息获取完毕，处理中..';

						post('/api/check/register', {
							nickname: _data.name,
							image: _data.avatar_url,
							token: access_token,
							login: _data.login,
						}, null, '', function (__data) {
							avalon.vmodels.global.my = __data;
							avalon.vmodels.global.myLogin = true;
							//返回首页
							avalon.router.navigate('/');
						});
					});
				});
			} else { // 其他第三方
				require(['frontia'], function (frontia) {
					// API key 从应用信息页面获取
					var AK = '6NfcaqlPimQxS9buDbFGG6iP';

					// 初始化 frontia
					frontia.init(AK);

					frontia.social.setLoginCallback({ //登录成功后的回调
						success: function (user) {
							console.log(user);
							post('/api/check/hasOauth', {
								id: user.getId(),
								token: user.getAccessToken(),
								type: user.getMediaType(),
								expire: user.getExpiresIn()
							}, null, null, function (data) {
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
										post('/api/check/oauthRegister', {
											id: user.getId(),
											token: user.getAccessToken(),
											nickname: result.username,
											image: result.headurl,
											type: user.getMediaType(),
											expire: user.getExpiresIn(),
										}, '注册成功', '', function (_data) {
											avalon.vmodels.global.my = _data;
											avalon.vmodels.global.myLogin = true;
											//返回首页
											avalon.router.navigate('/');
										});
									});
								} else { //账号已存在，自动登陆
									avalon.vmodels.global.my = data;
									avalon.vmodels.global.myLogin = true;
									//返回首页
									avalon.router.navigate('/');
								}
							});
						},
						error: function (error) {
							console.log(error);
							notice('验证失败', 'red');
							avalon.router.navigate('/');
						}
					});
				});
			}
		}

		$ctrl.$onRendered = function () {

		}
	})
});