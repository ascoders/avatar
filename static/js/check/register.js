'use strict';

define("checkRegister", ['jquery'], function ($) {
	return avalon.define({
		$id: "checkRegister",
		email: '',
		nickname: '',
		password: '',
		passwordRepeat: '',
		capid: '', //验证码id
		cap: '',
		stepList: ['填写信息', '邮箱验证', '完成'], //步骤
		step: 0, //当前步骤
		jumpStep: function (step) {
			avalon.vmodels.checkRegister.step = step;
		},
		onEnter: function () {
			avalon.vmodels.checkRegister.freshCap();
		},
		freshCap: function () { //刷新验证码
			//刷新验证码
			post('/api/freshCap', null, null, null, function (data) {
				avalon.vmodels.checkRegister.capid = data;
			});
		},
		onAfterLoad: function () {
			//Enter提交表单
			$(window).keydown(function (e) {
				if (e.keyCode == 13) { //按下Enter
					avalon.vmodels.checkRegister.submit();
				}
			});

			//账号获取焦点
			$('#check-register #email').focus();
		},
		submit: function () { //点击登陆按钮
			if (avalon.vmodels.checkRegister.email == '') {
				notice('邮箱不能为空', 'red');
				return;
			}
			if (avalon.vmodels.checkRegister.nickname == '') {
				notice('昵称不能为空', 'red');
				return;
			}
			if (avalon.vmodels.checkRegister.password == '') {
				notice('密码不能为空', 'red');
				return;
			}
			if (avalon.vmodels.checkRegister.passwordRepeat == '' || avalon.vmodels.checkRegister.passwordRepeat != avalon.vmodels.checkRegister.password) {
				notice('重复密码不正确', 'red');
				return;
			}
			post('/api/check/register', {
				email: avalon.vmodels.checkRegister.email,
				nickname: avalon.vmodels.checkRegister.nickname,
				password: avalon.vmodels.checkRegister.password,
				capid: avalon.vmodels.checkRegister.capid,
				cap: avalon.vmodels.checkRegister.cap,
			}, '注册信函已发送', '', function (data) {
				//刷新验证码
				avalon.vmodels.checkRegister.freshCap();
				avalon.vmodels.checkRegister.cap = '';
				//进入下一步
				avalon.vmodels.checkRegister.step = 1;
			}, function (data) {
				//刷新验证码
				avalon.vmodels.checkRegister.freshCap();
				avalon.vmodels.checkRegister.cap = '';
			});
		},
		$skipArray: ['onEnter', 'onAfterLoad'],
	});
});