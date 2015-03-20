'use strict';

define("index", ['jquery', 'editor', 'jquery.timeago', 'jquery.autocomplete'], function ($) {
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
		tag: false, //是否在编辑标签状态
		addTagInput: '', //新增标签输入框内容
		searchTag: '', //当前搜索的标签（仅在category:tag路由下有效）
		hotTags: [], //热门标签（仅在category:tag路由下有效）
		tagArray: [], //准备发布文章的标签数组
		temp: {
			editor: {},
			from: 0,
			number: 0,
			watchCategory: false, //是否执行category的watch
		},
		toggleTag: function () { // 新增标签输入框组是否显示
			avalon.vmodels.index.tag = !avalon.vmodels.index.tag;

			// 获取焦点
			$('#index #tag-input').focus();
		},
		addTag: function () { // 新增标签
			if (avalon.vmodels.index.addTagInput == '') {
				notice('标签不能为空', 'red');
				return;
			}

			if (avalon.vmodels.index.addTagInput.length > 15) {
				notice('标签最大长度为15', 'red');
				return;
			}

			if (avalon.vmodels.index.tagArray.size() >= 5) {
				notice('最多5个标签', 'red');
				return;
			}

			//是否重复
			if ($.inArray(avalon.vmodels.index.addTagInput, avalon.vmodels.index.tagArray.$model) != -1) {
				notice('标签不能重复', 'red');
				return;
			}

			avalon.vmodels.index.tagArray.push(avalon.vmodels.index.addTagInput);

			// 输入框置空
			avalon.vmodels.index.addTagInput = '';

			// 取消新增状态
			avalon.vmodels.index.tag = false;
		},
		RemoveTag: function (name) {
			avalon.vmodels.index.tagArray.remove(name);
		},
		submit: function () { //提交
			//如果用户没有登陆，触发登陆模块
			if (!avalon.vmodels.global.myLogin) {
				avalon.vmodels.global.github();
				return;
			}

			if (avalon.vmodels.index.inputTitle.length > 25) {
				noticle('标题最长25', 'red');
				return;
			}

			if (avalon.vmodels.index.inputContent.length < 3 || avalon.vmodels.index.inputContent.length > 50000) {
				notice('内容长度3-50000', 'red');
				return;
			}

			post('/api/article/add', {
				title: avalon.vmodels.index.inputTitle,
				content: avalon.vmodels.index.inputContent,
				category: avalon.vmodels.index.inputCategory,
				tag: avalon.vmodels.index.tagArray.$model,
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

			//初始化
			avalon.vmodels.index.searchTag = "";

			var postUrl = '/api/article/list';
			var postParams = {
				category: state.query.category,
				from: state.query.from,
				number: state.query.number,
			};

			if (state.query.tag != undefined) {
				avalon.vmodels.index.searchTag = state.query.tag;

				postUrl = '/api/tag/getList';

				postParams = {
					from: state.query.from,
					number: state.query.number,
					tag: state.query.tag,
				};

				// 查询热门标签
				post('/api/tag/hot', null, null, '', function (data) {
					avalon.vmodels.index.hotTags = data;
				});
			}

			//获得文章列表
			post(postUrl, postParams, null, '获取信息失败：', function (data) {
				// 解析回复作者信息
				var articleMembers = {};
				data.members = data.members || [];
				for (var i = 0, j = data.members.length; i < j; i++) {
					articleMembers[data.members[i]._id] = data.members[i];
				}

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

					// 设置作者信息
					data.lists[key].ua = articleMembers[data.lists[key].u].a;
					data.lists[key].ur = articleMembers[data.lists[key].u].r;
					data.lists[key].un = articleMembers[data.lists[key].u].n;
					data.lists[key].ui = articleMembers[data.lists[key].u].i;

					// 设置最后回复者信息
					data.lists[key].li = data.lists[key].l == "" ? "" : articleMembers[data.lists[key].l].i; // last image
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
			avalon.vmodels.index.temp.editor = new $("#index #editor").MarkEditor();

			avalon.vmodels.index.temp.editor.createDom();

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

			//获取xsrftoken
			var xsrf = $.cookie("_xsrf");
			if (!xsrf) {
				return;
			}
			var xsrflist = xsrf.split("|");
			var xsrftoken = Base64.decode(xsrflist[0]);

			// 搜索标签自动完成
			$('#index #tag-input').autocomplete({
				serviceUrl: '/api/tag/searchTag',
				type: 'post',
				deferRequestBy: 300,
				params: {
					_xsrf: xsrftoken,
				},
				onSelect: function (suggestion) {
					avalon.vmodels.index.addTagInput = suggestion.value;
					avalon.vmodels.index.addTag();
				}
			});
		},
		$skipArray: ['onChange', 'onAfterLoad', 'temp'],
	});
});