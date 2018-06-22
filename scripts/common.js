lazyLoad.require(['https://g.alicdn.com/msui/sm/0.6.2/js/sm.min.js'],function(){
    var userAgent = navigator.userAgent.toLowerCase();
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
            var token = this.getUserTag("token");
            var token = 'MzM6ZWIyYTRlMTAxNzVjZjA2ODg0ZDM3YmFkYTk3MjRiMjA6MTUzMTIxMTc1MjE4OA=='
            if(token){
                //options.data.token = token;
                $.ajax({
                    url: options.url,
                    dataType:"json",
                    type: options.type || "GET", 
                    data: options.data || {},
                    async: options.async || true,//请求是否异步，默认为异步
                    beforeSend: function(request) {          
                        request.setRequestHeader("token",token);
                    },
                    success: function(data){
                        if(data.errCode == 90003){
                            _this.toast('登录失效，请重新登录');
                            setTimeout(function(){
                                window.location.href = 'login.html'
                            },300);
                        }
                        else if(options.success)options.success(data);
                    },
                    error: function(data){
                        if(options.error)options.error(data);
                    }
                });
            }
            else{
                _this.toast('请登录');
                setTimeout(function(){
                    window.location.href = 'login.html'
                },300);
            }
            
        },
        infinitScroll: function(options) {
            var _this = this;
            // 加载flag
            var loading = false;
            // 最多可加载的条目
            var total = 0;
            // 每次加载添加多少条目
            var pageSize = options.pageSize || 10;

            var pageIndex = 0,
                startIndex = 0,
                endIndex = pageSize,
                data = options.data;
                data.pageIndex = pageIndex;
                data.startIndex = startIndex;
                data.endIndex = endIndex;
                data.pageSize = pageSize;
            _this.commonAjax({
                url:options.url,
                data: options.data || {},
                success: function(data){
                    total = data.total || 0;
                    if(total == 0){
                        if(options.zero)options.zero(options.parent);
                    }
                    //预先加载10条
                    addItems(pageSize,data);
                    if(endIndex >= total){
                        // 删除加载提示符
                        $('.infinite-scroll-preloader').remove();
                        if(options.endCallback)options.endCallback(options.parent);
                    };
                },
                error: function(){
                    // 删除加载提示符
                    $('.infinite-scroll-preloader').remove();
                    if(options.error)options.error;
                }
            });

            function addItems(number,data) {
                if(!data.data || data.data.length < 1)return;
                var length = data.data.length;
                if (options.handleData) {
                    for (var i = 0; i < length; i++) {
                        options.handleData(data.data[i], i);
                    }
                }
                // 生成新条目的HTML
                var html = template(options.templateId,data);
                // 添加新条目
                options.parent.append(html);
                
                var elements = [],
                    children = options.parent.children();
                for(var i=0;i<length;i++){
                    elements.push(children[endIndex-pageSize+i]);
                }
                if(options.success)options.success(data,elements,options.parent);
            }

            // 注册'infinite'事件处理函数
            $(document).on('infinite', '.infinite-scroll-bottom', function() {
                // 如果正在加载，则退出
                if (loading) return;
                // 设置flag
                loading = true;
                pageIndex++;
                startIndex += pageSize;
                endIndex += pageSize;
                data.pageIndex = pageIndex;
                data.startIndex = startIndex;
                data.endIndex = endIndex;
                _this.commonAjax({
                    url:options.url,
                    data: options.data || {},
                    success: function(data){
                        // 重置加载flag
                        loading = false;
                        total = data.total || 0;
                        // 添加新条目
                        addItems(pageSize, data);
                        //容器发生改变,如果是js滚动，需要刷新滚动
                        $.refreshScroller();
                        if (endIndex >= total) {
                            // 加载完毕，则注销无限加载事件，以防不必要的加载
                            $.detachInfiniteScroll($('.infinite-scroll'));
                            // 删除加载提示符
                            $('.infinite-scroll-preloader').remove();
                            if(options.endCallback)options.endCallback(options.parent);
                        }
                    }
                });
            
            });
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
            var _this = this,
                msg = msg || '报错';
            if(_this.isXYWL && _this.isAndroid && XYNativeClient){
                XYNativeClient.toastMessage(msg);
            }
            else{
                $.toast(msg);
            }
        },
        addEvent:function(){
            var _this = this;
            if(_this.isXYWL && XYNativeClient && $('#userId').length > 0)XYNativeClient.getUserId('getNativeId');
            window.getNativeId = function(id){
                $('#userId').val(id);
            }
        },
        init:function(){
           this.addEvent();
        }
    }
    boatIndex.init();
    return boatIndex;
});
