//后台管理公共配置文件
var CFG = {
    DEBUG: false,
    JDTYPE: 'form',
    //URL: 'http://192.168.3.192:8080/api/v1/',
    URL: 'http://gadmin-dev.suishou.cc/api/v1/',
    //URL: 'http://erp.suishou.cc/api/v1/',
    //en: 'en_US',
    //cn: 'zh_Cn',
    loginPage: 'login.html',
    defaultPage: 'main.html',
    token: 'token',  //token信息对象{code:token的编号,live:生存到期unix时间}
    admin: 'admin',  //当前登录的管理员对象 {username:用户名,name:姓名}
    tokenLive: 30*60, //生存期，单位秒
    noLogin: 999,    //未登录或登录超时验证
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
            if (data.code+''===CFG.noLogin+''){   //判定登录超时的情况
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
var REG={   //正则字典
    flaw: /^\d{1,3}(\.\d{1,2})?$/,    //计米数值的规范
    position: new RegExp(',|<br\/>') //仓库位置的中间分割,用于split仓库信息成为数组信息
};
var PATH = {
    login: CFG.URL+'user/login',    //登录接口
    missionCheck: CFG.URL+'examine',       //检验任务列表
    missionCheckDetails: CFG.URL+'examine/{bolt_id}',   //检验任务详细
    missionCut: CFG.URL+'cutout',           //裁剪任务列表
    missionCutDetails: CFG.URL+'cutout/{bolt_id}',  //裁剪任务详细
    missionCutFinished: CFG.URL+'cutout/{bolt_id}/cut',  //完成裁剪
    missionCutQuick: CFG.URL+'cutout/{bolt_id}/quickcut', //快速裁剪中的完成裁剪
    resetLength: CFG.URL+'bolts/{bolt_id}/length',   //重置布长
    addFlaw: CFG.URL+'examine/{bolt_id}/defect',     //新增疵点
    delFlaw: CFG.URL+'bolts/{bolt_id}',              //删除疵点
    missionCheckFinished: CFG.URL+'examine/{bolt_id}/complete',  //完成检验任务
    getBook: CFG.URL+'sampleBooks',     //获得样本信息
    quickCutting: CFG.URL+'bolts/{bolt_no}/detail',  //快速裁剪的详情
    recordList: CFG.URL+'history',    //操作记录
    recordDetails: CFG.URL+'history/{id}'  //操作记录详细
};
if (CFG.DEBUG){
    //通信路径处理
    CFG.URL='/server/';
    PATH.login=CFG.URL+'login.php';
    PATH.missionCheck=CFG.URL+'examinelist.php';
    PATH.missionCheckDetails=CFG.URL+'examinedetails.php';
    PATH.missionCut=CFG.URL+'cutlist.php';
    PATH.missionCutDetails=CFG.URL+'cutdetails.php';
    PATH.missionCutFinished=CFG.URL+'cutfinish.php';

    //设备状态模拟
    window.register_js = {};
    window.register_js.get_syncstat = function () {
        return {printstat:1,countstat:1,netstat:0};
    };
}
//app设备调用方法
var EQUIPMENT=(function(){
    function getStatus(){  //获得设备状态
        try{
            var result=window.register_js.get_syncstat();
            result=JSON.parse(result);
            if (window.vu){
                vu.equipment.printer=(result.printstat=='1'? 'on':'off');
                vu.equipment.counter=(result.countstat=='1'? 'on':'off');
                vu.equipment.neter=(result.netstat=='1'? 'on':'off');
            }
            if (window.dialog){
                //dialog.open('resultShow',{content:result});
            }
        }catch(e){
            if (window.vu) {
                for (var x in vu.equipment) {
                    vu.equipment[x] = '';
                }
            }
        }
    }

    function doPrint(printStr,count){   //打印标签
        if (count && count>1){
            count=count-0;
        }else{
            count=1;
        }
        var timeID=setInterval(_print,800);
        function _print(){
            try {
                window.register_js.goprint(printStr);
                showErrorResult('打印指令发送成功！');
            } catch (e) {
                showErrorResult('打印调用出错，请检查打印机连接情况！');
            }
            if ((--count)<=0){
                clearInterval(timeID);
                timeID='';
            }
        }
    }

    function getCounter(){   //获得计米器读数
        var PCOUNT;
        try{
            PCOUNT=window.register_js.updatenumbox();
            PCOUNT=(PCOUNT-0)/100;
            if (!isNaN(PCOUNT) && vu) vu.currentPosition=PCOUNT;
        }catch(e){
            PCOUNT='';
        }
    }

    function resetCounter(flag){   //置0计米器读数,参数flag 表示如果异常是否提示信息
        try{
            window.register_js.gozero();
            //if (window.vu) vu.currentPosition=0;
        }catch(e){
            if (!flag){
                showErrorResult('计米器未链接，清零指令发送失败！');
            }else{
                console.log('计米器未链接，清零指令发送失败！');
            }
        }
    }

    function openSetting(){
        try{
            window.register_js.exitwebview();
        }catch(e){
            showErrorResult('请在APP中使用该功能');
        }
    }

    function showErrorResult(msg){
        if (window.dialog){
            dialog.open('resultShow',{content:msg});
        }else{
            console.log(msg);
        }
    }

    return {
        status: getStatus,
        print: doPrint,
        getCounter: getCounter,
        resetCounter: resetCounter,
        setting: openSetting
    };
})();

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
            getEquipmentStatus();
            return;
        }
    }
    //alert('退回登录界面，通用检查不成功'+ nowTime);
    //localStorage.removeItem(CFG.token);
    localStorage.removeItem(CFG.admin);
    if (!isLogin) top.location.replace(CFG.loginPage);

    function getEquipmentStatus(){
        //设备状态检测
        setInterval(EQUIPMENT.status,1000);
    }
})();

//格式化ajax数据通用
var DFG=(function(){
    var data={};
    var excute={};

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