$(function(){
    var dialog=relaxDialog();
    var tempArray=$('.systemMenu [href]');
    tempArray.click(function(e){
        if ($(this).parent().hasClass('sel')){
            protectEvent(e);
            return false;
        }
        var path=this.href;
        this.href=refreshURL(path);
        $('.systemMenu .sel').removeClass('sel');
        $(this).parent().addClass('sel');
    });
    $('iframe')[0].src=refreshURL(tempArray[0].href);

    $('#loginOut').click(function(){
        dialog.open('sysInfo',{
            content:'是否回到登录界面以重新登录？',
            cname:'sure',
            closeCallback:function(id,typeStr,btnType){
                if (btnType==='sure'){
                    top.location.href='login.html';
                    localStorage.removeItem(CFG.admin);
                }
            }
        });
    });

    var originDom=$('.rexSysFrame').eq(0);

    $(".changeButton").click(function(){
       if (originDom.hasClass('hiddenLeft')){
           originDom.removeClass('hiddenLeft');
       }else{
           originDom.addClass('hiddenLeft');
       }
    });

    $('h1').click(function(){
       top.location.href='';
    });

    function refreshURL(path){
        if (/^.+\.html$/.test(path)){
            return path+'?v='+Math.random();
        }else{
            return path.replace(/([?&])v=[^&]+/,'$1v='+Math.random());
        }
    }
});