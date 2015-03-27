'use strict';

define("checkLogin", ['jquery', 'frontia'], function ($, frontia) {
	console.log(frontia);
	return avalon.define({
		$id: "checkLogin",
		account: '',
		password: '',
		onEnter: function () {

		},
		onAfterLoad: function () {
			//Enter提交表单
			$(window).keydown(function (e) {
				if (e.keyCode == 13) { //按下Enter
					avalon.vmodels.checkLogin.submit();
				}
			});

			//移动到第三方账号按钮上，下部展开
			//鼠标移动显示更多第三方登陆
			$(".other").hover(function () {
				$(".other-hide").show();
			}, function () {
				$(".other-hide").hide();
			});

			//账号获取焦点
			$('#check-login #account').focus();

			//百度社会化组件
			var frontype = "qqdenglu";
			// API key 从应用信息页面获取
			var AK = 'RqeMWD9G1m8agmxfj6ngCKRG';
			// 在应用管理页面下的 社会化服务 - 基础设置中设置该地址
			var redirect_url = 'http://www.wokugame.com/login/oauth';

			// 初始化 frontia
			frontia.init(AK);

			// 点击登录按钮
			$(".acc-item").click(function () {
				// 更新社会化平台信息
				frontype = $(this).attr("name");
				// 初始化登录的配置
				var options = {
					response_type: 'token',
					media_type: frontype,
					redirect_uri: redirect_url,
					client_type: 'web'
				};
				// 登录
				frontia.social.login(options);
			});
		},
		submit: function () { //点击登陆按钮
			if (avalon.vmodels.checkLogin.account == '') {
				notice('账号不能为空', 'red');
				return;
			}
			if (avalon.vmodels.checkLogin.password == '') {
				notice('密码不能为空', 'red');
				return;
			}
			post('/api/check/login', {
				account: avalon.vmodels.checkLogin.account,
				password: avalon.vmodels.checkLogin.password,
			}, '登陆成功', '', function (data) {
				data.image = userImage(data.image);
				avalon.vmodels.global.my = data;
				avalon.vmodels.global.myLogin = true;

				// 信息获取完毕
				avalon.vmodels.global.temp.myDeferred.resolve();

				// 跳回上个页面
				avalon.router.navigate(avalon.router.getLastPath());
			})
		},
		$skipArray: ['onEnter', 'onAfterLoad'],
	});
});