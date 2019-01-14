//后台管理公共配置文件
var CFG = {
    DEBUG: false,
    JDTYPE: 'form',
    URL: 'http://www.cloth.com/',
    //en: 'en_US',
    //cn: 'zh_Cn',
    loginPage: 'login.html',
    defaultPage: 'main.html',
    token: 'token',  //token信息对象{code:token的编号,live:生存到期unix时间}
    admin: 'admin',  //当前登录的管理员对象 {username:用户名,name:姓名}
    tokenLive: 30*60, //生存期，单位秒
    noLogin: 900,    //未登录或登录超时验证
    ajaxFormater: function (data) {  //ajax的传递参数加工(前道处理)
        return data;
    },
    ajaxReturnDo: function(data){  //ajax后道处理
        var result = {code: 200, msg: ''};
        if (data.code===undefined || data.msg===undefined){
            result.code=421; //格式不是预期
            result.msg='返回数据格式不是预期的';
            return result;
        }
        if (data.code+''!=='200') {
            result.code = data.code;
            result.msg = data.msg;
            if (data.code+''===CFG.noLogin+''){   //判定登录超时的情况
                //alert('AJAX获得未登录标记，即将退出');
                localStorage.removeItem(CFG.token);
                localStorage.removeItem(CFG.admin);
                top.location.href=CFG.loginPage;
                return result;
            }
        } else {
            result.data = data.data;
            //更新本地的登录生存时间
            var token=localStorage.getItem(CFG.token);
            if (token){
                token=JSON.parse(token);
                token.live=getUnixTime()+CFG.tokenLive*1000;
                localStorage.setItem(CFG.token,JSON.stringify(token));
            }
        }
        return result;
    }
};
var PATH = {
    lang: '../language/',
    login: CFG.URL+'admin/login',  //登录接口
    extractpayList: CFG.URL+'admin/withdrawCashs',  //提现订单列表
    extractpayDetails: CFG.URL+'admin/withdrawCashDetail',   //提现订单详情
    extractpayOperate: CFG.URL+'admin/withdrawCashUpdateStatus',  //提现订单操作
    messageTemplate: CFG.URL+'admin/msg/template/get',  //信息模板获取
    messageSend: CFG.URL+'admin/msg/notify/send'        //信息推送
};
if (CFG.DEBUG){
    CFG.URL=CFG.URL+'server/';
    PATH.login=CFG.URL+'login.php';
}
//登录状态的通用检测
(function(){
    var token=localStorage.getItem(CFG.token);
    var isLogin=!!(location.href.indexOf(CFG.loginPage)>-1);
    if (token){
        token=JSON.parse(token);
        //获得当前的unix时间
        var nowTime=getUnixTime();
        if (token.code && token.live>nowTime){
            if (isLogin){
                top.location.replace(CFG.defaultPage);
                //alert('登录信息存在，自动跳转到默认页面');
            }
            return;
        }
    }
    //alert('退回登录界面，通用检查不成功'+ nowTime);
    localStorage.removeItem(CFG.token);
    localStorage.removeItem(CFG.admin);
    if (!isLogin) top.location.replace(CFG.loginPage);
})();

//格式化ajax数据通用
var DFG=(function(){
    var data={};
    var excute={
        extractpay:{
            createAt:{
                type: 'datetime',
                from: 'unix'
            },
            cashAmount:{
                type: 'price',
                fixed: 2
            },
            taxAmount:{
                type: 'price',
                fixed: 2,
                emptyfill: '0'
            },
            arrivalAmount:{
                type: 'price',
                fixed: 2
            },
            pfType:{
                type: 'radio',
                search:{
                    '0':{key:'0', value:' ', text:' '},
                    '1':{key:'1', value:'支付宝', text:'支付宝'},
                    '2':{key:'2', value:'微信', text:'微信'},
                    '3':{key:'3', value:'paypal', text:'paypal'},
                    '4':{key:'4', value:'农业银行', text:'农业银行'}
                }
            },
            cashObjType:{
                type: 'radio',
                search:{
                    '0':{key:'0', value:' ', text:' '},
                    '1':{key:'1', value:'Y', text:'是'},
                    '-1':{key:'-1', value:'--', text:'否'}
                }
            },
            invoiceType:{
                type: 'radio',
                search:{
                    '0':{key:'0', value:'--', text:' '},
                    '1':{key:'1', value:'电子发票', text:'电子发票'},
                    '2':{key:'2', value:'普通发票', text:'普通发票'}
                }
            },
            status:{
                type: 'radio',
                search:{
                    '0':{key:'0', value:' ', text:' ', des:'查询任意状态的订单'},
                    '2':{key:'2', value:'待处理', text:'待处理', des:'订单的初始状态', class:'warning'},
                    '1':{key:'1', value:'退回', text:'退回', des:'由于相关资料错误或者其他原因退回订单，用户可以修改资料后重新发送', class:'info'},
                    '5':{key:'5', value:'成功', text:'成功', des:'打款成功，订单完成', class:'success'},
                    '4':{key:'4', value:'撤销', text:'撤销', des:'用户告知需要撤销订单或者其他不可打款的情况，金额解冻，订单完成', class:'danger'},
                    '3':{key:'3', value:'审核成功', text:'审核成功', des:'审核成功，可以进行线下打款打款操作', class:''},
                    '6':{key:'6', value:'撤销中', text:'撤销中', des:'撤销操作正在执行中', class:''},
                    '7':{key:'7', value:'完成中', text:'完成中', des:'提现成功操作正在执行中', class:''}
                }
            },
            operateAt:{
                type: 'datetime',
                from: 'unix',
                emptyfill: '--'
            },
            canDo:{
                type: 'array',
                search:{
                    'back':{key:'back', text:'退回', color:'Warning'},
                    'succ':{key:'succ', text:'打款成功，订单完成', color:'OK'},
                    'fail':{key:'fail', text:'撤销订单', color:'Alert'},
                    'pass':{key:'pass', text:'通过审核，准备打款', color:'Info'},
                    'refresh':{key:'refresh', text:'刷新订单状态', color:'Info'}
                }
            }
        },
        extractpayOperate:{
            finishAt:{
                type: 'datetime',
                from: 'unix'
            },
            operateType:{
                type: 'radio',
                search:{
                    'back':{  key:'back', text:'退回'},
                    'pass':{ key:'pass', text:'审核成功'},
                    'fail':{ key:'fail', text:'撤销'},
                    'succ':{ key:'success', text:'打款成功'},
                    'modify':{ key:'modify', text:'用户修改'},
                    'create':{ key:'create', text:'用户创建订单'}
                }
            },
            operateSource:{
                type: 'radio',
                from: 'string',
                value: [1,2,3],
                text: ['普通用户','管理员','脚本自动']
            },
            errorType:{
                type: 'radio',
                search:{
                    '0':{key:'0', text:' '},
                    '1':{key:'1', text:'身份信息错误'},
                    '2':{key:'2', text:'打款信息错误'},
                    '3':{key:'3', text:'其他'}
                }
            }
        }
    };

    //处理数据核心方法
    function solveData(excuteName, doData){
        data=doData;
        var dic=excute[excuteName];
        for (var x in data) {
            var per = dic[x];
            if (!per) continue;
            switch (per.type) {
                case 'datetime':
                    datetimeDo(per, x);
                    break;
                case 'date':
                    datetimeDo(per, x);
                    break;
                case 'price':
                    priceDo(per, x);
                    break;
                case 'radio':
                    radioDo(per, x);
                    break;
                case 'array':
                    arrayDo(per, x);
                    break;
            }
        }
    }

    //获得字符串日期时间
    function datetimeDo(conf, key){
        if (data[key]){
            var temp;
            switch(conf.from){
                case 'unix':
                    temp=getStringTime(data[key]*1000,'','-',true);
                    break;
                case 'unixms':
                    temp=getStringTime(data[key],'','-',true);
                    break;
                case 'datetime':
                    temp=data[key];
                    break;
                case 'date':
                    temp=data[key]+' 00:00:00';
                    break;
            }
            var result=temp.split(/\s/);
            switch(conf.type){
                case 'datetime':
                    data[key]=result;
                    break;
                case 'date':
                    data[key]=[result[0]];
                    break;
                case 'time':
                    data[key]=[result[1]];
                    break;
            }
        }else{
            if (conf.emptyfill!==undefined) data[key]=[conf.emptyfill];
        }
    }
    //金额格式化
    function priceDo(conf, key){
        var temp=data[key]-0;
        if (isNaN(temp)){
            if (conf.emptyfill!==undefined) data[key]=conf.emptyfill;
        }else{
            data[key]=temp.toFixed(conf.fixed);
        }
    }
    //单选值格式化
    function radioDo(conf, key){
        var temp=data[key];
        if (conf.from==='string'){
            temp=temp-0;
            if (isNaN(temp)) temp=data[key];
        }
        if (conf.value) {
            var index = conf.value.indexOf(temp);
            if (index >= 0) {
                data[key] = conf.text[index];
                return;
            }
        }else{
            data[key]=conf.search[temp];
            return;
        }
        data[key]='unknow';
    }
    //处理数组值（多选值，一般为数组）
    function arrayDo(conf, key){
        var temp=data[key];
        for (var i=0; i<temp.length; i++){
            temp[i]=conf.search[temp[i]];
        }
    }

    return {
        'ext': excute,
        'solve': solveData
    };
})();