var vu=new Vue({
    el: '#app',
    data:{
        username:'',
        equipment:{
            printer:'',
            counter:'',
            neter:''
        },
        version:''
    },
    methods:{
        openSetting: function(){   //打开app设置界面
            try{
                window.register_js.exitwebview();
            }catch(e){
                dialog.open('information',{cname:'warning',content:'请在APP中使用该功能。', btncancel:''});
            }
        },
        loginOut: function(){
            var that=this;
            dialog.open('information',{
                content:'是否注销当前登录的用户 '+ that.username +' ？',
                cname:'sure',
                closeCallback:function(id,typeStr,btnType){
                    if (btnType==='sure') EQUIPMENT.loginTimeout();
                }
            });
        },
        loginIn: function(){
            top.location.href=CFG.loginPage;
        }
    },
    watch: {
    },
    beforeMount: function () {
        var temp=JSON.parse(localStorage.getItem(CFG.admin));
        if (temp) this.username=temp.name;
        this.version=CFG.VER;
    }
});

var dialog=relaxDialog();