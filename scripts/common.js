lazyLoad.require(['https://g.alicdn.com/msui/sm/0.6.2/js/sm.min.js'],function(){
    var userAgent = navigator.userAgent.toLowerCase();
    var boatIndex = {
        isAndroid: !!(userAgent.indexOf('android') > -1 || userAgent.indexOf('Linux') > -1),//是否是安卓
        isIos: !!userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),//是否是IOS
        /*
         * function ajax请求
         * @param  {[Object]} options [参数配置]
         */
        commonAjax: function(options){
            var _this = this;
            var token = _this.getUserTag('token');
            // if(!token){
            //     window.location.href = 'login.html';
            //     return;
            // }
            $.ajax({
                url: options.url,
                dataType:"json",
                type: options.dataType || "GET", 
                data: options.data || {},
                async: options.async || true,//请求是否异步，默认为异步
                beforeSend: function(request) {                
                    request.setRequestHeader("Authorization", token);
                },
                success: function(data){
                    if(options.success)options.success(data);
                },
                error: function(data){
                    if(options.error)options.error(data);
                }
            })
        },
        /*
         * function 获取用户信息
         * @param name {string}
         */
        getUserTag: function(name){
            var _this = this;
            var userTag = '';
            if(_this.isAndroid){
                var name = android.getUserTag() || '';
                userTag = name ? name : _this.getCookie(name);
            }
            else{
                console.log(name)
                userTag = _this.getCookie(name);
            }
            return userTag
        },
        getCookie: function(name){
            var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
            if(arr=document.cookie.match(reg))
            return unescape(arr[2]);
            else
            return null;
        },
        /*
         * function toas弹窗
         * @param msg {string}
         */
        toast: function(msg){
            var _this = this;
            if(_this.isAndroid){
                if(android){
                    android.toastMessage(msg);
                }
            }
            else{
                $.toast(msg);
            }
        },
        //保存cookie
        setCookie: function(name, value, iDay){
            var oDate=new Date();
            oDate.setDate(oDate.getDate()+iDay);     
            document.cookie=name+'='+encodeURIComponent(value)+';expires='+oDate;       
        },
        scrolledAjax: function(ajaxOptions) { //滚动到底部获取数据
            var _this = this;
            var steps = ajaxOptions.steps || 10,
                maxRecords = ajaxOptions.maxRecords || 150,
                totalFlag = ajaxOptions.totalFlag || "total",
                startFlag = ajaxOptions.startFlag || "startIndex",
                endFlag = ajaxOptions.endFlag || "endIndex",
                recordsFlag = ajaxOptions.recordsFlag || "list",
                pageIndex = ajaxOptions.pageIndex || 'pageIndex',
                pageSize = ajaxOptions.pageSize || 'pageSize',
                timestamp = ajaxOptions.timestamp || 'timestamp',
                status = 0, //获取数据状态 0为空闲， 1为在获取中
                firstGet = true,
                remainTimes = 3,
                count = 0,
                scrolledmin = 300,
                autoGetData = ajaxOptions.autoGetData === false ? false : true,
                totalRecords = steps, //初始化值，设置的大一些以通过后续检测
                parent = ajaxOptions.parent,
                loader,
                callingFlag = false,
                startFetch = ajaxOptions.startFetch === undefined ? true : ajaxOptions.startFetch,
                firstStatus = { list: [] },
                lasyAnimate = ajaxOptions.lasyAnimate,
                lazier,
                self = this;
            ajaxOptions.data = ajaxOptions.data || {};
            if (startFetch && autoGetData !== false) getData();

            function scrollListener() {
                if (ajaxOptions.lazier) {
                    lazier.scrolled();
                }
                //startFetch=false开始默认不取数据，直到页面滑到底部才动态加载数据
                if (firstGet && startFetch && checkToBottom()) {
                    getData();
                } else if (status || !startFetch) return;
                else if (checkToBottom()) getData();
            }
            if (autoGetData !== false) {
                window.addEventListener("scroll", scrollListener, false);
            }

            function checkToBottom() {
                var de = document.documentElement,
                    bd = document.body,
                    clientHeight = de.clientHeight || bd.clientHeight,
                    scrollTop = bd.scrollTop || de.scrollTop,
                    scrollHeight = bd.scrollHeight || de.scrollHeight;
                if (clientHeight + scrollTop + scrolledmin > scrollHeight) {
                    return true
                }
                return false;
            }

            function loading() {
                var root = parent.parent(),
                    $elementObj = root.find('.scroll-loading'),
                    elementB = $elementObj.length === 0;
                if (ajaxOptions.loader === false) return;
                else if (ajaxOptions.loader) loader = ajaxOptions.loader;
                else if (!loader) {
                    loader = $('<div class="scroll-loading"><span class="mb3 loading-flag"/>&nbsp;加载中...</div>');
                    elementB ? loader : loader = '';
                    if (loader !== '') {
                        loader.insertAfter(parent);
                    }
                    root.css('position', 'relative');
                    clearLoading();
                }
                if (loader) loader.show();
            }

            function clearLoading() {
                if (loader) {
                    loader.hide();
                }
            }

            function getData() {
                if (callingFlag) return;
                firstGet = false;
                var options = ajaxOptions,
                    data = options.data;
                loading();
                data[startFlag] = ++count;
                if (totalRecords < data[startFlag]) { //起始下标大于总数返回
                    clearLoading();
                    --count;
                    return;
                }
                data[pageSize] = steps;
                data[pageIndex] = Math.ceil(count / steps);
                data[endFlag] = (count += steps - 1);
                data[timestamp] = new Date().getTime();
                if (totalRecords < data[endFlag]) { //总数小于结束下标
                    data[endFlag] = totalRecords;
                }
                callingFlag = true;
                _this.commonAjax({
                    url: options.url,
                    type: options.dataType || "GET", 
                    data: options.data || {},
                    noloading: true,
                    success: function(data) {
                        if (data[totalFlag] !== 0 && data[recordsFlag] && data[recordsFlag].length == 0) {
                            //后台接口超时，total!==0,但是list==0，异常状态，重复取3次数据
                            ajaxError();
                            return;
                        }
                        handleSuccess(data);
                        if (lazier) {
                            lazier.start();
                        }
                    },
                    error: function(data) {
                        if (data.type !== 'needAuthor') {
                            ajaxError();
                        } else if (options.error) {
                            options.error(data);
                        }

                    }
                });

                function ajaxError() {
                    if (remainTimes > 0) { //限定获取失败次数
                        remainTimes--;
                        count -= steps;
                        callingFlag = false;
                        getData();
                    } else {
                        callingFlag = false;
                        count -= steps;
                        clearLoading();
                    }
                }
            }

            function handleSuccess(json) {
                if (json) {
                    var elements = [];
                    if (totalRecords = (json[totalFlag] > maxRecords ? maxRecords : json[totalFlag])) {
                        var list = json[recordsFlag];
                        //保存第一次数据
                        if (count == steps) {
                            firstStatus.list = list || [];
                        }
                        if (list && list.length > 0) {
                            if (ajaxOptions.template) {
                                for (var i = 0, l = list.length; i < l; i++) {
                                    var html = typeof ajaxOptions.template === 'string' ? ajaxOptions.template :
                                        typeof ajaxOptions.template === 'function' ? ajaxOptions.template(list[i], i) : '';
                                    var record = list[i];
                                    if (html) { //为了解决老版本的模板&{}取数据格式
                                        html = html.replace(/\&\{([\d\.\w\?\:\-]*)\}/g, '{{$1}}');
                                    }
                                    var tpl = template.compile(html)(ajaxOptions.handleData ? ajaxOptions.handleData(list[i], i) : list[i]);
                                    parent[0].insertAdjacentHTML('beforeend', tpl);
                                    var element = parent[0].lastElementChild;
                                    if (ajaxOptions.animate) element.setAttribute("class", (element.getAttribute("class") || "") + " " + ajaxOptions.animate);
                                    elements.push(element);
                                }
                                if (ajaxOptions.animate) setTimeout(function() {
                                    for (var i = 0, l = elements.length; i < l; i++) {
                                        elements[i].style.opacity = 1;
                                    }
                                }, 10);
                            } else {
                                if (ajaxOptions.handleData) {
                                    for (var i = 0, l = list.length; i < l; i++) {
                                        ajaxOptions.handleData(list[i], i);
                                    }
                                }
                                var html = template(ajaxOptions.templateId, json);
                                parent.append(html);
                                var children = parent.children(),
                                    size = children.size(),
                                    length = list.length;

                                while (length--) {
                                    (function(index) {
                                        var element = children.get(index);
                                        elements.push(element);
                                        element.setAttribute("class", (element.getAttribute("class") || "") + " " + ajaxOptions.animate);
                                        if (ajaxOptions.animate) {
                                            setTimeout(function() {
                                                element.style.opacity = 1;
                                            }, 10);
                                        }
                                    })(size - length - 1);
                                }
                            }
                            if (ajaxOptions.success) ajaxOptions.success(json, ajaxOptions, elements);
                        }
                        if (totalRecords <= ajaxOptions.data[endFlag]) {
                            if (ajaxOptions.endCallback) {
                                var loadEndFlag = maxRecords && maxRecords <= json[totalFlag] && count >= maxRecords;
                                ajaxOptions.endCallback(ajaxOptions, loadEndFlag);
                            }
                            clearLoading();
                        }
                    } else if (ajaxOptions.zeroCallback) { //0条数据回调ajaxOptions.zeroCallback方法
                        clearLoading();
                        ajaxOptions.zeroCallback(ajaxOptions, parent, json);
                        return;
                    }
                }
                //一次获取数据没有满屏继续,此时需要1个延迟加载dom的时间
                callingFlag = false;
                if (checkToBottom() && autoGetData !== false) getData();
            }

            return {
                start: function() {
                    startFetch = true;
                    $(window).trigger('scroll');
                },
                close: function() {
                    startFetch = false;
                    clearLoading();
                },
                getData: function() {
                    getData();
                },
                isLoadingData: function() {
                    return callingFlag;
                },
                clearLoading: function() {
                    clearLoading();
                },
                destory: function() {
                    window.removeEventListener("scroll", scrollListener);
                    if (loader) {
                        loader.remove();
                    }
                },
                resetRemainTimes: function() {
                    remainTimes = 3;
                    firstGet = true;
                    totalRecords = steps;
                },
                abort: function() {
                    if (this.ajaxObject) {
                        this.ajaxObject.abort();
                    };
                },
                update: function(ids, opt) {
                    var list = firstStatus.list,
                        options = ajaxOptions,
                        data = options.data,
                        length = ids.length;

                    function equalList(newFirstData, firstData, ids) {
                        var idsLength = ids.length,
                            length = newFirstData.length;
                        if (length != firstData.length) {
                            return false;
                        }
                        var newObj, obj;
                        for (var j = 0; j < length; j++) {
                            newObj = newFirstData[j],
                                obj = firstData[j];
                            for (var i = 0; i < idsLength; i++) {
                                if (newObj[ids[i]] != obj[ids[i]]) {
                                    return false;
                                }
                            }
                        }
                        return true;

                    }
                    if (list) {
                        var dataTemp = {};
                        dataTemp = $.extend(dataTemp, options.data || {});
                        dataTemp[startFlag] = 1;
                        dataTemp[pageSize] = steps;
                        dataTemp[pageIndex] = Math.ceil(1 / steps);
                        dataTemp[endFlag] = steps;
                        dataTemp.timestamp = new Date().getTime();
                        this.ajaxObject = $.ajax({
                            url: options.url,
                            type: options.type || "GET",
                            data: dataTemp || {},
                            dataType: "json",
                            success: function(json) {
                                var newList = json[recordsFlag] || [],
                                    firstData = list,
                                    newFirstData = newList,
                                    equal = true;
                                if (newFirstData) {
                                    if (!firstData || !length) {
                                        equal = false
                                    } else {
                                        equal = equalList(newFirstData, firstData, ids);
                                    }
                                } else if (newFirstData != firstData) {
                                    equal = false;
                                }
                                if (!equal) {
                                    count = 0;
                                    data[startFlag] = ++count;
                                    data[pageSize] = steps;
                                    data[pageIndex] = Math.ceil(count / steps);
                                    data[endFlag] = (count += steps - 1);

                                    parent.empty();
                                    opt.hide();
                                    handleSuccess(json);
                                } else {
                                    opt.refreshNoData();
                                }
                                if (lazier) {
                                    setTimeout(function() {
                                        lazier.start();
                                    }, 500);
                                }
                            }
                        });
                    }
                }
            }
        },
        addEvent:function(){
            $('.nav-list li').bind('click',function(){
                if($(this).hasClass('on'))return;
                var index = $(this).index();
                if(index == 0){
                    window.location.href = 'page02.html';
                }
                else if(index == 1){
                    window.location.href = 'page05.html';
                }
                else if(index == 2){
                    window.location.href = 'page07.html';
                }
            });
        },
        init:function(){
           this.addEvent();
        }
    }
    boatIndex.init();
    return boatIndex;
});


