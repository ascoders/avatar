'use strict';

define("article", ['jquery', 'marked', 'prettify', 'editor', 'jquery.timeago', 'jquery.cookie', 'jquery.autocomplete'], function ($, marked, prettify) {
	var vm = avalon.define({
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
		$tuhua: false, // 是否加载了图话
		$temp: {
			editor: null,
			from: 0,
			number: 0,
			freshSame: function () { // 获取类似类容
				post('/api/tag/same', {
					article: vm.article._id
				}, null, '', function (data) {
					for (var key in data) {
						if (!data.hasOwnProperty(key) || key === "hasOwnProperty") {
							continue;
						}

						//如果没有标题，取内容
						if (data[key].t == "") {
							data[key].t = subStr(data[key].co, 0, 25);
						}

						// 取出内容中&nbsp;
						data[key].Content = data[key].co.replace(/&nbsp;/g, '');
					}

					vm.same = data || [];
				});
			}
		},
		inputContent: '', //提交评论内容
		submit: function () { //提交评论
			//如果用户没有登陆，触发登陆模块
			if (!avalon.vmodels.global.myLogin) {
				avalon.vmodels.global.github();
				return;
			}

			if (!vm.edit) {
				if (vm.inputContent.length < 3 || vm.inputContent.length > 10000) {
					notice('评论内容长度3-10000', 'red');
					return;
				}
			} else {
				if (vm.inputContent.length < 3 || vm.inputContent.length > 50000) {
					notice('文章内容长度3-50000', 'red');
					return;
				}
			}

			if (!vm.edit) {
				post('/api/article/addReply', {
					article: vm.article._id,
					content: vm.inputContent
				}, '评论成功', '', function () {
					//清空输入内容
					vm.inputContent = '';

					//跳转到最后一页
					avalon.router.navigate('/art/' + vm.article._id +
						'?number=' + vm.$temp.number + '&from=' +
						Math.floor(parseInt(vm.article.r) / vm.$temp.number) * vm.$temp.number, {
							reload: true
						});
				});
			} else {
				post('/api/article/edit', {
					id: vm.article._id,
					content: vm.inputContent
				}, '更新成功', '', function () {
					//清空输入内容
					vm.inputContent = '';

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

			if (vm.article.tp == 0) {
				post('/api/article/top', {
					id: vm.article._id,
					top: true
				}, '已置顶', '', function (data) {
					vm.article.tp = 1;
				});
			} else {
				post('/api/article/top', {
					id: vm.article._id,
					top: false
				}, '已取消置顶', '', function (data) {
					vm.article.tp = 0;
				});
			}

		},
		deleteArticle: function () { // 删除
			confirm('删除此文章吗', function () {
				post('/api/article/delete', {
					id: vm.article._id
				}, '成功删除', '', function (data) {
					// 移动到首页
					avalon.router.navigate('/');
				});
			});
		},
		changeEdit: function () { // 切换到编辑状态
			vm.edit = true;

			vm.inputContent = vm.article.co;

			//同步review
			vm.$temp.editor.freshPreview();

			//滑到编辑区
			$("html, body").animate({
				scrollTop: $("#article #editor").offset().top
			}, 300);
		},
		removeEdit: function () { // 取消编辑状态
			vm.edit = false;

			vm.inputContent = '';
		},
		toggleTag: function () { // 新增标签输入框组是否显示
			vm.tag = !vm.tag;

			// 获取焦点
			$('#article #tag-input').focus();
		},
		addTag: function () { // 新增标签
			if (vm.addTagInput == '') {
				notice('标签不能为空', 'red');
				return;
			}

			if (vm.addTagInput.length > 15) {
				notice('标签最大长度为15', 'red');
				return;
			}

			if (vm.article.ta.size() >= 5) {
				notice('最多5个标签', 'red');
				return;
			}

			//是否重复
			if ($.inArray(vm.addTagInput, vm.article.ta.$model) != -1) {
				notice('标签不能重复', 'red');
				return;
			}

			post('/api/tag/bind', {
				article: vm.article._id,
				name: vm.addTagInput
			}, '标签已添加', '', function (data) {
				vm.article.ta.push(vm.addTagInput);

				// 输入框置空
				vm.addTagInput = '';

				// 取消新增状态
				vm.tag = false;

				// 获取类似文章
				vm.$temp.freshSame();
			});
		},
		jumpOrRemove: function (name) {
			if (vm.rTag) {
				post('/api/tag/unBind', {
					article: vm.article._id,
					name: name
				}, '标签已删除', '', function (data) {
					vm.article.ta.remove(name);

					// 获取类似文章
					vm.$temp.freshSame();
				});
			} else {
				avalon.router.navigate('/?tag=' + name);
			}
		},
		toggleRemoveTag: function () { //切换删除标签状态
			vm.rTag = !vm.rTag;
		},
		replysRendered: function () { // 评论渲染完毕
			$('.timeago').timeago();
		},
		changeCategory: function (value) { // 改变分类
			post('/api/article/changeCategory', {
				article: vm.article._id,
				category: value
			}, '修改成功', '');
		}
	});

	return avalon.controller(function ($ctrl) {

		$ctrl.$onEnter = function (param, rs, rj) {
			// 初始化状态
			vm.edit = false;
			vm.inputContent = '';

			//获取文章信息
			post('/api/article/article', {
				id: param.id
			}, null, '文章不存在', function (data) {
				//文章内容markdown解析
				data.coHtml = marked(data.co);
				vm.article = data;

				mmState.query.from = mmState.query.from || 0;
				mmState.query.number = mmState.query.number || 20;
				vm.$temp.from = mmState.query.from;
				vm.$temp.number = mmState.query.number;

				//生成分页
				vm.pagin = createPagin(mmState.query.from, mmState.query.number, data.r);

				var setUserInfo = function (info) {
					vm.author = info;

					avalon.nextTick(function () {
						$('.timeago').timeago();

						//代码高亮
						$('pre').addClass('prettyprint pre-scrollable linenums');
						prettify.prettyPrint();
					});
				}

				//获取评论信息
				vm.replys.clear();
				post('/api/article/reply', {
					article: vm.article._id,
					from: mmState.query.from,
					number: mmState.query.number
				}, null, '取评论失败', function (_data) {
					// 解析回复作者信息
					var replyMembers = {};
					_data.member = _data.member || [];
					for (var i = 0, j = _data.member.length; i < j; i++) {
						replyMembers[_data.member[i]._id] = _data.member[i];
					}

					for (var key in _data.reply) {
						if (!_data.reply.hasOwnProperty(key) || key === "hasOwnProperty") {
							continue;
						}

						// markdown解析
						_data.reply[key].co = marked(_data.reply[key].co);

						// 设置作者信息
						_data.reply[key].ua = replyMembers[_data.reply[key].u].a;
						_data.reply[key].ur = replyMembers[_data.reply[key].u].r;
						_data.reply[key].un = replyMembers[_data.reply[key].u].n;
						_data.reply[key].ui = replyMembers[_data.reply[key].u].i;
						_data.reply[key]._id = replyMembers[_data.reply[key].u]._id;
					}

					vm.replys = _data.reply;
				});

				//获取作者信息
				if (avalon.vmodels.global.temp.users[data.u]) { //优先使用缓存
					setUserInfo(avalon.vmodels.global.temp.users[data.u]);
				} else {
					post('/api/user/user', {
						id: data.u
					}, null, '获取作者信息失败', function (_data) {
						//保存进缓存
						avalon.vmodels.global.temp.users[data.u] = _data;
						setUserInfo(_data);
					});
				}

				//获取作者热门和冷门文章
				if (avalon.vmodels.global.temp.userHotCold[data.u]) { //优先使用缓存
					vm.hot = avalon.vmodels.global.temp.userHotCold[data.u].hot || [];
					vm.cold = avalon.vmodels.global.temp.userHotCold[data.u].cold || [];
				} else {
					post('/api/user/getHotCold', {
						id: data.u
					}, null, '获取作者文章失败', function (_data) {
						//保存进缓存
						avalon.vmodels.global.temp.userHotCold[data.u] = _data;
						vm.hot = _data.hot || [];
						vm.cold = _data.cold || [];
					});
				}

				// 获取类似文章
				vm.$temp.freshSame();

			}, function () { //页面不存在
				avalon.router.navigate('/404');
			});
		}

		$ctrl.$onRendered = function () {
			//实例化markdown编辑器
			vm.$temp.editor = new $("#article #editor").MarkEditor();

			vm.$temp.editor.createDom();

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
					_xsrf: xsrftoken
				},
				onSelect: function (suggestion) {
					vm.addTagInput = suggestion.value;
					vm.addTag();
				}
			});

			// 百度图话
			(function () {
				if (!vm.$tuhua) {
					vm.$tuhua = true;

					window.baiduImageTalk = {
						'renderUrl': 'http://bcscdn.baidu.com/public03/imageplus/tuhua/v3/toggle.app.js'
					};
					var s = document.createElement('script');
					s.type = 'text/javascript';
					s.src = 'http://bcscdn.baidu.com/public03/imageplus/tuhua/common_loader.js?cache=' + Math.ceil(new Date() / 3600000);
					document.getElementsByTagName('head')[0].appendChild(s);
				}
			})();
		}
	})
});