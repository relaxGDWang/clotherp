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

    if (location.href.indexOf('main.html')>-1){
        getEquipmentStatus();
        return;
    }

    //var token=localStorage.getItem(CFG.token);
    var token=localStorage.getItem(CFG.admin);//

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