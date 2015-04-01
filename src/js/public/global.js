'use strict';

///////////////////////////////////////////////////////////////////////////////////////////////
// avalon
///////////////////////////////////////////////////////////////////////////////////////////////

//改变模板标签
avalon.config({
	interpolate: ["{[{", "}]}"]
});

// 过滤markdown标签
avalon.filters.cleanmark = function (str) { //str为管道符之前计算得到的结果，默认框架会帮你传入，此方法必须返回一个值
	// 移除所有 * ` [ ] # - >
	str = str
		.replace(/[!.*](.*)/g, "【图片】")
		.replace(/\*/g, "")
		.replace(/\`/g, "")
		.replace(/\[/g, "")
		.replace(/\]/g, "")
		.replace(/\#/g, "")
		.replace(/\-/g, "")
		.replace(/\>/g, "");

	return str;
};

// 计算用户等级 
avalon.filters.setLevel = function (str) { // 发布*2 评论*1
	var result = '草民';
	var levels = ['皇帝', '总督', '巡抚', '侍郎', '村长', '草民'];
	var numbers = [1000, 400, 200, 40, 6, 0];

	for (var i = 0, j = numbers.length; i < j; i++) {
		if (str >= numbers[i]) {
			result = levels[i];
			break;
		}
	}

	return result;
};

require.config({
	baseUrl: "/static/",
	paths: {
		"jquery": "http://cdn.bootcss.com/jquery/1.11.2/jquery.min",
		"jQuery": "http://cdn.bootcss.com/jquery/1.11.2/jquery.min",
		"jquery.timeago": "http://cdn.bootcss.com/jquery-timeago/1.4.0/jquery.timeago.min", //友好时间
		"jquery.ui": "http://cdn.bootcss.com/jqueryui/1.10.4/jquery-ui.min", //jquery-ui
		"jquery.autosize": "http://cdn.bootcss.com/autosize.js/1.18.15/jquery.autosize.min", //textarea大小自适应高度
		"jquery.selection": "http://cdn.bootcss.com/jquery.selection/1.0.1/jquery.selection.min", //表单选择
		"jquery.qrcode": "http://cdn.bootcss.com/jquery.qrcode/1.0/jquery.qrcode.min", //二维码
		"jquery.cookie": "http://cdn.bootcss.com/jquery-cookie/1.4.1/jquery.cookie", //操作cookie
		"jquery.autocomplete": "http://cdn.bootcss.com/jquery.devbridge-autocomplete/1.2.7/jquery.devbridge-autocomplete.min", //输入框自动补全
		"dropzone": "http://cdn.bootcss.com/dropzone/3.12.0/dropzone-amd-module.min", //拖拽上传
		"prettify": "http://cdn.bootcss.com/prettify/r298/prettify.min", //code美化
		"chart": "http://cdn.bootcss.com/Chart.js/1.0.1-beta.2/Chart.min", //表格
		"md5": "http://cdn.bootcss.com/blueimp-md5/1.1.0/js/md5.min", //md5加密
		"jquery.tree": "js/public/jquery.treeview", //tree树状结构
		"jquery.typetype": "js/public/jquery.typetype", //模拟输入
		"jquery.taboverride": "js/public/taboverride", //tab键变为缩进
		"contextMenu": "js/public/jquery.contextMenu", //右键菜单
		"jquery.jbox": "js/public/jBox", //迷你提示框
		"marked": "js/public/marked", //markdown解析器
		"editor": "js/public/editor", //编辑器
		"frontia": "js/public/baidu.frontia.1.0.0", //百度社会化组件
		"mmState": 'js/public/mmState',
		"mmRouter": 'js/public/mmRouter',
		"mmHistory": 'js/public/mmHistory',
		"mmPromise": 'js/public/mmPromise'
	},
	shim: {
		'jquery.timeago': {
			deps: ['jquery']
		},
		'jquery.ui': {
			deps: ['jquery']
		},
		'jquery.jbox': {
			deps: ['jquery']
		},
		'jquery.autosize': {
			deps: ['jquery']
		},
		'jquery.taboverride': {
			deps: ['jquery']
		},
		'jquery.selection': {
			deps: ['jquery']
		},
		'jquery.qrcode': {
			deps: ['jquery']
		},
		'jquery.typetype': {
			deps: ['jquery']
		},
		'md5': {
			exports: 'md5'
		},
		'frontia': {
			exports: 'baidu.frontia'
		},
		'contextMenu': {
			deps: ['jquery']
		}
	}
});

///////////////////////////////////////////////////////////////////////////////////////////////
// 自定义函数
///////////////////////////////////////////////////////////////////////////////////////////////

//封装提示框
function notice(text, color) {
	require(['jquery', 'jquery.jbox'], function ($) {
		new jBox('Notice', {
			content: text,
			attributes: {
				x: 'right',
				y: 'bottom'
			},
			animation: 'flip',
			color: color
		});
	});
}

//封装选择框
function confirm(content, callback) {
	require(['jquery', 'jquery.jbox'], function ($) {
		var myModal = new jBox('Confirm', {
			minWidth: '200px',
			content: content,
			animation: 'flip',
			confirmButton: '确定',
			cancelButton: '取消',
			confirm: function () {
				callback();
			}
		});

		myModal.open();
	});
}

//创建分页DOM内容
function createPagin(from, number, count, params) {
	//计算总页数
	if (count == 0) {
		return '';
	}
	var allPage = Math.ceil(parseFloat(count) / parseFloat(number));

	//如果总页数是1，返回空
	if (allPage == 1) {
		return '';
	}

	//当前页数
	var page = 1;

	from = parseInt(from);
	number = parseInt(number);

	if (from != 0) {
		page = from / number + 1;
	}

	//中间内容
	var list = "";

	//附加参数
	var paramString = '';
	for (var key in params) {
		paramString += '&' + key + '=' + params[key];
	}


	var path = window.location.pathname + '?number=' + number + paramString;

	//根据页数计算from
	var _from = function (i) {
		return ((i - 1) * number);
	}

	//首部箭头
	if (page == 1) {
		list += "<li><a class='disabled f-bln' href='#'><i class='fa fa-arrow-left'></i></a></li>";
	} else {
		list += "<li><a class='f-bln' href='#!" + path + "&from=" + (from - number) + "'><i class='fa fa-arrow-left'></i></a></li>";
	}

	//中间部分
	if (allPage < 7) {
		for (var i = 1; i <= allPage; i++) {
			if (i == page) {
				list += "<li><a class='active' href='#'>" + i + "</a></li>";
			} else {
				list += "<li><a href='#!" + path + "&from=" + _from(i) + "'>" + i + "</a></li>";
			}
		}
	} else {
		if (page < 6) {
			for (var i = 1; i <= 6; i++) {
				if (i == page) {
					list += "<li><a class='active' href='#'>" + i + "</a></li>";
				} else {
					list += "<li><a href='#!" + path + "&from=" + _from(i) + "'>" + i + "</a></li>";
				}
			}
			list += "<li><a class='disabled' href='#'>...</a></li>";
			list += "<li><a href='#!" + path + "&from=" + _from(allPage) + "'>" + allPage + "</a></li>";
		} else {
			list += "<li><a href='#!" + path + "&from=" + _from(1) + "'>1</a></li>";
			list += "<li><a href='#!" + path + "&from=" + _from(2) + "'>2</a></li>";
			list += "<li><a class='disabled' href='#'>...</a></li>";
			if (allPage - page < 6) {
				for (var i = allPage - 6; i <= allPage; i++) {
					if (i == page) {
						list += "<li><a class='active' href='#'>" + i + "</a></li>";
					} else {
						list += "<li><a href='#!" + path + "&from=" + _from(i) + "'>" + i + "</a></li>";
					}
				}
			} else {
				for (var i = page - 2; i <= page + 3; i++) {
					if (i == page) {
						list += "<li><a class='active' href='#'>" + i + "</a></li>";
					} else {
						list += "<li><a href='#!" + path + "&from=" + _from(i) + "'>" + i + "</a></li>";
					}
				}
				list += "<li><a class='disabled' href='#'>...</a></li>";
				list += "<li><a href='#!" + path + "&from=" + _from(allPage - 1) + "'>" + (allPage - 1) + "</a></li>";
				list += "<li><a href='#!" + path + "&from=" + _from(allPage) + "'>" + allPage + "</a></li>";
			}
		}
	}

	//末尾箭头
	if (page == allPage) {
		list += "<li><a class='disabled f-brn' href='javascript:void(0);'><i class='fa fa-arrow-right'></i></a></li>";
	} else {
		list += "<li><a class='f-brn' href='#!" + path + "&from=" + (from + number) + "'><i class='fa fa-arrow-right'></i></a></li>";
	}

	return "<ul class='g-pa f-pr'>" + list + "</ul>";
}

//调整用户头像图片路径
function userImage(str) {
	if (str != undefined && str != "") {
		if (!isNaN(str)) {
			return "/static/img/user/" + str + ".jpg";
		}
		return str;
	}
	return;
}

//自带_xsrf的post提交，整合了error处理
function post(url, params, success, error, callback, errorback) {
	require(['jquery', 'jquery.cookie'], function ($) {
		//获取xsrftoken
		var xsrf = $.cookie("_xsrf");
		if (!xsrf) {
			return;
		}
		var xsrflist = xsrf.split("|");
		var xsrftoken = Base64.decode(xsrflist[0]);

		var postParam = {
			_xsrf: xsrftoken
		};
		postParam = $.extend(postParam, params);

		return $.ajax({
				url: url,
				type: 'POST',
				traditional: true, //为了传数组
				data: postParam
			})
			.done(function (data) {
				if (data.ok) { //操作成功
					if (success !== null) {
						notice(success, 'green');
					}
					//执行回调函数
					if (callback != null) {
						callback(data.data);
					}
				} else { //操作失败
					if (error !== null) {
						notice(error + data.data, 'red');
					}
					if (errorback != null) {
						errorback(data.data);
					}
				}
			});
	});
}

//字符串截取方法，支持中文
function subStr(str, start, end) {
	var _start = 0;
	for (var i = 0; i < start; i++) {
		if (escape(str.charCodeAt(i)).indexOf("%u") >= 0) {
			_start += 2;
		} else {
			_start += 1;
		}
	}
	var _end = _start;
	for (var i = start; i < end; i++) {
		if (escape(str.charCodeAt(i)).indexOf("%u") >= 0) {
			_end += 2;
		} else {
			_end += 1;
		}
	}
	var r = str.substr(_start, _end);
	return r;
}

//dropzone统一外包一层规范
function createDropzone(obj, url, params, accept, callback) {
	require(['jquery', 'dropzone', 'md5', 'jquery.jbox'], function ($, Dropzone, md5) {
		//上传框组
		var modals = {};

		//实例化dropzone
		return new Dropzone(obj, {
			url: url,
			maxFiles: 10,
			maxFilesize: 0.5,
			method: 'post',
			acceptedFiles: accept,
			autoProcessQueue: false,
			init: function () {
				//事件监听
				this.on("addedfile", function (file) {
					//实例化上传框
					modals[md5(file.name)] = new jBox('Notice', {
						attributes: {
							x: 'left',
							y: 'bottom'
						},
						title: '上传 ' + file.name + ' 中..',
						theme: 'NoticeBorder',
						color: 'black',
						animation: {
							open: 'slide:bottom',
							close: 'slide:left'
						},
						autoClose: false,
						closeOnClick: false,
						onCloseComplete: function () {
							this.destroy();
						}
					});

					var _this = this;

					//获取上传到七牛的token
					post('/api/qiniu/createUpToken', params, null, '', function (data) {
						_this.options.params['token'] = data;

						// 开始上传
						_this.processQueue();
					}, function () { //失败撤销上传框
						modals[md5(file.name)].close();
					});
				});
				this.on("thumbnail", function (file, img) { //文件内容,缩略图base64
					//如果模态框被关闭,return
					if (!modals[md5(file.name)]) {
						return;
					}

					// 给缩略图赋值
					modals[md5(file.name)].setContent('<img src="' + img + '"><br><div class="progress" style="margin:10px 0 0 0"><div class="progress-bar" id="upload' + md5(file.name) + '" style="min-width:5%;">0%</div></div><br>尺寸: ' + file.width + ' × ' + file.height + ' &nbsp;&nbsp;大小: ' + (file.size / 1000).toFixed(1) + ' Kb<br>');
				});
				this.on("error", function (file, err) {
					notice(err.toString(), 'red');

					//如果模态框被关闭,return
					if (!modals[md5(file.name)]) {
						return;
					}

					//模态框关闭
					modals[md5(file.name)].close();
					modals[md5(file.name)] = null;
				});
				this.on("uploadprogress", function (file, process, size) {
					//如果模态框被关闭,return
					if (!modals[md5(file.name)]) {
						return;
					}

					process = process.toFixed(2);

					if (process == 100) {
						process = 99;
					}

					$('#upload' + md5(file.name)).css('width', process + "%").text(process + '%');
				});
				this.on("success", function (file, data) {
					notice('上传成功', 'green');

					//如果模态框被关闭,return
					if (!modals[md5(file.name)]) {
						return;
					}

					$('#upload' + md5(file.name)).css('width', "100%").text('100%');

					setTimeout(function () {
						//如果模态框被关闭,return
						if (!modals[md5(file.name)]) {
							return;
						}
						//模态框关闭
						modals[md5(file.name)].close();
						modals[md5(file.name)] = null;
					}, 200);

					//触发回调
					callback(data, file);
				});
			}
		});
	});
}

//倒计时
function timediff(element, options, callback) {
	//初始化
	var defaults = {
		second: 0
	};
	var opts = $.extend(defaults, options);
	opts.second = parseInt(opts.second);

	function Run() {
		var day = 0,
			hour = 0,
			minute = 0,
			second = 0; //时间默认值   

		if (opts.second > 0) {
			day = Math.floor(opts.second / (60 * 60 * 24));
			hour = Math.floor(opts.second / (60 * 60)) - (day * 24);
			minute = Math.floor(opts.second / 60) - (day * 24 * 60) - (hour * 60);
			second = Math.floor(opts.second) - (day * 24 * 60 * 60) - (hour * 60 * 60) - (minute * 60);
		} else if (opts.second == 0) {
			callback();
		}
		if (minute <= 9) minute = '0' + minute;
		if (second <= 9) second = '0' + second;
		element.find("#j-day").html(day + " 天");
		element.find("#j-hour").html(hour + " 时");
		element.find("#j-minute").html(minute + " 分");
		element.find("#j-second").html(second + " 秒");
		opts.second--;
	}

	var inter = setInterval(function () {
		if (!$.contains(document, element[0])) { //dom不存在就停止事件
			clearInterval(inter);
		}
		Run();
	}, 1000);

	Run();
}

// jbox插件渲染dom
function jbox() {
	require(['jquery', 'jquery.jbox'], function ($) {
		// jbox插件
		$('.jbox').each(function () {
			var title = $(this).attr('title');
			if (!title) {
				return;
			}
			$(this).removeAttr('title');
			$(this).jBox('Tooltip', {
				content: title,
				animation: 'zoomIn',
				closeOnMouseleave: true
			});
		});
	});
}

// 判断ie9及其以下版本
function ieVersion() {
	var v = 3,
		div = document.createElement('div'),
		all = div.getElementsByTagName('i');
	while (div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->', all[0]);
	return v > 4 ? v : false;
}

///////////////////////////////////////////////////////////////////////////////////////////////
// 初始化插件
///////////////////////////////////////////////////////////////////////////////////////////////

//初始化timeago组件
require(['jquery', 'jquery.timeago'], function ($) {
	$.timeago.settings.allowFuture = true;
	$.timeago.settings.localeTitle = true;
	$.timeago.settings.strings = {
		prefixAgo: null,
		prefixFromNow: null,
		suffixAgo: "前",
		suffixFromNow: "后",
		inPast: '现在',
		seconds: "<1分钟",
		minute: "1分钟",
		minutes: "%d 分钟",
		hour: "1小时",
		hours: "%d 小时",
		day: "一天",
		days: "%d 天",
		month: "一个月",
		months: "%d 个月",
		year: "一年",
		years: "%d 年",
		wordSeparator: " ",
		numbers: []
	};
});

///////////////////////////////////////////////////////////////////////////////////////////////
// 全局监听
///////////////////////////////////////////////////////////////////////////////////////////////

//导航条
require(['jquery'], function ($) {
	//一级导航条
	$('.m-nav').on('mouseenter mouseleave', '.j-drop', function (event) {
		switch (event.type) {
		case 'mouseenter':
			$(this).find(".j-drop-content").show();
			break;
		case 'mouseleave':
			$(this).find(".j-drop-content").hide();
			break;
		}
	});
	//二级拓展条
	$('.m-nav').on('mouseenter mouseleave', '.j-right-drop', function (event) {
		switch (event.type) {
		case 'mouseenter':
			$(this).find(".j-right-drop-content").show();
			break;
		case 'mouseleave':
			$(this).find(".j-right-drop-content").hide();
			break;
		}
	});
});

// jbox提示
jbox();

///////////////////////////////////////////////////////////////////////////////////////////////
// global - 全局vm
///////////////////////////////////////////////////////////////////////////////////////////////

var global = avalon.define({
	$id: "global",
	my: {}, // 我的信息
	myLogin: false, // 是否已登陆
	avalon: {},
	temp: {
		myDeferred: null, // 我的信息执行状态
		state: '', //当前状态
		users: {}, //保存用户信息
		userHotCold: {} //保存用户热评冷门文章信息
	}, // 缓存
	github: function () { //github登陆按钮
		post('/api/check/setState', null, null, '', function (data) {
			window.location.href = 'https://github.com/login/oauth/authorize?client_id=c6d10825049147370ff2&redirect_uri=http://www.avalon.org.cn/oauth&state=' + data;
		});
	},
	otherLogin: function (name) { // 除github以外，其他第三方登陆
		require(['frontia'], function (frontia) {
			// API key 从应用信息页面获取
			var AK = '6NfcaqlPimQxS9buDbFGG6iP';

			// 在应用管理页面下的 社会化服务 - 基础设置中设置该地址
			var redirect_url = 'http://www.avalon.org.cn/oauth';

			// 初始化 frontia
			frontia.init(AK);

			// 初始化登录的配置
			var options = {
				response_type: 'token',
				media_type: name,
				redirect_uri: redirect_url,
				client_type: 'web'
			};

			// 登录
			frontia.social.login(options);
		});
	},
	emptyObject: function (obj) { //判断对象是否为空
		require(['jquery'], function ($) {
			return $.isEmptyObject(obj);
		});
	},
	getMessage: function () { //获取用户消息

	},
	signout: function () { //退出登陆
		post('/api/check/signout', null, '已退出', null, function (data) {
			global.myLogin = false;
			global.my = {};
			//如果用户在用户信息后台则返回首页
			if (global.temp.state.stateName.indexOf('user') > -1) {
				avalon.router.navigate('/');
			}
		});
	},
	$skipArray: ['emptyObject', 'temp']
});

///////////////////////////////////////////////////////////////////////////////////////////////
// 状态路由
///////////////////////////////////////////////////////////////////////////////////////////////

require(['jquery', 'mmState'], function ($) {
	//获取登陆用户信息
	global.temp.myDeferred = $.Deferred();
	post('/api/check/currentUser', null, null, null, function (data) {
		data.image = userImage(data.image);
		global.my = data;
		global.myLogin = true;
		global.temp.myDeferred.resolve(); // 信息获取完毕 用户已登录
	}, function () {
		global.temp.myDeferred.resolve(); // 信息获取完毕 用户未登录
	});

	//获取avalon信息
	$.ajax({
		url: 'https://api.github.com/repos/RubyLouvre/avalon',
		type: 'GET',
		dataType: "jsonp"
	}).done(function (data) {
		global.avalon = data.data;
	});

	//找不到的页面跳转到404
	avalon.router.error(function () {
		console.log(arguments);
		avalon.router.navigate('/404');
	});

	//模版无法加载跳转404
	avalon.state.config({
		onload: function () {

		},
		onError: function (err) {
			avalon.router.navigate("/404");
		}
	})

	//404
	avalon.state("404", {
		controller: "global",
		url: "/404",
		views: {
			"container": {
				templateUrl: '/static/html/public/404.html'
			}
		}
	});

	//首页
	avalon.state("index", {
		controller: "global",
		url: "/",
		views: {
			"container": {
				templateUrl: '/static/html/index/home.html',
				controllerUrl: ["js/index/index"],
				ignoreChange: function (changeType) {
					if (changeType) return true;
				}
			}
		}
	});

	// 文章页面
	avalon.state("article", {
		controller: "global",
		url: "/art/{id}",
		views: {
			"container": {
				templateUrl: '/static/html/article/article.html',
				controllerUrl: ["js/article/article"],
				ignoreChange: function (changeType) {
					if (changeType) return true;
				}
			}
		}
	});

	// 回调页面
	avalon.state("oauth", {
		controller: "global",
		url: "/oauth",
		views: {
			"container": {
				templateUrl: '/static/html/check/oauth.html',
				controllerUrl: ["js/check/oauth"],
				ignoreChange: function (changeType) {
					if (changeType) return true;
				}
			}
		}
	});

	// 第三方平台二跳地址
	avalon.router.get("/oauth/jump", function () {
		location.href = "https://openapi.baidu.com/social/oauth/2.0/receiver" + location.search;
	});

	// 用户账号
	avalon.state("user", {
		controller: "global",
		url: "/user/{id}",
		views: {
			"container": {
				templateUrl: '/static/html/user/user.html',
				controllerUrl: ["js/user/user"],
				ignoreChange: function (changeType) {
					if (changeType) return true;
				}
			}
		}
	});

	// 用户设置（需用户权限）
	avalon.state("setting", {
		controller: "global",
		url: "/setting",
		views: {
			"container": {
				templateUrl: '/static/html/setting/setting.html',
				controllerUrl: ["js/setting/setting"],
				ignoreChange: function (changeType) {

					if (changeType) return true;
				}
			}
		},
		abstract: true
	});

	// 用户设置 默认
	avalon.state("setting.default", {
		controller: "setting",
		url: "",
		views: {
			"settingContainer": {
				templateUrl: '/static/html/setting/thrid.html',
				controllerUrl: ['js/setting/thrid'],
				ignoreChange: function (changeType) {
					console.log('12312321342343214123123');
					if (changeType) return true;
				}
			}
		}
	});

	avalon.state("setting.settings", {
		controller: "setting",
		url: "/{type}",
		views: {
			"settingContainer": {
				templateUrl: function (param) {
					return '/static/html/setting/' + param.type + '.html';
				},
				controllerUrl: function (param) {
					return ["js/setting/" + param.type];
				},
				ignoreChange: function (changeType) {
					if (changeType) return true;
				}
			}
		}
	});

	// 启动路由
	avalon.history.start({
		basepath: "/",
		html5Mode: true
	});

	// 扫描
	avalon.scan();
});