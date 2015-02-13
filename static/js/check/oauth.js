'use strict';

define("oauth", ['jquery'], function ($) {
	return avalon.define({
		$id: "oauth",
		info: '验证请求中..',
		onChange: function (state) {
			//获取token
			post('/api/check/getToken', {
				code: state.query.code,
				state: state.query.state,
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
		},
		onAfterLoad: function () {

		},
		$skipArray: ['onChange', 'onAfterLoad'],
	});
});