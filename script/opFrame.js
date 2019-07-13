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
                cut:{icon:'fa-cut',txt:'裁剪'},
                check:{icon:'fa-instagram',txt:'检验'}
            },
            navigatorSource:{
                quick:{icon:'fa-plane',txt:'快速'},
                mission:{icon:'fa-tasks',txt:'任务'},
                record:{icon:'fa-calendar',txt:'操作记录'}
            },
            menu:'',
            navigator:''
        }
    },
    methods: {
        setMenuView: function(type,key){  //设置导航或选项卡
            switch(type){
                case 'menu':
                    if (!(key in UI.menuSource)) return;
                    UI.menu = UI.menuSource[key];
                    this._changeHash(type,key);
                    break;
                case 'navigator':
                    if (!(key in UI.navigatorSource)) return;
                    UI.navigator = UI.navigatorSource[key];
                    break;
            }
        },
        _changeHash: function(type,key){

        }
    },
    beforeMount: function () {
        this.username=USER.name;

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