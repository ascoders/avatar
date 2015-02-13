'use strict';

define("article", ['jquery', 'marked', 'prettify', 'editor', 'jquery.timeago'], function ($, marked, prettify) {
	return avalon.define({
		$id: "article",
		article: {}, //文章信息
		replys: [], //评论信息
		author: {}, //作者信息
		hot: [], //热门文章
		cold: [], //冷门文章
		pagin: '',
		temp: {
			editor: null,
			from: 0,
			number: 0,
		},
		inputContent: '', //提交评论内容
		submit: function () { //提交评论
			//如果用户没有登陆，触发登陆模块
			if (!avalon.vmodels.global.myLogin) {
				avalon.vmodels.global.github();
				return;
			}

			if (avalon.vmodels.article.inputContent.length < 3 || avalon.vmodels.article.inputContent.length > 1000) {
				notice('评论内容长度3-1000', 'red');
				return;
			}

			post('/api/article/addReply', {
				article: avalon.vmodels.article.article._id,
				content: avalon.vmodels.article.inputContent,
			}, '评论成功', '', function () {
				//清空输入内容
				avalon.vmodels.article.inputContent = '';

				//跳转到最后一页
				avalon.router.navigate('/art/' + avalon.vmodels.article.article._id +
					'?number=' + avalon.vmodels.article.temp.number + '&from=' +
					Math.floor(parseInt(avalon.vmodels.article.article.r) / avalon.vmodels.article.temp.number) * avalon.vmodels.article.temp.number, {
						reload: true
					});
			});
		},
		onChange: function (state) {
			//获取文章信息
			post('/api/article/article', {
				id: state.params.id,
			}, null, '文章不存在', function (data) {
				//文章内容markdown解析
				data.co = marked(data.co);
				avalon.vmodels.article.article = data;

				state.query.from = state.query.from || 0;
				state.query.number = state.query.number || 20;
				avalon.vmodels.article.temp.from = state.query.from;
				avalon.vmodels.article.temp.number = state.query.number;

				//生成分页
				avalon.vmodels.article.pagin = createPagin(state.query.from, state.query.number, data.r);

				var setUserInfo = function (info) {
					avalon.vmodels.article.author = info;

					avalon.nextTick(function () {
						$('.timeago').timeago();

						//代码高亮
						$('pre').addClass('prettyprint pre-scrollable linenums');
						prettify.prettyPrint();
					});
				}

				//获取评论信息
				avalon.vmodels.article.replys.clear();
				post('/api/article/reply', {
					article: avalon.vmodels.article.article._id,
					from: state.query.from,
					number: state.query.number,
				}, null, '取评论失败', function (_data) {
					//markdown解析
					for (var key in _data) {
						_data[key].co = marked(_data[key].co);
					}

					avalon.vmodels.article.replys = _data;
				});

				//获取作者信息
				if (avalon.vmodels.global.temp.users[data.u]) { //优先使用缓存
					setUserInfo(avalon.vmodels.global.temp.users[data.u]);
				} else {
					post('/api/user/user', {
						id: data.u,
					}, null, '获取作者信息失败', function (_data) {
						//保存进缓存
						avalon.vmodels.global.temp.users[data.u] = _data;
						setUserInfo(_data);
					});
				}

				//获取作者热门和冷门文章
				if (avalon.vmodels.global.temp.userHotCold[data.u]) { //优先使用缓存
					avalon.vmodels.article.hot = avalon.vmodels.global.temp.userHotCold[data.u].hot || [];
					avalon.vmodels.article.cold = avalon.vmodels.global.temp.userHotCold[data.u].cold || [];
				} else {
					post('/api/user/getHotCold', {
						id: data.u,
					}, null, '获取作者文章失败', function (_data) {
						//保存进缓存
						avalon.vmodels.global.temp.userHotCold[data.u] = _data;
						avalon.vmodels.article.hot = _data.hot || [];
						avalon.vmodels.article.cold = _data.cold || [];
					});
				}
			}, function () { //页面不存在
				avalon.router.navigate('/404');
			});
		},
		onAfterLoad: function () {
			//实例化markdown编辑器
			avalon.vmodels.article.temp.editor = new $("#article #editor").MarkEditor();
		},
		$skipArray: ['onChange', 'onAfterLoad', 'temp'],
	});
});