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
    recordDetails: CFG.URL+'history/{id}',  //操作记录详细
    import: CFG.URL+'imports',        //入库操作
    importDetails: CFG.URL+'imports/{id}'  //入库详情
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