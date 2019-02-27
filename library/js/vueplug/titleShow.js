//utf8
//裁剪和检验页面的标题及搜索条
//外抛数据接口
//title 标题文本
//icon 标题图标
//username 用户名
//equipment 设备状态对象{printer,counter,neter}
//search search对象
//searchvalue  临时用，目前为过滤已完成需要传递的字符串
//外部方法
//refresh 刷新事件
//setsearch 设置查询条件
Vue.component('rex-title', {
    template: ''+
        '<div class="titleBar">' +
            '<h1 class="itemButton fa" :class="icon">{{title}}</h1>' +
            '<div class="itemButton dropItemShow fa fa-bars"><ul class="nohead"><li class="fa fa-home" @click="backHome()">返回首页</li><li class="fa fa-refresh" @click="refresh()">刷新列表</li><li class="fa fa-print" @click="printget">取货打印</li></ul></div>' +
            '<div class="itemButton fa fa-pencil-square" :class="{\'sel\':!search.listType}" @click="setsearch()">待处理</div>' +
            '<div class="itemButton fa fa-check-square" :class="{\'sel\':search.listType}" @click="setsearch(1)">已完成</div>' +
            '<span class="rexIconInput" size="S"><span class="fa fa-search"></span><input type="text"/></span>' +
            '<span class="userInfo fa fa-user">{{username}}</span>' +
            '<span class="eqStatus fa fa-print" :class="equipment.printer" @click="openSetting()"></span>' +
            '<span class="eqStatus fa fa-legal" :class="equipment.counter" @click="openSetting()"></span>' +
            '<span class="eqStatus fa fa-signal" :class="equipment.neter" @click="openSetting()"></span>' +
        '</div>',
    props:{
        title:{
            required:  true
        },
        icon:{
            default: ''
        },
        username:{
            required:  true
        },
        equipment:{
            default: {}
        },
        search:{
            default: {}
        },
        searchvalue:{
            required:  true
        }
    },
    computed:{
    },
    methods:{
        refresh: function(){
            this.$emit('refresh');
        },
        backHome: function(){
            history.back();
        },
        setsearch: function(keyValue){
            if (keyValue){
                this.$emit('setsearch',this.searchvalue);
            }else{
                this.$emit('setsearch');
            }
        },
        printget: function(){
            this.$emit('printget');
        },
        openSetting: function(){
            //打开设备设置窗口
            if (window.EQUIPMENT) EQUIPMENT.setting();
        }
    }
});