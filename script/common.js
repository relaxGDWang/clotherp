var USER;  //用户信息公共变量
//app设备调用方法
var EQUIPMENT=(function(){
    var app=!!window.register_js;  //标记是否在app下运行
    var printFlag=false;          //标记是否有打印任务正在执行

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

    function getPrintType(){  //获得打印机类型
        var typeStr;
        try{
            typeStr=window.register_js.getprint();  //paper,label
        }catch(e){
            typeStr='';
        }
        return typeStr;
    }

    function doPrint(printStr,count){   //打印标签
        /*
        if (count && count>1){
            count=count-0;
        }else{
            count=1;
        }
        */
        if (printFlag){
            showErrorResult('有打印任务正在执行中！');
            return;
        }
        if (!printStr){
            showErrorResult('待打印的字符为空！');
            return;
        }
        if (count){
            var typeStr=getPrintType();
            if (typeStr){
                if (typeStr==='label'){
                    count=4;
                }else{
                    count=2;
                }
            }else{
                count=1;
            }
            console.log('print count have='+ count);
        }else{
            count=1;
            console.log('print no count='+ count);
        }
        printFlag=true;
        var timeID=setInterval(_print,800);
        function _print(){
            console.log('print');
            try {
                window.register_js.goprint(printStr);
                showErrorResult('打印指令发送成功！');
            } catch (e) {
                showErrorResult('打印调用出错，请检查打印机连接情况！');
            }
            if ((--count)<=0){
                clearInterval(timeID);
                timeID='';
                printFlag=false;
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
            console.log('clear zero');
            window.register_js.gozero();
            var count=5;
            var timeID=setInterval(function(){
                if (count<=1 || (window.register_js.updatenumbox()-0)/100===0){
                    clearInterval(timeID);
                    timeID='';
                }else{
                    window.register_js.gozero();
                    count--;
                }
            },200);
            //if (window.vu) vu.currentPosition=0;
        }catch(e){
            if (!flag){
                showErrorResult('计米器未链接，清零指令发送失败！');
            }else{
                console.log('计米器未链接，清零指令发送失败！');
            }
        }
    }

    //回到设置界面
    function openSetting(){
        try{
            window.register_js.exitwebview();
        }catch(e){
            showErrorResult('请在APP中使用该功能');
        }
    }
    //获得用户登录信息，如未登录返回token为空的对象，如出错返回空字符，否则返回登录信息对象 token,mobile,name
    function getCurrentUser(){
        var result={token:'',mobile:'',name:''};
        var temp;
        if (app){
            try{
                temp=window.register_js.getLoginUser();
                if (temp!==''){
                    temp=JSON.parse(temp);
                    result.token=temp.api_token;
                    result.mobile=temp.mobile;
                    result.name=temp.name;
                }
            }catch(e){
                result='';
            }
        }else{   //不是在app下运行，检验localStorage
            temp=localStorage.getItem(CFG.admin);
            if (temp) result=JSON.parse(temp);
        }
        return result;
    }

    //返回APP首页
    function gotoHome(){
        if (app){
            try{
                window.register_js.backHome();
            }catch(e){
                showErrorResult('调用跳转首页方法似乎有问题');
            }
        }else{
            location.href=CFG.defaultPage+'?v='+Math.random();
        }
    }

    //跳转页面
    function gotoPage(url){
        if (url.indexOf('?')>=0){
            url=url.replace('?','?v='+Math.random()+'&');
        }else{
            url=url+'?v='+Math.random();
        }
        if (app){
            try{
                window.register_js.jumpUrl(url);
            }catch(e){
                showErrorResult('调用页面跳转方法似乎有问题');
            }
        }else{
            location.href=url;
        }
    }

    //登录超时
    function loginTimeout(){
        if (app){
            try{
                window.register_js.tokenUpdate();
            }catch(e){
                gotoHome();
            }
        }else{
            localStorage.removeItem(CFG.admin);
            if (location.href.indexOf(CFG.defaultPage)>=0){
                location.reload();
            }else{
                location.href=CFG.loginPage;
            }
        }
    }

    //打开我的任务APP页面
    function taskList(){
        if (app){
            try{
                window.register_js.goTaskList();
            }catch(e){
                showErrorResult('调用打开APP任务列表页面方法出错了。');
            }
        }else{
            showErrorResult('请在APP中使用该功能。');
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
        app: app,
        status: getStatus,
        print: doPrint,
        getCounter: getCounter,
        resetCounter: resetCounter,
        setting: openSetting,
        getCurrentUser: getCurrentUser,
        gotoHome: gotoHome,
        gotoPage: gotoPage,
        taskList: taskList,
        loginTimeout: loginTimeout
    };
})();

//登录状态的通用检测
(function(){
    USER=EQUIPMENT.getCurrentUser();
    if (USER===''){  //调用出错的情况
        setTimeout(function(){
            EQUIPMENT.gotoHome();
        },2000);
        return;
    }else if(USER.token===''){  //未登录的情况
        if (location.href.indexOf(CFG.defaultPage)<0 && location.href.indexOf(CFG.loginPage)<0){
            EQUIPMENT.gotoHome();
            return;
        }
    }
    //如果不是login页面，则调用设备连接状态刷新
    if(location.href.indexOf(CFG.loginPage)<0) getEquipmentStatus();

    //当前版本和版本号检测
    CFG.VER='2.0';
    if (CFG.URL.indexOf('-dev')>=0){
        CFG.SERVER='dev';
        window.onload=function(){
            var div=document.createElement('div');
            div.id='verTips';
            document.body.appendChild(div);
        }
    }else{
        CFG.SERVER='pd';
    }

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