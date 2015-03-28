'use strict';

define("index", ['jquery', 'editor', 'jquery.timeago', 'jquery.autocomplete'], function ($) {
	var vm = avalon.define({
		$id: "index",
		categorys: {
			'<i class="fa fa-th f-mr5"></i>全部': '-1',
			'<i class="fa fa-comments f-mr5"></i>问答': '0',
			'<i class="fa fa-share-alt f-mr5"></i>分享': '1',
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
		number: 20, // 每页显示数量
		temp: {
			editor: {},
			from: 0,
			watchCategory: false, //是否执行category的watch
		},
		changeNumber: function (val) { // 改变每页显示数量
			//跳转
			avalon.router.go('index', {
				query: {
					number: val,
					category: vm.category,
				},
			});
		},
		toggleTag: function () { // 新增标签输入框组是否显示
			vm.tag = !vm.tag;

			// 获取焦点
			$('#index #tag-input').focus();
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

			if (vm.tagArray.size() >= 5) {
				notice('最多5个标签', 'red');
				return;
			}

			//是否重复
			if ($.inArray(vm.addTagInput, vm.tagArray.$model) != -1) {
				notice('标签不能重复', 'red');
				return;
			}

			vm.tagArray.push(vm.addTagInput);

			// 输入框置空
			vm.addTagInput = '';

			// 取消新增状态
			vm.tag = false;
		},
		RemoveTag: function (name) {
			vm.tagArray.remove(name);
		},
		submit: function () { //提交
			//如果用户没有登陆，触发登陆模块
			if (!avalon.vmodels.global.myLogin) {
				avalon.vmodels.global.github();
				return;
			}

			if (vm.inputTitle.length > 25) {
				noticle('标题最长25', 'red');
				return;
			}

			if (vm.inputContent.length < 3 || vm.inputContent.length > 50000) {
				notice('内容长度3-50000', 'red');
				return;
			}

			post('/api/article/add', {
				title: vm.inputTitle,
				content: vm.inputContent,
				category: vm.inputCategory,
				tag: vm.tagArray.$model,
			}, '发布成功', '', function (data) {
				//清空输入内容
				vm.inputTitle = '';
				vm.inputContent = '';

				//跳转到此文章页
				avalon.router.navigate('/art/' + data);
			});
		},
		rendered: function () { //列表渲染完毕
			$('.timeago').timeago();
		},
		changeCategory: function (val) { // 修改分类
			if (val == vm.category && vm.searchTag == '') {
				return;
			}

			//跳转
			avalon.router.go('index', {
				query: {
					category: val,
					from: 0,
					number: vm.number,
				},
			});
		},
		$skipArray: ['temp'],
	});

	return avalon.controller(function ($ctrl) {
		// $ctrl.$vmodels = [vm];

		$ctrl.$onEnter = function (param, rs, rj) {
			mmState.query.from = mmState.query.from || 0;
			mmState.query.number = mmState.query.number || 20;
			vm.number = mmState.query.number;
			mmState.query.category = mmState.query.category || -1;

			vm.temp.watchCategory = false;
			vm.category = mmState.query.category;
			vm.temp.watchCategory = true;

			//初始化
			vm.searchTag = "";

			var postUrl = '/api/article/list';
			var postParams = {
				category: mmState.query.category,
				from: mmState.query.from,
				number: mmState.query.number,
			};

			if (mmState.query.tag != undefined) {
				vm.searchTag = mmState.query.tag;

				postUrl = '/api/tag/getList';

				postParams = {
					from: mmState.query.from,
					number: mmState.query.number,
					tag: mmState.query.tag,
				};

				// 查询热门标签
				post('/api/tag/hot', null, null, '', function (data) {
					vm.hotTags = data;
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

				vm.lists = data.lists || [];

				var paginParams = {};

				if (mmState.query.tag === undefined) {
					paginParams.category = mmState.query.category;
				} else {
					paginParams.tag = mmState.query.tag;
				}

				//生成分页
				vm.pagin = createPagin(mmState.query.from, mmState.query.number, data.count, paginParams);
			});
		}

		$ctrl.$onRendered = function () {
			//实例化markdown编辑器
			vm.temp.editor = new $("#index #editor").MarkEditor();

			vm.temp.editor.createDom();

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
					vm.addTagInput = suggestion.value;
					vm.addTag();
				}
			});
		}
	})
});