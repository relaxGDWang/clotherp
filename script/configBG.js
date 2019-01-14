//后台管理公共配置文件
var CFG = {
    DEBUG: true,
    JDTYPE: 'form',
    URL: 'http://192.168.3.130:8080/',
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
            result.code = data.success;
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
    lang: '../language/',
    login: CFG.URL+'api/v1/user/login',    //登录接口
    missionCheck: CFG.URL+'api/v1/examine',       //检验任务列表
    missionCut: CFG.URL+'api/v1/cutout'           //裁剪任务列表
};
if (CFG.DEBUG){
    CFG.URL='http://www.cloth.com/server/';
    PATH.login=CFG.URL+'login.php';
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