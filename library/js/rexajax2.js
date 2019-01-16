//relax ajax
// 基于jquery框架的relax ajax类v2.0
// code at 2018-11-06
// Notice 对于跨域请求，如果contentType设置为json，一次ajax通信在浏览器上会有两次请求，第一次是mothed为option的请求，这次请求成功，下次才是真正的ajax数据发送。对于该contentType的数据，服务端接收方法也不太一样，以PHP为例子，from格式可以用$_POST来获取，而json方式，则需要用...来处理
// modify by relax 2019-1-16 应对某些框架下参数放在url中的情况 比如 www.test.com/getlist/1/get/ 这种，无法用静态url直接设置，现在扩展url的处理方法，可以动态应对data中的数据，使用 www.test.com/{id}/{method}这种方式进行协调
function relaxAJAX(config) {
    var CON = {
        url: '',      //ajax访问路劲
        sendData: '', //传输参数
        data: 'json',   //dataType 期望服务端返回的数据格式 xml,json,script,html,jsonp,text
        type: 'POST',   //type 传递参数的方法POST/GET，同样支持PUT/DELETE，不过这两种方法并不被所有浏览器支持
        async: true,    //是否使用异步通信，true为异步通信
        timeout: 20 * 1000,
        before: '',
        success: '',
        error: '',
        complete: '',
        cache: true,
        headers: {},   //头部自定义字段
        checker: '',  //用于自定义正常检测时候的业务逻辑错误，返回数据请遵循{code:错误编码，正确为200,msg:''}
        formater: '', //格式化传递数据，否则使用默认格式传递
        contentType: 'json' //header头中的content-Type定义 json->application/json;charset=utf-8 , form->application/x-www-form-urlencoded;charset=utf-8,
    };

    var LANG = {   //提示信息语言包
        'zh_Cn': {
            nourl: 'AJAX通信地址缺失',
            sending: 'AJAX正在请求中...',
            abort: 'AJAX已被主动取消',
            notfound: 'AJAX请求的资源没有找到',
            timeout: 'AJAX请求已超时',
            jsonParse: '返回数据非JSON字符串 '
        },
        'en_US': {
            nourl: 'AJAX URL is empty',
            sending: 'AJAX is requiring...',
            abort: 'AJAX to be canceled',
            notfound: 'AJAX url not be found',
            timeout: 'AJAX is timeout',
            jsonParse: 'data which be sended back is not JSON,'
        }
    };
    var MGST = LANG['zh-Cn'];

    var STA = {
        msg: '',      //提示信息
        code: 0,     //发送标记 0未发送 100发送中 200完成 400错误
        ajax: ''
    };

    if (config) {
        for (var x in CON) {
            if (config[x] !== undefined) CON[x] = config[x];
        }
    }

    //按定义的contentType返回对应的字符串
    function _changeContentType(typeStr) {
        switch (typeStr) {
            case 'json':
                return 'application/json;charset=utf-8';
            case 'form':
                return 'application/x-www-form-urlencoded;charset=utf-8';
            default:
                return '';
        }
    }

    //触发对应的事件
    function _chkEventFunction(eventStr, eventArg) {
        if (!CON[eventStr] || typeof(CON[eventStr]) !== 'function') return false;
        switch (eventStr) {
            case 'before':
                CON.before();
                break;
            case 'complete':
                CON.complete();
                break;
            case 'error':
                CON.error(eventArg.code, eventArg.msg);
                break;
            case 'success':
                CON.success(eventArg);
                break;
            default:
                return false;
        }
        return true;
    }

    //add 2019-1-16
    //按url中的替换文本获取在传递参数中的值
    function _getValueStr(keyStr, data){
        var tempArray=keyStr.split('.'), i, temp;
        for (i=0; i<tempArray.length; i++){
            temp=data[tempArray[i]];
            if (temp===undefined) break;
        }
        //如果是一层结构，删除当前在传递数据中的该值
        if (temp!==undefined && i===1) delete data[tempArray[0]];
        return temp;
    }

    /*
      arg参数说明
      url ajax请求路径
      data ajax请求发送的数据
      headers //请求的自定义头
      method //请求方法 GET/POST...
      success //成功请求的触发事件
    */
    function _send(arg) {
        if (window.LG && LG.locale) {
            MGST = LANG[LG.locale];
        } else {
            MGST = LANG['zh_Cn'];
        }
        if (!arg || typeof(arg) !== 'object') arg = {};
        var urlStr = arg.url ? arg.url : CON.url;
        //判断url是否定义
        if (urlStr === "") {
            STA.code = 400;
            STA.msg = MGST.nourl;
            _chkEventFunction('error', STA);
            return false;
        }
        //判断是否在发送中
        if (STA.code === 100) {
            _chkEventFunction('error', STA);
            return false;
        }
        //加工发送的数据 modify by relax 2019-1-16 修改了前置处理的逻辑，之前没有参数传递的时候不会调用前置处理，现在不管什么情况都会调用，只要配置了前置处理就行
        var tempData = arg.data ? arg.data : CON.sendData;
        if (!tempData) tempData={};
        if (CON.formater && typeof(CON.formater) === 'function') tempData = CON.formater(tempData);

        //modify 2019-1-16 加工url地址
        var tempArray=urlStr.match(/{[^}]+}/g), i, tempValue, tempRegexp;
        if (!tempArray) tempArray=[];
        for (i=0; i<tempArray.length; i++){
            tempArray[i]=tempArray[i].replace('{','').replace('}','');
            tempValue=_getValueStr(tempArray[i], tempData);
            if (tempValue!==undefined){
                tempRegexp=new RegExp('{'+ tempArray[i] +'}','g');
                urlStr=urlStr.replace(tempRegexp,tempValue);
            }
        }
        //按通信类型匹调整传递参数
        if (CON.contentType === 'json') tempData = JSON.stringify(tempData);

        //加工自定义头
        var headerData = arg.headers ? arg.headers : CON.headers;
        //加工method
        var methodData = arg.method ? arg.method : CON.type;

        STA.ajax = $.ajax({
            dataType: CON.data,
            type: methodData,
            url: urlStr,
            data: tempData,
            timeout: CON.timeout,
            cache: CON.cache,
            async: CON.async,
            headers: headerData,
            contentType: _changeContentType(CON.contentType),
            //发送之前事件
            beforeSend: function (xhr) {
                STA.code = 100;
                STA.msg = MGST.sending;
                _chkEventFunction('before');
            },
            //错误反馈事件
            error: function (XHR, status, errorThrown) {
                STA.ajax = '';
                if (XHR.statusText === "abort") {
                    STA.code = 420;
                    STA.msg = MGST.abort;
                    _chkEventFunction('error', STA);
                } else {
                    if (XHR.status === 404) {
                        STA.code = 404;
                        STA.msg = MGST.notfound;
                        _chkEventFunction('error', STA);
                    } else {
                        if (XHR.statusText === "timeout") {
                            STA.code = 408;
                            STA.msg = MGST.timeout;
                            _chkEventFunction('error', STA);
                        } else {
                            //未知错误的情况
                            //判定是否是JSON解析出错
                            if (CON.data==='json' && XHR.responseText){
                                try{
                                    var jsonTemp=JSON.parse(XHR.responseText);
                                    STA.code = 420;  //标记不可预知错误
                                    STA.msg = errorThrown;
                                }catch(e){
                                    STA.code = 510;  //JSON解析错误
                                    STA.msg = MGST.jsonParse + XHR.responseText;
                                }
                            }else{
                                STA.code = XHR.status;
                                STA.msg = errorThrown;
                            }
                            _chkEventFunction('error', STA);
                        }
                    }
                }
            },
            //请求成功
            success: function (data, status, XHR) {
                if (CON.checker && typeof(CON.checker) === 'function') {
                    var returnObj = CON.checker(data);
                    if (returnObj.code !== 200) {
                        STA.code = 400;
                        _chkEventFunction('error', {code: returnObj.code, msg: returnObj.msg});
                        return;
                    } else {
                        data = returnObj.data;
                    }
                }
                STA.code = 200;
                STA.msg = "ok";
                if (arg.success && typeof(arg.success) === 'function') {
                    arg.success(data);
                } else {
                    _chkEventFunction('success', data);
                }
            },
            //请求完成
            complete: function (XHR, status) {
                _chkEventFunction('complete');
            }
        });
    }

    function _abort() {
        if (STA.ajax === '') return false;
        STA.ajax.abort();
        STA.ajax = '';
    }

    return {
        send: _send,
        //取消ajax请求
        abort: _abort,
        //获得状态
        status: STA
    }
}
