var vu=new Vue({
    el: '#app',
    data:{
        nowPosition: ''  //记录当前布的长度
    },
    methods:{

    },
    watch: {
        'nowPosition': function (newVal) {
            if (iframeObject && iframeObject.contentWindow && iframeObject.contentWindow.changePosition){
                iframeObject.contentWindow.changePosition(newVal);
            }
        }
    }
});

var iframeObject='';
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
    iframeObject=document.getElementById('abc');
    iframeObject.onload=function(){
        if (iframeObject && iframeObject.contentWindow && iframeObject.contentWindow.changePosition){
            iframeObject.contentWindow.changePosition(vu.nowPosition);
        }
    };
    iframeObject.src=refreshURL(tempArray[0].href);

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
       top.location.href='main.html?v='+Math.random();
    });

    function refreshURL(path){
        if (/^.+\.html$/.test(path)){
            return path+'?v='+Math.random();
        }else{
            return path.replace(/([?&])v=[^&]+/,'$1v='+Math.random());
        }
    }
});

//对外接口，设置滚动位置
function setPosition(pos){
    if (vu){
        vu.nowPosition=pos;
    }
}

//对外接口，置零滚动位置
function resetPosition(){
    try{
        window.register_js.gozero();
    }catch(e){
        console.log('记米器错误');
    }
}