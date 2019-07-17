/*
主框架说明
1. 主框架url的hash只包含m（表示主菜单选择项，cut表示裁剪，check表示检验）和n（quick表示快速操作，mission表示任务操作，record表示操作记录），且组成对象并加工成json字符串作为哈希值
2. 具体页面目前使用iframe框架实现，且只有一层，不做嵌套实现，模拟app端的模式。iframe子菜单分为快速裁剪，检验任务列表（裁剪任务列表交给app原生实现），操作记录，操作详情4个iframe页
3. 设备状态和设备的方法调用都集成到opFrame中，其他页面不再建议调用本页面包含的common.js中设备方法
4.
*/
var vu=new Vue({
    el: '#app',
    data: {
        username: '',
        equipment: {
            printer: '',
            counter: '',
            neter: ''
        },
        UI:{
            menuSource:{
                cut:{key:'cut',icon:'fa-cut',txt:'裁剪',nav:{
                    quick:{icon:'fa-plane',txt:'快速'},
                    mission:{icon:'fa-tasks',txt:'任务'},
                    record:{icon:'fa-calendar',txt:'操作记录'}
                }},
                check:{key:'check',icon:'fa-instagram',txt:'检验',nav:{
                    quick:{icon:'fa-plane',txt:'快速'},
                    mission:{icon:'fa-tasks',txt:'任务'},
                    record:{icon:'fa-calendar',txt:'操作记录'}
                }}
            },
            menu:'',
            navigator:'',
            firstLoad:true,
            iframeSource:{   //添加随机数参数，以免iframe缓存
                record:'pageRecord.html?v='+Math.random(),  //操作记录，不带参数
                quick:'pageQuick.html?v='+Math.random(),    //快速裁剪/检验，带hash参数，用于标记是裁剪还是检验 #cut/check
                check:'pageMissioncheck.html?v='+Math.random(), //检验任务列表，不带参数
                cut:'pageMissioncut.html?v='+Math.random(),   //裁剪任务列表，不带参数
                operate:'pageOperate.html?v='+Math.random()   //裁剪/检验详情页，带hash参数 #{b:布卷编号,id:布卷id号,op:cut/check}
            },
            iframeDom:{},  //用于存放当前加载的iframe对象
            iframeShow:''  //标记当前展示的是哪个iframe
        }
    },
    methods: {
        showSystemMenu: function(e){  //主菜单激活
            $(e.target).addClass('active');
        },
        hideSystemMenu: function(e){  //主菜单隐藏
            $(e.target).removeClass('active');
        },
        setMenuView: function(m,n){  //对接view层的菜单跳转触发
            if (m===this.UI.menu.key && n===this.UI.navigator) return;
            var result={};
            result.m=m || this.UI.menu.key;
            result.n=n;
            this._setURL(result);
        },
        _setMenuView: function(menuConfig){  //设置菜单对应的vue变量值
            this.UI.menu=this.UI.menuSource[menuConfig.m];
            this.UI.navigator=menuConfig.n || 'quick';
            menuConfig.n=this.UI.navigator;
            //显示对应的iframe页面
            this._setIframeView(menuConfig);
        },
        _changeHash: function(){  //hash变更触发
            var hash=decodeURIComponent(location.hash.replace(/^#/,''));
            try{
                hash=JSON.parse(hash);
                if (!hash.m) throw 'The parameter for the menu is incorrect, hash be changed auto.';
                this._setMenuView(hash);
                return true;
            }catch(e){
                hash={m:'check'};
            }
            this._setURL(hash);
        },
        _setURL: function(hashObject){  //按当前的菜单设置调整url的hash值，目前采用传统的url
            var urlStr=location.href.replace(/#.+$/,'');
            urlStr+='#'+encodeURIComponent(JSON.stringify(hashObject));
            location.replace(urlStr);
        },
        _setIframeView: function(hashObject){   //显示/添加对应的iframe内容框
            var key='';
            if (hashObject.n==='quick'){
                key='quick';
            }else if(hashObject.n==='record'){
                key='record';
            }else{
                if (hashObject.m==='cut'){
                    key='cut';
                    //打开app裁剪任务列表
                    if (this.UI.firstLoad){
                        setTimeout(function(){
                            EQUIPMENT.taskList();
                        },1000);
                    }else{
                        EQUIPMENT.taskList();
                    }
                }else{
                    key='check';
                }
            }
            var url=this.UI.iframeSource[key];
            if (key==='quick'){
                url=url+'#'+hashObject.m;
                Vue.set(this.UI.iframeDom,key,url);
            }else{
                if (!(key in this.UI.iframeDom)){
                    Vue.set(this.UI.iframeDom,key,url);
                }
            }
            this.UI.iframeShow=key;
        },
        openDetails: function(op,bid){   //打开操作详情的iframe
            var hash={op:op,bid:bid};
            var url=this.UI.iframeSource.operate+'#'+encodeURIComponent(JSON.stringify(hash));
            if ('operate' in this.UI.iframeDom){
                this.UI.iframeDom.operate=url;
            }else{
                Vue.set(this.UI.iframeDom,'operate',url);
            }
            this.UI.iframeShow='operate';
        },
        closeDetails: function(){   //关闭操作详情窗口的iframe
            switch(this.UI.navigator){
                case 'quick':
                    this.UI.iframeShow='quick';
                    break;
                case 'record':
                    this.UI.iframeShow='record';
                    break;
                case 'mission':  //目前只有裁剪任务可能打开详情页面
                    this.UI.iframeShow='check';
                    break;
            }
        },
        refresh: function(){   //刷新当前的iframe，刷新原则为把v的随机数进行更改
            var nowURL=this.UI.iframeDom[this.UI.iframeShow];
            nowURL=nowURL.replace(/v=0\.\d+/,'v='+Math.random());
            this.UI.iframeDom[this.UI.iframeShow]=nowURL;
        }
    },
    beforeMount: function () {
        this.username=USER.name;

        window.onhashchange=function(){
            vu._changeHash();
        };
        this._changeHash();
    },
    mounted: function(){
        this.UI.firstLoad=false;
    }
});

var dialog=relaxDialog();
var ajax=relaxAJAX({
    type: 'get'
});

$(function(){
    //APP端样式适应
    if (EQUIPMENT.app) $('body').addClass('appShow');
});