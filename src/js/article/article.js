'use strict';

define("article", ['jquery', 'marked', 'prettify', 'editor', 'jquery.timeago', 'jquery.cookie', 'jquery.autocomplete'], function ($, marked, prettify) {
	return avalon.define({
		$id: "article",
		article: {}, //文章信息
		replys: [], //评论信息
		author: {}, //作者信息
		hot: [], //热门文章
		cold: [], //冷门文章
		same: [], //类似文章
		pagin: '',
		edit: false, //是否在编辑状态
		addTagInput: '', //新增标签输入框内容
		tag: false, //是否在编辑标签状态
		rTag: false, //是否在删除标签状态
		temp: {
			editor: null,
			from: 0,
			number: 0,
			freshSame: function () { // 获取类似类容
				post('/api/tag/same', {
					article: avalon.vmodels.article.article._id,
				}, null, '', function (data) {
					for (var key in data) {
						//如果没有标题，取内容
						if (data[key].t == "") {
							data[key].t = subStr(data[key].co, 0, 25);
						}

						// 取出内容中&nbsp;
						data[key].Content = data[key].co.replace(/&nbsp;/g, '');
					}

					avalon.vmodels.article.same = data || [];
				});
			},
		},
		inputContent: '', //提交评论内容
		submit: function () { //提交评论
			//如果用户没有登陆，触发登陆模块
			if (!avalon.vmodels.global.myLogin) {
				avalon.vmodels.global.github();
				return;
			}

			if (!avalon.vmodels.article.edit) {
				if (avalon.vmodels.article.inputContent.length < 3 || avalon.vmodels.article.inputContent.length > 10000) {
					notice('评论内容长度3-10000', 'red');
					return;
				}
			} else {
				if (avalon.vmodels.article.inputContent.length < 3 || avalon.vmodels.article.inputContent.length > 50000) {
					notice('文章内容长度3-50000', 'red');
					return;
				}
			}

			if (!avalon.vmodels.article.edit) {
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
			} else {
				post('/api/article/edit', {
					id: avalon.vmodels.article.article._id,
					content: avalon.vmodels.article.inputContent,
				}, '更新成功', '', function () {
					//清空输入内容
					avalon.vmodels.article.inputContent = '';

					//刷新本页
					avalon.router.navigate(window.location.pathname + window.location.search, {
						reload: true
					});

					//滑动到顶部
					$("html, body").animate({
						scrollTop: 0
					}, 300);
				});
			}
		},
		addTop: function () { // 置顶/取消

			if (avalon.vmodels.article.article.tp == 0) {
				post('/api/article/top', {
					id: avalon.vmodels.article.article._id,
					top: true,
				}, '已置顶', '', function (data) {
					avalon.vmodels.article.article.tp = 1;
				});
			} else {
				post('/api/article/top', {
					id: avalon.vmodels.article.article._id,
					top: false,
				}, '已取消置顶', '', function (data) {
					avalon.vmodels.article.article.tp = 0;
				});
			}

		},
		deleteArticle: function () { // 删除
			confirm('删除此文章吗', function () {
				post('/api/article/delete', {
					id: avalon.vmodels.article.article._id,
				}, '成功删除', '', function (data) {
					// 移动到首页
					avalon.router.navigate('/');
				});
			});
		},
		changeEdit: function () { // 切换到编辑状态
			avalon.vmodels.article.edit = true;

			avalon.vmodels.article.inputContent = avalon.vmodels.article.article.co;

			//同步review
			avalon.vmodels.article.temp.editor.freshPreview();

			//滑到编辑区
			$("html, body").animate({
				scrollTop: $("#article #editor").offset().top
			}, 300);
		},
		removeEdit: function () { // 取消编辑状态
			avalon.vmodels.article.edit = false;

			avalon.vmodels.article.inputContent = '';
		},
		toggleTag: function () { // 新增标签输入框组是否显示
			avalon.vmodels.article.tag = !avalon.vmodels.article.tag;

			// 获取焦点
			$('#article #tag-input').focus();
		},
		addTag: function () { // 新增标签
			if (avalon.vmodels.article.addTagInput == '') {
				notice('标签不能为空', 'red');
				return;
			}

			if (avalon.vmodels.article.addTagInput.length > 15) {
				notice('标签最大长度为15', 'red');
				return;
			}

			if (avalon.vmodels.article.article.ta.size() >= 5) {
				notice('最多5个标签', 'red');
				return;
			}

			//是否重复
			if ($.inArray(avalon.vmodels.article.addTagInput, avalon.vmodels.article.article.ta.$model) != -1) {
				notice('标签不能重复', 'red');
				return;
			}

			post('/api/tag/bind', {
				article: avalon.vmodels.article.article._id,
				name: avalon.vmodels.article.addTagInput,
			}, '标签已添加', '', function (data) {
				avalon.vmodels.article.article.ta.push(avalon.vmodels.article.addTagInput);

				// 输入框置空
				avalon.vmodels.article.addTagInput = '';

				// 取消新增状态
				avalon.vmodels.article.tag = false;

				// 获取类似文章
				avalon.vmodels.article.temp.freshSame();
			});
		},
		jumpOrRemove: function (name) {
			if (avalon.vmodels.article.rTag) {
				post('/api/tag/unBind', {
					article: avalon.vmodels.article.article._id,
					name: name,
				}, '标签已删除', '', function (data) {
					avalon.vmodels.article.article.ta.remove(name);

					// 获取类似文章
					avalon.vmodels.article.temp.freshSame();
				});
			} else {
				avalon.router.navigate('/?tag=' + name);
			}
		},
		toggleRemoveTag: function () { //切换删除标签状态
			avalon.vmodels.article.rTag = !avalon.vmodels.article.rTag;
		},
		onChange: function (state) {
			// 初始化状态
			avalon.vmodels.article.edit = false;
			avalon.vmodels.article.inputContent = '';

			//获取文章信息
			post('/api/article/article', {
				id: state.params.id,
			}, null, '文章不存在', function (data) {
				//文章内容markdown解析
				data.coHtml = marked(data.co);
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

				// 获取类似文章
				avalon.vmodels.article.temp.freshSame();

			}, function () { //页面不存在
				avalon.router.navigate('/404');
			});
		},
		onAfterLoad: function () {
			//实例化markdown编辑器
			avalon.vmodels.article.temp.editor = new $("#article #editor").MarkEditor();

			avalon.vmodels.article.temp.editor.createDom();

			//获取xsrftoken
			var xsrf = $.cookie("_xsrf");
			if (!xsrf) {
				return;
			}
			var xsrflist = xsrf.split("|");
			var xsrftoken = Base64.decode(xsrflist[0]);

			// 搜索标签自动完成
			$('#article #tag-input').autocomplete({
				serviceUrl: '/api/tag/searchTag',
				type: 'post',
				deferRequestBy: 300,
				params: {
					_xsrf: xsrftoken,
				},
				onSelect: function (suggestion) {
					avalon.vmodels.article.addTagInput = suggestion.value;
					avalon.vmodels.article.addTag();
				}
			});
		},
		$skipArray: ['onChange', 'onAfterLoad', 'temp'],
	});
});