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
            iframeSource:{
                record:{
                    url:'pageRecord.html',
                    dom:''
                },
                quickCut:{
                    url:'pageQuickcut.html',
                    dom:''
                },
                quickCheck:{
                    url:'pageQuickCheck.html',
                    dom:''
                },
                check:{
                    url:'pageMissioncheck.html',
                    dom:''
                },
                details:{
                    url:'pageDetails.html',
                    dom:''
                }
            }
        }
    },
    methods: {
        setMenuView: function(m,n,b){  //设置菜单展示
            if (!b && m===this.UI.menu.key && n===this.UI.navigator) return;
            var result={};
            result.m=m || this.UI.menu.key;
            if (b){
                result.n='quick';
                result.b=b;
            }else{
                result.n=n;
            }
            this._setURL(result);
        },
        _setMenuView: function(menuConfig){  //设置导航或选项卡
            this.UI.menu=this.UI.menuSource[menuConfig.m];
            this.UI.navigator=menuConfig.n || 'quick';
            if (menuConfig.b) this.UI.navigator='quick';
            //显示对应的iframe页面

        },
        _changeHash: function(){  //hash变更触发
            var hash=decodeURIComponent(location.hash.replace(/^#/,''));
            try{
                hash=JSON.parse(hash);
                if (!hash.m) throw 'The parameter for the menu is incorrect, hash be changed auto.';
                this._setMenuView(hash);
                return;
            }catch(e){
                hash={m:'check'};
            }
            this._setURL(hash);
        },
        _setURL: function(hashObject){  //设置当前hash，使用replace方法是为了不产生历史纪录
            var urlStr=location.href.replace(/#.+$/,'');
            urlStr+='#'+encodeURIComponent(JSON.stringify(hashObject));
            location.replace(urlStr);
        },
        _setIframeView: function(hashObject){   //显示/添加对应的iframe内容框
            var key='';
            if (hash)
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