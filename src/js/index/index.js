'use strict';

define("index", ['jquery', 'editor', 'jquery.timeago'], function ($) {
	return avalon.define({
		$id: "index",
		categorys: {
			'全部': -1,
			'问答': 0,
			'分享': 1,
		},
		lists: [], //文章列表
		pagin: '', //分页按钮
		category: -1, //当前分类
		inputTitle: '', //输入框标题
		inputContent: '', //输入框内容
		inputCategory: 0, //输入框分类
		temp: {
			editor: {},
			from: 0,
			number: 0,
			watchCategory: false, //是否执行category的watch
		},
		submit: function () { //提交
			//如果用户没有登陆，触发登陆模块
			if (!avalon.vmodels.global.myLogin) {
				avalon.vmodels.global.github();
				return;
			}

			if (avalon.vmodels.index.inputTitle.length > 20) {
				noticle('标题最长20', 'red');
				return;
			}

			if (avalon.vmodels.index.inputContent.length < 3 || avalon.vmodels.index.inputContent.length > 10000) {
				notice('内容长度3-10000', 'red');
				return;
			}

			post('/api/article/add', {
				title: avalon.vmodels.index.inputTitle,
				content: avalon.vmodels.index.inputContent,
				category: avalon.vmodels.index.inputCategory,
			}, '发布成功', '', function (data) {
				//清空输入内容
				avalon.vmodels.index.inputTitle = '';
				avalon.vmodels.index.inputContent = '';

				//跳转到此文章页
				avalon.router.navigate('/art/' + data);
			});
		},
		rendered: function () { //列表渲染完毕
			$('.timeago').timeago();
		},
		onChange: function (state) {
			state.query.from = state.query.from || 0;
			state.query.number = state.query.number || 20;
			state.query.category = state.query.category || -1;

			avalon.vmodels.index.temp.watchCategory = false;
			avalon.vmodels.index.category = state.query.category;
			avalon.vmodels.index.temp.watchCategory = true;

			//获得文章列表
			post('/api/article/list', {
				category: state.query.category,
				from: state.query.from,
				number: state.query.number,
			}, null, '获取信息失败：', function (data) {
				for (var key in data.lists) {
					//是否为精华
					if (data.lists[key].r * 5 + data.lists[key].v > 100) { //判定为精华
						data.lists[key].good = true;
					} else {
						data.lists[key].good = false;
					}

					//分类名称
					switch (data.lists[key].c) {
					case 0:
						data.lists[key]._c = '问答';
						break;
					case 1:
						data.lists[key]._c = '分享';
						break;
					}
				}

				avalon.vmodels.index.lists = data.lists || [];

				//生成分页
				avalon.vmodels.index.pagin = createPagin(state.query.from, state.query.number, data.count, {
					category: state.query.category,
				});
			});
		},
		onAfterLoad: function () {
			//实例化markdown编辑器
			avalon.vmodels.index.temp.editor = new $("#home #editor").MarkEditor();

			//监听分类改变
			avalon.vmodels.index.$watch('category', function (newValue) {
				if (!avalon.vmodels.index.temp.watchCategory) {
					return;
				}

				//跳转
				avalon.router.go('index', {
					query: {
						category: newValue,
						from: 0,
					},
				});
			});
		},
		$skipArray: ['onChange', 'onAfterLoad', 'temp'],
	});
});