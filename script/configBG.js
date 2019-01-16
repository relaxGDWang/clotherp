//后台管理公共配置文件
var CFG = {
    DEBUG: true,
    JDTYPE: 'form',
    URL: 'http://192.168.3.109:8080/api/v1/',
    //en: 'en_US',
    //cn: 'zh_Cn',
    loginPage: 'login.html',
    defaultPage: 'main.html',
    token: 'token',  //token信息对象{code:token的编号,live:生存到期unix时间}
    admin: 'admin',  //当前登录的管理员对象 {username:用户名,name:姓名}
    tokenLive: 30*60, //生存期，单位秒
    noLogin: 900,    //未登录或登录超时验证
    ajaxFormater: function (data) {  //ajax的传递参数加工(前道处理)
        var token=localStorage.getItem(CFG.admin);
        if (token){
            token=JSON.parse(token);
            data.api_token=token.token;
        }
        return data;
    },
    ajaxReturnDo: function(data){  //ajax后道处理
        var result = {code: 200, msg: ''};
        if (data.success===undefined || data.message===undefined){
            result.code=421; //格式不是预期
            result.msg='返回数据格式不是预期的';
            return result;
        }
        if (data.success!==true) {
            result.code = 420;
            result.msg = data.message;
            if (data.success+''===CFG.noLogin+''){   //判定登录超时的情况
                //alert('AJAX获得未登录标记，即将退出');
                //localStorage.removeItem(CFG.token);
                localStorage.removeItem(CFG.admin);
                top.location.href=CFG.loginPage;
                return result;
            }
        } else {
            result.data = data.data;
            //更新本地的登录生存时间
            //var token=localStorage.getItem(CFG.token);
            /*
            if (token){
                token=JSON.parse(token);
                token.live=getUnixTime()+CFG.tokenLive*1000;
                localStorage.setItem(CFG.token,JSON.stringify(token));
            }
            */
        }
        return result;
    }
};
var PATH = {
    login: CFG.URL+'user/login',    //登录接口
    missionCheck: CFG.URL+'examine',       //检验任务列表
    missionCheckDetails: CFG.URL+'examine/{id}',   //检验任务详细
    missionCut: CFG.URL+'cutout',           //裁剪任务列表
    missionCutDetails: CFG.URL+'cutout/{bolt_id}',  //裁剪任务详细
    missionCutFinished: CFG.URL+'cutout/{bolt_id}/cut'  //完成裁剪
};
if (CFG.DEBUG){
    CFG.URL='/server/';
    PATH.login=CFG.URL+'login.php';
    PATH.missionCut=CFG.URL+'cutlist.php';
    PATH.missionCutDetails=CFG.URL+'cutdetails.php';
    PATH.missionCutFinished=CFG.URL+'cutfinish.php';
}
//登录状态的通用检测
(function(){
    //var token=localStorage.getItem(CFG.token);
    var token=localStorage.getItem(CFG.admin);
    var isLogin=!!(location.href.indexOf(CFG.loginPage)>-1);
    if (token){
        token=JSON.parse(token);
        //获得当前的unix时间
        //var nowTime=getUnixTime();
        //if (token.uid && token.live>nowTime){
        if (token.token){
            if (isLogin){
                top.location.replace(CFG.defaultPage);
                //alert('登录信息存在，自动跳转到默认页面');
            }
            return;
        }
    }
    //alert('退回登录界面，通用检查不成功'+ nowTime);
    //localStorage.removeItem(CFG.token);
    localStorage.removeItem(CFG.admin);
    if (!isLogin) top.location.replace(CFG.loginPage);
})();

//格式化ajax数据通用
var DFG=(function(){
    var data={};
    var excute={
        cutlist:{
            length:{
                type: 'string',
                format:'$value$米'
            },
            current_length:{
                type: 'string',
                format:'$value$米'
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
                case 'string':
                    stringDo(per, x);
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
    //处理字符串加工
    function stringDo(conf, key){
        data[key]=conf.format.replace(/\$value\$/g,data[key]);
    }

    return {
        'ext': excute,
        'solve': solveData
    };
})();