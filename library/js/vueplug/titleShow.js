//utf8
//裁剪和检验页面的标题及搜索条
//外抛数据接口
//view //用于记录当前展示哪个选项卡 mission,record,quick
//type 用于区分是哪个栏目的顶部，目前支持check,cut
//username 用户名
//equipment 设备状态对象{printer,counter,neter}
//外部方法
//refresh 刷新事件
//changeview 切换显示选项
Vue.component('rex-title', {
    template: ''+
        '<div class="titleBar">' +
            '<h1 class="itemButton fa" :class="head[type].icon">{{head[type].title}}</h1>' +
            '<div class="itemButton dropItemShow fa fa-bars"><ul class="nohead">' +
                '<li class="fa fa-home" @click="backHome()">返回首页</li>' +
                '<li v-if="type===\'cut\'" class="fa fa-instagram" @click="goPage(\'missionCheck.html\')">检验任务</li>' +
                '<li v-if="type===\'check\'" class="fa fa-cut" @click="goPage(\'missionCut.html\')">裁剪任务</li>' +
                '<li v-if="view!==\'quick\'" class="fa fa-refresh" @click="refresh()">刷新列表</li>' +
                '<li class="fa fa-print" @click="printget">取货打印</li>' +
            '</ul></div>' +
            '<div class="itemButton fa fa-plane" :class="{\'sel\': view===\'quick\'}" @click="changeView(\'quick\')">{{type===\'cut\'? \'快速裁剪\':\'快速检验\'}}</div>' +
            '<div class="itemButton fa fa-pencil-square" :class="{\'sel\': view===\'mission\'}" @click="changeView(\'mission\')">任务列表</div>' +
            '<div class="itemButton fa fa-calendar-o" :class="{\'sel\': view===\'record\'}" @click="changeView(\'record\')">操作记录</div>' +
            '<span class="userInfo fa fa-user">{{username}}</span>' +
            '<span class="eqStatus fa fa-print" :class="equipment.printer" @click="openSetting()"></span>' +
            '<span class="eqStatus fa fa-legal" :class="equipment.counter" @click="openSetting()"></span>' +
            '<span class="eqStatus fa fa-signal" :class="equipment.neter" @click="openSetting()"></span>' +
        '</div>',
    props:{
        view:{   //用于记录当前展示哪个选项卡
            default: 'mission'
        },
        type:{
            required: true
        },
        username:{
            required:  true
        },
        equipment:{
            default: {}
        }
    },
    data: function(){
        return {
            head:{
                check:{
                    'title':'检验任务',
                    'icon':'fa-instagram'
                },
                cut:{
                    'title':'裁剪任务',
                    'icon':'fa-cut'
                }
            }
        };
    },
    computed:{
    },
    methods:{
        refresh: function(){
            this.$emit('refresh');
        },
        backHome: function(){
            location.replace('main.html?v='+Math.random());
        },
        changeView: function(keyValue){
            this.$emit('changeview',keyValue);
        },
        printget: function(){
            this.$emit('printget');
        },
        openSetting: function(){
            //打开设备设置窗口
            if (window.EQUIPMENT) EQUIPMENT.setting();
        },
        goPage: function(page){
            location.replace(page+'?v='+Math.random());
        }
    }
});