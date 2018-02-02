lazyLoad.require(['https://g.alicdn.com/msui/sm/0.6.2/js/sm.min.js'],function(){
    var userAgent = navigator.userAgent.toLowerCase();
    //alert(userAgent)
    var boatIndex = {
        isAndroid: !!(userAgent.indexOf('android') > -1 || userAgent.indexOf('Linux') > -1),//是否是安卓
        isIos: !!userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),//是否是IOS
        isXYWL: !!(userAgent.indexOf('xywl') > -1 ),//app
        isWeiXin: !!(userAgent.indexOf('micromessenger') > -1 ),//微信
        /*
         * function ajax请求
         * @param  {[Object]} options [参数配置]
         */
        commonAjax: function(options){
            var _this = this;
            var token = _this.getUserTag('token');
            if(!token){
                window.location.href = 'login.html';
                return;
            }
            $.ajax({
                url: options.url,
                dataType:"json",
                type: options.type || "GET", 
                data: options.data || {},
                async: options.async || true,//请求是否异步，默认为异步
                beforeSend: function(request) {                
                    request.setRequestHeader("token", token);
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
            if(_this.isXYWL){
                var userId = $('#userId').val();
                userTag = userId ? userId : _this.getCookie(name);
            }
            else{
                userTag = _this.getCookie(name);
            }
            return userTag;
        },
        /*
         * function 获取cookie
         * @param name {string}
         */
        getCookie: function(name){
            var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
            if(arr=document.cookie.match(reg))
            return unescape(arr[2]);
            else
            return null;
        },
        //保存cookie
        setCookie: function(name, value, iDay){
            var oDate=new Date();
            oDate.setDate(oDate.getDate()+iDay);     
            document.cookie=name+'='+encodeURIComponent(value)+';expires='+oDate;       
        },
        //清除cookie
        delCookie: function(name){
            var exp = new Date();
            exp.setTime(exp.getTime() - 1);
            var cval = this.getCookie(name);
            if(cval!=null)
            document.cookie= name + "="+cval+";expires="+exp.toGMTString();
        },
        //获取Url参数
        getQueryString: function(name) { 
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"); 
            var r = window.location.search.substr(1).match(reg); 
            if (r != null) return unescape(r[2]); 
            return null; 
        },
        /*
         * function toast弹窗
         * @param msg {string}
         */
        toast: function(msg){
            var _this = this;
            if(_this.isXYWL && XYNative){
                XYNative.toastMessage(msg);
            }
            else{
                $.toast(msg);
            }
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
                    if (this.pulldownRefresh) {
                        this.pulldownRefresh.destory();
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
                createPulldownRefresh: function(options) {
                    var element = options.element,
                        pullDownArea = options.pullDownArea || parent,
                        insertBeforeEl = options.insertBeforeEl,
                        endCallback = options.endCallback,
                        id = options.id,
                        ids = id ? id.split(' ') : [],
                        elementObj = parent.find('.ui-pulldown-refresh').length === 0;
                    if (!element) {
                        var html = '<div class="ui-pulldown-refresh">' + '<div style="bottom:' + (options.bottom || 0) + ';">' + '<i></i>' + '<span>下拉刷新</span>' + '</div>' + '</div>';
                        elementObj ? html : html = '';
                        insertBeforeEl = insertBeforeEl || pullDownArea;
                        element = $(html).insertBefore(insertBeforeEl);
                    }

                    var self = this;
                    //pulldown下拉刷新页面
                    this.pulldownRefresh = boatIndex.pulldownRefresh({
                        element: element,
                        maxDragY: options.maxDragY || 80,
                        pullDownArea: pullDownArea,
                        insertBeforeEl: insertBeforeEl,
                        endCallback: function(opt) {
                            //创建ajax
                            self.abort();
                            self.update(ids, opt);
                            if (!!endCallback) {
                                endCallback();
                            }
                        }
                    });
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
        pulldownRefresh: function(opt) { //下拉刷新页面
            var _this = this;
            var insertBeforeEl = opt.insertBeforeEl,
                element = opt.element,
                destory = false,
                noDie = opt.noDie,
                tipEl = element.find('div');
            var startY, endY, subY, startX, sMoveX, sMoveY, endX, scrollTop, bodyHeight,
                // 清空位移
                moveX = 0,
                moveY = 0;

            function hide() {
                element.css({ "height": "0" });
            }

            function animation() {
                element.css({ "-webkit-transition": "height 0.4s ease" });
            }

            function clearLick() {
                element.css({ "-webkit-transition": "" });
            }

            function refreshNoData() {
                element.find("span").html("已是最新数据");
                element.find("i").addClass("ui-hide");
                //延时显示
                setTimeout(function() {
                    hide();
                    element.css({ "-webkit-transition": "height 0.5s liner" });
                }, 1000);
            }
            boatIndex.touchstart(insertBeforeEl, function(event){
                if (destory) return;
                startX = event.screenX;
                startY = event.screenY;
                scrollTop = $(window).scrollTop();
                $('.zc-title .title-list').css('opacity', 0).hide();
                bodyHeight = $("body").height();
                clearLick();
            });
            boatIndex.touchmove(insertBeforeEl,function(event){
                if (destory) return;
                if (scrollTop > 0) {
                    return;
                }
                endX = event.screenX;
                endY = event.screenY;
                moveX = endX - startX;
                moveY = endY - startY;
                //过滤横向移动
                sMoveX = moveX < 0 ? -moveX : moveX;
                sMoveY = (moveY < 0 ? -moveY : moveY);


                if (sMoveX * 2 > sMoveY) {
                    return true;
                }

                var maxDragY = opt.maxDragY || 80;


                var showRefreshTipY = 50;
                if (moveY < 0) {
                    return;
                }
                element.find("i").removeClass("load");
                //下拉代码
                if (scrollTop == 0) {
                    subY = (moveY / bodyHeight * moveY);
                    subY = subY > maxDragY ? maxDragY : subY;
                    element.find("i").removeClass("ui-hide");

                    if (subY > showRefreshTipY && subY <= maxDragY) {
                        element.find("span").html("释放立即刷新");
                        element.find("i").addClass("up");
                    } else {
                        element.find("span").html("下拉刷新");
                        element.find("i").removeClass("up");
                    }
                    element.css({ "height": subY + "px" });
                    tipEl.css({ 'margin-left': -tipEl.width() / 2 });
                    return false;
                }
            });
            boatIndex.touchend(insertBeforeEl, function(event){
                if (destory) return;

                if (sMoveX > sMoveY) {
                    return true;
                }
                var scrollTop = document.body.scrollTop;
                if (element.find("i").hasClass("load") && scrollTop < 0) {
                    element.find("i").removeClass("load");
                    opt.stopStaut = true;
                    opt.endCallback(opt);
                    if (scrollTop > 40) {
                        document.body.scrollTop = 0;
                    }
                    hide();
                }
                if ((moveY < 0 || scrollTop !== 0) && element.find("i").hasClass("load")) return false;
                if (moveY > 0) {
                    //加载代码
                    if (opt.endCallback && element.find("i").hasClass("up")) {
                        opt.stopStaut = false;
                        opt.hide = hide;
                        opt.refreshNoData = refreshNoData;
                        element.find("span").html("加载中...");
                        element.find("i").addClass("load");
                        element.css({ "height": "36px" });
                        tipEl.css({ 'margin-left': -tipEl.width() / 2 });
                        opt.endCallback(opt);
                    } else {
                        hide();
                    }
                }
                animation();
                // 清空位移
                moveX = 0;
                moveY = 0;
            });

            return {
                destory: function() {
                    if (!noDie) {
                        element.remove();
                    }
                    destory = true;
                }
            }
        },
        registerListener: function($el, eventName, selector, handler){
            if(!handler){
                handler = selector;
                selector = undefined;
            }
            var mobile = boatIndex.touchstart || touchstart.isIos,
                eventNames = {
                    touchstart: {
                        name: mobile ? "touchstart" : "mousedown",
                        path: "touches"
                    },
                    touchmove: {
                        name: mobile ? "touchmove" : "mousemove",
                        path: "touches"
                    },
                    touchend: {
                        name: mobile ? "touchend" : "mouseup",
                        path: "changedTouches"
                    },
                    touchcancel: {
                        name: mobile ? "touchcancel" : "mouseup",
                        path: "touches"
                    }
                },
                config = eventNames[eventName],
                newListener = function(event){
                    var evt = event[config.path]?event[config.path][0]:event, self = this;
                    if(handler){
                        return handler.call(self, evt, event);
                    }
                },
                args = [config.name, selector, newListener];
            if(!selector){
                args = [config.name, newListener];
            }
            $el.on.apply($el, args);
        },
        /*
         * function 拖动开始事件
         * @param  {[Element]} $el [触发对象]
         * @param  {[string]} selector [选择器]
         * @param  {[function]} handler [事件回调]
         */
        touchstart: function($el, selector, handler){
            this.registerListener($el, "touchstart", selector, handler);
        },
        /*
         * function 拖动移动事件
         * @param  {[Element]} $el [触发对象]
         * @param  {[string]} selector [选择器]
         * @param  {[function]} handler [事件回调]
         */
        touchmove: function($el, selector, handler){
            this.registerListener($el, "touchmove", selector, handler);
        },
        /*
         * function 拖动结束事件
         * @param  {[Element]} $el [触发对象]
         * @param  {[string]} selector [选择器]
         * @param  {[function]} handler [事件回调]
         */
        touchend: function($el, selector, handler){
            this.registerListener($el, "touchend", selector, handler);
        },
        /*
         * function 拖动取消事件
         * @param  {[Element]} $el [触发对象]
         * @param  {[string]} selector [选择器]
         * @param  {[function]} handler [事件回调]
         * @param  {[object]} data [绑定数据]
         */
        touchcancel: function($el, selector, handler, data){
            this.registerListener($el, "touchcancel", selector, handler, data);
        },
        addEvent:function(){
            var _this = this;
            if(_this.isXYWL && XYNative && $('#userId').length > 0)XYNative.getUserId('getNativeId');
            window.getNativeId = function(id){
                $('#userId').val(id);
            }
            $('.nav-list li').bind('click',function(){
                if($(this).hasClass('on'))return;
                var index = $(this).index();
                if(index == 0){
                    window.location.href = 'index.html';
                }
                else if(index == 1){
                    window.location.href = 'myOrderList.html';
                }
                else if(index == 2){
                    window.location.href = 'userInfo.html';
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
