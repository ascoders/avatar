define('editor', ['jquery', 'marked', 'prettify', 'jquery.jbox', 'jquery.selection', 'jquery.autosize'], function ($, marked, prettify) {
	$.fn.MarkEditor = function (options) {
		//参数
		var opts = $.extend({}, $.fn.MarkEditor.defaults, options);
		var _this = this;

		/* 初始化 */

		//添加容器
		_this.wrap("<div class='f-cb edit-box'></div>").addClass('f-w12 f-btn f-mb10'); //添加容器

		//整体容器
		var box = _this.parent();

		//预览框父级
		var previewBox = $('<div/>')
			.addClass('f-usn')
			.appendTo(box);

		//预览框
		var preview = $('<div/>')
			.addClass('f-w12 f-p20 preview border-bottom')
			.appendTo(previewBox); //预览

		//工具栏
		var tools = $('<div/>')
			.addClass('f-wm tool-bar')
			.prependTo(box);
		_this.autosize(); //自动拓展高度

		//记录上一刻鼠标Y轴位置
		var lastY;

		//渲染模式
		var render = 0; //0:实时渲染 1:延时渲染

		//判断渲染模式数组，每3次取一个平均值判断是否渲染过慢
		var renderTime = new Array();

		//延时渲染的timeout
		var renderTimeout = null;

		//tabOverride.tabSize(4).autoIndent(true).set(_this); //tab键

		//是否支持markdown
		var markdown = true;

		//设置按钮
		var buttons = {
			"header": "标题",
			"bold": "加粗",
			"italic": "斜体",
			"link": "超链接",
			"quote-left": "引用",
			"code": "代码块",
			"tag": "标签",
			"list-ol": "有序列表",
			"list-ul": "无序列表",
			"minus": "分割线",
			"image": "图片",
			"table": "表格",
			'save': '保存草稿',
			'paste': '恢复草稿'
		};

		// 草稿
		var lastDraft;
		var draftInterval = null;

		this.createDom = function () { // 刷新dom
			// ie7及其以下没有此功能
			if (ieVersion() != false && ieVersion() <= 7) {
				$(tools).remove();
				return;
			}

			for (var key in buttons) {
				var button = $("<div/>")
					.addClass('i f-hvc effect fa fa-' + key)
					.attr('type', key)
					.appendTo(tools);

				button.jBox('Tooltip', {
					content: buttons[key]
				});

				switch (key) {
				case 'header':
					button.addClass('j-ul-list');
					var ul = $("<ul/>").appendTo(button).addClass('f-bln');
					var headers = [
						"h1", "h2", "h3", "h4", "h5", "h6"
					];
					for (var item in headers) {
						var li = $("<li/>").appendTo(ul).addClass('effect');
						li.text(headers[item]).attr("type", headers[item]);
					}
					break;
				case 'table':
					button.addClass('j-table').removeAttr('type');
					var table = $("<table/>").appendTo(button);
					for (var i = 0; i < 6; i++) {
						var tr = $("<tr/>").appendTo(table);
						for (var j = 0; j < 6; j++) {
							var td = $("<td/>").appendTo(tr).addClass('effect').attr('type', 'table');
						}
					}
					break;
				case 'image': //图片上传
					// ie8及其以下没有此功能
					if (ieVersion() != false && ieVersion() <= 8) {
						break;
					}

					createDropzone(button[0], 'http://upload.qiniu.com', opts.uploadParams, ".jpg,.jpeg,.png,.gif,.ico", function (data, file) {
						// 过滤图片名的[ ] ( )
						var fileName = file.name.replace(/[\[\]\(\)]/g, '*')

						_this.selection('insert', {
							text: '\n![' + fileName + '](http://avatar.img.wokugame.com/' + data.name + ')',
							mode: 'before'
						});
						//刷新视图
						freshPreview();
					});

					break;
				}
			}

			//右侧标注
			var button = $("<div/>")
				.addClass('i effect fa fa-maxcdn f-fr')
				.attr('id', 'markdown-enable')
				.appendTo(tools);

			button.jBox('Tooltip', {
				content: "markdown 语法支持"
			});

			// 监听草稿
			if (draftInterval == null) {
				draftInterval = setInterval(function () {
					// textarea不在页面中，移除监听
					if (!$.contains(document, _this[0])) {
						clearInterval(draftInterval);
						draftInterval = null;
					}

					save();
				}, 5000);
			}
		}

		/* --------------- createDom end -------------------- */

		//响应下拉菜单工具
		$(document).on('mouseenter mouseleave', ".j-ul-list", function (e) {
			switch (e.type) {
			case 'mouseenter':
				$(this).find("ul").show();
				break;
			case 'mouseleave':
				$(this).find("ul").hide();
				break;
			}
		});

		//响应表格下拉列表
		$(document).on('mouseenter mouseleave', ".j-table", function (e) {
			switch (e.type) {
			case 'mouseenter':
				$(this).find("table").show();
				break;
			case 'mouseleave':
				$(this).find("table").hide();
				break;
			}
		});

		$(document).on('mouseenter mouseleave', ".j-table .effect", function (e) {
			var _this = this;
			switch (e.type) {
			case 'mouseenter':
				$(_this).parent().parent().find("td").removeClass('active error');
				var col = $(_this).index();
				var row = $(_this).parent().index();
				var clas = 'active';
				if (col == 0 || row == 0) {
					clas = 'error';
				}
				$(_this).parent().parent().find("tr:lt(" + (row + 1) + ")").each(function () {
					$(this).find("td:lt(" + (col + 1) + ")").addClass(clas);
				});
				break;
			case 'mouseleave':
				$(_this).parent().parent().find("td").removeClass('active error');
				break;
			}
		});

		//点击工具按钮
		$(document).on('click', ".tool-bar .effect", function () {
			switch ($(this).attr('type')) {
			case 'bold':
				_this.selection('insert', {
					text: '**',
					mode: 'before'
				});
				_this.selection('insert', {
					text: '**',
					mode: 'after'
				});
				break;
			case 'italic':
				_this.selection('insert', {
					text: '*',
					mode: 'before'
				});
				_this.selection('insert', {
					text: '*',
					mode: 'after'
				});
				break;
			case 'link':
				_this.selection('insert', {
					text: '[',
					mode: 'before'
				});
				_this.selection('insert', {
					text: '](http://)',
					mode: 'after'
				});
				break;
			case 'quote-left':
				_this.selection('insert', {
					text: '> ',
					mode: 'before'
				});
				break;
			case 'code':
				_this.selection('insert', {
					text: '````\n',
					mode: 'before'
				});
				_this.selection('insert', {
					text: '\n````',
					mode: 'after'
				});
				break;
			case 'tag':
				_this.selection('insert', {
					text: '`',
					mode: 'before'
				});
				_this.selection('insert', {
					text: '`',
					mode: 'after'
				});
				break;
			case 'list-ol':
				_this.selection('insert', {
					text: '1. ',
					mode: 'before'
				});
				break;
			case 'list-ul':
				_this.selection('insert', {
					text: '- ',
					mode: 'before'
				});
				break;
			case 'minus':
				var content = "\n\n---";
				var lastLine = getLineContent(0);
				if (lastLine == "") {
					content = "\n---"
				}
				_this.selection('insert', {
					text: content,
					mode: 'before'
				});
				break;
			case 'h1':
				_this.selection('insert', {
					text: '# ',
					mode: 'before'
				});
				_this.selection('insert', {
					text: ' #',
					mode: 'after'
				});
				break;
			case 'h2':
				_this.selection('insert', {
					text: '## ',
					mode: 'before'
				});
				_this.selection('insert', {
					text: ' ##',
					mode: 'after'
				});
				break;
			case 'h3':
				_this.selection('insert', {
					text: '### ',
					mode: 'before'
				});
				_this.selection('insert', {
					text: ' ###',
					mode: 'after'
				});
				break;
			case 'h4':
				_this.selection('insert', {
					text: '#### ',
					mode: 'before'
				});
				_this.selection('insert', {
					text: ' ####',
					mode: 'after'
				});
				break;
			case 'h5':
				_this.selection('insert', {
					text: '##### ',
					mode: 'before'
				});
				_this.selection('insert', {
					text: ' #####',
					mode: 'after'
				});
				break;
			case 'h6':
				_this.selection('insert', {
					text: '###### ',
					mode: 'before'
				});
				_this.selection('insert', {
					text: ' ######',
					mode: 'after'
				});
				break;
			case 'table':
				var col = $(this).index();
				var row = $(this).parent().index();
				if (col == 0 || row == 0) {
					break;
				}
				var text = "\n";
				for (var i = 0; i < row + 1; i++) {
					var cols = new Array();
					for (var j = 0; j < col + 1; j++) {
						if (i == 0) {
							cols.push(' `           ');
						} else {
							cols.push('             ');
						}
					}
					text += cols.join('|') + "\n";
					if (i == 0) { //表格分割线
						for (var j = 0; j < col + 1; j++) {
							text += "-----------";
							if (j != col) {
								text += "|";
							}
						}
						text += "\n";
					}
				}
				_this.selection('insert', {
					text: text,
					mode: 'after'
				});
				break;
			case 'save':
				save();
				break;
			case 'paste':
				load();
				break;
			}

			//如果是li，父级隐藏
			if ($(this).is('li')) {
				$(this).parent().hide();
			}

			//如果是td，父级隐藏
			if ($(this).is('td')) {
				$(this).parents('table').first().hide();
			}

			//textarea刷新高度
			_this.trigger('autosize.resize');

			//刷新视图
			freshPreview();
		});

		//设置markdown解析格式
		marked.setOptions({
			gfm: true,
			tables: true,
			breaks: true,
			pedantic: false,
			sanitize: true,
			smartLists: false,
			silent: false,
			langPrefix: 'prettyprint',
			smartypants: false,
			headerPrefix: '',
			xhtml: false
		});

		/* ************** *
		 * ** 方法函数 ** *
		 * ************** */

		//刷新预览视图
		function freshPreview() {
			if (!markdown) {
				return;
			}

			if (_this.val() == "") {
				_this.removeClass('f-w6').addClass('f-w12');
				preview.hide();

				//编辑区也刷新高度
				_this.trigger('autosize.resize');

				//预览框父级同步高度为自由
				previewBox.css('height', 'auto');
				return;
			}

			if (render == 0) { //实时渲染
				doRender();
			} else if (render == 1) { //延时渲染
				if (renderTimeout != null) {
					clearTimeout(renderTimeout); //每次有输入都清除timeout执行
				}

				renderTimeout = setTimeout(doRender, 300);
			}

			//如果视图高于500px，改变显示方式
			if (preview.height() > 500) {
				_this.removeClass('f-w12').addClass('f-w6');
				preview.removeClass('border-bottom').addClass('border-right');
				previewBox.addClass('f-w6 f-drag').removeClass('f-w12');

				//预览框父级同步高度
				previewBox.css('height', (_this.height() + 21) + 'px');
			} else { //复原
				//别忘了把预览框重置到顶层
				preview.css('margin-top', '0px');

				_this.removeClass('f-w6').addClass('f-w12');
				preview.removeClass('border-right').addClass('border-bottom');
				previewBox.addClass('f-w12').removeClass('f-w6 f-drag');

				//预览框父级同步高度为自由
				previewBox.css('height', 'auto');
			}

			preview.show();

			//编辑区刷新高度
			_this.trigger('autosize.resize');
		}

		function doRender() { //执行渲染，耗时
			//计算代码耗时：开始
			var start = new Date().getTime();

			preview.html(marked(_this.val()));

			//代码高亮
			$('pre').addClass('prettyprint pre-scrollable linenums');
			prettify.prettyPrint();

			//计算代码耗时：结束
			var end = new Date().getTime();

			//计算平均耗时
			var cost = 0;
			renderTime.push(end - start);

			if (renderTime.length > 3) {
				//计算平均耗时
				cost = (renderTime[0] + renderTime[1] + renderTime[2]) / 3;

				renderTime = [];

				//时差大于30毫秒判定为执行缓慢
				if (cost > 30 && render < 1) {
					notice('文档过长，切换到延时渲染');
					render = 1;
				} else if (cost < 15 && render != 0) {
					notice('恢复实时渲染');
					render = 0;
				}
			}
		}

		// 是否支持markdown语法
		this.enableMarkdown = function (ok) {
			markdown = ok;
			if (!ok) {
				tools.hide();
				_this.removeClass('f-w6').addClass('f-w12');
				_this.removeClass('f-btn');
				preview.hide();
			} else {
				tools.show();
				_this.addClass('f-btn');
				preview.show();
			}
		}

		// 获得当前行的内容 0:当前行 1:上一行
		var getLineContent = function (line) {
			var selectStart = _this.selection('getPos').start;
			var beforeWords = subStr(_this.val(), 0, selectStart);
			var wordArray = beforeWords.split('\n');
			var lastLine = wordArray[wordArray.length - line - 1];
			return lastLine;
		}

		// 保存草稿
		function save() {
			if (_this.val() != '' && _this.val() != lastDraft) {
				lastDraft = _this.val();

				store.set('editDraft', lastDraft);

				notice('草稿已保存', 'green');
			}
		}

		// 获取草稿
		function load() {
			var draft = store.get('editDraft');
			if (draft != '') {
				lastDraft = draft;
				_this.val(draft);
				freshPreview();

				notice('已恢复草稿', 'green');
			}
		}

		/* ************** *
		 * ** 事件监听 ** *
		 * ************** */

		//输入框按键监听
		_this.on("keyup keydown", function (e) {
			if (e.keyCode == 13 && e.type == "keyup") {
				var lastLine = getLineContent(1);

				if (subStr(lastLine, 0, 2) == "> " && subStr(lastLine, 2, 3) != "") {
					_this.selection('insert', {
						text: '> ',
						mode: 'before'
					});
				}

				if (subStr(lastLine, 0, 3) == "1. " && subStr(lastLine, 3, 4) != "") {
					_this.selection('insert', {
						text: '1. ',
						mode: 'before'
					});
				}

				if (subStr(lastLine, 0, 2) == "- " && subStr(lastLine, 2, 3) != "") {
					_this.selection('insert', {
						text: '- ',
						mode: 'before'
					});
				}
			}

			if (e.type == "keyup") {
				freshPreview();
			}
		});

		//预览框父级鼠标点击
		previewBox.on("mousedown", function (e) {
			//如果预览框未在右侧，则退出
			if (previewBox.hasClass('f-w12')) {
				return;
			}

			lastY = e.pageY;

			//增加拖拽中状态
			previewBox.addClass('f-dragging');
		});

		//鼠标松开
		$(document).on("mouseup", function () {
			//如果预览框未在右侧，则退出
			if (previewBox.hasClass('f-w12')) {
				return;
			}

			//增加拖拽中状态
			previewBox.removeClass('f-dragging');
		});

		//鼠标移动
		$(document).on("mousemove", function (e) {
			//如果预览框父级不在状态“拖拽中”，则退出
			if (!previewBox.hasClass('f-dragging')) {
				return;
			}

			//如果预览框比预览框父级短，则退出
			if (preview.height() < previewBox.height()) {
				return;
			}

			//鼠标Y轴与点击那一刻的偏移量
			var offset = e.pageY - lastY;
			lastY = e.pageY;

			//预览框位移
			var marginTop = parseInt(preview.css("margin-top").replace('px', ''));
			preview.css('margin-top', (marginTop + offset) + 'px');
		});

		//窗体滚动时触发逻辑
		$(window).scroll(function () {
			//自身被隐藏时无效
			if (box.is(':hidden')) {
				return;
			}

			//不允许markdown语法时无效
			if (!markdown) {
				return;
			}

			//是否隐藏导航条
			if (box.offset().top - $(window).scrollTop() <= 30) {
				if ($(window).scrollTop() - _this.offset().top - _this.height() > -200) { //如果距离编辑框底部太短
					forceHideNav = false;
				} else {
					forceHideNav = true;
				}
			} else {
				forceHideNav = false;
			}

			//调整编辑框按钮区域位置
			if (box.offset().top - $(window).scrollTop() <= 0) { //按钮接触到了顶部以下

				if ($(window).scrollTop() - _this.offset().top - _this.height() > -200) { //如果距离编辑框底部太短，编辑框不会跟随移动
					tools.css("position", "absolute").css("top", (_this.height() + _this.offset().top - 350) + "px");
				} else {
					tools.css("position", "fixed").css("top", "0").css("width", (box.width() + 1) + "px");
				}
			} else { // 重置位置
				tools.removeAttr("style");
			}

			//如果预览框被显示到了右侧
			if (preview.hasClass('f-w6')) {

			}
		});

		return this;
	}

	$.fn.MarkEditor.defaults = {
		uploadUrl: '',
		uploadParams: []
	};
});