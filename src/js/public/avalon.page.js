'use strict';

define("page", ["text!../../html/public/avalon.page.html"], function (pageHtml) {

    var vm = avalon.define({
        $id: 'page',
        lists: [],
        show: false,
        page: 1, // 当前页数
        allPage: 1, // 总页数
        pageTo: 1, // 将要跳转到的page（跳转动画使用）
        loading: false,
        jump: function (page, force) { // 跳转到指定page
            if (page < 1) {
                return;
            }

            if (page > vm.allPage) {
                return;
            }

            if (page == vm.page && !force) {
                return;
            }

            vm.loading = true;

            vm.pageTo = page;

            vm.$from = (Number(page) - 1) * vm.$number;

            // 提交请求（外部处理）
            vm.$post();
        },
        $from: 0,
        $number: 10,
        $post: function () {}, // 自定义回调
        $page: pageHtml,
        $fresh: function (count) { // 刷新lists
            // 没有内容，不显示
            if (count == 0) {
                vm.show = false;
                return;
            }

            // 计算总页数
            vm.allPage = Math.ceil(parseFloat(count) / parseFloat(vm.$number));

            if (vm.allPage <= 1) {
                vm.show = false;
                return;
            }

            // 计算当前页数
            vm.page = 1;

            if (vm.$from != 0) {
                vm.page = vm.$from / vm.$number + 1;
            }

            // 计算中间页
            var tempList = [];

            if (vm.allPage < 7) {
                for (var i = 1; i <= vm.allPage; i++) {
                    tempList.push(i);
                }
            } else {
                if (vm.page < 6) {
                    for (var i = 1; i <= 6; i++) {
                        tempList.push(i);
                    }
                    tempList.push(-1);
                    tempList.push(vm.allPage);
                } else {
                    tempList.push(1);
                    tempList.push(2);
                    tempList.push(-1);
                    if (vm.allPage - vm.page < 6) {
                        for (var i = vm.allPage - 6; i <= vm.allPage; i++) {
                            tempList.push(i);
                        }
                    } else {
                        for (var i = vm.page - 2; i <= vm.page + 3; i++) {
                            tempList.push(i);
                        }
                        tempList.push(-1);
                        tempList.push(vm.allPage - 1);
                        tempList.push(vm.allPage);
                    }
                }
            }

            vm.lists.clear();
            vm.lists.pushArray(tempList);

            vm.loading = false;

            // 显示分页
            vm.show = true;
        },
    });

    return vm;
});