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
							if (__data == 'exist') {
								notice('绑定失败：此第三方账号已有绑定', 'red');
								avalon.router.navigate('/setting/thrid');
							} else if (__data == 'bind') {
								notice('绑定成功', 'green');
								avalon.router.navigate('/setting/thrid');
							} else {
								avalon.vmodels.global.my = __data;
								avalon.vmodels.global.myLogin = true;
								//返回首页
								avalon.router.navigate('/');
							}
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
							post('/api/check/hasOauth', {
								id: user.getId(),
								token: user.getAccessToken(),
								type: user.getMediaType(),
								expire: user.getExpiresIn()
							}, null, null, function (data) {
								if (data == -1) { // 此第三方账号对应本站用户不存在
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
										}, null, '', function (_data) {
											if (_data == "thrid") { // 第三方绑定成功
												notice('绑定成功', 'green');
												avalon.router.navigate('/setting/thrid');
											} else if (_data == "thridExist") {
												notice('绑定失败：此第三方账号已有绑定', 'red');
												avalon.router.navigate('/setting/thrid');
											} else {
												notice('注册成功', 'green');
												avalon.vmodels.global.my = _data;
												avalon.vmodels.global.myLogin = true;
												//返回首页
												avalon.router.navigate('/');
											}
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